"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useListOrganizations,
  useActiveOrganization,
  organization,
} from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Building2, Check, Plus, ChevronDown } from "lucide-react";

export function OrgSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: orgs } = useListOrganizations();
  const { data: activeOrg } = useActiveOrganization();

  const handleSwitch = async (orgId: string) => {
    await organization.setActive({ organizationId: orgId });
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-between"
      >
        <span className="flex items-center">
          <Building2 className="mr-2 h-4 w-4" />
          <span className="truncate">{activeOrg?.name || "組織を選択"}</span>
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border bg-popover p-1 shadow-md">
            {orgs?.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                {org.name}
                {activeOrg?.id === org.id && <Check className="h-4 w-4" />}
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => {
                setOpen(false);
                router.push("/settings/organization/new");
              }}
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Plus className="mr-2 h-4 w-4" />
              新しい組織を作成
            </button>
          </div>
        </>
      )}
    </div>
  );
}
