<!-- # ロギング運用方針

## 目的

エラーの再現時間を最小化。関数レベルでデバッグ時間を短縮。

## レイヤー別戦略

| レイヤー              | 手法                | 記録タイミング                 |
| --------------------- | ------------------- | ------------------------------ |
| API Routes            | `withErrorHandling` | 成功・失敗の両方               |
| 境界関数（IO/副作用） | `withLog`           | エラー時のみ（デフォルト）     |
| 純粋関数              | ラップ不要          | -                              |
| Server Actions        | 明示的ログ          | エラー時のみ                   |
| クライアント          | `withClientLog`     | 失敗は常時、成功はサンプリング |

## withLog ラッパー

```typescript
// 境界関数をラップ
export const loadFonts = withLog(
  async function loadFonts(pdfDoc: PDFDocument) { ... },
  {
    name: "pdf.loadFonts",
    pickArgs: ([pdfDoc]) => ({ pageCount: pdfDoc.getPageCount() }),
  }
);
```

**ラップすべき関数**: 外部IO、副作用、重い計算（100ms以上または失敗の可能性あり）

## ログキー標準

```typescript
{
  name: string;       // "domain.function" 形式
  ms?: number;        // 処理時間
  userId?: string;    // BetterAuth userId
  orgId?: string;     // BetterAuth orgId
  err?: { message, stack };
  code?: string;      // DATA_LOSS, SECURITY, EXTERNAL_API等
}
```

## 引数の要約

| 型     | 要約方法              |
| ------ | --------------------- |
| string | 長さ + プレビュー50字 |
| Buffer | バイト数              |
| Array  | 件数                  |
| Object | 主要項目のみ          |

**禁止**: バイナリそのまま、巨大文字列、未検証ユーザー入力

## info ログを使うケース

1. **外部API呼び出し成功**（DBに記録されないもの: Slack, メール, R2）
2. **Stripe関連**（請求トラブル時の証拠）
3. **パフォーマンス監視**（処理時間 > 1秒、`ms`キー必須）

## PRチェックリスト

- [ ] `console.log` / `console.error` が残っていない
- [ ] 境界関数に `withLog` 適用済み
- [ ] `name` が `domain.function` 形式
- [ ] `userId` / `orgId` をログに含めている
- [ ] `pickArgs` で引数を要約（生データなし） -->
