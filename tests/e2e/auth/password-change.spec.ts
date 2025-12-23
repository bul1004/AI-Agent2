import { test, expect } from "@playwright/test";
import {
  createTestUser,
  cleanupTestUser,
  openPasswordSettings,
} from "./fixtures";

/**
 * E2Eテスト: パスワード変更機能
 *
 * ハッピーパス:
 * 1. メールサインアップ後、設定からパスワードを変更できる
 *
 * 異常系:
 * 1. 現在のパスワードが間違っている場合はエラー
 * 2. パスワードが8文字未満の場合はバリデーションエラー
 */

test.describe("パスワード変更", () => {
  const testPassword = "testPassword123!";
  const newPassword = "newPassword456!";

  // 各テスト後にテストユーザーをクリーンアップ
  test.afterEach(async ({ page }) => {
    await cleanupTestUser(page);
  });

  test("メールサインアップ後、設定からパスワードを変更できる", async ({
    page,
  }) => {
    // テストユーザーを作成
    await createTestUser(page, { password: testPassword });

    // パスワード設定画面を開く
    await openPasswordSettings(page);

    // パスワード変更フォームに入力
    await page.locator('[data-testid="current-password-input"]').fill(testPassword);
    await page.locator('[data-testid="new-password-input"]').fill(newPassword);
    await page.locator('[data-testid="confirm-password-input"]').fill(newPassword);

    // 変更ボタンをクリック
    await page.locator('[data-testid="change-password-submit"]').click();

    // 成功トーストを確認（sonnerトーストまたはアカウント画面への戻りを確認）
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: 'パスワードを変更しました' }).or(
        page.locator('text=パスワードを変更しました')
      ).or(
        // パスワード変更成功後はアカウント overview に戻る
        page.locator('h2:has-text("アカウント")')
      )
    ).toBeVisible({ timeout: 15000 });
  });

  test("現在のパスワードが間違っている場合はエラーが表示される", async ({
    page,
  }) => {
    // テストユーザーを作成
    await createTestUser(page, { password: testPassword });

    // パスワード設定画面を開く
    await openPasswordSettings(page);

    // 間違ったパスワードで変更を試みる
    await page.locator('[data-testid="current-password-input"]').fill("wrongPassword123!");
    await page.locator('[data-testid="new-password-input"]').fill(newPassword);
    await page.locator('[data-testid="confirm-password-input"]').fill(newPassword);

    await page.locator('[data-testid="change-password-submit"]').click();

    // エラートーストを確認（sonnerトースト）
    await expect(
      page.locator('[data-sonner-toast][data-type="error"]')
    ).toBeVisible({ timeout: 15000 });
  });

  test("新しいパスワードが8文字未満の場合はバリデーションエラーが表示される", async ({
    page,
  }) => {
    // テストユーザーを作成
    await createTestUser(page, { password: testPassword });

    // パスワード設定画面を開く
    await openPasswordSettings(page);

    // 短いパスワードで変更を試みる
    await page.locator('[data-testid="current-password-input"]').fill(testPassword);
    await page.locator('[data-testid="new-password-input"]').fill("short");
    await page.locator('[data-testid="confirm-password-input"]').fill("short");

    await page.locator('[data-testid="change-password-submit"]').click();

    // バリデーションエラーを確認
    await expect(
      page.locator('text=パスワードは8文字以上で入力してください')
    ).toBeVisible({ timeout: 5000 });
  });
});
