# zouka

ブラウザ上で動作する、完全ローカル処理の画像リサイズ＆形式変換ツール

## 特徴

- 🔒 **完全ローカル処理** - 画像は一切サーバーに送信されません
- 🚫 **技術的に送信不能** - fetch/XMLHttpRequest を使用せず、CSP で外部通信を禁止
- 🖼️ **多形式対応** - JPEG, PNG, WebP, AVIF に対応
- 📐 **柔軟なリサイズ** - カスタムサイズ、長辺指定、プリセット比率
- 🌙 **ダークモード対応**
- 🌐 **多言語対応** - 日本語/英語

## 使い方

1. 画像をドラッグ＆ドロップ、またはクリックして選択
2. リサイズ設定を調整（幅・高さ、アスペクト比ロック）
3. 出力形式と品質を選択
4. 「変換」ボタンをクリック
5. 結果をダウンロード

## 対応形式

### 入力
- JPEG
- PNG
- WebP
- GIF
- AVIF

### 出力
- JPEG（品質指定可能）
- PNG
- WebP（品質指定可能）
- AVIF（ブラウザ対応時のみ）

## セキュリティ・プライバシー

このツールは以下の方法でプライバシーを保護しています：

1. **ローカル処理のみ** - すべての処理はブラウザ内で完結
2. **ネットワーク通信なし** - JavaScript で `fetch` や `XMLHttpRequest` を一切使用しない
3. **CSP による制限** - `connect-src: 'none'` により外部通信を技術的に禁止

## 技術スタック

- HTML5
- CSS3（CSS カスタムプロパティ、Grid、Flexbox）
- Vanilla JavaScript
- File API
- Canvas API
- createImageBitmap API

## 開発

```bash
# ローカルサーバーで実行
npx serve .

# または Python
python -m http.server 8000
```

## デプロイ

Cloudflare Pages に静的ホスティング：

1. GitHub リポジトリに接続
2. ビルド設定なし（静的ファイルのみ）
3. ルートディレクトリ: `/zouka`

## ライセンス

MIT License

## 関連プロジェクト

- [utsushi](https://utsushi.taptoclicks.com) - テキスト差分比較ツール

---

Made with ❤️ by [taptoclicks.com](https://taptoclicks.com)
