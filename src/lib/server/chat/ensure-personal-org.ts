import { createSupabaseAdminClient } from "@/lib/db/admin";

type UserRecord = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function ensureUserRecordExists(user: UserRecord): Promise<void> {
  if (!user.email) {
    throw new Error("User email is required to create record");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("user").upsert(
    {
      id: user.id,
      name: user.name ?? null,
      email: user.email,
      image: user.image ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (error && error.code !== "23505") {
    throw error;
  }
}

export async function ensurePersonalOrganizationExists(
  organizationId: string,
  user: Pick<UserRecord, "id" | "name" | "email">,
): Promise<void> {
  if (organizationId !== user.id) return;

  const name = user.name || user.email || "Personal";
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("organization").upsert(
    {
      id: organizationId,
      name,
      slug: null,
      logo: null,
      metadata: { personal: true, ownerId: user.id },
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (error && error.code !== "23505") {
    throw error;
  }
}
