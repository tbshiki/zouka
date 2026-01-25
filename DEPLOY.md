# zouka デプロイガイド

## Cloudflare Pages へのデプロイ

### 前提条件

- Cloudflare アカウント
- GitHub リポジトリ（tbshiki/zouka）

### 手順

#### 1. Cloudflare Pages プロジェクト作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. **Pages** > **Create a project** > **Connect to Git**
3. GitHub リポジトリ `tbshiki/zouka` を選択
4. ビルド設定:
   - **Framework preset**: `None`
   - **Build command**: （空欄）
   - **Build output directory**: `/`（ルート）

#### 2. カスタムドメイン設定

1. プロジェクト設定 > **Custom domains**
2. `zouka.taptoclicks.com` を追加
3. DNS レコードが自動設定されるか確認

#### 3. CSP Nonce 対応（Functions）

このプロジェクトでは、JSON-LD の構造化データに CSP nonce を適用するため、Cloudflare Pages Functions を使用します。

**functions/_middleware.js** が以下を処理します：
- リクエストごとにランダムな nonce を生成
- HTML 内の `__CSP_NONCE__` プレースホルダーを置換
- `_headers` ファイルの CSP ヘッダー内の nonce も置換

#### 4. ファイル構成確認

デプロイ前に以下のファイルが存在することを確認：

```
zouka/
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── i18n.js             # 多言語対応モジュール
├── image-processor.js  # 画像処理モジュール
├── ui.js               # UIモジュール
├── main.js             # エントリーポイント
├── manifest.json       # PWA マニフェスト
├── _headers            # Cloudflare Pages ヘッダー設定
├── robots.txt          # クローラー設定
├── sitemap.xml         # サイトマップ
├── logo.png            # ファビコン/OGP画像（512x512推奨）
├── LICENSE             # ライセンスファイル
├── README.md           # プロジェクト説明
├── DEPLOY.md           # このファイル
└── functions/
    └── _middleware.js  # CSP nonce 処理
```

### 重要: logo.png の準備

`logo.png` は以下の用途で使用されます：
- ファビコン
- Apple Touch Icon
- PWA アイコン
- OGP 画像

**推奨仕様:**
- サイズ: 512×512 ピクセル
- 形式: PNG（透過可）
- 内容: 🖼️ の絵文字または zouka ロゴ

### デプロイ後の確認

#### 1. 基本動作確認

- [ ] https://zouka.taptoclicks.com/ にアクセスできる
- [ ] 画像のドラッグ＆ドロップが動作する
- [ ] 変換・ダウンロードが動作する

#### 2. セキュリティヘッダー確認

```bash
curl -I https://zouka.taptoclicks.com/
```

以下のヘッダーが返されることを確認：
- `Content-Security-Policy` に `connect-src 'none'` が含まれる
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

#### 3. PWA 確認

- [ ] Chrome DevTools > Application > Manifest が正常
- [ ] アイコンが表示される

#### 4. SEO 確認

- [ ] https://zouka.taptoclicks.com/sitemap.xml にアクセスできる
- [ ] robots.txt が正常

### トラブルシューティング

#### CSP エラーが発生する場合

1. `functions/_middleware.js` が正しく配置されているか確認
2. Cloudflare Pages の Functions が有効になっているか確認
3. デプロイログでエラーを確認

#### 画像処理が動作しない場合

1. ブラウザの開発者ツールでコンソールエラーを確認
2. CSP ヘッダーが正しく設定されているか確認
3. `blob:` が `img-src` に含まれているか確認

### ローカル開発

```bash
# 簡易サーバーで動作確認
npx serve .

# または Wrangler（Cloudflare CLI）で Functions も含めてテスト
npx wrangler pages dev .
```

### 更新手順

1. ローカルで変更を加える
2. `git commit` & `git push`
3. Cloudflare Pages が自動でデプロイ
4. デプロイ完了を確認（通常1-2分）

---

## 関連リンク

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [CSP ヘッダーリファレンス](https://developer.mozilla.org/ja/docs/Web/HTTP/CSP)
- [zouka GitHub リポジトリ](https://github.com/tbshiki/zouka)
