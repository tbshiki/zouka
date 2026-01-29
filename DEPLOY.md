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
   - **Build command**: `node scripts/build.js`
   - **Build output directory**: `dist`

#### 1.1 Analytics 環境変数の設定（GA / Clarity）

Cloudflare Pages の **Settings > Environment variables** に以下を追加します。

- `GA_ID` : GA4 の測定 ID（例: `G-XXXXXXXXXX`）
- `CLARITY_ID` : Microsoft Clarity のプロジェクト ID

※ どちらか未設定の場合、そのスクリプトはビルド時に注入されません。

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

※ `scripts/replace-csp-nonce.js` は静的配信用の置換ツールです。Functions を使う構成ではビルドで実行しません。

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
├── scripts/
│   ├── build.js         # dist/ を生成するビルドスクリプト
│   └── replace-csp-nonce.js # 静的配信用のnonce置換（任意）
└── functions/
    └── _middleware.js  # CSP nonce 処理
```

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
- `Content-Security-Policy` に `connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms https://cloudflareinsights.com` が含まれる
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`


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
# dist/ を生成
node scripts/build.js

# 簡易サーバーで動作確認
npx serve dist

# または Wrangler（Cloudflare CLI）で Functions も含めてテスト
npx wrangler pages dev dist
```
