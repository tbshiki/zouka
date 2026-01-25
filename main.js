/**
 * zouka - Main Entry Point
 * アプリケーション初期化
 */

(function () {
  'use strict';

  /**
   * アプリケーション初期化
   */
  async function initApp() {
    console.log('🖼️ zouka v0.1.0 - Image Resize & Convert Tool');
    console.log('🔒 完全ローカル処理 - サーバー通信なし');
    console.log('🚫 翻訳ファイルはローカル読み込み - 外部通信はCSPで禁止');

    // ImageProcessor 確認
    if (typeof ImageProcessor !== 'undefined') {
      console.log('✓ ImageProcessor ready');
    } else {
      console.error('✗ ImageProcessor module not found');
    }

    // UI 初期化（非同期）
    if (typeof UI !== 'undefined') {
      await UI.init();
      console.log('✓ UI initialized');
    } else {
      console.error('✗ UI module not found');
    }

    // I18n 確認
    if (typeof I18n !== 'undefined') {
      console.log('✓ I18n module ready');
    } else {
      console.warn('⚠ I18n module not found - using default language');
    }
  }

  // DOM 読み込み完了後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
