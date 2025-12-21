import type { FC } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { ArchiveIcon } from "lucide-react";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="flex flex-col items-stretch gap-1">
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  );
};

const ThreadListItems: FC = () => {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="group data-[active]:bg-muted hover:bg-muted focus-visible:bg-muted flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer">
      <ThreadListItemPrimitive.Trigger className="flex-grow px-3 py-2 text-start truncate">
        <ThreadListItemTitle />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemTitle: FC = () => {
  return (
    <p className="text-sm truncate">
      <ThreadListItemPrimitive.Title fallback="New Chat" />
    </p>
  );
};

const ThreadListItemArchive: FC = () => {
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
