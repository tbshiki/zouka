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
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/jpg'],
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
   * MIMEタイプを正規化
   * @param {string} type
   * @returns {string}
   */
  function normalizeMimeType(type) {
    return typeof type === 'string' ? type.toLowerCase().trim() : '';
  }

  /**
   * 拡張子からMIMEタイプを推定
   * @param {string} filename
   * @returns {string}
   */
  function inferMimeTypeFromFilename(filename) {
    if (!filename) return '';
    const match = filename.toLowerCase().match(/\.([^.]+)$/);
    if (!match) return '';
    const ext = match[1];
    const map = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      avif: 'image/avif'
    };
    return map[ext] || '';
  }

  /**
   * ファイルのMIMEタイプを解決
   * @param {File} file
   * @returns {string}
   */
  function resolveMimeType(file) {
    const normalized = normalizeMimeType(file?.type);
    if (normalized && normalized !== 'application/octet-stream') {
      return normalized;
    }
    return inferMimeTypeFromFilename(file?.name);
  }

  /**
   * GIFがアニメーションかどうかを判定
   * @param {Uint8Array} bytes
   * @returns {boolean}
   */
  function isAnimatedGif(bytes) {
    if (!bytes || bytes.length < 14) return false;
    const header = String.fromCharCode(...bytes.slice(0, 6));
    if (header !== 'GIF87a' && header !== 'GIF89a') return false;

    const packed = bytes[10];
    const hasGct = (packed & 0x80) !== 0;
    const gctSize = hasGct ? 3 * (1 << ((packed & 0x07) + 1)) : 0;

    let i = 13 + gctSize;
    let frames = 0;

    while (i < bytes.length) {
      const blockId = bytes[i];

      if (blockId === 0x3B) {
        break; // Trailer
      }

      if (blockId === 0x2C) {
        // Image Descriptor
        if (i + 9 >= bytes.length) break;
        const localPacked = bytes[i + 9];
        const hasLct = (localPacked & 0x80) !== 0;
        const lctSize = hasLct ? 3 * (1 << ((localPacked & 0x07) + 1)) : 0;

        frames += 1;
        if (frames > 1) return true;

        i += 10; // move past image descriptor
        i += lctSize;
        if (i >= bytes.length) break;

        // LZW min code size
        i += 1;

        // Image data sub-blocks
        while (i < bytes.length) {
          const blockSize = bytes[i];
          i += 1;
          if (blockSize === 0) break;
          i += blockSize;
        }
        continue;
      }

      if (blockId === 0x21) {
        // Extension block
        i += 2; // skip 0x21 and label
        while (i < bytes.length) {
          const blockSize = bytes[i];
          i += 1;
          if (blockSize === 0) break;
          i += blockSize;
        }
        continue;
      }

      i += 1;
    }

    return false;
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

    const resolvedType = resolveMimeType(file);
    if (!CONFIG.SUPPORTED_FORMATS.includes(resolvedType)) {
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

    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (error) {
      // imageOrientation未対応ブラウザ向けのフォールバック
      bitmap = await createImageBitmap(file);
    }
    const mimeType = resolveMimeType(file);

    let isAnimated = false;
    if (mimeType === 'image/gif') {
      try {
        const buffer = await file.arrayBuffer();
        isAnimated = isAnimatedGif(new Uint8Array(buffer));
      } catch (error) {
        isAnimated = false;
      }
    }

    const info = {
      filename: file.name,
      width: bitmap.width,
      height: bitmap.height,
      aspectRatio: calculateAspectRatio(bitmap.width, bitmap.height),
      fileSize: file.size,
      formattedSize: formatFileSize(file.size),
      mimeType: mimeType || file.type,
      isAnimatedGif: isAnimated
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

    const shouldPreserveRatio = options.mode === 'long-edge' ||
      options.mode === 'preset' ||
      (options.mode === 'custom' && options.lockRatio);

    if (shouldPreserveRatio) {
      const maxDim = Math.max(newWidth, newHeight);
      if (maxDim > CONFIG.MAX_DIMENSION) {
        const scale = CONFIG.MAX_DIMENSION / maxDim;
        newWidth = Math.max(1, Math.round(newWidth * scale));
        newHeight = Math.max(1, Math.round(newHeight * scale));
      }
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
  function estimateOutputSize(width, height, format, quality, originalInfo = null) {
    const totalPixels = width * height;
    // 非圧縮: RGBA = 4 bytes/pixel
    const rawSize = totalPixels * 4;

    // 圧縮後サイズの推定（非常に概算、実際の結果は大きく異なる場合があります）
    let estimatedCompressed;
    const normalizedQuality = typeof quality === 'number' ? Math.min(Math.max(quality, 0.3), 1) : 0.85;

    if (originalInfo && originalInfo.fileSize && originalInfo.width && originalInfo.height) {
      const originalPixels = originalInfo.width * originalInfo.height;
      const pixelRatio = originalPixels > 0 ? totalPixels / originalPixels : 1;
      const baseSize = originalInfo.fileSize * pixelRatio;

      let formatMultiplier = 1;
      switch (format) {
        case 'image/jpeg':
          formatMultiplier = 1.0;
          break;
        case 'image/webp':
          formatMultiplier = 0.9;
          break;
        case 'image/avif':
          formatMultiplier = 1.15;
          break;
        case 'image/png':
          formatMultiplier = 1.3;
          break;
        default:
          formatMultiplier = 1.0;
      }

      let qualityMultiplier = 0.15 + normalizedQuality; // 0.45〜1.15
      if (format === 'image/png') {
        qualityMultiplier = 1;
      }

      // PNG入力を不可逆に変換する場合はやや大きめに見る
      const originalFormat = originalInfo.mimeType;
      if (originalFormat === 'image/png' && format !== 'image/png') {
        formatMultiplier *= format === 'image/avif' ? 1.35 : 1.2;
      } else if (originalFormat === 'image/jpeg' && format === 'image/avif') {
        formatMultiplier *= 1.25;
      }

      estimatedCompressed = Math.max(1024, Math.round(baseSize * formatMultiplier * qualityMultiplier));
    } else {
      let compressionRatio;
      switch (format) {
        case 'image/jpeg':
          compressionRatio = 0.1 + normalizedQuality * 0.3; // 10-40%
          break;
        case 'image/png':
          compressionRatio = 0.3; // 約30%（可逆圧縮）
          break;
        case 'image/webp':
          compressionRatio = 0.08 + normalizedQuality * 0.22; // 8-30%
          break;
        case 'image/avif':
          // AVIFはブラウザ実装により結果が大きく異なる
          // 推定値はやや大きめにする
          compressionRatio = 0.07 + normalizedQuality * 0.25; // 7-32%
          break;
        default:
          compressionRatio = 0.2;
      }
      estimatedCompressed = Math.round(rawSize * compressionRatio);
    }

    return {
      dimensions: `${width} × ${height}`,
      totalPixels: totalPixels.toLocaleString(),
      rawSize: formatFileSize(rawSize),
      rawSizeBytes: rawSize,
      estimatedCompressed: formatFileSize(estimatedCompressed),
      estimatedCompressedBytes: estimatedCompressed
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

    // Blob生成（サイズ最適化付き）
    const result = await generateOptimizedBlob(canvas, options, width, height);

    return result;
  }

  /**
   * Blobを生成（品質はユーザー設定を尊重）
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   * @param {number} width
   * @param {number} height
   * @returns {Promise<Object>}
   */
  async function generateOptimizedBlob(canvas, options, width, height) {
    const targetFormat = options.format;

    // PNG は品質指定不可（可逆圧縮）
    if (targetFormat === 'image/png') {
      return generateBlob(canvas, targetFormat, undefined, width, height);
    }

    return generateBlob(canvas, targetFormat, options.quality, width, height);
  }

  /**
   * Blobを生成
   * @param {HTMLCanvasElement} canvas
   * @param {string} format
   * @param {number|undefined} quality
   * @param {number} width
   * @param {number} height
   * @returns {Promise<Object>}
   */
  function generateBlob(canvas, format, quality, width, height) {
    return new Promise((resolve, reject) => {
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
      }, format, quality);
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
