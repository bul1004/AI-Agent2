# Auth テスト一覧

BetterAuth 認証・認可機能の E2E テストをまとめています。

| ファイル                                    | 確認事項                                               | 主なテストケース                                                                       |
| ------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [sign-up.spec.ts](./sign-up.md)             | メール/パスワードでの新規登録フロー                    | ランディングページからサインアップへ遷移、新規ユーザー登録→/chat へ遷移、バリデーション |
| [member-invite.spec.ts](./member-invite.md) | 組織への招待・招待受理フロー                           | 招待送信、招待リンク検証、ログイン促進表示、招待受け入れ→組織参加                      |
| [password-change.spec.ts](./password-change.md) | パスワード変更フロー                               | パスワード変更成功、現在のパスワード不一致エラー、バリデーションエラー                 |

## 使用するテストユーザー

| 環境変数                | 用途                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `E2E_REAL_EMAIL`        | リアルメール送信テスト用（招待メールテスト、設定されていない場合はスキップ） |

※ 基本的には `fixtures.ts` の `generateTestEmail()` でユニークなテストメールを動的生成

## テスト実行

```bash
# auth ディレクトリ全体を実行
npx playwright test tests/e2e/auth/

# 特定のファイルのみ実行
npx playwright test tests/e2e/auth/sign-up.spec.ts
npx playwright test tests/e2e/auth/member-invite.spec.ts
npx playwright test tests/e2e/auth/password-change.spec.ts
```

## 共通フィクスチャ（fixtures.ts）

| 関数名                       | 用途                                           |
| ---------------------------- | ---------------------------------------------- |
| `generateTestEmail`          | ユニークなテストメールアドレスを生成           |
| `createTestUser`             | テストユーザーを作成してログイン状態にする     |
| `cleanupTestUser`            | テストユーザーを削除＆サインアウト             |
| `openAccountSettings`        | 設定モーダル（アカウントタブ）を開く           |
| `openPasswordSettings`       | パスワード設定画面を開く                       |
| `createOrganization`         | 組織を作成する                                 |
| `openOrganizationSettings`   | 組織設定タブを開く                             |
| `getInvitationFromDB`        | DBから招待IDを取得する                         |
| `cleanupTestEmailData`       | 指定メールの招待・メンバーシップをクリーンアップ |

## 前提条件

- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` が設定されていること（DB操作を行うテスト用）
- 各テストは独立して実行可能（テストごとに新規ユーザー・組織を作成）
- テスト後は `cleanupTestUser` でクリーンアップを実行

