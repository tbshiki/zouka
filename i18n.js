/**
 * zouka - Internationalization Module
 * 多言語対応
 */

const I18n = (function () {
  'use strict';

  // 翻訳データ
  const translations = {
    en: {},
    ja: {}
  };

  // 現在の言語
  let currentLang = 'en';

  // 言語ファイルをロード済みか
  let loaded = false;

  /**
   * 翻訳データをロード
   */
  async function loadTranslations() {
    try {
      const [enData, jaData] = await Promise.all([
        fetch('locales/en.json').then(r => r.ok ? r.json() : {}),
        fetch('locales/ja.json').then(r => r.ok ? r.json() : {})
      ]);

      Object.assign(translations.en, enData);
      Object.assign(translations.ja, jaData);
      loaded = true;
    } catch (error) {
      console.warn('Failed to load translations, using inline defaults');
      loaded = true;
    }
  }

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

    await loadTranslations();
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
