/**
 * E2Eテスト用認証ヘルパー
 *
 * 事前に作成されたテストユーザーでログインするためのユーティリティ
 */

import type { Page } from "@playwright/test";
import { getTestConfig, type TestUserConfig } from "./test-users";

const config = getTestConfig();

/**
 * 指定したメール/パスワードでログイン
 */
export async function signInWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");

  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();

  // ログイン成功を待つ
  await page.waitForURL(/\/(chat|$)/, { timeout: 15000 });
}

/**
 * オーナーとしてログイン
 */
export async function signInAsOwner(page: Page): Promise<void> {
  await signInWithCredentials(page, config.owner.email, config.owner.password);
}

/**
 * 管理者としてログイン
 */
export async function signInAsAdmin(page: Page): Promise<void> {
  await signInWithCredentials(page, config.admin.email, config.admin.password);
}

/**
 * メンバーとしてログイン
 */
export async function signInAsMember(page: Page): Promise<void> {
  await signInWithCredentials(page, config.member.email, config.member.password);
}

/**
 * テストユーザー設定を取得
 */
export function getOwnerUser(): TestUserConfig {
  return config.owner;
}

export function getAdminUser(): TestUserConfig {
  return config.admin;
}

export function getMemberUser(): TestUserConfig {
  return config.member;
}

/**
 * テスト組織名を取得
 */
export function getTestOrgName(): string {
  return config.orgName;
}

/**
 * 事前作成ユーザーが利用可能かチェック
 */
export function hasPreseededUsers(): boolean {
  return !!(
    config.owner.email &&
    config.admin.email &&
    config.member.email &&
    config.password
  );
}
