/**
 * zouka - Internationalization Module
 * 多言語対応
 * Note: fetchを使用せずインライン翻訳データを使用（CSP connect-src: 'none' 対応）
 */

const I18n = (function () {
  'use strict';

  // 翻訳データ（インライン）
  const translations = {
    en: {
      'skip.link': 'Skip to main content',
      'header.tagline': 'Image Resize & Convert Tool',
      'header.lang.title': 'Switch language',
      'header.lang.aria': 'Switch language',
      'header.theme.title': 'Toggle dark/light mode',
      'header.theme.aria': 'Toggle between dark and light mode',
      'notice.avifUnsupported': 'AVIF format is not supported in this browser.',
      'input.section.aria': 'Image input area',
      'dropzone.aria': 'Click or drop image file here',
      'dropzone.text': 'Drop image here or click to select',
      'dropzone.hint': 'Supports: JPEG, PNG, WebP, GIF, AVIF (max 20MB)',
      'info.original.title': 'Original Image',
      'info.filename': 'Filename',
      'info.dimensions': 'Dimensions',
      'info.aspectRatio': 'Aspect Ratio',
      'info.fileSize': 'File Size',
      'info.format': 'Format',
      'preview.alt': 'Preview of selected image',
      'settings.section.aria': 'Resize and conversion settings',
      'settings.title': 'Settings',
      'settings.resize.title': 'Resize',
      'settings.resize.custom': 'Custom Size',
      'settings.resize.longEdge': 'Long Edge',
      'settings.resize.preset': 'Preset Ratio',
      'settings.resize.width': 'Width',
      'settings.resize.height': 'Height',
      'settings.resize.longEdgeLabel': 'Long Edge',
      'settings.resize.baseWidth': 'Base Width',
      'settings.resize.lockRatio': 'Lock aspect ratio',
      'settings.format.title': 'Output Format',
      'settings.format.quality': 'Quality',
      'settings.format.bgColor': 'Background Color',
      'settings.format.bgColorHint': 'For transparent images converted to JPEG',
      'output.preview.title': 'Output Estimate',
      'output.dimensions': 'Dimensions',
      'output.pixels': 'Total Pixels',
      'output.rawSize': 'Raw Size (Est.)',
      'output.compressedSize': 'Compressed (Est.)',
      'action.convert': 'Convert',
      'action.reset': 'Reset',
      'action.download': 'Download',
      'result.section.aria': 'Conversion result',
      'result.title': 'Result',
      'result.original': 'Original',
      'result.converted': 'Converted',
      'processing.text': 'Converting...',
      'toast.convertSuccess': 'Conversion complete!',
      'toast.convertError': 'Conversion failed',
      'toast.fileError': 'Failed to load file',
      'toast.fileTooLarge': 'File size exceeds 20MB',
      'toast.unsupportedFormat': 'Unsupported file format',
      'toast.noFile': 'No file selected',
      'footer.copyright': '© 2026 zouka',
      'footer.privacy.policy': 'Privacy Policy',
      'footer.repo.link': 'GitHub Repository',
      'footer.from': 'from taptoclicks.com',
      'footer.privacy.toggle': 'Privacy',
      'footer.privacy.local': 'This tool processes everything locally',
      'footer.privacy.noSend': 'Images are not sent to any server',
      'footer.privacy.noFetch': 'No fetch/XMLHttpRequest used - technically impossible to send data',
      'modal.close.aria': 'Close',
      'privacy.title': 'Privacy Policy',
      'privacy.section1.title': '1. Introduction',
      'privacy.section1.content': 'zouka (hereinafter "this tool") is a tool for resizing and converting images in your browser. This privacy policy explains how information is handled in this tool.',
      'privacy.section2.title': '2. Handling of Image Data',
      'privacy.section2.intro.prefix': 'Image data loaded into this tool is ',
      'privacy.section2.intro.emphasis': 'processed entirely locally within your browser',
      'privacy.section2.intro.suffix': '.',
      'privacy.section2.item1': 'Images are not sent to any server',
      'privacy.section2.item2': 'Images are not saved or recorded anywhere',
      'privacy.section2.item3': 'Image data is deleted when you close the page',
      'privacy.section2.item4': 'No fetch/XMLHttpRequest - technically impossible to transmit',
      'privacy.section3.title': '3. Technical Guarantee',
      'privacy.section3.content': 'This tool uses Content-Security-Policy (CSP) headers to technically prevent any network requests for user data. The connect-src directive is set to \'none\', making it impossible to send data to external servers.',
      'privacy.section4.title': '4. Local Storage',
      'privacy.section4.intro': 'This tool uses local storage only for the following purposes.',
      'privacy.section4.item1': 'Saving theme settings (dark/light mode)',
      'privacy.section4.item2': 'Saving language settings',
      'privacy.section5.title': '5. Contact',
      'privacy.section5.content': 'For inquiries about this privacy policy, please use the <a href="https://github.com/tbshiki/zouka/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>.',
      'privacy.section6.title': '6. Amendments',
      'privacy.section6.content': 'This privacy policy may be amended as necessary. Significant changes will be announced on this tool.',
      'privacy.lastUpdated': 'Last updated: January 25, 2026'
    },
    ja: {
      'skip.link': 'メインコンテンツへスキップ',
      'header.tagline': '画像リサイズ＆変換ツール',
      'header.lang.title': '言語切替',
      'header.lang.aria': '言語を切り替え',
      'header.theme.title': 'テーマ切替',
      'header.theme.aria': 'ダークモードとライトモードを切り替え',
      'notice.avifUnsupported': 'このブラウザではAVIF形式に対応していません。',
      'input.section.aria': '画像入力エリア',
      'dropzone.aria': 'クリックまたはドロップで画像を選択',
      'dropzone.text': 'ここに画像をドロップ、またはクリックして選択',
      'dropzone.hint': '対応形式: JPEG, PNG, WebP, GIF, AVIF（最大20MB）',
      'info.original.title': '元画像',
      'info.filename': 'ファイル名',
      'info.dimensions': 'サイズ',
      'info.aspectRatio': 'アスペクト比',
      'info.fileSize': 'ファイルサイズ',
      'info.format': '形式',
      'preview.alt': '選択した画像のプレビュー',
      'settings.section.aria': 'リサイズと変換の設定',
      'settings.title': '設定',
      'settings.resize.title': 'リサイズ',
      'settings.resize.custom': 'カスタムサイズ',
      'settings.resize.longEdge': '長辺指定',
      'settings.resize.preset': 'プリセット比率',
      'settings.resize.width': '幅',
      'settings.resize.height': '高さ',
      'settings.resize.longEdgeLabel': '長辺',
      'settings.resize.baseWidth': '基準幅',
      'settings.resize.lockRatio': '縦横比を固定',
      'settings.format.title': '出力形式',
      'settings.format.quality': '品質',
      'settings.format.bgColor': '背景色',
      'settings.format.bgColorHint': '透明な画像をJPEGに変換する際の背景色',
      'output.preview.title': '出力予定',
      'output.dimensions': 'サイズ',
      'output.pixels': '総ピクセル数',
      'output.rawSize': '生データサイズ（推定）',
      'output.compressedSize': '圧縮後サイズ（推定）',
      'action.convert': '変換',
      'action.reset': 'リセット',
      'action.download': 'ダウンロード',
      'result.section.aria': '変換結果',
      'result.title': '結果',
      'result.original': '元画像',
      'result.converted': '変換後',
      'processing.text': '変換中...',
      'toast.convertSuccess': '変換が完了しました！',
      'toast.convertError': '変換に失敗しました',
      'toast.fileError': 'ファイルの読み込みに失敗しました',
      'toast.fileTooLarge': 'ファイルサイズが20MBを超えています',
      'toast.unsupportedFormat': '対応していないファイル形式です',
      'toast.noFile': 'ファイルが選択されていません',
      'footer.copyright': '© 2026 zouka',
      'footer.privacy.policy': 'プライバシーポリシー',
      'footer.repo.link': 'GitHubリポジトリ',
      'footer.from': 'from taptoclicks.com',
      'footer.privacy.toggle': 'プライバシー',
      'footer.privacy.local': 'このツールはすべてローカルで処理します',
      'footer.privacy.noSend': '画像はサーバーに送信されません',
      'footer.privacy.noFetch': 'fetch/XMLHttpRequest不使用 - 技術的に送信不能',
      'modal.close.aria': '閉じる',
      'privacy.title': 'プライバシーポリシー',
      'privacy.section1.title': '1. はじめに',
      'privacy.section1.content': 'zouka（以下「本ツール」）は、ブラウザ上で画像のリサイズと形式変換を行うツールです。このプライバシーポリシーでは、本ツールにおける情報の取り扱いについて説明します。',
      'privacy.section2.title': '2. 画像データの取り扱い',
      'privacy.section2.intro.prefix': '本ツールに読み込まれた画像データは、',
      'privacy.section2.intro.emphasis': 'すべてお使いのブラウザ内でローカル処理',
      'privacy.section2.intro.suffix': 'されます。',
      'privacy.section2.item1': '画像はサーバーに送信されません',
      'privacy.section2.item2': '画像は保存・記録されません',
      'privacy.section2.item3': 'ページを閉じると画像データは削除されます',
      'privacy.section2.item4': 'fetch/XMLHttpRequest不使用 - 技術的に送信不能',
      'privacy.section3.title': '3. 技術的保証',
      'privacy.section3.content': '本ツールは、Content-Security-Policy（CSP）ヘッダーを使用して、ユーザーデータに関するネットワークリクエストを技術的に防止しています。connect-srcディレクティブは\'none\'に設定されており、外部サーバーへのデータ送信は不可能です。',
      'privacy.section4.title': '4. ローカルストレージ',
      'privacy.section4.intro': '本ツールは、以下の目的でのみローカルストレージを使用します。',
      'privacy.section4.item1': 'テーマ設定の保存（ダーク/ライトモード）',
      'privacy.section4.item2': '言語設定の保存',
      'privacy.section5.title': '5. お問い合わせ',
      'privacy.section5.content': 'このプライバシーポリシーに関するお問い合わせは、<a href="https://github.com/tbshiki/zouka/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>をご利用ください。',
      'privacy.section6.title': '6. 改定',
      'privacy.section6.content': 'このプライバシーポリシーは必要に応じて改定されることがあります。重要な変更は本ツール上でお知らせします。',
      'privacy.lastUpdated': '最終更新日: 2026年1月25日'
    }
  };

  // 現在の言語
  let currentLang = 'en';

  /**
   * 現在の言語を取得
   * @returns {string}
   */
  function getCurrentLang() {
    return currentLang;
  }

  /**
   * 言語を設定
   * @param {string} lang
   */
  function setLang(lang) {
    if (lang !== 'en' && lang !== 'ja') {
      lang = 'en';
    }
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
  }

  /**
   * 翻訳を取得
   * @param {string} key
   * @param {Object} params
   * @returns {string}
   */
  function t(key, params = {}) {
    const keys = key.split('.');
    let value = translations[currentLang];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (value === undefined) {
      // フォールバック: 英語
      value = translations.en;
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          value = key; // キーをそのまま返す
          break;
        }
      }
    }

    if (typeof value === 'string') {
      // パラメータ置換
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`{{${k}}}`, 'g'), v);
      });
    }

    return value || key;
  }

  /**
   * DOM要素に翻訳を適用
   */
  function applyTranslations() {
    // data-i18n 属性を持つ要素
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const attr = el.getAttribute('data-i18n-attr');
      const isHtml = el.getAttribute('data-i18n-html') === 'true';

      const translation = t(key);

      if (attr) {
        el.setAttribute(attr, translation);
      } else if (isHtml) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    });

    // data-i18n-aria 属性を持つ要素
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', t(key));
    });

    // html lang 属性
    document.documentElement.lang = currentLang;
  }

  /**
   * 初期化
   */
  async function init() {
    // 保存された言語設定を読み込み
    const savedLang = localStorage.getItem('lang');
    const browserLang = navigator.language.startsWith('ja') ? 'ja' : 'en';
    currentLang = savedLang || browserLang;

    applyTranslations();
  }

  // Public API
  return {
    init,
    getCurrentLang,
    setLang,
    t,
    applyTranslations
  };
})();
