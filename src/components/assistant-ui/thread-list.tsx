"use client";

import type { FC } from "react";
import { ThreadListPrimitive } from "@assistant-ui/react";
import { ThreadListItems } from "@/components/assistant-ui/thread-list/thread-list-items";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="flex flex-col items-stretch gap-1">
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  );
};
