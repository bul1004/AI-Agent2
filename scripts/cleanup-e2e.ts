/**
 * E2Eテストデータ削除スクリプト
 *
 * 使用方法:
 *   npx tsx scripts/cleanup-e2e.ts
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { getTestConfig } from "../tests/e2e/test-users";

async function main() {
  const config = getTestConfig();

  console.log("=== E2E Cleanup ===\n");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user IDs
  const { data: users } = await supabase
    .from("user")
    .select("id, email")
    .like("email", "e2e-%@example.com");

  const userIds = users?.map((u) => u.id) || [];
  console.log(`削除対象ユーザー: ${userIds.length}名`);
  users?.forEach((u) => console.log(`  - ${u.email}`));

  if (userIds.length > 0) {
    await supabase.from("member").delete().in("userId", userIds);
    await supabase.from("session").delete().in("userId", userIds);
    await supabase.from("account").delete().in("userId", userIds);
    await supabase.from("user").delete().in("id", userIds);
    console.log("✓ ユーザー削除完了");
  }

  // Delete invitations
  const { count: invCount } = await supabase
    .from("invitation")
    .delete({ count: "exact" })
    .like("email", "e2e-%@example.com");
  console.log(`✓ 招待削除: ${invCount || 0}件`);

  // Delete organization
  const { count: orgCount } = await supabase
    .from("organization")
    .delete({ count: "exact" })
    .eq("name", config.orgName);
  console.log(`✓ 組織削除: ${orgCount || 0}件`);

  console.log("\n=== 完了 ===");
}

main().catch(console.error);
