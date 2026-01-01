# サブスクリプション E2E テスト

## テスト観点

### 1. 個人モードでのサブスクリプション (`personal-subscription.spec.ts`)

| ケース                                     | 説明                                            |
| ------------------------------------------ | ----------------------------------------------- |
| 個人モードでプラン詳細が正しく表示される   | 「/月」表記、「個人事業主向けプラン」の表示確認 |
| Stripe チェックアウトにリダイレクトされる | 個人プランでの課金フロー完走                    |

### 2. チームモードでのサブスクリプション (`team-subscription.spec.ts`)

| ケース                                             | 説明                                   |
| -------------------------------------------------- | -------------------------------------- |
| オーナー権限でプラン詳細が正しく表示される         | 「/シート/月」表記、チームプランの確認 |
| 管理者権限でプラン詳細が正しく表示される           | 管理者もサブスク管理可能なことを確認   |
| オーナー権限で Stripe チェックアウトにリダイレクト | 組織単位での課金フロー完走             |

### 3. メンバー権限での制限 (`member-permission.spec.ts`)

| ケース                                         | 説明                                         |
| ---------------------------------------------- | -------------------------------------------- |
| メンバー権限ではサブスクボタンがグレーアウト   | 「管理者に連絡してください」の表示確認       |
| メンバー権限でもプラン詳細は閲覧できる         | 情報閲覧は可能、操作のみ制限されることを確認 |

### 4. 契約済み状態の表示 (`subscribed-state.spec.ts`)

| ケース                                   | 説明                                 |
| ---------------------------------------- | ------------------------------------ |
| 契約済みの場合「契約中」ボタンが表示される | サブスク契約後の表示確認             |
| 契約済みでもプラン詳細は表示される       | プラン情報は常に閲覧可能             |

### 5. Stripe Webhook処理 (`webhook.spec.ts`)

| ケース                                                | 説明                                  |
| ----------------------------------------------------- | ------------------------------------- |
| checkout.session.completed でサブスクリプションが更新 | 決済完了時にDBがbusinessに更新される  |
| customer.subscription.deleted で解約処理              | サブスク削除時にplan=noneになる       |
| 不正なシグネチャでは400エラー                         | 署名検証が機能している                |
| シグネチャがない場合は400エラー                       | シグネチャ必須チェックが機能している  |

### 6. Customer Portal (`customer-portal.spec.ts`)

| ケース                           | 説明                        |
| -------------------------------- | --------------------------- |
| ポータルAPIは認証が必要          | 未認証アクセスで401が返される |
| 契約済みユーザーがポータルを開く | ポータルにリダイレクトされる |

## 使用するシードデータ

| ロール | メール                 | パスワード          | 組織                |
| ------ | ---------------------- | ------------------- | ------------------- |
| owner  | e2e-owner@example.com  | E2eTestPassword123! | E2E Test Team       |
| admin  | e2e-admin@example.com  | E2eTestPassword123! | E2E Test Team       |
| member | e2e-member@example.com | E2eTestPassword123! | E2E Test Team       |

## 実行方法

```bash
# Stripe Webhook Listenerを起動（別ターミナル）
stripe listen --forward-to localhost:8000/api/stripe/webhook --log-level debug

# 全テスト実行（Chromiumのみ）
CI=true npx playwright test tests/e2e/subscription --project=chromium --reporter=list

# 個別ファイル実行
CI=true npx playwright test tests/e2e/subscription/personal-subscription.spec.ts --project=chromium --reporter=list
CI=true npx playwright test tests/e2e/subscription/team-subscription.spec.ts --project=chromium --reporter=list
CI=true npx playwright test tests/e2e/subscription/member-permission.spec.ts --project=chromium --reporter=list
CI=true npx playwright test tests/e2e/subscription/subscribed-state.spec.ts --project=chromium --reporter=list
CI=true npx playwright test tests/e2e/subscription/webhook.spec.ts --project=chromium --reporter=list
CI=true npx playwright test tests/e2e/subscription/customer-portal.spec.ts --project=chromium --reporter=list
```

## 前提条件

- Supabase が起動している
- シードデータが投入済み (`supabase db reset`)
- Stripe テスト環境が設定済み
- 環境変数が設定済み:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_ID_BUSINESS`
  - `STRIPE_WEBHOOK_SECRET`

## ファイル構成

```
tests/e2e/subscription/
├── README.md                        # このファイル
├── fixtures.ts                      # テスト用フィクスチャ（ログイン、組織切り替え）
├── personal-subscription.spec.ts    # 個人モードテスト
├── personal-subscription.md         # 個人モードテスト仕様書
├── team-subscription.spec.ts        # チームモードテスト（オーナー/管理者）
├── team-subscription.md             # チームモードテスト仕様書
├── member-permission.spec.ts        # メンバー権限制限テスト
├── member-permission.md             # メンバー権限制限テスト仕様書
├── subscribed-state.spec.ts         # 契約済み状態テスト
├── subscribed-state.md              # 契約済み状態テスト仕様書
├── webhook.spec.ts                  # Webhook処理テスト
├── webhook.md                       # Webhook処理テスト仕様書
├── customer-portal.spec.ts          # Customer Portalテスト
└── customer-portal.md               # Customer Portalテスト仕様書
```
