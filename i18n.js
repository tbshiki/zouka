/**
 * zouka - Internationalization Module
 * 多言語対応
 * Note: ローカルJSONの翻訳データを読み込み（CSPの許可リストに準拠）
 */

const I18n = (function () {
  'use strict';

  const SUPPORTED_LANGS = ['en', 'ja'];
  const DEFAULT_LANG = 'en';
  const translations = {};
  const loadPromises = {};

  // 現在の言語
  let currentLang = DEFAULT_LANG;

  /**
   * 対応言語かどうか
   * @param {string} lang
   * @returns {boolean}
   */
  function isSupportedLang(lang) {
    return SUPPORTED_LANGS.includes(lang);
  }

  /**
   * 翻訳データを読み込み
   * @param {string} lang
   * @returns {Promise<boolean>}
   */
  async function loadTranslations(lang) {
    if (!isSupportedLang(lang)) {
      return false;
    }
    if (translations[lang]) {
      return true;
    }
    if (loadPromises[lang]) {
      return loadPromises[lang];
    }

    const localePath = resolveLocalePath(lang);
    loadPromises[lang] = fetch(localePath, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      mode: 'same-origin'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${lang}`);
        }
        return response.json();
      })
      .then(data => {
        translations[lang] = data;
        return true;
      })
      .catch(error => {
        console.warn('Translation load failed:', error);
        return false;
      })
      .finally(() => {
        delete loadPromises[lang];
      });

    return loadPromises[lang];
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
    const nextLang = isSupportedLang(lang) ? lang : DEFAULT_LANG;
    currentLang = nextLang;
    localStorage.setItem('lang', nextLang);

    return loadTranslations(nextLang).then(() => {
      applyTranslations();
      return true;
    });
  }

  /**
   * 翻訳を取得
   * @param {string} key
   * @param {Object} params
   * @returns {string}
   */
  function t(key, params = {}) {
    // フラットキー構造を使用（例: 'settings.resize.title'）
    let value = translations[currentLang]?.[key];

    // フォールバック: 英語
    if (value === undefined) {
      value = translations[DEFAULT_LANG]?.[key];
    }

    // それでも見つからない場合はキーをそのまま返す
    if (value === undefined) {
      return key;
    }

    // パラメータ置換
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`{{${k}}}`, 'g'), v);
      });
    }

    return value;
  }

  /**
   * DOM要素に翻訳を適用
   */
  function applyTranslations() {
    if (!translations[currentLang] && !translations[DEFAULT_LANG]) {
      return;
    }

    // data-i18n 属性を持つ要素
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const attr = el.getAttribute('data-i18n-attr');
      const translation = t(key);

      if (translation === key) {
        return;
      }

      if (attr) {
        el.setAttribute(attr, translation);
      } else if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    });

    // data-i18n-aria 属性を持つ要素
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const translation = t(key);
      if (translation !== key) {
        el.setAttribute('aria-label', translation);
      }
    });

    // html lang 属性
    document.documentElement.lang = currentLang;

    updateStructuredData();
  }

  /**
   * 変換済みのロケールパスを取得（ビルド時ハッシュ対応）
   * @param {string} lang
   * @returns {string}
   */
  function resolveLocalePath(lang) {
    if (typeof window !== 'undefined' && window.__ASSET_MANIFEST__) {
      const mapped = window.__ASSET_MANIFEST__.locales?.[lang];
      if (mapped) {
        return mapped;
      }
    }
    return `locales/${lang}.json`;
  }

  /**
   * 構造化データを言語に合わせて更新
   */
  function updateStructuredData() {
    const script = document.getElementById('structured-data');
    if (!script) {
      return;
    }

    const fallbackDescription =
      'A fully local image resize and format conversion tool. Process images safely in your browser without sending data to any server.';
    const fallbackFeatures = [
      'Image resize',
      'Format conversion',
      'WebP/PNG/JPEG support',
      'Fully local processing',
      'Privacy protection'
    ];

    const description = t('structured.description');
    const featureListValue = t('structured.featureList');
    const featureList = Array.isArray(featureListValue)
      ? featureListValue
      : (typeof featureListValue === 'string' && featureListValue !== 'structured.featureList'
        ? featureListValue.split('|').map(item => item.trim()).filter(Boolean)
        : fallbackFeatures);

    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'zouka',
      description: description === 'structured.description' ? fallbackDescription : description,
      url: 'https://zouka.taptoclicks.com/',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      featureList
    };

    script.textContent = JSON.stringify(data, null, 2);
  }

  /**
   * 初期化
   */
  async function init() {
    // 保存された言語設定を読み込み
    const savedLang = localStorage.getItem('lang');
    const browserLang = navigator.language.startsWith('ja') ? 'ja' : 'en';
    const preferredLang = savedLang || browserLang;
    currentLang = isSupportedLang(preferredLang) ? preferredLang : DEFAULT_LANG;

    await Promise.all(SUPPORTED_LANGS.map(lang => loadTranslations(lang)));

    if (!translations[currentLang] && translations[DEFAULT_LANG]) {
      currentLang = DEFAULT_LANG;
    }

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
