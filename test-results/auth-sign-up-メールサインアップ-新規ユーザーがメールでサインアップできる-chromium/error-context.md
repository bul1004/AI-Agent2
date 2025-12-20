# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "アカウント作成" [level=1] [ref=e6]
      - paragraph [ref=e7]: 無料でアカウントを作成しましょう
    - generic [ref=e8]:
      - generic [ref=e9]:
        - text: 名前
        - textbox "名前" [ref=e10]:
          - /placeholder: 山田 太郎
          - text: テスト ユーザー
      - generic [ref=e11]:
        - text: メールアドレス
        - textbox "メールアドレス" [ref=e12]:
          - /placeholder: email@example.com
          - text: test-1766237484715-j37ftk@example.com
      - generic [ref=e13]:
        - text: パスワード
        - textbox "パスワード" [ref=e14]:
          - /placeholder: 8文字以上
          - text: testPassword123!
      - button "アカウント作成" [ref=e15]
    - paragraph [ref=e16]:
      - text: すでにアカウントをお持ちの方は
      - link "ログイン" [ref=e17] [cursor=pointer]:
        - /url: /login
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e23] [cursor=pointer]:
    - img [ref=e24]
  - alert [ref=e27]
```