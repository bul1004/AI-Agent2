"use client";

import type { FC } from "react";
import useSWR, { mutate } from "swr";
import { usePathname, useRouter } from "next/navigation";
import { ArchiveIcon } from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ThreadItem = {
  id: string;
  title: string | null;
  updatedAt?: string;
  createdAt?: string;
};

export const ChatThreadList: FC<{ onSelect?: () => void }> = ({ onSelect }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading } = useSWR<{ threads: ThreadItem[] }>(
    "/api/chat/threads",
    fetcher,
  );

  const threads = data?.threads ?? [];
  const activeThreadId = pathname?.startsWith("/chat/")
    ? pathname.split("/chat/")[1]?.split("/")[0]
    : null;

  const handleSelect = (threadId: string) => {
    router.push(`/chat/${threadId}`);
    onSelect?.();
  };

  const handleDelete = async (threadId: string) => {
    try {
      const res = await fetch(`/api/chat/threads/${threadId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      await mutate("/api/chat/threads");
      if (activeThreadId === threadId) {
        router.replace("/chat");
      }
    } catch {
      // Ignore deletion errors
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 px-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 rounded-md bg-muted/70" />
        ))}
      </div>
    );
  }

  if (!threads.length) {
    return (
      <div className="px-2 py-3 text-xs text-muted-foreground">
        まだチャットがありません
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {threads.map((thread) => {
        const isActive = thread.id === activeThreadId;
        return (
          <div
            key={thread.id}
            className={cn(
              "group flex items-center rounded-lg transition-all",
              isActive
                ? "bg-neutral-100 dark:bg-neutral-800"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-900",
            )}
          >
            <button
              type="button"
              onClick={() => handleSelect(thread.id)}
              className="flex-grow px-2 py-0.5 text-start text-[14px] font-normal text-neutral-900 dark:text-neutral-100 truncate"
            >
              {thread.title || "New Chat"}
            </button>
            <TooltipIconButton
              className="ml-auto mr-2 size-4 p-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              variant="ghost"
              tooltip="削除"
              onClick={(event) => {
                event.stopPropagation();
                void handleDelete(thread.id);
              }}
            >
              <ArchiveIcon />
            </TooltipIconButton>
          </div>
        );
      })}
    </div>
  );
};
