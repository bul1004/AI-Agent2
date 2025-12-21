import { assistant } from "@/mastra/agents";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";

const logger = createLogger("api.chat");

async function handleChatRequestImpl(req: Request): Promise<Response> {
  try {
    const { messages } = await req.json();

    const stream = await assistant.stream(messages);

    const encoder = new TextEncoder();
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();

    (async () => {
      try {
        const reader = stream.textStream;
        for await (const chunk of reader) {
          try {
            const formattedChunk = `data: ${JSON.stringify({ type: "text", value: chunk })}\n\n`;
            await writer.write(encoder.encode(formattedChunk));
          } catch {
            break;
          }
        }

        try {
          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } catch {
          // Ignore close write failures
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("ResponseAborted")) {
          return;
        }

        logger.error("Chat stream error", {
          name: "api.chat.stream",
          err: serializeError(error),
        });

        try {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", value: error instanceof Error ? error.message : String(error) })}\n\n`
            )
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
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error("Chat request failed", {
      name: "api.chat.request",
      err: serializeError(error),
    });

    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
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
