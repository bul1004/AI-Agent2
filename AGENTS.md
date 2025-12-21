# AGENTS.md

Next.js 15 + TypeScript + Supabase + BetterAuth テンプレート

## Quick Commands

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Build
npm run lint         # Lint
npm run format       # Prettier format
npm run test:e2e     # Playwright E2E tests
npx tsc              # Type check
```

## Documentation

`_docs/` 配下のドキュメントを参照:

- [\_docs/dev-rules/summary.md](_docs/dev-rules/summary.md) - 開発ルール、ディレクトリ構成
- [\_docs/dev-rules/logging.md](_docs/dev-rules/logging.md) - ロギング運用
- [\_docs/how-to-test/](_docs/how-to-test/) - テストガイド（E2E / Unit）
- [\_docs/business-logics/](_docs/business-logics/) - ビジネスロジック仕様

## Key Principles

- **TypeScript 必須**、ESLint/型エラーは常にゼロを維持
- **Server Actions** を基本とし、API Routes は技術的制約時のみ（Webhook、ストリーミング等）
- **UI**: shadcn/ui 最優先、アイコンは lucide-react
- **データフェッチ**: useSWR 最優先（useEffect は最小限）
- **RLS**: `get_current_user_id()` / `get_current_org_id()` で認可

## Implementation Workflow

**実装前**: 必ず [\_docs/dev-rules/summary.md](_docs/dev-rules/summary.md) を読むこと

機能実装後の確認手順:

1. **Build & Type Check** - エラーゼロになるまで実行:

   ```bash
   npm run build
   npx tsc
   ```

2. **Lint** - エラーがないか確認:

   ```bash
   npm run lint
   ```

3. **E2E & Unit Testing**（指示があった場合）:
   [\_docs/how-to-test/](_docs/how-to-test/) にあるファイルの指示に従ってテストを実行
