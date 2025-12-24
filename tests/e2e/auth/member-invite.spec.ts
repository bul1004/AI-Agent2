import { test, expect } from "@playwright/test";
import {
  createTestUser,
  cleanupTestUser,
  generateTestEmail,
  openOrganizationSettings,
  createOrganization,
  getInvitationFromDB,
  cleanupTestEmailData,
} from "./fixtures";
import { getTestConfig } from "../test-users";

/**
 * E2Eテスト: メンバー招待機能
 *
 * ハッピーパス:
 * 1. 組織を作成し、メンバーを招待できる
 * 2. 招待メールのリンクから組織に参加できる
 *
 * 異常系:
 * 1. 招待IDがない場合はエラーが表示される
 * 2. 未ログイン時はログイン促進画面が表示される
 */

test.describe("メンバー招待", () => {
  // 各テスト後にテストユーザーをクリーンアップ
  test.afterEach(async ({ page }) => {
    await cleanupTestUser(page);
  });

  test("組織オーナーがメンバーを招待できる", async ({ page }) => {
    // テストユーザーを作成（ログイン済み）
    await createTestUser(page);

    // 組織を作成
    const orgName = `テスト組織-${Date.now()}`;
    await createOrganization(page, orgName);

    // 組織設定を開く
    await openOrganizationSettings(page);

    // 招待ボタンをクリック
    const inviteButton = page.getByRole("button", { name: "招待" });
    await inviteButton.waitFor({ state: "visible", timeout: 5000 });
    await inviteButton.click();

    // 招待モーダルが表示されることを確認
    const inviteModal = page.getByRole("dialog").filter({ hasText: "チームメンバーを招待" });
    await expect(inviteModal).toBeVisible({ timeout: 5000 });

    // 招待フォームに入力
    const inviteEmail = generateTestEmail("invite");
    await page.getByLabel("メールアドレス").fill(inviteEmail);

    // 権限を選択（デフォルトはメンバー）
    // 管理者を選択する場合はここでSelectを操作

    // 招待を送信
    await page.getByRole("button", { name: "招待を送信" }).click();

    // 成功トーストを確認
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: "招待しました" })
    ).toBeVisible({ timeout: 10000 });
  });

  test("招待IDがない場合はエラーが表示される", async ({ page }) => {
    // 招待受け入れページにIDなしでアクセス
    await page.goto("/invite/accept");

    // エラーメッセージを確認
    await expect(
      page.locator("text=招待IDが見つかりません")
    ).toBeVisible({ timeout: 10000 });
  });

  test("未ログイン時は招待受け入れページでログイン促進が表示される", async ({ page }) => {
    // 偽の招待IDで招待受け入れページにアクセス
    await page.goto("/invite/accept?id=fake-invitation-id");

    // ログイン促進画面を確認
    await expect(
      page.locator("text=ログインが必要です")
    ).toBeVisible({ timeout: 10000 });

    // ログインボタンが表示されることを確認
    await expect(
      page.getByRole("link", { name: "ログイン" })
    ).toBeVisible();

    // 新規登録ボタンが表示されることを確認
    await expect(
      page.getByRole("link", { name: "新規登録" })
    ).toBeVisible();
  });

  test("招待を受け入れて組織に参加できる", async ({ page, context }) => {
    // === オーナーとして組織作成・招待 ===
    const ownerUser = await createTestUser(page, {
      email: generateTestEmail("owner")
    });

    const orgName = `招待テスト組織-${Date.now()}`;
    await createOrganization(page, orgName);

    // 招待を送信
    await openOrganizationSettings(page);
    const inviteButton = page.getByRole("button", { name: "招待" });
    await inviteButton.click();

    const inviteeEmail = generateTestEmail("invitee");
    await page.getByLabel("メールアドレス").fill(inviteeEmail);
    await page.getByRole("button", { name: "招待を送信" }).click();

    // 成功トーストを待つ
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: "招待しました" })
    ).toBeVisible({ timeout: 10000 });

    // DBから招待IDを取得
    const invitationId = await getInvitationFromDB(inviteeEmail);
    if (!invitationId) {
      test.skip(true, "招待IDの取得をスキップ（DB接続なし）");
      return;
    }

    // オーナーをサインアウト
    await cleanupTestUser(page);

    // === 招待されたユーザーとして参加 ===
    // 新規ユーザーを作成
    await createTestUser(page, {
      name: "招待ユーザー",
      email: inviteeEmail,
      password: "inviteePassword123!",
    });

    // 招待受け入れページにアクセス
    await page.goto(`/invite/accept?id=${invitationId}`);

    // 成功メッセージを確認
    await expect(
      page.locator("text=招待を受け入れました")
    ).toBeVisible({ timeout: 15000 });

    // チャットページにリダイレクトされることを確認
    await expect(page).toHaveURL("/chat", { timeout: 10000 });
  });

  test("リアルメールアドレスに招待メールを送信できる", async ({ page }) => {
    const config = getTestConfig();

    // E2E_REAL_EMAIL が設定されていない場合はスキップ
    if (!config.realEmail) {
      test.skip(true, "E2E_REAL_EMAIL が設定されていません");
      return;
    }

    // テスト前にリアルメールの招待・メンバーシップをクリーンアップ
    await cleanupTestEmailData(config.realEmail);

    // テストユーザーを作成（ログイン済み）
    await createTestUser(page);

    // 組織を作成
    const orgName = `リアルメールテスト-${Date.now()}`;
    await createOrganization(page, orgName);

    // 組織設定を開く
    await openOrganizationSettings(page);

    // 招待ボタンをクリック
    const inviteButton = page.getByRole("button", { name: "招待" });
    await inviteButton.waitFor({ state: "visible", timeout: 5000 });
    await inviteButton.click();

    // 招待モーダルが表示されることを確認
    const inviteModal = page.getByRole("dialog").filter({ hasText: "チームメンバーを招待" });
    await expect(inviteModal).toBeVisible({ timeout: 5000 });

    // リアルメールアドレスを入力
    await page.getByLabel("メールアドレス").fill(config.realEmail);

    // 招待を送信
    await page.getByRole("button", { name: "招待を送信" }).click();

    // 成功トーストを確認
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: "招待しました" })
    ).toBeVisible({ timeout: 10000 });

    // DBに招待が作成されたことを確認
    const invitationId = await getInvitationFromDB(config.realEmail);
    expect(invitationId).toBeTruthy();
  });
});
