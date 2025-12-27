"use client";

import type { FC } from "react";
import { ThreadListItemPrimitive } from "@assistant-ui/react";

export const ThreadListItemTitle: FC = () => {
  return (
    <p className="text-[14px] truncate">
      <ThreadListItemPrimitive.Title fallback="New Chat" />
    </p>
  );
};
