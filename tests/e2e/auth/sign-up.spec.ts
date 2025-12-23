import { test, expect } from "@playwright/test";
import { LandingPage } from "../page-objects/LandingPage";
import { SignupPage } from "../page-objects/SignupPage";
import { generateTestEmail, cleanupTestUser } from "./fixtures";

/**
 * E2Eテスト: メールサインアップフロー
 *
 * ハッピーパス:
 * 1. ランディングページからサインアップページへの遷移
 * 2. サインアップフォームの入力と送信（新規ユーザー）
 *
 * 異常系:
 * 1. パスワードが8文字未満の場合のバリデーションエラー
 */

test.describe("メールサインアップ", () => {
  // 各テスト後にテストユーザーをクリーンアップ（ログイン中の場合のみ）
  test.afterEach(async ({ page }) => {
    await cleanupTestUser(page);
  });

  test("ランディングページのヘッダーからサインアップページへ遷移できる", async ({
    page,
  }) => {
    const landingPage = new LandingPage(page);
    const signupPage = new SignupPage(page);

    // ランディングページに移動
    await landingPage.goto();

    // ヘッダーの「無料で始める」ボタンをクリック
    await landingPage.clickSignupButton();

    // サインアップページに遷移したことを確認
    await expect(page).toHaveURL(/\/signup/);
    await signupPage.expectLoaded();
  });

  test("ランディングページのモーダルからサインアップページへ遷移できる", async ({
    page,
  }) => {
    const landingPage = new LandingPage(page);
    const signupPage = new SignupPage(page);

    // ランディングページに移動
    await landingPage.goto();

    // チャット入力をフォーカスしてモーダルを開く
    await landingPage.focusChatInput();
    await landingPage.expectModalVisible();

    // モーダル内の「メールで登録」ボタンをクリック
    await landingPage.clickModalSignupButton();

    // サインアップページに遷移したことを確認
    await expect(page).toHaveURL(/\/signup/);
    await signupPage.expectLoaded();
  });

  test("新規ユーザーがメールでサインアップできる", async ({ page }) => {
    const signupPage = new SignupPage(page);

    // サインアップページに移動
    await signupPage.goto();

    // テストユーザー情報
    const testUser = {
      name: "テスト ユーザー",
      email: generateTestEmail(),
      password: "testPassword123!",
    };

    // サインアップフォームに入力して送信
    await signupPage.signup(testUser.name, testUser.email, testUser.password);

    // サインアップ成功（/chatにリダイレクト）
    await signupPage.expectSignupSuccess();
  });

  test("パスワードが8文字未満の場合エラーが表示される", async ({ page }) => {
    const signupPage = new SignupPage(page);

    // サインアップページに移動
    await signupPage.goto();

    // 短いパスワードでサインアップを試みる
    await signupPage.fillSignupForm(
      "テスト ユーザー",
      generateTestEmail(),
      "short" // 5文字
    );

    // 送信ボタンをクリック（HTML5バリデーションでブロックされるか確認）
    await signupPage.submitSignupForm();

    // まだサインアップページにいることを確認（リダイレクトされていない）
    await expect(page).toHaveURL(/\/signup/);
  });
});
