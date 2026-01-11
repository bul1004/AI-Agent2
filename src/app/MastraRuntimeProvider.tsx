"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import useSWR, { mutate } from "swr";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";

type ThreadMessageRecord = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: { parts?: unknown } | null;
  createdAt: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const createMastraModelAdapter = (threadId: string): ChatModelAdapter => ({
  async *run({ messages, abortSignal, unstable_assistantMessageId }) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        threadId,
        assistantMessageId: unstable_assistantMessageId,
        messages,
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get stream reader");
    }

    const decoder = new TextDecoder();
    let text = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "" || !line.startsWith("data: ")) continue;

          const data = line.substring(6);

          if (data === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text" && parsed.value) {
              text += parsed.value;

              yield {
                content: [{ type: "text", text }],
              };
            } else if (parsed.type === "error") {
              throw new Error(parsed.value || "Unknown error");
            }
          } catch {
            // Ignore malformed SSE chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
      mutate("/api/chat/threads").catch(() => undefined);
    }
  },
});

export function MastraRuntimeProvider({
  children,
  threadId,
}: Readonly<{
  children: ReactNode;
  threadId: string;
}>) {
  const { data, isLoading } = useSWR<{ messages: ThreadMessageRecord[] }>(
    threadId ? `/api/chat/threads/${threadId}/messages` : null,
    fetcher,
  );

  const initialMessages = useMemo(() => {
    const messages = data?.messages ?? [];
    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      createdAt: new Date(message.createdAt),
      content: (() => {
        const parts = message.metadata?.parts;
        if (Array.isArray(parts) && parts.length > 0) return parts;
        return [{ type: "text", text: message.content }];
      })(),
    }));
  }, [data?.messages]);

  const adapter = useMemo(() => createMastraModelAdapter(threadId), [threadId]);
  const runtime = useLocalRuntime(adapter);

  useEffect(() => {
    if (isLoading) return;
    runtime.thread.reset(initialMessages);
  }, [isLoading, initialMessages, runtime]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
