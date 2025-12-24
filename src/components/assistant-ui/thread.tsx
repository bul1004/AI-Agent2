"use client";

import type { FC } from "react";
import { ThreadPrimitive } from "@assistant-ui/react";
import { ProfileAvatarButton } from "@/components/profile/profile-avatar-button";
import { Composer } from "@/components/assistant-ui/thread/composer";
import { ThreadScrollToBottom } from "@/components/assistant-ui/thread/thread-scroll-to-bottom";
import { ThreadWelcome } from "@/components/assistant-ui/thread/thread-welcome";
import { AssistantMessage } from "@/components/assistant-ui/thread/assistant-message";
import { EditComposer } from "@/components/assistant-ui/thread/edit-composer";
import { UserMessage } from "@/components/assistant-ui/thread/user-message";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="bg-background box-border flex h-full flex-col overflow-hidden"
      style={{
        ["--thread-max-width" as string]: "42rem",
      }}
    >
      <div className="sticky top-0 z-10 flex justify-end items-center gap-2 px-4 py-3 bg-background">
        <ProfileAvatarButton />
      </div>

      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8">
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            EditComposer: EditComposer,
            AssistantMessage: AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
          <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
            <ThreadScrollToBottom />
            <Composer />
          </div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};
