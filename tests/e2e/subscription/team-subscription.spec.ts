import { test } from "@playwright/test";
import { BillingPage } from "../page-objects/BillingPage";
import { loginAsUser, switchToOrganization } from "./fixtures";

/**
 * E2Eテスト: チームモードでのサブスクリプション（オーナー/管理者）
 *
 * テスト観点:
 * - オーナー権限で組織単位の課金ができる
 * - 管理者権限で組織単位の課金ができる
 * - チームプラン用の表示がされる
 * - Stripeチェックアウトにリダイレクトされる
 *
 * 使用するシードデータ:
 * - e2e-owner@example.com (owner権限)
 * - e2e-admin@example.com (admin権限)
 */

test.describe("チームモードでのサブスクリプション", () => {
  test("オーナー権限でプラン詳細が正しく表示される", async ({ page }) => {
    // オーナーでログイン
    await loginAsUser(page, "owner");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // チームモードの表示を確認
    await billingPage.expectTeamMode();
    await billingPage.expectBusinessPlanDisplayed();
    await billingPage.expectNotSubscribed();
  });

  test("管理者権限でプラン詳細が正しく表示される", async ({ page }) => {
    // 管理者でログイン
    await loginAsUser(page, "admin");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // チームモードの表示を確認
    await billingPage.expectTeamMode();
    await billingPage.expectBusinessPlanDisplayed();
    await billingPage.expectNotSubscribed();
  });

  test("オーナー権限でStripeチェックアウトにリダイレクトされる", async ({
    page,
  }) => {
    // オーナーでログイン
    await loginAsUser(page, "owner");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // チェックアウトを開始
    await billingPage.startCheckout();

    // Stripeにリダイレクトされることを確認
    await billingPage.expectRedirectToStripe();
  });
});
