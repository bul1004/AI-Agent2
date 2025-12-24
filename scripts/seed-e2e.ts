/**
 * E2Eテスト用シードデータ作成スクリプト
 *
 * 使用方法:
 *   1. npm run dev でサーバー起動
 *   2. npx tsx scripts/seed-e2e.ts
 *
 * 環境変数(.env.local):
 *   E2E_TEST_PASSWORD - 共通パスワード
 *   E2E_TEST_ORG_NAME - テスト組織名
 *   E2E_OWNER_EMAIL / E2E_OWNER_NAME - オーナー
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_NAME - 管理者
 *   E2E_MEMBER_EMAIL / E2E_MEMBER_NAME - メンバー
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { getTestConfig, getAllTestUsers } from "../tests/e2e/test-users";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Common headers for BetterAuth API calls
const commonHeaders = {
  "Content-Type": "application/json",
  Origin: BASE_URL,
};

interface AuthResponse {
  user?: { id: string; email: string };
  error?: { message: string };
}

async function signUp(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ email, password, name }),
  });
  return res.json();
}

async function signIn(
  email: string,
  password: string
): Promise<{ cookies: string[]; user?: { id: string } }> {
  const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ email, password }),
  });
  const cookies = res.headers.getSetCookie();
  const data = await res.json();
  return { cookies, user: data.user };
}

async function createOrganization(
  cookies: string[],
  name: string
): Promise<{ id?: string; error?: string }> {
  // Generate slug from name
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const res = await fetch(`${BASE_URL}/api/auth/organization/create`, {
    method: "POST",
    headers: {
      ...commonHeaders,
      Cookie: cookies.join("; "),
    },
    body: JSON.stringify({ name, slug }),
  });
  const data = await res.json();
  // BetterAuth returns organization in different formats
  const id = data.id || data.organization?.id;
  return { id, error: data.error?.message || data.message };
}

async function setActiveOrganization(
  cookies: string[],
  organizationId: string
): Promise<void> {
  await fetch(`${BASE_URL}/api/auth/organization/set-active`, {
    method: "POST",
    headers: {
      ...commonHeaders,
      Cookie: cookies.join("; "),
    },
    body: JSON.stringify({ organizationId }),
  });
}

async function inviteMember(
  cookies: string[],
  organizationId: string,
  email: string,
  role: "admin" | "member"
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/organization/invite-member`, {
    method: "POST",
    headers: {
      ...commonHeaders,
      Cookie: cookies.join("; "),
    },
    body: JSON.stringify({ organizationId, email, role }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `${res.status}: ${text}` };
  }
  return { success: true };
}

async function acceptInvitation(
  cookies: string[],
  invitationId: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/api/auth/organization/accept-invitation`, {
    method: "POST",
    headers: {
      ...commonHeaders,
      Cookie: cookies.join("; "),
    },
    body: JSON.stringify({ invitationId }),
  });
  return { success: res.ok };
}

async function main() {
  const config = getTestConfig();
  const testUsers = getAllTestUsers();

  console.log("=== E2E Seed Data ===\n");
  console.log(`サーバー: ${BASE_URL}`);
  console.log(`組織名: ${config.orgName}`);
  console.log(`パスワード: ${config.password}`);
  console.log("");

  // Check server
  try {
    await fetch(`${BASE_URL}`);
  } catch {
    console.error("エラー: サーバーが起動していません");
    console.error("  npm run dev を実行してから再度お試しください");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Step 1: Create owner
  const owner = config.owner;
  console.log(`1. オーナー作成: ${owner.email}`);

  const { data: existingOwner } = await supabase
    .from("user")
    .select("id")
    .eq("email", owner.email)
    .single();

  let ownerCookies: string[] = [];
  let organizationId: string | undefined;

  if (existingOwner) {
    console.log("   → 既存ユーザー、ログイン中...");
    const signInResult = await signIn(owner.email, owner.password);
    ownerCookies = signInResult.cookies;

    const { data: existingOrg } = await supabase
      .from("organization")
      .select("id")
      .eq("name", config.orgName)
      .single();

    organizationId = existingOrg?.id;
    if (organizationId) {
      await setActiveOrganization(ownerCookies, organizationId);
    }
  } else {
    const signUpResult = await signUp(owner.email, owner.password, owner.name);
    if (signUpResult.error) {
      console.error(`   ✗ サインアップエラー: ${signUpResult.error.message}`);
      process.exit(1);
    }
    console.log("   ✓ ユーザー作成完了");

    const signInResult = await signIn(owner.email, owner.password);
    ownerCookies = signInResult.cookies;
  }

  // Step 2: Create organization
  console.log(`\n2. 組織作成: ${config.orgName}`);

  if (organizationId) {
    console.log("   → 既存組織をスキップ");
  } else {
    const orgResult = await createOrganization(ownerCookies, config.orgName);
    if (orgResult.error) {
      console.error(`   ✗ 組織作成エラー: ${orgResult.error}`);
      process.exit(1);
    }
    organizationId = orgResult.id;
    console.log(`   ✓ 組織作成完了 (ID: ${organizationId})`);

    if (organizationId) {
      await setActiveOrganization(ownerCookies, organizationId);
    }
  }

  // Step 3: Create and invite other users
  const otherUsers = [config.admin, config.member];

  for (let i = 0; i < otherUsers.length; i++) {
    const user = otherUsers[i];
    console.log(`\n${i + 3}. ユーザー作成・招待: ${user.email} (${user.role})`);

    const { data: existingUser } = await supabase
      .from("user")
      .select("id")
      .eq("email", user.email)
      .single();

    if (existingUser) {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("member")
        .select("id")
        .eq("userId", existingUser.id)
        .eq("organizationId", organizationId)
        .single();

      if (existingMember) {
        console.log("   → 既にメンバー、スキップ");
        continue;
      }
      console.log("   → 既存ユーザー、招待のみ実行");
    } else {
      const signUpResult = await signUp(user.email, user.password, user.name);
      if (signUpResult.error) {
        console.error(`   ✗ サインアップエラー: ${signUpResult.error.message}`);
        continue;
      }
      console.log("   ✓ ユーザー作成完了");
    }

    // Invite
    const inviteResult = await inviteMember(
      ownerCookies,
      organizationId!,
      user.email,
      user.role as "admin" | "member"
    );
    if (!inviteResult.success) {
      console.error(`   ✗ 招待エラー: ${inviteResult.error}`);
      continue;
    }
    console.log("   ✓ 招待送信完了");

    // Get invitation from DB
    const { data: invitation } = await supabase
      .from("invitation")
      .select("id")
      .eq("email", user.email)
      .eq("status", "pending")
      .single();

    if (!invitation) {
      console.error("   ✗ 招待IDが見つかりません");
      continue;
    }

    // Accept
    const userSignIn = await signIn(user.email, user.password);
    const acceptResult = await acceptInvitation(userSignIn.cookies, invitation.id);
    if (!acceptResult.success) {
      console.error("   ✗ 招待受け入れエラー");
      continue;
    }
    console.log("   ✓ 招待受け入れ完了");
  }

  console.log("\n=== 完了 ===");
  console.log("\nテスト認証情報:");
  console.log(`  パスワード: ${config.password}`);
  console.log(`  組織: ${config.orgName}`);
  console.log("\nユーザー:");
  for (const user of testUsers) {
    console.log(`  - ${user.email} (${user.role})`);
  }
}

main().catch(console.error);
