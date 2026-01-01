### Stripe Webhook処理 (`webhook`)

- Stripe Webhookが正しく処理されることを確認

#### テストケース

| テスト名                                                | 確認事項                                        |
| ------------------------------------------------------- | ----------------------------------------------- |
| `checkout.session.completed でサブスクリプションがbusinessに更新される` | 決済完了時にDBが更新される                      |
| `customer.subscription.deleted で解約処理される`        | サブスクリプション削除時にplan=noneになる        |
| `不正なシグネチャでは400エラーが返される`               | 署名検証が機能している                          |
| `シグネチャがない場合は400エラーが返される`             | シグネチャ必須チェックが機能している            |

#### 手順（checkout.session.completed）

1. テスト用のサブスクリプションレコードをDBに作成
2. checkout.session.completedイベントのペイロードを作成
3. Stripeシグネチャを生成
4. `/api/stripe/webhook`にPOSTリクエスト
5. DBを確認し、plan=businessに更新されていることを確認

#### 手順（署名検証）

1. 不正なシグネチャでWebhookエンドポイントにアクセス
2. 400エラーが返されることを確認

#### 前提条件

- Stripe Webhook Secret（`STRIPE_WEBHOOK_SECRET`）が設定済み
- ローカルテスト時: `stripe listen --forward-to localhost:8000/api/stripe/webhook`

#### 環境変数

| 変数名                 | 用途                          |
| ---------------------- | ----------------------------- |
| `STRIPE_WEBHOOK_SECRET` | Webhook署名検証用シークレット |

#### 備考

- 実際のStripe環境では署名検証が必要
- テスト環境では手動生成したシグネチャを使用
- 署名検証失敗は想定内（本番環境のみ動作）
