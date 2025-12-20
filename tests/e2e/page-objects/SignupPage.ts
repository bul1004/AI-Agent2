import { expect, type Locator, type Page } from "@playwright/test";

/**
 * サインアップページのPage Object
 * /signupにあるアカウント作成ページを操作するためのクラス
 */
export class SignupPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // ページタイトル
    this.heading = page.getByRole("heading", { name: "アカウント作成" });
    // 名前入力フィールド
    this.nameInput = page.getByLabel("名前");
    // メール入力フィールド
    this.emailInput = page.getByLabel("メールアドレス");
    // パスワード入力フィールド
    this.passwordInput = page.getByLabel("パスワード");
    // 送信ボタン
    this.submitButton = page.getByRole("button", { name: /アカウント作成/ });
    // ログインリンク
    this.loginLink = page.getByRole("link", { name: "ログイン" });
  }

  /**
   * サインアップページに移動
   */
  async goto() {
    await this.page.goto("/signup");
    await this.expectLoaded();
  }

  /**
   * ページが正常にロードされたことを確認
   */
  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * サインアップフォームに入力
   */
  async fillSignupForm(name: string, email: string, password: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * サインアップフォームを送信
   */
  async submitSignupForm() {
    await this.submitButton.click();
  }

  /**
   * サインアップを実行（入力 + 送信）
   */
  async signup(name: string, email: string, password: string) {
    await this.fillSignupForm(name, email, password);
    await this.submitSignupForm();
  }

  /**
   * 送信ボタンがローディング状態かを確認
   */
  async expectSubmitLoading() {
    await expect(this.submitButton).toHaveText(/アカウント作成中/);
  }

  /**
   * サインアップ成功を確認（/chatにリダイレクト）
   */
  async expectSignupSuccess() {
    await expect(this.page).toHaveURL(/\/chat/, { timeout: 15_000 });
  }

  /**
   * エラーメッセージを確認（Sonner toast）
   */
  async expectErrorMessage(message: string | RegExp) {
    const toastLocator = this.page.locator("[data-sonner-toast]");
    await expect(toastLocator).toContainText(message, { timeout: 5_000 });
  }
}
