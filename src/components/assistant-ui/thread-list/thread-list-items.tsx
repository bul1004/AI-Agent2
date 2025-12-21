"use client";

import type { FC } from "react";
import { ThreadListPrimitive } from "@assistant-ui/react";
import { ThreadListItem } from "@/components/assistant-ui/thread-list/thread-list-item";

export const ThreadListItems: FC = () => {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};
