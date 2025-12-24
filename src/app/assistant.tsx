"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ChatModeProvider } from "@/contexts/chat-mode-context";

export const Assistant = () => {
  return (
    <ChatModeProvider>
      <div className="h-full w-full">
        <Thread />
      </div>
    </ChatModeProvider>
  );
};
