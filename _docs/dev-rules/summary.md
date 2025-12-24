# 開発ルール

## コア原則

### 技術スタック

- **Next.js App Router** + **TypeScript** 必須
- **ESLint/型エラーは常にゼロ** を維持
- **Server Actions** を基本とし、API Routes は技術的制約（Webhook、ストリーミング等）時のみ使用

### UI/UX

- **shadcn/ui を最優先**: カスタムコンポーネントは shadcn/ui に存在しない場合のみ
- **lucide-react** でアイコンを統一
- **react-hook-form** + **Zod** でフォーム実装

### データ・状態管理

- **useSWR を最優先**: データフェッチ・キャッシュ・再検証
- **useEffect は最小限**: 副作用処理が技術的に必要な場合のみ（例: window イベント購読）
- **nuqs** で URL 状態管理
- **React Context + useReducer** でグローバル状態（必要最小限のみ）

### 認証・データベース

- **BetterAuth** で認証（organization プラグインでマルチテナント）
- **Supabase** でデータベース + RLS（Row Level Security）

---

## ディレクトリ構成

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 認証ページ（login, signup）
│   ├── (dashboard)/            # 認証必須エリア（chat, settings）
│   ├── (public)/               # 公開ページ（LP等）
│   ├── api/                    # API Routes
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── stripe/
│   │   └── upload/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                 # UIコンポーネント（機能別フォルダ構成）
│   ├── ui/                     # shadcn/ui コンポーネント
│   ├── assistant-ui/           # アシスタントUI関連
│   ├── auth/                   # 認証関連UI
│   ├── billing/                # 課金関連UI
│   ├── chat/                   # チャット関連UI
│   ├── organization/           # 組織管理UI
│   ├── profile/                # プロフィール関連UI
│   └── upload/                 # アップロード関連UI
│
├── hooks/                      # カスタムフック
│   ├── use-auth.ts
│   ├── use-organization.ts
│   └── use-subscription.ts
│
├── lib/                        # ビジネスロジック・外部サービス連携
│   ├── auth/                   # BetterAuth 設定
│   │   ├── client.ts           # クライアント側設定
│   │   └── server.ts           # サーバー側設定
│   ├── db/                     # Supabase クライアント
│   │   ├── admin.ts            # Service Role（RLSバイパス）
│   │   ├── server.ts           # Server Components用
│   │   └── client.ts           # クライアント用
│   ├── server/                 # サーバーサイドロジック
│   │   ├── cloudflare/         # Cloudflare連携（R2, Images）
│   │   ├── logging/            # ロギング（Axiom）
│   │   ├── utils/              # サーバーユーティリティ
│   │   └── stripe.ts           # Stripe連携
│   └── utils.ts                # 汎用ユーティリティ（cn等）
│
├── mastra/                     # Mastra AI エージェント
│   ├── agents/
│   ├── tools/
│   └── index.ts
│
└── types/                      # 型定義
    ├── database.ts             # Supabase型定義
    └── index.ts                # 共通型定義
```

---

## 配置ルール

### 1. コンポーネントの配置

**原則: 機能別フォルダ構成**

```
components/
├── ui/                    # shadcn/ui コンポーネント（汎用）
├── {feature}/             # 機能別コンポーネント
│   ├── feature-card.tsx   # 1ファイル = 1コンポーネント
│   └── feature-list.tsx
```

**良い例:**

```
components/
├── ui/button.tsx
├── auth/
│   ├── login-form.tsx
│   └── signup-form.tsx
├── billing/
│   ├── pricing-table.tsx
│   ├── subscription-status.tsx
│   └── usage-meter.tsx
```

**悪い例:**

```
❌ components/auth-components.tsx（複数のコンポーネントを1ファイルに）
❌ components/user-dashboard.tsx（複数の責任を持つ）
```

### 2. API Routes の構造

**原則: route.ts は薄く、ロジックは分離**

```
app/api/{endpoint}/
├── route.ts              # メイン関数（GET/POST等）のみ（50-100行目安）
└── _lib/                 # 内部実装（Next.jsルーティング対象外）
    ├── types.ts          # 型定義
    ├── validation.ts     # バリデーション
    └── handler.ts        # ビジネスロジック
```

### 3. lib/ 配下の分類

| ディレクトリ   | 用途                 | 例                           |
| -------------- | -------------------- | ---------------------------- |
| `lib/auth/`    | 認証設定             | BetterAuth client/server     |
| `lib/db/`      | データベース         | Supabase client/server/admin |
| `lib/server/`  | サーバー専用ロジック | Stripe, Cloudflare, ロギング |
| `lib/utils.ts` | 汎用ユーティリティ   | cn（Tailwind マージ）        |

**判断基準:**

- **外部サービス連携** → `lib/server/{service}/`
- **認証・DB** → `lib/auth/`, `lib/db/`
- **汎用ヘルパー** → `lib/utils.ts`

---

## Supabase クライアント使い分け

### 3種類のクライアント

| クライアント | 用途                         | インポート        | 使用場所          |
| ------------ | ---------------------------- | ----------------- | ----------------- |
| `client.ts`  | ブラウザ（リアルタイム更新） | `@/lib/db/client` | Client Components |
| `server.ts`  | Server Components（RLS経由） | `@/lib/db/server` | Server Components |
| `admin.ts`   | Service Role（RLSバイパス）  | `@/lib/db/admin`  | Server Actions    |

**重要:** `admin.ts` 使用時は**必ず認証・認可チェックを実施**

---

## UI・コンポーネント設計

### 必須ルール

1. **shadcn/ui 最優先**: 必要なUIは必ず shadcn/ui から探す。存在しない場合のみカスタム実装
2. **1ファイル = 1コンポーネント**: 単一責任の原則を徹底
3. **明確なファイル名**: `kebab-case.tsx` で役割を明示
4. **最小構成**: 必要最小限の機能のみ実装

### コンポーネント分割例

- ❌ `components/user-dashboard.tsx` に複数コンポーネントを定義
- ✅ `components/profile/user-profile.tsx`、`user-stats.tsx`、`user-activity.tsx` に分割

---

## データフェッチ・状態管理

### データフェッチ戦略

| 条件                     | 実装                        | 備考                   |
| ------------------------ | --------------------------- | ---------------------- |
| ユーザー操作に依存しない | Server Components           | RSC優先                |
| ユーザー操作に依存する   | Client Components + useSWR  | useEffect は避ける     |
| AIストリーミング         | API Routes（Vercel AI SDK） |                        |
| Webhook                  | API Routes                  | 外部エンドポイント必須 |

### useSWR vs useEffect

- **useSWR を最優先**: データフェッチ・キャッシュ・再検証
- **useEffect は避ける**: 副作用処理が技術的に必要な場合のみ
- **楽観的更新**: `mutate(optimisticData, { revalidate: false })` で即座にUI更新

### URL 状態管理

- **nuqs を使用**: URL パラメータの状態管理に統一
- クエリパラメータの型安全な管理

### グローバル状態管理

- **React Context + useReducer** で最小構成
- 必要最小限の状態のみグローバル化
- `contexts/` ディレクトリに配置

---

## 認証・認可

### BetterAuth + Supabase RLS

- BetterAuth の `organization` プラグインでマルチテナント実装
- **個人アカウント**: `activeOrganizationId = null`（userId で代替）
- **組織アカウント**: `activeOrganizationId` でスコープ
- **RLS ポリシー**: `get_current_user_id()` / `get_current_org_id()` で最小権限

---

## パフォーマンス最適化

### React Server Components 優先

- **RSC（React Server Components）を優先**: `use client` は最小限
- **useEffect / useState は最小化**: まず RSC で実装できないか検討
- ❌ Client Component で `useEffect` + `useState` でデータフェッチ
- ✅ Server Component で直接 `await` でデータ取得

### レンダリング最適化

- **Suspense でフォールバック**: 非同期コンポーネントを Suspense でラップ
- **動的 import**: 重いコンポーネントは `next/dynamic` で遅延読み込み
- **next/image**: 画像最適化は必ず `next/image` を使用
- **next/link**: ナビゲーションは必ず `next/link` を使用

### コード分割

- **ルートベースのコード分割**: App Router の自動分割を活用
- **不要な依存関係を避ける**: バンドルサイズを最小化

---

## コード品質

### 構造

- **ガード節で早期return**: エラーケースを先に処理、成功パスは最後
- **1ファイル = 1機能**: コンポーネント・関数は別ファイルに分離
- **明確な命名**: ファイル名で機能を明示（`kebab-case.tsx`）

### セキュリティ

- **Server Actions**: ユーザーが許可された操作のみ実装
- **認証チェック必須**: `db/admin` 使用時は必ず認証・認可を実施
- **入力検証**: Zod でクライアント/サーバー両方でバリデーション

### ロギング

- **Axiom** でロギング（`lib/server/logging/`）
- **本番コードで `console.log` / `console.error` は禁止**

### 実装チェックリスト

- [ ] shadcn/ui で実装可能なUIか確認済み
- [ ] useSWR でデータフェッチ実装（useEffect を避けた）
- [ ] RSC で実装可能か検討済み（use client は最小限）
- [ ] 1ファイル = 1コンポーネント/1関数を遵守
- [ ] ファイル名が機能を明確に表現している
- [ ] 認証・認可チェック実施済み
- [ ] ESLint/型エラーがゼロ
