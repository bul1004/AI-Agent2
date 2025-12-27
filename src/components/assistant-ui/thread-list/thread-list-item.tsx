"use client";

import type { FC } from "react";
import { ThreadListItemPrimitive } from "@assistant-ui/react";
import { ThreadListItemArchive } from "@/components/assistant-ui/thread-list/thread-list-item-archive";
import { ThreadListItemTitle } from "@/components/assistant-ui/thread-list/thread-list-item-title";

export const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="group data-[active]:bg-neutral-100 dark:data-[active]:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-0 cursor-pointer">
      <ThreadListItemPrimitive.Trigger className="flex-grow px-3 py-1.5 text-start truncate font-normal text-neutral-900 dark:text-neutral-100">
        <ThreadListItemTitle />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};
