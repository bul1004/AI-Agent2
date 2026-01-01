import { test } from "@playwright/test";
import { BillingPage } from "../page-objects/BillingPage";
import { loginAsUser, switchToOrganization } from "./fixtures";

/**
 * E2Eテスト: 契約済み状態でのサブスクリプション表示
 *
 * テスト観点:
 * - 契約済みの場合「契約中」ボタンが表示される
 * - 契約済みの場合ボタンは無効化されている
 *
 * 使用するシードデータ:
 * - e2e-owner@example.com (owner権限)
 * - E2E Test Team 組織（businessプラン契約済み）
 *
 * 注意: シードデータにbusinessプランのサブスクリプションが含まれています
 */

test.describe("契約済み状態でのサブスクリプション表示", () => {
  test("契約済みの場合「契約中」ボタンが表示される", async ({ page }) => {
    // オーナーでログイン
    await loginAsUser(page, "owner");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // 契約済み状態を確認
    await billingPage.expectSubscribed();
  });

  test("契約済みでもプラン詳細は表示される", async ({ page }) => {
    // オーナーでログイン
    await loginAsUser(page, "owner");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // プラン詳細は表示される
    await billingPage.expectBusinessPlanDisplayed();
  });
});
