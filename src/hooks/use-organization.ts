"use client";

import { useActiveOrganization, useListOrganizations, organization } from "@/lib/auth-client";
import { useCallback } from "react";

export function useOrganization() {
  const { data: orgs, isPending: isLoadingOrgs } = useListOrganizations();
  const { data: activeOrg, isPending: isLoadingActive } = useActiveOrganization();

  const createOrg = useCallback(
    async (name: string, slug: string) => {
      return organization.create({
        name,
        slug,
      });
    },
    []
  );

  const switchOrg = useCallback(
    async (organizationId: string) => {
      return organization.setActive({ organizationId });
    },
    []
  );

  const inviteMember = useCallback(
    async (email: string, role: "admin" | "member") => {
      if (!activeOrg?.id) throw new Error("No active organization");
      return organization.inviteMember({
        organizationId: activeOrg.id,
        email,
        role,
      });
    },
    [activeOrg?.id]
  );

  return {
    organizations: orgs ?? [],
    currentOrg: activeOrg ?? null,
    isLoading: isLoadingOrgs || isLoadingActive,
    createOrg,
    switchOrg,
    inviteMember,
  };
}
