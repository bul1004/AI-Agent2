import { test, expect } from "@playwright/test";
import { loginAsUser } from "../subscription/fixtures";

/**
 * E2Eテスト: 既存ユーザーがログインしてチャット画面に遷移できる
 */

test.describe("ログイン → チャット", () => {
  test("既存ユーザーがログイン後にチャット画面へ遷移できる", async ({ page }) => {
    await loginAsUser(page, "owner");

    // チャットページの主要UIが表示されることを確認
    await expect(page.getByText("チャット履歴")).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByPlaceholder("タスクを割り当てるか、何でも質問してください"),
    ).toBeVisible({ timeout: 10000 });
  });
});
