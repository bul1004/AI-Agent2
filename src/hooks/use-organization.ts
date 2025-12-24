"use client";

import {
  useActiveOrganization,
  useListOrganizations,
  organization,
  authClient,
} from "@/lib/auth/client";
import { useCallback } from "react";

type OrgRole = "admin" | "owner" | "member";

/**
 * useOrganization hook
 * Returns organizations, active organization data, and all organization methods
 */
export function useOrganization() {
  const { data: orgs, isPending: isLoadingOrgs } = useListOrganizations();
  const { data: activeOrg, isPending: isLoadingActive } =
    useActiveOrganization();

  // ========================================
  // Organization Management
  // ========================================

  const createOrg = useCallback(async (name: string, slug?: string) => {
    // Generate slug from name if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      // If slug is empty (e.g., Japanese-only name), generate a unique one
      finalSlug =
        baseSlug ||
        `org-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    }
    return organization.create({
      name,
      slug: finalSlug,
    });
  }, []);

  const switchOrg = useCallback(async (organizationId: string | null) => {
    return organization.setActive({ organizationId });
  }, []);

  const updateOrg = useCallback(
    async (organizationId: string, data: { name?: string; logo?: string }) => {
      return organization.update({
        organizationId,
        data,
      });
    },
    [],
  );

  // Alias for switchOrg with different signature (for compatibility)
  const setActive = useCallback(
    async (params: { organization: string | { id: string } | null }) => {
      if (params.organization === null) {
        return organization.setActive({ organizationId: null });
      }
      const orgId =
        typeof params.organization === "string"
          ? params.organization
          : params.organization.id;
      return organization.setActive({ organizationId: orgId });
    },
    [],
  );

  // ========================================
  // Member Management
  // ========================================

  const inviteMember = useCallback(
    async (email: string, role: OrgRole = "member") => {
      if (!activeOrg?.id) throw new Error("No active organization");
      return organization.inviteMember({
        organizationId: activeOrg.id,
        email,
        role,
      });
    },
    [activeOrg?.id],
  );

  const updateMemberRole = useCallback(
    async (memberId: string, role: OrgRole) => {
      if (!activeOrg?.id) throw new Error("No active organization");
      return organization.updateMemberRole({
        organizationId: activeOrg.id,
        memberId,
        role,
      });
    },
    [activeOrg?.id],
  );

  const removeMember = useCallback(
    async (memberIdOrEmail: string) => {
      if (!activeOrg?.id) throw new Error("No active organization");
      return organization.removeMember({
        organizationId: activeOrg.id,
        memberIdOrEmail,
      });
    },
    [activeOrg?.id],
  );

  const getMembers = useCallback(async () => {
    if (!activeOrg?.id) return [];
    try {
      const response = await authClient.organization.listMembers({
        query: { organizationId: activeOrg.id },
      });
      return response.data?.members ?? [];
    } catch {
      return [];
    }
  }, [activeOrg?.id]);

  return {
    // State
    organizations: orgs ?? [],
    currentOrg: activeOrg ?? null,
    isLoading: isLoadingOrgs || isLoadingActive,
    isLoaded: !isLoadingOrgs && !isLoadingActive,

    // Organization Management
    createOrg,
    switchOrg,
    setActive,
    updateOrg,

    // Member Management
    inviteMember,
    updateMemberRole,
    removeMember,
    getMembers,
  };
}
