import { test, expect } from "@playwright/test";
import { SignupPage } from "../page-objects/SignupPage";

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

// テスト用のユニークなメールアドレスを生成
const generateTestEmail = () =>
  `test-pwd-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

/**
 * アカウント設定モーダルを開き、プロフィール編集画面に遷移する
 */
async function openPasswordSettings(page: import("@playwright/test").Page) {
  // アバターボタンにホバーしてメニューを開く
  const avatarButton = page.locator('[data-testid="profile-avatar-button"]');
  await avatarButton.waitFor({ state: "visible", timeout: 10000 });
  await avatarButton.hover();

  // プロフィールメニューからアカウント設定を開く（ユーザー名/メールが表示されているセクションをクリック）
  // これはアカウントタブを開く
  const accountButton = page.locator('[data-testid="profile-menu-account"]');
  const profileSection = page.locator('.rounded-2xl.border button').first();

  // アカウントボタンがあればクリック、なければプロフィールセクションをクリック
  if (await accountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await accountButton.click();
  } else {
    await profileSection.waitFor({ state: "visible", timeout: 5000 });
    await profileSection.click();
  }

  // 設定モーダルが表示されるのを待つ
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

  // プロフィール編集ボタンをクリック
  const editProfileButton = page.locator('[data-testid="edit-profile-button"]');
  await editProfileButton.waitFor({ state: "visible", timeout: 5000 });
  await editProfileButton.click();

  // パスワード設定ボタンを待つ
  const passwordButton = page.locator('[data-testid="password-settings-button"]');
  await passwordButton.waitFor({ state: "visible", timeout: 5000 });
  await passwordButton.click();
}

test.describe("パスワード変更", () => {
  const testPassword = "testPassword123!";
  const newPassword = "newPassword456!";

  test("メールサインアップ後、設定からパスワードを変更できる", async ({
    page,
  }) => {
    const signupPage = new SignupPage(page);
    const testEmail = generateTestEmail();

    // 新規ユーザーをサインアップ
    await signupPage.goto();
    await signupPage.signup("テスト ユーザー", testEmail, testPassword);
    await signupPage.expectSignupSuccess();

    // パスワード設定画面を開く
    await openPasswordSettings(page);

    // パスワード変更フォームに入力
    await page.locator('[data-testid="current-password-input"]').fill(testPassword);
    await page.locator('[data-testid="new-password-input"]').fill(newPassword);
    await page.locator('[data-testid="confirm-password-input"]').fill(newPassword);

    // 変更ボタンをクリック
    await page.locator('[data-testid="change-password-submit"]').click();

    // 成功トーストを確認
    await expect(page.locator('text=パスワードを変更しました')).toBeVisible({
      timeout: 10000,
    });
  });

  test("現在のパスワードが間違っている場合はエラーが表示される", async ({
    page,
  }) => {
    const signupPage = new SignupPage(page);
    const testEmail = generateTestEmail();

    // 新規ユーザーをサインアップ
    await signupPage.goto();
    await signupPage.signup("テスト ユーザー", testEmail, testPassword);
    await signupPage.expectSignupSuccess();

    // パスワード設定画面を開く
    await openPasswordSettings(page);

    // 間違ったパスワードで変更を試みる
    await page.locator('[data-testid="current-password-input"]').fill("wrongPassword123!");
    await page.locator('[data-testid="new-password-input"]').fill(newPassword);
    await page.locator('[data-testid="confirm-password-input"]').fill(newPassword);

    await page.locator('[data-testid="change-password-submit"]').click();

    // エラートーストを確認
    await expect(
      page.locator('text=現在のパスワードが正しくありません').or(
        page.locator('text=パスワードの変更に失敗しました')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("新しいパスワードが8文字未満の場合はバリデーションエラーが表示される", async ({
    page,
  }) => {
    const signupPage = new SignupPage(page);
    const testEmail = generateTestEmail();

    // 新規ユーザーをサインアップ
    await signupPage.goto();
    await signupPage.signup("テスト ユーザー", testEmail, testPassword);
    await signupPage.expectSignupSuccess();

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
