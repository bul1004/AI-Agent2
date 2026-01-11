"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ChatModeProvider } from "@/contexts/chat-mode-context";
import { MastraRuntimeProvider } from "@/app/MastraRuntimeProvider";

export const Assistant = ({ threadId }: { threadId: string }) => {
  return (
    <ChatModeProvider>
      <MastraRuntimeProvider key={threadId} threadId={threadId}>
        <div className="h-full w-full">
          <Thread />
        </div>
      </MastraRuntimeProvider>
    </ChatModeProvider>
  );
};
