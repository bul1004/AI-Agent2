"use client";

import type { FC } from "react";
import { ThreadListItemPrimitive } from "@assistant-ui/react";
import { ThreadListItemArchive } from "@/components/assistant-ui/thread-list/thread-list-item-archive";
import { ThreadListItemTitle } from "@/components/assistant-ui/thread-list/thread-list-item-title";

export const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="group data-[active]:bg-muted hover:bg-muted focus-visible:bg-muted flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer">
      <ThreadListItemPrimitive.Trigger className="flex-grow px-3 py-2 text-start truncate">
        <ThreadListItemTitle />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};
