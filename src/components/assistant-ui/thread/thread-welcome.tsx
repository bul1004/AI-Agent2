"use client";

import type { FC } from "react";
import { ThreadPrimitive } from "@assistant-ui/react";
import { Composer } from "@/components/assistant-ui/thread/composer";

export const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex h-full w-full max-w-[var(--thread-max-width)] flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center gap-6 mb-12">
          <p className="font-semibold text-2xl">今日は何をしましょうか？</p>
          <div className="w-full">
            <Composer />
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};
