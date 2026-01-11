import { assistant } from "@/mastra/agents";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";
import { auth } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/db/server";
import { nanoid } from "nanoid";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-token";
import type { MessageListInput } from "@mastra/core/agent/message-list";
import {
  ensurePersonalOrganizationExists,
  ensureUserRecordExists,
} from "@/lib/server/chat/ensure-personal-org";

const logger = createLogger("api.chat");

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

type ChatMessage = {
  id?: string;
  role?: string;
  content?: unknown;
  createdAt?: string;
};

type ChatRequestBody = {
  threadId?: string;
  assistantMessageId?: string;
  messages?: MessageListInput;
};

function extractErrorCodeFromMessage(message: string): string | null {
  try {
    const parsed = JSON.parse(message) as {
      error?: { code?: string };
      code?: string;
    };
    return parsed?.error?.code ?? parsed?.code ?? null;
  } catch {
    return null;
  }
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.message.includes("insufficient_quota")) return true;
    return extractErrorCodeFromMessage(error.message) === "insufficient_quota";
  }

  if (error && typeof error === "object") {
    const maybe = error as {
      error?: { code?: string; message?: string };
      code?: string;
      message?: string;
    };
    if (maybe.code === "insufficient_quota") return true;
    if (maybe.error?.code === "insufficient_quota") return true;
    if (maybe.message?.includes("insufficient_quota")) return true;
    if (maybe.error?.message?.includes("insufficient_quota")) return true;
  }

  return false;
}

function getLastUserMessage(messages: unknown): ChatMessage | null {
  if (!Array.isArray(messages)) return null;

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i] as ChatMessage | undefined;
    if (message?.role === "user") {
      return message;
    }
  }

  return null;
}

function buildFallbackMessage(messages: unknown): string {
  const lastUserMessage = getLastUserMessage(messages);
  const base =
    "OpenAI quota exceeded. Using a fallback response so you can keep chatting during setup.";

  if (!lastUserMessage) return base;
  const contentText = extractMessageText(lastUserMessage?.content);
  if (!contentText) return base;
  return `${base}\n\nYou said:\n${contentText}`;
}

function extractMessageText(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const maybeText = (part as { type?: string; text?: string }).text;
      return (part as { type?: string }).type === "text" && maybeText
        ? maybeText
        : "";
    })
    .join("");
}

function buildThreadTitle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "New Chat";
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

function createSseTextResponse(text: string): Response {
  const encoder = new TextEncoder();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  (async () => {
    try {
      const formattedChunk = `data: ${JSON.stringify({ type: "text", value: text })}\n\n`;
      await writer.write(encoder.encode(formattedChunk));
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch {
      // Ignore write failures
    } finally {
      try {
        if (writer.desiredSize !== null) {
          await writer.close();
        }
      } catch {
        // Ignore close failures
      }
    }
  })();

  return new Response(responseStream.readable, { headers: SSE_HEADERS });
}

async function handleChatRequestImpl(req: Request): Promise<Response> {
  try {
    const { messages, threadId, assistantMessageId } =
      (await req.json()) as ChatRequestBody;
    const messageInput: MessageListInput = messages ?? [];
    const safeMessages = Array.isArray(messageInput)
      ? messageInput
      : [messageInput];
    if (!threadId) {
      return new Response(
        JSON.stringify({ error: "threadId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let supabaseToken: string | null = null;
    try {
      supabaseToken = await createSupabaseAccessToken(session);
    } catch (error) {
      logger.warn("Failed to create Supabase token", {
        name: "api.chat.token",
        err: serializeError(error),
      });
    }
    if (!supabaseToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const activeOrganizationId =
      ((session.session as Record<string, unknown> | null)
        ?.activeOrganizationId as string | null) ?? session.user.id;

    const supabase = await createSupabaseServerClient(supabaseToken);

    const { data: existingThread } = await supabase
      .from("chat_threads")
      .select("id, title")
      .eq("id", threadId)
      .maybeSingle();

    if (!existingThread) {
      try {
        await ensureUserRecordExists(session.user);
        await ensurePersonalOrganizationExists(activeOrganizationId, session.user);
      } catch (error) {
        logger.error("Failed to prepare personal org", {
          name: "api.chat.ensurePersonalOrg",
          err: serializeError(error),
        });
        return new Response(
          JSON.stringify({ error: "Failed to create thread" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      const { error: insertThreadError } = await supabase
        .from("chat_threads")
        .insert({
          id: threadId,
          organizationId: activeOrganizationId,
          userId: session.user.id,
          title: null,
        });
      if (insertThreadError) {
        logger.error("Failed to create chat thread", {
          name: "api.chat.thread.create",
          err: serializeError(insertThreadError),
        });
        return new Response(JSON.stringify({ error: "Failed to create thread" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const lastUserMessage = getLastUserMessage(safeMessages);
    const lastUserText = extractMessageText(lastUserMessage?.content);

    if (lastUserMessage && lastUserText) {
      const createdAt = lastUserMessage.createdAt
        ? new Date(lastUserMessage.createdAt).toISOString()
        : undefined;
      const metadata = Array.isArray(lastUserMessage.content)
        ? { parts: lastUserMessage.content }
        : {};

      await supabase.from("chat_messages").upsert(
        {
          id: lastUserMessage.id ?? nanoid(),
          threadId,
          role: "user",
          content: lastUserText,
          metadata,
          ...(createdAt ? { createdAt } : {}),
        },
        { onConflict: "id" },
      );

      await supabase
        .from("chat_threads")
        .update({ updatedAt: new Date().toISOString() })
        .eq("id", threadId);
    }

    if (!existingThread?.title && lastUserText) {
      await supabase
        .from("chat_threads")
        .update({ title: buildThreadTitle(lastUserText) })
        .eq("id", threadId);
    }

    let stream: Awaited<ReturnType<typeof assistant.stream>>;
    try {
      stream = await assistant.stream(messageInput);
    } catch (error) {
      if (isQuotaError(error)) {
        logger.warn("OpenAI quota exceeded. Sending fallback response.");
        const fallbackText = buildFallbackMessage(safeMessages);
        await supabase.from("chat_messages").upsert(
          {
            id: assistantMessageId ?? nanoid(),
            threadId,
            role: "assistant",
            content: fallbackText,
            metadata: { parts: [{ type: "text", text: fallbackText }] },
          },
          { onConflict: "id" },
        );
        await supabase
          .from("chat_threads")
          .update({ updatedAt: new Date().toISOString() })
          .eq("id", threadId);
        return createSseTextResponse(fallbackText);
      }
      throw error;
    }
    const encoder = new TextEncoder();
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    let assistantText = "";

    (async () => {
      try {
        const reader = stream.textStream;
        for await (const chunk of reader) {
          try {
            const formattedChunk = `data: ${JSON.stringify({ type: "text", value: chunk })}\n\n`;
            await writer.write(encoder.encode(formattedChunk));
            assistantText += chunk;
          } catch {
            break;
          }
        }
        try {
          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } catch {
          // Ignore close write failures
        }

        if (assistantText) {
          await supabase.from("chat_messages").upsert(
            {
              id: assistantMessageId ?? nanoid(),
              threadId,
              role: "assistant",
              content: assistantText,
              metadata: { parts: [{ type: "text", text: assistantText }] },
            },
            { onConflict: "id" },
          );
          await supabase
            .from("chat_threads")
            .update({ updatedAt: new Date().toISOString() })
            .eq("id", threadId);
        }
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message.includes("ResponseAborted")
        ) {
          return;
        }

        if (isQuotaError(error)) {
          logger.warn("OpenAI quota exceeded during stream. Sending fallback.");
          try {
            const fallbackText = buildFallbackMessage(safeMessages);
            const fallbackChunk = `data: ${JSON.stringify({
              type: "text",
              value: fallbackText,
            })}\n\n`;
            await writer.write(encoder.encode(fallbackChunk));
            await writer.write(encoder.encode("data: [DONE]\n\n"));
            await supabase.from("chat_messages").upsert(
              {
                id: assistantMessageId ?? nanoid(),
                threadId,
                role: "assistant",
                content: fallbackText,
                metadata: { parts: [{ type: "text", text: fallbackText }] },
              },
              { onConflict: "id" },
            );
            await supabase
              .from("chat_threads")
              .update({ updatedAt: new Date().toISOString() })
              .eq("id", threadId);
          } catch {
            // Ignore write failures
          }
          return;
        }

        logger.error("Chat stream error", {
          name: "api.chat.stream",
          err: serializeError(error),
        });

        try {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", value: error instanceof Error ? error.message : String(error) })}\n\n`,
            ),
          );
        } catch {
          // Ignore write failures
        }
      } finally {
        try {
          if (writer.desiredSize !== null) {
            await writer.close();
          }
        } catch {
          // Ignore close failures
        }
      }
    })();

    return new Response(responseStream.readable, {
      headers: SSE_HEADERS,
    });
  } catch (error) {
    logger.error("Chat request failed", {
      name: "api.chat.request",
      err: serializeError(error),
    });

    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const handleChatRequest = withLog(handleChatRequestImpl, {
  name: "api.chat.request",
  pickArgs: ([req]) => ({
    method: req.method,
    urlLen: req.url.length,
  }),
  sampleInfoRate: 0,
});
