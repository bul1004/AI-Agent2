# Playwright E2E テスト運用ガイド

## 1. テスト観点

- **ハッピーパス** 2〜3本（完走フロー）
- **異常系** 必要に応じて追加（入力エラー、権限、API失敗など）

## 2. 実行コマンド

```bash
# 標準（AI/CI向け）
CI=true npx playwright test <test-file> --project=chromium --reporter=list

# フォルダ単位（並列実行）
npx playwright test tests/<folder> --workers=4 --reporter=list
```

**ルール**:

- `--reporter=list` 必須（HTMLレポーターはサンドボックスで失敗する）
- ブラウザは Chromium, Microsoft Edge, Safari
- ポート競合時は `npm run dev` を先に起動し、`--base-url` で指定

## 3. データ準備

| 種類        | ファイル                  | 用途                                       |
| ----------- | ------------------------- | ------------------------------------------ |
| **Seed**    | `supabase/seed.local.sql` | 恒久データ（テンプレート、ユーザー、権限） |
| **Fixture** | `tests/**/fixtures.ts`    | Seed補助、一時データ生成・削除             |

**Seed実行**:

```bash
npm run db:seed:local
```

## 4. 運用ルール

- **本番デプロイ前に全テストパス必須**
- Seed済みデータを前提にシナリオ設計
- 遅延が読みにくい箇所は `expect.poll` やタイムアウト余裕で吸収
- 失敗時は Playwright ログ + サーバーログで UI/API を切り分け
