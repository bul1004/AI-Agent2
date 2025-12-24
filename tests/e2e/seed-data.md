# E2E テスト用シードデータ

## 概要

`supabase/seed.sql` には E2E テスト用の初期データが含まれています。
BetterAuth で生成されたパスワードハッシュが含まれているため、ログイン可能です。

## テストユーザー

| ロール | メール | パスワード |
|--------|--------|------------|
| owner | e2e-owner@example.com | E2eTestPassword123! |
| admin | e2e-admin@example.com | E2eTestPassword123! |
| member | e2e-member@example.com | E2eTestPassword123! |

## テスト組織

- **組織名**: E2E Test Team
- **スラッグ**: e2e-test-team
- **メンバー**: 上記3ユーザーが所属

## 初期状態への復元

### ローカル Supabase

```bash
supabase db reset
```

### リモート Supabase（本番以外）

```bash
supabase db reset --linked
```

> **注意**: `--linked` は本番環境では絶対に使用しないでください

## 環境変数

リアルメールアドレスへの招待テストを実行する場合、`.env.local` に設定:

```env
E2E_REAL_EMAIL=your-real-email@example.com
```

## シードデータの再生成

シードデータを変更したい場合：

1. `supabase db reset` でクリーン
2. `npm run dev` でサーバー起動
3. UI から手動でユーザー・組織を作成
4. Supabase Studio から `user`, `account`, `member`, `organization`, `invitation` テーブルをエクスポート
5. `supabase/seed.sql` に貼り付け
