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
    isProcessing: false,
    formatFallback: null,
    lastFocusedElement: null
  };

  // モーダルのフォーカストラップ用
  let focusTrapHandler = null;

  /**
   * 翻訳取得（キー未定義時はフォールバック）
   * @param {string} key
   * @param {string} fallback
   * @param {Object} params
   * @returns {string}
   */
  function tOr(key, fallback = '', params = {}) {
    if (typeof I18n === 'undefined') {
      return fallback;
    }
    const value = I18n.t(key, params);
    return value === key ? fallback : value;
  }

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
      estimateDelta: document.getElementById('estimate-delta'),
      estimateDeltaIcon: document.getElementById('estimate-delta-icon'),
      estimateDeltaText: document.getElementById('estimate-delta-text'),

      // Action buttons
      btnConvert: document.getElementById('btn-convert'),
      btnReset: document.getElementById('btn-reset'),

      // Result
      resultSection: document.getElementById('result-section'),
      resultOriginalImg: document.getElementById('result-original-img'),
      resultConvertedImg: document.getElementById('result-converted-img'),
      resultOriginalExt: document.getElementById('result-original-ext'),
      resultConvertedExt: document.getElementById('result-converted-ext'),
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

      // Warnings
      warningArea: document.getElementById('warning-area'),
      warningSizeIncrease: document.getElementById('warning-size-increase'),
      warningAspectChange: document.getElementById('warning-aspect-change'),
      warningAspectText: document.querySelector('#warning-aspect-change [data-i18n]'),
      warningAnimatedGif: document.getElementById('warning-animated-gif'),
      warningFormatUnsupported: document.getElementById('warning-format-unsupported'),
      warningFormatUnsupportedText: document.getElementById('warning-format-unsupported-text'),
      warningFormatFallback: document.getElementById('warning-format-fallback'),
      warningFormatText: document.getElementById('warning-format-text'),

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
      showToast(tOr(validation.errorKey, 'Invalid file'), 'error');
      if (elements.fileInput) {
        elements.fileInput.value = '';
      }
      return;
    }

    try {
      // 古いリソースを解放
      if (state.originalBitmap && typeof state.originalBitmap.close === 'function') {
        state.originalBitmap.close();
      }
      if (state.previewUrl && state.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(state.previewUrl);
        state.previewUrl = null;
      }

      // 画像ロード
      const { bitmap, info } = await ImageProcessor.loadImage(file);

      // 状態更新
      state.originalImage = file;
      state.originalBitmap = bitmap;
      state.originalInfo = info;
      clearFormatFallback();

      // UI更新
      displayOriginalInfo(info);
      displayPreview(file);
      showSettings();
      updateSizeInputs(info.width, info.height);
      updateFormatControls();
      updateEstimate();

      // 変換ボタン有効化
      elements.btnConvert.disabled = false;

      // 結果セクションをリセット
      hideResult();

    } catch (error) {
      console.error('Error loading image:', error);
      showToast(tOr('toast.fileError', 'Failed to load image'), 'error');
    } finally {
      if (elements.fileInput) {
        elements.fileInput.value = '';
      }
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

    clearFormatFallback();

    // PNG選択時は品質コントロールを非表示
    elements.qualityControl.classList.toggle('hidden', format === 'image/png');

    // JPEG選択時かつ元画像が透過可能フォーマットの場合のみ背景色コントロールを表示
    const showBgColor = format === 'image/jpeg' && isOriginalTransparentCapable();
    elements.bgColorControl.classList.toggle('hidden', !showBgColor);

    updateEstimate();
  }

  /**
   * 元画像が透過をサポートするフォーマットかどうか
   * @returns {boolean}
   */
  function isOriginalTransparentCapable() {
    if (!state.originalInfo) return false;

    // JPEGは透過をサポートしない
    const transparentFormats = ['image/png', 'image/webp', 'image/gif', 'image/avif'];
    return transparentFormats.includes(state.originalInfo.mimeType);
  }

  /**
   * フォーマット関連のコントロールを更新
   */
  function updateFormatControls() {
    const format = getOutputFormat();

    // JPEG選択時かつ元画像が透過可能フォーマットの場合のみ背景色コントロールを表示
    const showBgColor = format === 'image/jpeg' && isOriginalTransparentCapable();
    elements.bgColorControl.classList.toggle('hidden', !showBgColor);
  }

  function handleQualityChange() {
    elements.qualityValue.textContent = `${elements.inputQuality.value}`;
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
    if (!state.originalInfo) {
      resetEstimateDelta();
      updateWarnings();
      return;
    }

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

    const estimateFormat = isOutputFormatSupported(format) ? format : 'image/png';
    const estimate = ImageProcessor.estimateOutputSize(width, height, estimateFormat, quality, state.originalInfo);

    elements.estimateDimensions.textContent = estimate.dimensions;
    elements.estimatePixels.textContent = estimate.totalPixels;
    elements.estimateRaw.textContent = estimate.rawSize;
    elements.estimateCompressed.textContent = `~${estimate.estimatedCompressed}`;
    updateEstimateDelta(estimate);

    // 警告を更新
    updateWarnings(width, height, estimate);
  }

  function setEstimateDeltaState(variant, icon, text) {
    if (!elements.estimateDelta) return;
    elements.estimateDelta.classList.remove(
      'estimate-delta--neutral',
      'estimate-delta--increase',
      'estimate-delta--decrease'
    );
    elements.estimateDelta.classList.add(`estimate-delta--${variant}`);
    if (elements.estimateDeltaIcon) {
      elements.estimateDeltaIcon.textContent = icon;
    }
    if (elements.estimateDeltaText) {
      elements.estimateDeltaText.textContent = text;
    }
  }

  function resetEstimateDelta() {
    const placeholder = tOr('output.change.placeholder', 'Select an image to see size change');
    setEstimateDeltaState('neutral', '↔', placeholder);
  }

  function updateEstimateDelta(estimate) {
    if (!state.originalInfo || !estimate || !estimate.estimatedCompressedBytes) {
      resetEstimateDelta();
      return;
    }

    const originalSize = state.originalInfo.fileSize;
    const estimatedSize = estimate.estimatedCompressedBytes;
    if (!originalSize || originalSize <= 0) {
      resetEstimateDelta();
      return;
    }

    const diff = estimatedSize - originalSize;
    const percent = Math.abs(diff) / originalSize * 100;

    if (percent < 0.5) {
      const sameText = tOr('output.change.same', 'About the same size');
      setEstimateDeltaState('neutral', '↔', sameText);
      return;
    }

    const percentText = percent.toFixed(1);
    if (diff < 0) {
      const smallerText = tOr('output.change.smaller', `Smaller by ${percentText}%`, { percent: percentText });
      setEstimateDeltaState('decrease', '⬇', smallerText);
      return;
    }

    const largerText = tOr('output.change.larger', `Larger by ${percentText}%`, { percent: percentText });
    setEstimateDeltaState('increase', '⚠️', largerText);
  }

  // ========== 警告表示 ==========

  function updateWarnings(newWidth = 0, newHeight = 0, estimate = null) {
    let hasAnyWarning = false;

    // サイズ増加警告
    // ピクセル数が大幅に増加する場合、またはPNG変換時に警告
    let showSizeWarning = false;
    if (state.originalInfo && newWidth > 0 && newHeight > 0) {
      const originalPixels = state.originalInfo.width * state.originalInfo.height;
      const newPixels = newWidth * newHeight;
      const format = getOutputFormat();

      // ピクセル数が50%以上増加する場合
      if (newPixels > originalPixels * 1.5) {
        showSizeWarning = true;
      }
      // 元がJPEG/WebPでPNGに変換する場合（容量が大幅に増加する可能性）
      else if (format === 'image/png' &&
        (state.originalInfo.mimeType === 'image/jpeg' || state.originalInfo.mimeType === 'image/webp')) {
        showSizeWarning = true;
      }
    }
    elements.warningSizeIncrease.classList.toggle('hidden', !showSizeWarning);
    if (showSizeWarning) hasAnyWarning = true;

    // 縦横比逆転警告
    let showAspectWarning = false;
    let aspectMessageKey = 'warning.aspectChange';
    if (state.originalInfo && newWidth > 0 && newHeight > 0) {
      const originalIsLandscape = state.originalInfo.width > state.originalInfo.height;
      const originalIsPortrait = state.originalInfo.width < state.originalInfo.height;
      const newIsLandscape = newWidth > newHeight;
      const newIsPortrait = newWidth < newHeight;
      const originalRatio = state.originalInfo.width / state.originalInfo.height;
      const newRatio = newWidth / newHeight;
      const aspectChanged = Math.abs(newRatio - originalRatio) > 0.01;
      const mode = getResizeMode();

      // 横長→縦長、または縦長→横長になる場合
      if ((originalIsLandscape && newIsPortrait) || (originalIsPortrait && newIsLandscape)) {
        showAspectWarning = true;
        aspectMessageKey = 'warning.aspectChangeFlip';
      } else if (mode === 'preset' && aspectChanged) {
        showAspectWarning = true;
        aspectMessageKey = 'warning.aspectChange';
      }
    }
    if (showAspectWarning) {
      if (elements.warningAspectText) {
        elements.warningAspectText.setAttribute('data-i18n', aspectMessageKey);
        const translated = tOr(aspectMessageKey, '');
        if (translated) {
          elements.warningAspectText.textContent = translated;
        }
      }
    }
    elements.warningAspectChange.classList.toggle('hidden', !showAspectWarning);
    if (showAspectWarning) hasAnyWarning = true;

    // アニメーションGIF警告
    const showAnimatedGifWarning = !!state.originalInfo?.isAnimatedGif;
    elements.warningAnimatedGif.classList.toggle('hidden', !showAnimatedGifWarning);
    if (showAnimatedGifWarning) hasAnyWarning = true;

    // フォーマットフォールバック警告
    let showFormatFallbackWarning = false;
    if (state.formatFallback && state.formatFallback.requested && state.formatFallback.actual) {
      const requestedLabel = getFormatLabel(state.formatFallback.requested);
      const actualLabel = getFormatLabel(state.formatFallback.actual);
      const fallbackMessage = tOr(
        'warning.formatFallback',
        `Selected format is not supported. Output will be ${actualLabel} instead of ${requestedLabel}.`,
        { requested: requestedLabel, actual: actualLabel }
      );
      if (elements.warningFormatText) {
        elements.warningFormatText.textContent = fallbackMessage;
      }
      showFormatFallbackWarning = true;
    }
    elements.warningFormatFallback?.classList.toggle('hidden', !showFormatFallbackWarning);
    if (showFormatFallbackWarning) hasAnyWarning = true;

    // フォーマット未対応警告（事前）
    let showFormatUnsupportedWarning = false;
    const selectedFormat = getOutputFormat();
    if (
      state.originalInfo &&
      !showFormatFallbackWarning &&
      selectedFormat &&
      !isOutputFormatSupported(selectedFormat)
    ) {
      const formatLabel = getFormatLabel(selectedFormat);
      const warningMessage = tOr(
        'warning.formatUnsupported',
        `This browser cannot encode ${formatLabel}. Output may fall back to PNG.`,
        { format: formatLabel }
      );
      if (elements.warningFormatUnsupportedText) {
        elements.warningFormatUnsupportedText.textContent = warningMessage;
      }
      showFormatUnsupportedWarning = true;
    }
    elements.warningFormatUnsupported?.classList.toggle('hidden', !showFormatUnsupportedWarning);
    if (showFormatUnsupportedWarning) hasAnyWarning = true;

    // 警告エリア全体の表示/非表示
    elements.warningArea.classList.toggle('hidden', !hasAnyWarning);
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
      const actualFormat = normalizeMimeType(result.mimeType) || normalizeMimeType(format);
      const fallbackInfo = detectFormatFallback(format, actualFormat);

      // 古いURLを解放
      if (state.convertedUrl) {
        ImageProcessor.revokeURL(state.convertedUrl);
      }
      state.convertedUrl = result.url;

      state.formatFallback = fallbackInfo;

      // 結果表示
      displayResult(result, format);

      if (fallbackInfo) {
        const requestedLabel = getFormatLabel(fallbackInfo.requested);
        const actualLabel = getFormatLabel(fallbackInfo.actual);
        showToast(
          tOr(
            'toast.formatFallback',
            `Format fallback: ${requestedLabel} → ${actualLabel}`,
            { requested: requestedLabel, actual: actualLabel }
          ),
          'warning'
        );
      }

      // トースト通知
      if (result.size > state.originalInfo.fileSize) {
        // それでもサイズが増加した場合（PNG変換時など）
        const increase = Math.round((result.size / state.originalInfo.fileSize - 1) * 100);
        showToast(tOr('toast.sizeIncreased', `File size increased by ${increase}%`, { percent: increase }), 'warning');
      } else {
        showToast(tOr('toast.convertSuccess', 'Conversion complete!'), 'success');
      }

      // 警告の再評価（フォーマットフォールバック含む）
      updateEstimate();

    } catch (error) {
      console.error('Conversion error:', error);
      showToast(tOr('toast.convertError', 'Conversion failed'), 'error');
    } finally {
      state.isProcessing = false;
      hideProcessing();
    }
  }

  function displayResult(result, format) {
    const actualFormat = normalizeMimeType(result?.mimeType) || normalizeMimeType(format);

    // 元画像
    elements.resultOriginalImg.src = elements.previewImage.src;
    elements.resultOriginalSize.textContent = `${state.originalInfo.width}×${state.originalInfo.height} / ${state.originalInfo.formattedSize}`;
    const originalExt = getFileExtension(state.originalInfo.filename) || getExtensionFromMime(state.originalInfo.mimeType);
    elements.resultOriginalExt.textContent = originalExt ? `.${originalExt}` : '-';

    // 変換後画像
    elements.resultConvertedImg.src = result.url;
    elements.resultConvertedSize.textContent = `${result.width}×${result.height} / ${result.formattedSize}`;
    const convertedExt = getExtensionFromMime(actualFormat);
    elements.resultConvertedExt.textContent = convertedExt ? `.${convertedExt}` : '-';

    // サイズ削減率
    const reduction = parseFloat(((state.originalInfo.fileSize - result.size) / state.originalInfo.fileSize * 100).toFixed(1));
    if (reduction > 0) {
      elements.resultReduction.textContent = `-${reduction}%`;
      elements.resultReduction.classList.remove('increase');
      elements.resultReduction.classList.remove('warning');
    } else {
      elements.resultReduction.textContent = `+${Math.abs(reduction)}%`;
      elements.resultReduction.classList.add('increase');
      // 20%以上増加した場合は警告色
      if (Math.abs(reduction) >= 20) {
        elements.resultReduction.classList.add('warning');
      } else {
        elements.resultReduction.classList.remove('warning');
      }
    }

    // ダウンロードリンク
    const filename = ImageProcessor.generateFilename(
      state.originalInfo.filename,
      result.width,
      result.height,
      actualFormat
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

  function getFileExtension(filename) {
    if (!filename) return null;
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : null;
  }

  function getExtensionFromMime(mimeType) {
    if (!mimeType) return null;
    const map = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif'
    };
    return map[mimeType] || (mimeType.includes('/') ? mimeType.split('/')[1] : null);
  }

  function isOutputFormatSupported(format) {
    const normalized = normalizeMimeType(format);
    if (normalized === 'image/avif') {
      return ImageProcessor.isAVIFSupported();
    }
    if (normalized === 'image/webp') {
      return ImageProcessor.isWebPSupported();
    }
    return true;
  }

  function normalizeMimeType(type) {
    if (typeof type !== 'string') return '';
    const normalized = type.toLowerCase().trim();
    return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
  }

  function getFormatLabel(mimeType) {
    const normalized = normalizeMimeType(mimeType);
    const map = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
      'image/avif': 'AVIF',
      'image/gif': 'GIF'
    };
    if (map[normalized]) return map[normalized];
    if (!normalized) return 'Unknown';
    const suffix = normalized.includes('/') ? normalized.split('/')[1] : normalized;
    return suffix.toUpperCase();
  }

  function detectFormatFallback(requestedFormat, actualFormat) {
    const requested = normalizeMimeType(requestedFormat);
    const actual = normalizeMimeType(actualFormat);
    if (!requested || !actual || requested === actual) return null;
    return { requested, actual };
  }

  function clearFormatFallback() {
    state.formatFallback = null;
  }

  // ========== 処理中オーバーレイ ==========

  function showProcessing() {
    elements.processingOverlay.classList.remove('hidden');
    elements.btnConvert.disabled = true;
    elements.btnReset.disabled = true;
  }

  function hideProcessing() {
    elements.processingOverlay.classList.add('hidden');
    elements.btnConvert.disabled = false;
    elements.btnReset.disabled = false;
  }

  // ========== リセット ==========

  function handleReset() {
    // 状態リセット
    if (state.originalBitmap && typeof state.originalBitmap.close === 'function') {
      state.originalBitmap.close();
    }
    if (state.previewUrl && state.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(state.previewUrl);
    }
    state.originalImage = null;
    state.originalBitmap = null;
    state.originalInfo = null;
    state.previewUrl = null;
    clearFormatFallback();
    hideResult();

    // UI リセット
    elements.fileInput.value = '';
    elements.originalInfo.classList.add('hidden');
    elements.previewImage.src = '';
    elements.btnConvert.disabled = true;

    // 警告エリアをクリア
    elements.warningArea.classList.add('hidden');
    elements.warningSizeIncrease.classList.add('hidden');
    elements.warningAspectChange.classList.add('hidden');
    elements.warningFormatUnsupported?.classList.add('hidden');
    elements.warningFormatFallback?.classList.add('hidden');
    resetEstimateDelta();

    // 設定をデフォルトに
    elements.inputWidth.value = '';
    elements.inputHeight.value = '';
    elements.inputLongEdge.value = '';
    elements.inputPresetWidth.value = '';
    document.querySelector('input[name="resize-mode"][value="custom"]').checked = true;
    document.querySelector('input[name="output-format"][value="image/jpeg"]').checked = true;
    elements.inputQuality.value = 85;
    elements.qualityValue.textContent = '85';
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
    elements.btnLockRatio.setAttribute('aria-pressed', 'true');
    elements.btnLockRatio.querySelector('.lock-icon').textContent = '🔗';

    // アップロードエリアへフォーカスを戻す
    if (elements.dropZone) {
      elements.dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.requestAnimationFrame(() => {
        try {
          elements.dropZone.focus({ preventScroll: true });
        } catch (error) {
          elements.dropZone.focus();
        }
      });
    }
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
      updateLangIcon(newLang);
      const langPromise = I18n.setLang(newLang);
      if (langPromise && typeof langPromise.then === 'function') {
        langPromise.then(() => updateEstimate());
      } else {
        updateEstimate();
      }
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
    elements.privacyDetails.classList.toggle('hidden', !isExpanded);
    elements.btnPrivacyToggle.setAttribute('aria-expanded', isExpanded);
  }

  function getFocusableElements(container) {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    return Array.from(container.querySelectorAll(selector));
  }

  function trapFocus(container) {
    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    focusTrapHandler = event => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', focusTrapHandler);
    first.focus();
  }

  function releaseFocus(container) {
    if (focusTrapHandler) {
      container.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
      state.lastFocusedElement.focus();
    }
    state.lastFocusedElement = null;
  }

  function openPrivacyModal() {
    if (!elements.privacyModal.hidden) return;
    state.lastFocusedElement = document.activeElement;
    elements.privacyModal.hidden = false;
    document.body.classList.add('modal-open');
    trapFocus(elements.privacyModal);
  }

  function closePrivacyModal() {
    if (elements.privacyModal.hidden) return;
    elements.privacyModal.hidden = true;
    document.body.classList.remove('modal-open');
    releaseFocus(elements.privacyModal);
  }

  // ========== トースト ==========

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('aria-atomic', 'true');
    if (type === 'error') {
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
    } else {
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
    }
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('is-closing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ========== AVIF対応チェック ==========

  async function checkBrowserSupport() {
    await Promise.all([
      ImageProcessor.checkAVIFSupport(),
      ImageProcessor.checkWebPSupport()
    ]);

    updateEstimate();
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
