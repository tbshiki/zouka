# zouka - 画像リサイズ＆形式変換ツール

ブラウザ上で動作する、完全ローカル処理の画像リサイズ＆形式変換ツール

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 特徴

- 🔒 **完全ローカル処理** - 画像は一切サーバーに送信されません
- 🚫 **外部送信を制限** - Analytics（Google Analytics / Microsoft Clarity）以外の通信をCSPで制限、画像は送信しません
- 🖼️ **多形式対応** - JPEG, PNG, WebP, AVIF に対応
- 📐 **柔軟なリサイズ** - カスタムサイズ、長辺指定、プリセット比率
- 🎨 **品質調整** - 出力形式ごとの品質設定、背景色指定
- 📊 **リアルタイム見積もり** - 変換前にサイズを予測
- 🌙 **ダークモード対応**
- 🌐 **多言語対応** - 日本語/英語
- ♿ **アクセシビリティ対応** - キーボード操作、スクリーンリーダー対応

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
- AVIF（品質指定可能、ブラウザ対応時のみ）

## ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/tbshiki/zouka.git
cd zouka

# ビルド（dist/ を生成）
node scripts/build.js

# ローカルサーバーを起動
npx serve dist

```

ブラウザで http://localhost:3000 にアクセス

## デプロイ

デプロイ手順は [DEPLOY.md](DEPLOY.md) を参照してください。

## セキュリティ・プライバシー

このツールは以下の方法でプライバシーを保護しています：

1. **ローカル処理のみ** - すべての処理はブラウザ内で完結
2. **Analytics は利用状況のみ** - Google Analytics / Microsoft Clarityで計測、画像データは送信しない
3. **CSP による制限** - 翻訳JSONと分析の許可ドメインのみ通信可能

## ライセンス

MIT License

Copyright (c) 2026 tbshiki

## バージョン履歴

### v0.2.0 (2026-01-30)
- WebP/AVIF 変換の未対応・フォールバックに関する常時警告を追加
- iOS Chrome の WebP 圧縮に関する注意表示を追加
- 変換結果の実形式に合わせた拡張子・ダウンロード名表示に修正
- 画像読み込み後に「元画像」へフォーカス移動でUX改善
- アセットのハッシュ生成ビルドを導入（キャッシュ更新の安定化）
- キャッシュ期間を30日に調整

### v0.1.0 (2026-01-29)
- 初回リリース
- 画像リサイズ（カスタム/長辺/プリセット比率）と形式変換を提供
- JPEG/PNG/WebP/AVIF に対応（品質指定可）
- 変換前のサイズ見積もりとダークモード、多言語対応を搭載


## 関連プロジェクト

- [utsushi](https://utsushi.taptoclicks.com) - テキスト差分比較ツール

---

Made with ❤️ by [taptoclicks.com](https://taptoclicks.com)
