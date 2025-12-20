# Jest 単体テスト運用ルール

## いつ Jest を使うか

- **純粋な計算・整形ロジック**（例: フォーマッタ、バリデーション、サニタイザ）。外部 I/O へ依存しないこと。
- **副作用が限定されたユーティリティ**。HTTP クライアントや DB など外部サービスへの実アクセスはモックで遮断できる場合のみ対象。
- **リグレッションが Playwright では検出しづらい小さな分岐**。E2E だと網羅困難な枝を Jest でピンポイントに押さえる。
- Next.js App Router の Server/Client コンポーネントのうち、`render` に依存せず関数として切り出せるロジック。レンダリング検証は Storybook/Playwright を優先。

## ディレクトリ構成と命名規則

- ルートに `tests/unit` を置き、その下を **層 > 機能** で分割する。
  - 例: `tests/unit/api/proxy-download/`, `tests/unit/lib/pdf/` など。
- テストファイル名は **対象ファイル名 + `.test.ts`** とする。
  - 例: `proxy-download-utils.test.ts` は `app/api/proxy-download/_lib/utils.ts` をカバー。
- Jest から対象モジュールを読み込む際は `@/` エイリアス（`jest.config.js` で定義済み）を使い、絶対パスで import する。

## 実装ガイドライン

- `describe` ブロックは対象関数/シナリオ単位で分け、`it`/`test` は期待する戻り値や分岐ごとに用意する。
- 例外やエラー文字列もエッジケースとして必ず 1 ケースを入れる。
- 新たなテストファイルを追加したら `npm test -- <path>` でピンポイント実行し、CI では `npm test` が `tests/unit/**/*.test.ts` を拾うよう `jest.config.js` を保持する。
