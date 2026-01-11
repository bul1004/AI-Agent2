"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const createThread = async () => {
      try {
        const res = await fetch("/api/chat/threads", { method: "POST" });
        if (!res.ok) return;
        const data = (await res.json()) as { threadId?: string };
        if (!cancelled && data.threadId) {
          router.replace(`/chat/${data.threadId}`);
        }
      } catch {
        // Ignore redirect failures
      }
    };

    createThread();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      新しいチャットを準備しています...
    </div>
  );
}
