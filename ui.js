/**
 * zouka - UI Module
 * ユーザーインターフェース管理
 */

const UI = (function () {
  'use strict';

  // DOM要素のキャッシュ
  let elements = {};

  // 状態管理
  let state = {
    originalImage: null,
    originalBitmap: null,
    originalInfo: null,
    previewUrl: null,
    convertedUrl: null,
    lockRatio: true,
    selectedRatio: '1:1',
    lastChangedDimension: 'width',
    isProcessing: false
  };

  /**
   * DOM要素を取得してキャッシュ
   */
  function cacheElements() {
    elements = {
      // Notice
      avifNotice: document.getElementById('avif-notice'),

      // Drop zone
      dropZone: document.getElementById('drop-zone'),
      fileInput: document.getElementById('file-input'),

      // Original info
      originalInfo: document.getElementById('original-info'),
      infoFilename: document.getElementById('info-filename'),
      infoDimensions: document.getElementById('info-dimensions'),
      infoAspect: document.getElementById('info-aspect'),
      infoSize: document.getElementById('info-size'),
      infoFormat: document.getElementById('info-format'),
      previewImage: document.getElementById('preview-image'),

      // Settings
      settingsSection: document.getElementById('settings-section'),
      resizeModeRadios: document.querySelectorAll('input[name="resize-mode"]'),
      customSizeInputs: document.getElementById('custom-size-inputs'),
      longEdgeInput: document.getElementById('long-edge-input'),
      presetRatioInputs: document.getElementById('preset-ratio-inputs'),
      inputWidth: document.getElementById('input-width'),
      inputHeight: document.getElementById('input-height'),
      inputLongEdge: document.getElementById('input-long-edge'),
      inputPresetWidth: document.getElementById('input-preset-width'),
      btnLockRatio: document.getElementById('btn-lock-ratio'),
      presetButtons: document.querySelectorAll('.btn-preset'),
      formatRadios: document.querySelectorAll('input[name="output-format"]'),
      formatAvifLabel: document.getElementById('format-avif-label'),
      qualityControl: document.getElementById('quality-control'),
      inputQuality: document.getElementById('input-quality'),
      qualityValue: document.getElementById('quality-value'),
      bgColorControl: document.getElementById('bg-color-control'),
      inputBgColor: document.getElementById('input-bg-color'),
      bgColorValue: document.getElementById('bg-color-value'),

      // Output preview
      estimateDimensions: document.getElementById('estimate-dimensions'),
      estimatePixels: document.getElementById('estimate-pixels'),
      estimateRaw: document.getElementById('estimate-raw'),
      estimateCompressed: document.getElementById('estimate-compressed'),

      // Action buttons
      btnConvert: document.getElementById('btn-convert'),
      btnReset: document.getElementById('btn-reset'),

      // Result
      resultSection: document.getElementById('result-section'),
      resultOriginalImg: document.getElementById('result-original-img'),
      resultConvertedImg: document.getElementById('result-converted-img'),
      resultOriginalSize: document.getElementById('result-original-size'),
      resultConvertedSize: document.getElementById('result-converted-size'),
      resultReduction: document.getElementById('result-reduction'),
      btnDownload: document.getElementById('btn-download'),

      // Processing overlay
      processingOverlay: document.getElementById('processing-overlay'),

      // Theme & Language
      btnThemeToggle: document.getElementById('btn-theme-toggle'),
      themeIcon: document.querySelector('.theme-icon'),
      btnLangToggle: document.getElementById('btn-lang-toggle'),
      langIcon: document.querySelector('.lang-icon'),

      // Footer & Modal
      btnPrivacyPolicy: document.getElementById('btn-privacy-policy'),
      btnPrivacyPolicyInline: document.getElementById('btn-privacy-policy-inline'),
      btnPrivacyToggle: document.getElementById('btn-privacy-toggle'),
      privacyDetails: document.getElementById('privacy-details'),
      privacyModal: document.getElementById('privacy-modal'),
      btnModalClose: document.getElementById('btn-modal-close'),
      modalBackdrop: document.querySelector('.modal-backdrop'),

      // Toast
      toastContainer: document.getElementById('toast-container')
    };
  }

  /**
   * イベントリスナーを設定
   */
  function setupEventListeners() {
    // ドロップゾーン
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        elements.fileInput.click();
      }
    });
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);

    // リサイズモード
    elements.resizeModeRadios.forEach(radio => {
      radio.addEventListener('change', handleResizeModeChange);
    });

    // サイズ入力
    elements.inputWidth.addEventListener('input', () => handleSizeInput('width'));
    elements.inputHeight.addEventListener('input', () => handleSizeInput('height'));
    elements.inputLongEdge.addEventListener('input', updateEstimate);
    elements.inputPresetWidth.addEventListener('input', updateEstimate);

    // アスペクト比ロック
    elements.btnLockRatio.addEventListener('click', toggleLockRatio);

    // プリセットボタン
    elements.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => handlePresetClick(btn));
    });

    // フォーマット選択
    elements.formatRadios.forEach(radio => {
      radio.addEventListener('change', handleFormatChange);
    });

    // 品質スライダー
    elements.inputQuality.addEventListener('input', handleQualityChange);

    // 背景色
    elements.inputBgColor.addEventListener('input', handleBgColorChange);

    // アクションボタン
    elements.btnConvert.addEventListener('click', handleConvert);
    elements.btnReset.addEventListener('click', handleReset);

    // テーマ切替
    elements.btnThemeToggle.addEventListener('click', toggleTheme);

    // 言語切替
    elements.btnLangToggle.addEventListener('click', toggleLanguage);

    // プライバシー
    elements.btnPrivacyToggle.addEventListener('click', togglePrivacyDetails);
    elements.btnPrivacyPolicy.addEventListener('click', openPrivacyModal);
    if (elements.btnPrivacyPolicyInline) {
      elements.btnPrivacyPolicyInline.addEventListener('click', openPrivacyModal);
    }
    elements.btnModalClose.addEventListener('click', closePrivacyModal);
    elements.modalBackdrop.addEventListener('click', closePrivacyModal);

    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !elements.privacyModal.hidden) {
        closePrivacyModal();
      }
    });
  }

  // ========== ドラッグ＆ドロップ ==========

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    // 子要素への移動時は無視（relatedTargetがdropZone内の場合）
    if (elements.dropZone.contains(e.relatedTarget)) {
      return;
    }
    elements.dropZone.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  // ========== ファイル処理 ==========

  async function processFile(file) {
    // バリデーション
    const validation = ImageProcessor.validateFile(file);
    if (!validation.valid) {
      showToast(I18n.t(validation.errorKey), 'error');
      return;
    }

    try {
      // 画像ロード
      const { bitmap, info } = await ImageProcessor.loadImage(file);

      // 状態更新
      state.originalImage = file;
      state.originalBitmap = bitmap;
      state.originalInfo = info;

      // UI更新
      displayOriginalInfo(info);
      displayPreview(file);
      showSettings();
      updateSizeInputs(info.width, info.height);
      updateEstimate();

      // 変換ボタン有効化
      elements.btnConvert.disabled = false;

      // 結果セクションをリセット
      hideResult();

    } catch (error) {
      console.error('Error loading image:', error);
      showToast('Failed to load image', 'error');
    }
  }

  function displayOriginalInfo(info) {
    elements.infoFilename.textContent = info.filename;
    elements.infoDimensions.textContent = `${info.width} × ${info.height} px`;
    elements.infoAspect.textContent = info.aspectRatio;
    elements.infoSize.textContent = info.formattedSize;
    elements.infoFormat.textContent = info.mimeType;
    elements.originalInfo.classList.remove('hidden');
  }

  function displayPreview(file) {
    // 既存のObject URLがあれば解放
    if (state.previewUrl && state.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(state.previewUrl);
    }
    // Object URLを使用（FileReaderより効率的）
    state.previewUrl = URL.createObjectURL(file);
    elements.previewImage.src = state.previewUrl;
  }

  function showSettings() {
    elements.settingsSection.classList.remove('hidden');
  }

  // ========== リサイズ設定 ==========

  function handleResizeModeChange(e) {
    const mode = e.target.value;

    // 入力パネルの切り替え
    elements.customSizeInputs.classList.toggle('hidden', mode !== 'custom');
    elements.longEdgeInput.classList.toggle('hidden', mode !== 'long-edge');
    elements.presetRatioInputs.classList.toggle('hidden', mode !== 'preset');

    updateEstimate();
  }

  function handleSizeInput(dimension) {
    state.lastChangedDimension = dimension;

    if (state.lockRatio && state.originalInfo) {
      const ratio = state.originalInfo.width / state.originalInfo.height;

      if (dimension === 'width') {
        const width = parseInt(elements.inputWidth.value) || 0;
        if (width > 0) {
          elements.inputHeight.value = Math.round(width / ratio);
        }
      } else {
        const height = parseInt(elements.inputHeight.value) || 0;
        if (height > 0) {
          elements.inputWidth.value = Math.round(height * ratio);
        }
      }
    }

    updateEstimate();
  }

  function toggleLockRatio() {
    state.lockRatio = !state.lockRatio;
    elements.btnLockRatio.classList.toggle('active', state.lockRatio);
    elements.btnLockRatio.setAttribute('aria-pressed', state.lockRatio);
    elements.btnLockRatio.querySelector('.lock-icon').textContent = state.lockRatio ? '🔗' : '🔓';
  }

  function handlePresetClick(btn) {
    elements.presetButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedRatio = btn.dataset.ratio;
    updateEstimate();
  }

  function updateSizeInputs(width, height) {
    elements.inputWidth.value = width;
    elements.inputHeight.value = height;
    elements.inputWidth.placeholder = width;
    elements.inputHeight.placeholder = height;
    elements.inputLongEdge.value = Math.max(width, height);
    elements.inputLongEdge.placeholder = Math.max(width, height);
    elements.inputPresetWidth.placeholder = width;
  }

  // ========== フォーマット設定 ==========

  function handleFormatChange(e) {
    const format = e.target.value;

    // PNG選択時は品質コントロールを非表示
    elements.qualityControl.classList.toggle('hidden', format === 'image/png');

    // JPEG選択時は背景色コントロールを表示
    elements.bgColorControl.classList.toggle('hidden', format !== 'image/jpeg');

    updateEstimate();
  }

  function handleQualityChange() {
    elements.qualityValue.textContent = `${elements.inputQuality.value}%`;
    updateEstimate();
  }

  function handleBgColorChange() {
    elements.bgColorValue.textContent = elements.inputBgColor.value;
  }

  // ========== 出力プレビュー ==========

  function getResizeMode() {
    const checked = document.querySelector('input[name="resize-mode"]:checked');
    return checked ? checked.value : 'custom';
  }

  function getOutputFormat() {
    const checked = document.querySelector('input[name="output-format"]:checked');
    return checked ? checked.value : 'image/jpeg';
  }

  function updateEstimate() {
    if (!state.originalInfo) return;

    const mode = getResizeMode();
    const format = getOutputFormat();
    const quality = parseInt(elements.inputQuality.value) / 100;

    let options = { mode };

    switch (mode) {
      case 'custom':
        options.width = parseInt(elements.inputWidth.value) || state.originalInfo.width;
        options.height = parseInt(elements.inputHeight.value) || state.originalInfo.height;
        options.lockRatio = state.lockRatio;
        options.widthChanged = state.lastChangedDimension === 'width';
        break;
      case 'long-edge':
        options.longEdge = parseInt(elements.inputLongEdge.value) || Math.max(state.originalInfo.width, state.originalInfo.height);
        break;
      case 'preset':
        options.ratio = state.selectedRatio;
        options.baseWidth = parseInt(elements.inputPresetWidth.value) || state.originalInfo.width;
        break;
    }

    const { width, height } = ImageProcessor.calculateNewSize(
      state.originalInfo.width,
      state.originalInfo.height,
      options
    );

    const estimate = ImageProcessor.estimateOutputSize(width, height, format, quality);

    elements.estimateDimensions.textContent = estimate.dimensions;
    elements.estimatePixels.textContent = estimate.totalPixels;
    elements.estimateRaw.textContent = estimate.rawSize;
    elements.estimateCompressed.textContent = `~${estimate.estimatedCompressed}`;
  }

  // ========== 変換処理 ==========

  async function handleConvert() {
    if (!state.originalBitmap || state.isProcessing) return;

    state.isProcessing = true;
    showProcessing();

    try {
      const mode = getResizeMode();
      const format = getOutputFormat();

      const options = {
        mode,
        format,
        quality: parseInt(elements.inputQuality.value) / 100,
        bgColor: elements.inputBgColor.value
      };

      switch (mode) {
        case 'custom':
          options.width = parseInt(elements.inputWidth.value) || state.originalInfo.width;
          options.height = parseInt(elements.inputHeight.value) || state.originalInfo.height;
          options.lockRatio = state.lockRatio;
          options.widthChanged = state.lastChangedDimension === 'width';
          break;
        case 'long-edge':
          options.longEdge = parseInt(elements.inputLongEdge.value) || Math.max(state.originalInfo.width, state.originalInfo.height);
          break;
        case 'preset':
          options.ratio = state.selectedRatio;
          options.baseWidth = parseInt(elements.inputPresetWidth.value) || state.originalInfo.width;
          break;
      }

      // 変換実行
      const result = await ImageProcessor.convertImage(state.originalBitmap, options);

      // 古いURLを解放
      if (state.convertedUrl) {
        ImageProcessor.revokeURL(state.convertedUrl);
      }
      state.convertedUrl = result.url;

      // 結果表示
      displayResult(result, format);

      showToast(I18n.t('toast.convertSuccess') || 'Conversion complete!', 'success');

    } catch (error) {
      console.error('Conversion error:', error);
      showToast(I18n.t('toast.convertError') || 'Conversion failed', 'error');
    } finally {
      state.isProcessing = false;
      hideProcessing();
    }
  }

  function displayResult(result, format) {
    // 元画像
    elements.resultOriginalImg.src = elements.previewImage.src;
    elements.resultOriginalSize.textContent = `${state.originalInfo.width}×${state.originalInfo.height} / ${state.originalInfo.formattedSize}`;

    // 変換後画像
    elements.resultConvertedImg.src = result.url;
    elements.resultConvertedSize.textContent = `${result.width}×${result.height} / ${result.formattedSize}`;

    // サイズ削減率
    const reduction = ((state.originalInfo.fileSize - result.size) / state.originalInfo.fileSize * 100).toFixed(1);
    if (reduction > 0) {
      elements.resultReduction.textContent = `-${reduction}%`;
      elements.resultReduction.classList.remove('increase');
    } else {
      elements.resultReduction.textContent = `+${Math.abs(reduction)}%`;
      elements.resultReduction.classList.add('increase');
    }

    // ダウンロードリンク
    const filename = ImageProcessor.generateFilename(
      state.originalInfo.filename,
      result.width,
      result.height,
      format
    );
    elements.btnDownload.href = result.url;
    elements.btnDownload.download = filename;

    // 結果セクション表示
    elements.resultSection.classList.remove('hidden');
    elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function hideResult() {
    elements.resultSection.classList.add('hidden');
    if (state.convertedUrl) {
      ImageProcessor.revokeURL(state.convertedUrl);
      state.convertedUrl = null;
    }
  }

  // ========== 処理中オーバーレイ ==========

  function showProcessing() {
    elements.processingOverlay.classList.remove('hidden');
    elements.btnConvert.disabled = true;
  }

  function hideProcessing() {
    elements.processingOverlay.classList.add('hidden');
    elements.btnConvert.disabled = false;
  }

  // ========== リセット ==========

  function handleReset() {
    // 状態リセット
    if (state.originalBitmap) {
      state.originalBitmap.close();
    }
    if (state.previewUrl && state.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(state.previewUrl);
    }
    state.originalImage = null;
    state.originalBitmap = null;
    state.originalInfo = null;
    state.previewUrl = null;
    hideResult();

    // UI リセット
    elements.fileInput.value = '';
    elements.originalInfo.classList.add('hidden');
    elements.settingsSection.classList.add('hidden');
    elements.previewImage.src = '';
    elements.btnConvert.disabled = true;

    // 設定をデフォルトに
    elements.inputWidth.value = '';
    elements.inputHeight.value = '';
    elements.inputLongEdge.value = '';
    elements.inputPresetWidth.value = '';
    document.querySelector('input[name="resize-mode"][value="custom"]').checked = true;
    document.querySelector('input[name="output-format"][value="image/jpeg"]').checked = true;
    elements.inputQuality.value = 85;
    elements.qualityValue.textContent = '85%';
    elements.customSizeInputs.classList.remove('hidden');
    elements.longEdgeInput.classList.add('hidden');
    elements.presetRatioInputs.classList.add('hidden');
    elements.qualityControl.classList.remove('hidden');
    elements.bgColorControl.classList.add('hidden');

    // プリセットボタンリセット
    elements.presetButtons.forEach(btn => btn.classList.remove('active'));
    elements.presetButtons[0]?.classList.add('active');
    state.selectedRatio = '1:1';

    // アスペクト比ロックリセット
    state.lockRatio = true;
    elements.btnLockRatio.classList.add('active');
    elements.btnLockRatio.querySelector('.lock-icon').textContent = '🔗';
  }

  // ========== テーマ ==========

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    elements.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  function loadTheme() {
    const savedTheme = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  // ========== 言語 ==========

  function toggleLanguage() {
    if (typeof I18n !== 'undefined') {
      const currentLang = I18n.getCurrentLang();
      const newLang = currentLang === 'en' ? 'ja' : 'en';
      I18n.setLang(newLang);
      updateLangIcon(newLang);
    }
  }

  function updateLangIcon(lang) {
    elements.langIcon.textContent = lang === 'en' ? 'JA' : 'EN';
  }

  function loadLanguage() {
    if (typeof I18n !== 'undefined') {
      const currentLang = I18n.getCurrentLang();
      updateLangIcon(currentLang);
    }
  }

  // ========== プライバシー ==========

  function togglePrivacyDetails() {
    const isExpanded = elements.btnPrivacyToggle.classList.toggle('active');
    elements.privacyDetails.style.display = isExpanded ? 'block' : 'none';
    elements.btnPrivacyToggle.setAttribute('aria-expanded', isExpanded);
  }

  function openPrivacyModal() {
    elements.privacyModal.hidden = false;
    document.body.style.overflow = 'hidden';
    elements.btnModalClose.focus();
  }

  function closePrivacyModal() {
    elements.privacyModal.hidden = true;
    document.body.style.overflow = '';
  }

  // ========== トースト ==========

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.transition = 'opacity 0.3s ease';
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ========== AVIF対応チェック ==========

  async function checkBrowserSupport() {
    const avifSupported = await ImageProcessor.checkAVIFSupport();

    if (!avifSupported) {
      elements.avifNotice.classList.remove('hidden');
      elements.formatAvifLabel.classList.add('hidden');
    }
  }

  // ========== 初期化 ==========

  async function init() {
    cacheElements();
    setupEventListeners();
    loadTheme();

    // 言語初期化を待ってからUI更新
    if (typeof I18n !== 'undefined') {
      await I18n.init();
      loadLanguage();
    }

    await checkBrowserSupport();

    // 初期プリセット選択
    elements.presetButtons[0]?.classList.add('active');

    console.log('✓ UI initialized');
  }

  // Public API
  return {
    init,
    showToast
  };
})();
