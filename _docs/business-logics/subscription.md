# Subscription Architecture

## Purpose

- 組織単位のサブスクリプション状態管理
- Stripe 連携による決済フロー
- シンプルな月額固定費モデル（シート課金）

## プラン構成

| Plan     | 価格              | 説明                         |
| -------- | ----------------- | ---------------------------- |
| none     | ¥0                | 未契約状態（機能制限あり）   |
| business | ¥9,800/シート/月  | 全機能利用可能（フェアユース）|

- 定義ファイル: `lib/server/stripe.ts`
- 従量課金なし、トークン制限なし（フェアユース、異常利用のみ段階制御）
- チャット履歴: 最終更新日から6ヶ月保持
- 30日返金保証

## Data Model

### Table: `subscriptions`

| Column                   | Type        | Description                                   |
| ------------------------ | ----------- | --------------------------------------------- |
| `id`                     | TEXT (PK)   | 内部識別子                                    |
| `organizationId`         | TEXT UNIQUE | 組織 ID（BetterAuth）                         |
| `stripeCustomerId`       | TEXT UNIQUE | Stripe Customer ID                            |
| `stripeSubscriptionId`   | TEXT UNIQUE | Stripe Subscription ID                        |
| `plan`                   | ENUM        | `none` / `business`                           |
| `status`                 | ENUM        | `active`, `canceled`, `past_due`, `trialing`, `unpaid` |
| `currentPeriodStart`     | TIMESTAMPTZ | 現在の請求期間開始                            |
| `currentPeriodEnd`       | TIMESTAMPTZ | 現在の請求期間終了                            |
| `cancelAtPeriodEnd`      | BOOLEAN     | 次回更新でのキャンセル予約                    |
| `createdAt` / `updatedAt`| TIMESTAMPTZ | タイムスタンプ                                |

- 1組織1レコードを `organizationId` の UNIQUE 制約で強制

### Table: `usage`

| Column           | Type        | Description                |
| ---------------- | ----------- | -------------------------- |
| `id`             | TEXT (PK)   | 内部識別子                 |
| `organizationId` | TEXT        | 組織 ID                    |
| `month`          | DATE        | 集計月（YYYY-MM-01）       |
| `messagesCount`  | INTEGER     | メッセージ数               |
| `tokensUsed`     | BIGINT      | トークン使用量             |
| `filesUploaded`  | INTEGER     | アップロードファイル数     |
| `storageBytes`   | BIGINT      | ストレージ使用量           |

- `(organizationId, month)` で UNIQUE
- `increment_usage()` 関数で UPSERT 更新

## Stripe 連携フロー

### 新規契約

1. ユーザーが `PricingTable` でプランを選択
2. `/api/stripe/checkout` で Stripe Customer 作成（未契約レコード作成）
3. Stripe Checkout Session にリダイレクト
4. 決済完了後、Webhook `checkout.session.completed` で `plan: business` に更新

### サブスクリプション更新

- Webhook `customer.subscription.updated` で `status`, `currentPeriodStart/End`, `cancelAtPeriodEnd` を同期

### 解約

- Webhook `customer.subscription.deleted` で `plan: none`, `status: canceled` に更新

## RLS ポリシー

- `SELECT`: 組織メンバーのみ閲覧可能
- `INSERT/UPDATE/DELETE`: `service_role` のみ（Webhook 経由）

## チャット履歴クリーンアップ

- `cleanup_old_chat_threads(months)` 関数で最終更新日から指定月数経過したスレッドを削除
- デフォルト: 6ヶ月
- pg_cron 等で定期実行を想定

## Client Hook

`hooks/use-subscription.ts` で以下を提供:

- `subscription`: 現在のサブスクリプション情報
- `usage`: 当月の使用量
- `plan`, `planDetails`, `limits`: プラン情報
- `isSubscribed`: 有料契約中かどうか
- `canManageSubscription`: サブスク管理権限（owner/admin）

## File Reference

| ファイル                                    | 役割                              |
| ------------------------------------------- | --------------------------------- |
| `supabase/migrations/004_subscription_tables.sql` | テーブル・RLS・関数定義     |
| `supabase/migrations/006_single_plan_subscription.sql` | プラン移行・チャットクリーンアップ |
| `lib/server/stripe.ts`                      | プラン定義・Stripe クライアント   |
| `app/api/stripe/checkout/_lib/handler.ts`   | Checkout Session 作成             |
| `app/api/stripe/webhook/_lib/handler.ts`    | Webhook 処理                      |
| `app/api/stripe/portal/_lib/handler.ts`     | Customer Portal リダイレクト      |
| `hooks/use-subscription.ts`                 | クライアント側フック              |
| `components/billing/`                       | 料金表・サブスク状態表示 UI       |
