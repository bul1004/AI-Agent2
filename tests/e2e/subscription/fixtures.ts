import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * E2Eテスト用フィクスチャ: サブスクリプション
 *
 * シードデータのユーザーを使用してテストを行う
 * @see tests/e2e/seed-data.md
 */

/** テストユーザー情報 */
export const TEST_USERS = {
  owner: {
    email: "e2e-owner@example.com",
    password: "E2eTestPassword123!",
    name: "E2E Owner",
    role: "owner" as const,
  },
  admin: {
    email: "e2e-admin@example.com",
    password: "E2eTestPassword123!",
    name: "E2E Admin",
    role: "admin" as const,
  },
  member: {
    email: "e2e-member@example.com",
    password: "E2eTestPassword123!",
    name: "E2E Member",
    role: "member" as const,
  },
};

/** テスト組織情報 */
export const TEST_ORG = {
  name: "E2E Test Team",
  slug: "e2e-test-team",
};

/**
 * シードデータのユーザーでログイン
 */
export async function loginAsUser(
  page: Page,
  userType: keyof typeof TEST_USERS,
): Promise<void> {
  const user = TEST_USERS[userType];

  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // ログインフォームに入力
  await page.getByPlaceholder("email@example.com").fill(user.email);
  await page.getByPlaceholder("••••••••").fill(user.password);
  await page
    .getByRole("button", { name: "ログイン", exact: true })
    .click();

  // チャットページにリダイレクトされるのを待つ
  await expect(page).toHaveURL(/\/chat/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

/**
 * 組織モードに切り替え（チームを選択）
 */
export async function switchToOrganization(page: Page): Promise<void> {
  // サイドバーのプロフィールボタンをクリック
  const profileBtn = page.locator("aside button").last();
  await profileBtn.waitFor({ state: "visible", timeout: 10000 });
  await profileBtn.click();

  // チームを選択（E2E Test Team）
  const teamMenuItem = page.getByRole("menuitem", { name: "E2E Test Team" });
  await teamMenuItem.waitFor({ state: "visible", timeout: 5000 });
  await teamMenuItem.click();

  // 切り替えを待つ
  await page.waitForTimeout(1000);
}
