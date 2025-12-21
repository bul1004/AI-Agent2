"use client";

import type { FC } from "react";
import { MessagePrimitive } from "@assistant-ui/react";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { AssistantActionBar } from "@/components/assistant-ui/thread/assistant-action-bar";
import { BranchPicker } from "@/components/assistant-ui/thread/branch-picker";

export const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
      <div className="text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
      </div>

      <AssistantActionBar />

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
};
