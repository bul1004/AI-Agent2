/**
 * E2Eテスト用ユーザー設定
 *
 * .env.local から読み込んだテストユーザー情報を提供
 * スクリプトとE2Eテストの両方で使用
 */

export interface TestUserConfig {
  email: string;
  name: string;
  password: string;
  role: "owner" | "admin" | "member";
}

export interface TestConfig {
  password: string;
  orgName: string;
  owner: TestUserConfig;
  admin: TestUserConfig;
  member: TestUserConfig;
  realEmail: string;
}

/**
 * 環境変数からテスト設定を取得
 */
export function getTestConfig(): TestConfig {
  const password = process.env.E2E_TEST_PASSWORD || "E2eTestPassword123!";
  const orgName = process.env.E2E_TEST_ORG_NAME || "E2E Test Team";

  return {
    password,
    orgName,
    owner: {
      email: process.env.E2E_OWNER_EMAIL || "e2e-owner@gibberishlab.com",
      name: process.env.E2E_OWNER_NAME || "E2E Owner",
      password,
      role: "owner",
    },
    admin: {
      email: process.env.E2E_ADMIN_EMAIL || "e2e-admin@gibberishlab.com",
      name: process.env.E2E_ADMIN_NAME || "E2E Admin",
      password,
      role: "admin",
    },
    member: {
      email: process.env.E2E_MEMBER_EMAIL || "e2e-member@gibberishlab.com",
      name: process.env.E2E_MEMBER_NAME || "E2E Member",
      password,
      role: "member",
    },
    realEmail: process.env.E2E_REAL_EMAIL || "",
  };
}

/**
 * テスト設定が有効かチェック
 */
export function isTestConfigValid(): boolean {
  const config = getTestConfig();
  return !!(
    config.owner.email &&
    config.admin.email &&
    config.member.email &&
    config.password
  );
}

/**
 * 全テストユーザーを配列で取得
 */
export function getAllTestUsers(): TestUserConfig[] {
  const config = getTestConfig();
  return [config.owner, config.admin, config.member];
}
