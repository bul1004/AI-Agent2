# 開発ルール

## コア原則

- **App Router** + **TypeScript** 必須（ESLint/型エラー常にゼロ）
- **Server Actions** が基本、API Routes は技術的制約（Webhook、ストリーミング等）のみ
- UI: **shadcn/ui** + **lucide-react**、フォーム: **react-hook-form** + **Zod**
- 認証: **BetterAuth** + **Supabase RLS**

## ディレクトリ構成

```
app/                    # ルーティング & ページ
├── (public)/           # 認証なし（LP、法的文書）
├── (dashboard)/        # 認証必須（メインアプリ）
├── api/                # API Routes（Webhook、ストリーミング等のみ）
└── [feature]/          # 機能別
    ├── components/     # ページ固有コンポーネント
    └── types.ts        # ページ固有型

components/             # 汎用UI（SideBar, ConfirmDialog等）
hooks/                  # 汎用フック
types/                  # 共通型定義

lib/
├── auth/               # 認証（BetterAuth）
│   ├── server.ts       # サーバーサイド設定
│   └── client.ts       # クライアントサイド設定
├── db/                 # Supabaseクライアント
│   ├── admin.ts        # Service Role（RLSバイパス）
│   ├── server.ts       # Server Components用
│   └── client.ts       # クライアント用
├── server/             # サーバーサイドロジック
│   ├── actions/        # Server Actions
│   ├── logging/        # ロギング（Axiom）
│   └── utils/          # サーバーユーティリティ
└── utils.ts            # 汎用ユーティリティ（cn等）
```

## Supabaseクライアント使い分け

| クライアント | 用途                           | インポート          |
| ------------ | ------------------------------ | ------------------- |
| `db/client`  | ブラウザ（リアルタイム更新）   | `@/lib/db/client`   |
| `db/server`  | Server Components（RLS経由）   | `@/lib/db/server`   |
| `db/admin`   | Server Actions（RLSバイパス）  | `@/lib/db/admin`    |

**重要**: `db/admin` 使用時は必ず認証・認可チェックを実施。

## データハンドリング

| 条件                     | 実装                                        |
| ------------------------ | ------------------------------------------- |
| ユーザー操作に依存しない | Server Components + Server Actions          |
| ユーザー操作に依存する   | Client Components + Server Actions          |
| AIストリーミング         | API Routes（Vercel AI SDK）                 |
| Webhook                  | API Routes                                  |

## 認証・認可

- BetterAuth の `organization` プラグインでマルチテナント
- 個人アカウント: `activeOrganizationId = null`（userId で代替）
- 組織アカウント: `activeOrganizationId` でスコープ
- RLS: `get_current_user_id()` / `get_current_org_id()` で最小権限

## 品質

- ガード節で早期return、成功パスは最後
- Server Actionsはユーザーが許可された操作のみ実装
- ロギング: `logging-rules.md` に従う
- `console.log` / `console.error` は本番コードで禁止
