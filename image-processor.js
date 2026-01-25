/**
 * zouka - Image Processor Module
 * 画像処理のコアロジック
 */

const ImageProcessor = (function () {
  'use strict';

  // 設定
  const CONFIG = {
    MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
    MAX_DIMENSION: 8000, // 8000px
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
    OUTPUT_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  };

  // AVIF対応フラグ
  let avifSupported = false;

  /**
   * AVIF対応をチェック
   * @returns {Promise<boolean>}
   */
  async function checkAVIFSupport() {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      canvas.toBlob(blob => {
        avifSupported = !!blob;
        resolve(avifSupported);
      }, 'image/avif', 0.5);
    });
  }

  /**
   * AVIF対応状態を取得
   * @returns {boolean}
   */
  function isAVIFSupported() {
    return avifSupported;
  }

  /**
   * ファイルサイズをフォーマット
   * @param {number} bytes
   * @returns {string}
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * アスペクト比を計算
   * @param {number} width
   * @param {number} height
   * @returns {string}
   */
  function calculateAspectRatio(width, height) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  }

  /**
   * ファイル検証
   * @param {File} file
   * @returns {{valid: boolean, errorKey?: string}}
   */
  function validateFile(file) {
    if (!file) {
      return { valid: false, errorKey: 'toast.noFile' };
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return { valid: false, errorKey: 'toast.fileTooLarge' };
    }

    if (!CONFIG.SUPPORTED_FORMATS.includes(file.type) && !file.type.startsWith('image/')) {
      return { valid: false, errorKey: 'toast.unsupportedFormat' };
    }

    return { valid: true };
  }

  /**
   * 画像をロード
   * @param {File} file
   * @returns {Promise<{bitmap: ImageBitmap, info: Object}>}
   */
  async function loadImage(file) {
    // UI更新のための待機
    await new Promise(resolve => requestAnimationFrame(resolve));

    const bitmap = await createImageBitmap(file);

    const info = {
      filename: file.name,
      width: bitmap.width,
      height: bitmap.height,
      aspectRatio: calculateAspectRatio(bitmap.width, bitmap.height),
      fileSize: file.size,
      formattedSize: formatFileSize(file.size),
      mimeType: file.type
    };

    return { bitmap, info };
  }

  /**
   * 新しいサイズを計算
   * @param {number} originalWidth
   * @param {number} originalHeight
   * @param {Object} options
   * @returns {{width: number, height: number}}
   */
  function calculateNewSize(originalWidth, originalHeight, options) {
    let newWidth, newHeight;
    const aspectRatio = originalWidth / originalHeight;

    switch (options.mode) {
      case 'custom':
        if (options.lockRatio) {
          if (options.widthChanged) {
            newWidth = Math.min(options.width || originalWidth, CONFIG.MAX_DIMENSION);
            newHeight = Math.round(newWidth / aspectRatio);
          } else {
            newHeight = Math.min(options.height || originalHeight, CONFIG.MAX_DIMENSION);
            newWidth = Math.round(newHeight * aspectRatio);
          }
        } else {
          newWidth = options.width || originalWidth;
          newHeight = options.height || originalHeight;
        }
        break;

      case 'long-edge':
        const longEdge = Math.min(options.longEdge || Math.max(originalWidth, originalHeight), CONFIG.MAX_DIMENSION);
        if (originalWidth >= originalHeight) {
          newWidth = longEdge;
          newHeight = Math.round(longEdge / aspectRatio);
        } else {
          newHeight = longEdge;
          newWidth = Math.round(longEdge * aspectRatio);
        }
        break;

      case 'preset':
        const [ratioW, ratioH] = (options.ratio || '1:1').split(':').map(Number);
        const targetRatio = ratioW / ratioH;
        newWidth = options.baseWidth || originalWidth;
        newHeight = Math.round(newWidth / targetRatio);
        break;

      default:
        newWidth = originalWidth;
        newHeight = originalHeight;
    }

    // 上限ガード
    newWidth = Math.min(Math.max(1, Math.round(newWidth)), CONFIG.MAX_DIMENSION);
    newHeight = Math.min(Math.max(1, Math.round(newHeight)), CONFIG.MAX_DIMENSION);

    return { width: newWidth, height: newHeight };
  }

  /**
   * 出力サイズを推定
   * @param {number} width
   * @param {number} height
   * @param {string} format
   * @param {number} quality
   * @returns {Object}
   */
  function estimateOutputSize(width, height, format, quality) {
    const totalPixels = width * height;
    // 非圧縮: RGBA = 4 bytes/pixel
    const rawSize = totalPixels * 4;

    // 圧縮後サイズの推定（非常に概算）
    let compressionRatio;
    switch (format) {
      case 'image/jpeg':
        compressionRatio = 0.1 + (1 - quality) * 0.15; // 10-25%
        break;
      case 'image/png':
        compressionRatio = 0.3; // 約30%（可逆圧縮）
        break;
      case 'image/webp':
        compressionRatio = 0.08 + (1 - quality) * 0.12; // 8-20%
        break;
      case 'image/avif':
        compressionRatio = 0.05 + (1 - quality) * 0.1; // 5-15%
        break;
      default:
        compressionRatio = 0.2;
    }

    const estimatedCompressed = Math.round(rawSize * compressionRatio);

    return {
      dimensions: `${width} × ${height}`,
      totalPixels: totalPixels.toLocaleString(),
      rawSize: formatFileSize(rawSize),
      estimatedCompressed: formatFileSize(estimatedCompressed)
    };
  }

  /**
   * 画像を変換
   * @param {ImageBitmap} bitmap
   * @param {Object} options
   * @returns {Promise<{blob: Blob, url: string, size: number}>}
   */
  async function convertImage(bitmap, options) {
    // UI更新のための待機
    await new Promise(resolve => requestAnimationFrame(resolve));

    const { width, height } = calculateNewSize(
      bitmap.width,
      bitmap.height,
      options
    );

    // Canvas作成
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 背景色の設定（JPEG変換時）
    if (options.format === 'image/jpeg' && options.bgColor) {
      ctx.fillStyle = options.bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    // 高品質リサイズ
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // UI更新のための待機
    await new Promise(resolve => requestAnimationFrame(resolve));

    // 描画
    ctx.drawImage(bitmap, 0, 0, width, height);

    // UI更新のための待機
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Blob生成
    return new Promise((resolve, reject) => {
      const quality = options.format === 'image/png' ? undefined : options.quality;

      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Failed to convert image'));
          return;
        }

        const url = URL.createObjectURL(blob);
        resolve({
          blob,
          url,
          size: blob.size,
          formattedSize: formatFileSize(blob.size),
          width,
          height
        });
      }, options.format, quality);
    });
  }

  /**
   * ファイル名を生成
   * @param {string} originalName
   * @param {number} width
   * @param {number} height
   * @param {string} format
   * @returns {string}
   */
  function generateFilename(originalName, width, height, format) {
    const baseName = originalName.replace(/\.[^.]+$/, '');
    const extension = format.split('/')[1];
    return `${baseName}_${width}x${height}.${extension}`;
  }

  /**
   * Blob URLを解放
   * @param {string} url
   */
  function revokeURL(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  // Public API
  return {
    CONFIG,
    checkAVIFSupport,
    isAVIFSupported,
    formatFileSize,
    calculateAspectRatio,
    validateFile,
    loadImage,
    calculateNewSize,
    estimateOutputSize,
    convertImage,
    generateFilename,
    revokeURL
  };
})();
