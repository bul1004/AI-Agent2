"use client";

import type { FC } from "react";
import { ThreadListItemPrimitive } from "@assistant-ui/react";
import { ArchiveIcon } from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

export const ThreadListItemArchive: FC = () => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        className="text-muted-foreground hover:text-foreground ml-auto mr-2 size-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        variant="ghost"
        tooltip="Archive thread"
      >
        <ArchiveIcon />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};
