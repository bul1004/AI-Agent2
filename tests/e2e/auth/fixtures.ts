import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { SignupPage } from "../page-objects/SignupPage";
import { createClient } from "@supabase/supabase-js";

/**
 * E2Eテスト用フィクスチャ
 *
 * テストユーザーの作成・削除など、複数のテストファイルで共有する機能を提供
 */

/**
 * Supabase Admin クライアント（テスト用）
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * テスト用のユニークなメールアドレスを生成
 */
export function generateTestEmail(prefix = "test") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * テストユーザー情報
 */
export interface TestUser {
  name: string;
  email: string;
  password: string;
}

/**
 * テストユーザーを作成してログイン状態にする
 */
export async function createTestUser(
  page: Page,
  options?: Partial<TestUser>
): Promise<TestUser> {
  const signupPage = new SignupPage(page);
  const testUser: TestUser = {
    name: options?.name ?? "テスト ユーザー",
    email: options?.email ?? generateTestEmail(),
    password: options?.password ?? "testPassword123!",
  };

  await signupPage.goto();
  await signupPage.signup(testUser.name, testUser.email, testUser.password);
  await signupPage.expectSignupSuccess();

  return testUser;
}

/**
 * 現在ログイン中のテストユーザーを削除する
 *
 * BetterAuthの delete-user APIを使用
 * 注意: deleteUser機能がサーバーで有効になっている必要がある
 */
export async function deleteCurrentUser(page: Page): Promise<boolean> {
  try {
    // BetterAuthのセッションCookieを使ってユーザーを削除
    const response = await page.request.post("/api/auth/delete-user", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {},
    });

    if (response.ok()) {
      return true;
    }

    // delete-userが有効でない場合はログだけ出して続行
    console.warn(
      `Failed to delete test user: ${response.status()} - delete-user may not be enabled`
    );
    return false;
  } catch (error) {
    console.warn("Error deleting test user:", error);
    return false;
  }
}

/**
 * テストユーザーをサインアウトする
 */
export async function signOutUser(page: Page): Promise<void> {
  try {
    await page.request.post("/api/auth/sign-out", {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.warn("Error signing out user:", error);
  }
}

/**
 * テストユーザー作成後のクリーンアップを行うヘルパー
 *
 * 使用例:
 * ```typescript
 * test.afterEach(async ({ page }) => {
 *   await cleanupTestUser(page);
 * });
 * ```
 */
export async function cleanupTestUser(page: Page): Promise<void> {
  // まずユーザー削除を試み、失敗してもサインアウトは行う
  await deleteCurrentUser(page);
  await signOutUser(page);
}

/**
 * 設定モーダルを開く（アカウントタブ）
 */
export async function openAccountSettings(page: Page): Promise<void> {
  // アバターボタンにホバーしてメニューを開く
  const avatarButton = page.locator('[data-testid="profile-avatar-button"]');
  await avatarButton.waitFor({ state: "visible", timeout: 10000 });
  await avatarButton.hover();

  // プロフィールメニューからアカウント設定を開く
  const accountButton = page.locator('[data-testid="profile-menu-account"]');
  await accountButton.waitFor({ state: "visible", timeout: 5000 });
  await accountButton.click();

  // 設定モーダルが表示されるのを待つ
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
}

/**
 * パスワード設定画面を開く
 */
export async function openPasswordSettings(page: Page): Promise<void> {
  await openAccountSettings(page);

  // プロフィール編集ボタンをクリック
  const editProfileButton = page.locator('[data-testid="edit-profile-button"]');
  await editProfileButton.waitFor({ state: "visible", timeout: 5000 });
  await editProfileButton.click();

  // パスワード設定ボタンを待つ
  const passwordButton = page.locator(
    '[data-testid="password-settings-button"]'
  );
  await passwordButton.waitFor({ state: "visible", timeout: 5000 });
  await passwordButton.click();
}

/**
 * 組織を作成する
 */
export async function createOrganization(page: Page, name: string): Promise<void> {
  // サイドバーのドロップダウンを開く
  const profileTrigger = page.locator('button').filter({ has: page.locator('.font-semibold') }).first();
  await profileTrigger.waitFor({ state: "visible", timeout: 10000 });
  await profileTrigger.click();

  // チーム作成ボタンをクリック
  const createTeamButton = page.locator('text=チームを作成');
  await createTeamButton.waitFor({ state: "visible", timeout: 5000 });
  await createTeamButton.click();

  // 組織作成モーダルが表示されるのを待つ
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

  // チーム名を入力
  await page.getByLabel("チーム名").fill(name);

  // 作成ボタンをクリック
  await page.getByRole("button", { name: "チームを作成" }).click();

  // 成功を確認（モーダルが閉じる or トーストが表示される）
  await expect(page.locator('[role="dialog"]').filter({ hasText: "新しいチームを作成" })).not.toBeVisible({ timeout: 10000 });
}

/**
 * 組織設定を開く（設定モーダル → 組織タブ）
 */
export async function openOrganizationSettings(page: Page): Promise<void> {
  // サイドバーのドロップダウンを開く
  const profileTrigger = page.locator('button').filter({ has: page.locator('.font-semibold') }).first();
  await profileTrigger.waitFor({ state: "visible", timeout: 10000 });
  await profileTrigger.click();

  // 設定ボタンをクリック（exactマッチ）
  const settingsButton = page.getByRole("menuitem", { name: "設定", exact: true });
  await settingsButton.waitFor({ state: "visible", timeout: 5000 });
  await settingsButton.click();

  // 設定モーダルが表示されるのを待つ
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: "visible", timeout: 5000 });

  // モーダル内の組織タブをクリック
  const orgTab = dialog.getByRole("button", { name: "組織", exact: true });
  await orgTab.waitFor({ state: "visible", timeout: 5000 });
  await orgTab.click();

  // 組織タブのコンテンツが表示されるのを待つ
  await expect(dialog.locator('text=組織情報')).toBeVisible({ timeout: 5000 });
}

/**
 * DBから招待情報を取得する
 */
export async function getInvitationFromDB(email: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("Supabase admin client not available, skipping DB lookup");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("invitation")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .order("createdAt", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn("Failed to get invitation from DB:", error?.message);
      return null;
    }

    return data.id;
  } catch (err) {
    console.warn("Error getting invitation from DB:", err);
    return null;
  }
}
