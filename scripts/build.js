/**
 * Build script for Cloudflare Pages.
 * Copies only required assets into dist/.
 * CSP nonce replacement is handled at runtime by middleware unless opted in.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CSP_NONCE_MODE = process.env.CSP_NONCE_MODE || 'dynamic';

const FILES_TO_COPY = [
  'manifest.json',
  'logo.png',
  '_headers',
  'robots.txt',
  'sitemap.xml'
];

const HASHED_ASSETS = [
  'style.css',
  'main.js',
  'ui.js',
  'image-processor.js',
  'i18n.js'
];

const LOCALES_DIR = 'locales';

function ensureCleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(srcPath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath);
    }
  }
}

function hashContent(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 8);
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function copyHashedFile(srcRelPath) {
  const srcPath = path.join(ROOT_DIR, srcRelPath);
  const data = fs.readFileSync(srcPath);
  const hash = hashContent(data);
  const parsed = path.parse(srcRelPath);
  const hashedName = `${parsed.name}.${hash}${parsed.ext}`;
  const destRelPath = toPosixPath(path.join(parsed.dir || '', hashedName));
  const destPath = path.join(DIST_DIR, destRelPath);
  copyFile(srcPath, destPath);
  return { original: toPosixPath(srcRelPath), hashed: destRelPath };
}

function buildAssetManifest() {
  const assetManifest = {
    assets: {},
    locales: {}
  };

  for (const asset of HASHED_ASSETS) {
    const mapping = copyHashedFile(asset);
    assetManifest.assets[mapping.original] = mapping.hashed;
  }

  const localesPath = path.join(ROOT_DIR, LOCALES_DIR);
  if (fs.existsSync(localesPath)) {
    const localeFiles = fs.readdirSync(localesPath).filter(file => file.endsWith('.json'));
    for (const file of localeFiles) {
      const relPath = path.join(LOCALES_DIR, file);
      const mapping = copyHashedFile(relPath);
      assetManifest.assets[mapping.original] = mapping.hashed;
      const lang = path.basename(file, '.json');
      assetManifest.locales[lang] = mapping.hashed;
    }
  }

  return assetManifest;
}

function buildAnalyticsSnippet(gaId, clarityId) {
  const snippets = [];

  if (gaId) {
    snippets.push(
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>`
    );
    snippets.push(
      `<script nonce="__CSP_NONCE__">` +
        `window.dataLayer=window.dataLayer||[];` +
        `function gtag(){dataLayer.push(arguments);}` +
        `gtag('js', new Date());` +
        `gtag('config','${gaId}',{'anonymize_ip':true});` +
      `</script>`
    );
  }

  if (clarityId) {
    snippets.push(
      `<script nonce="__CSP_NONCE__">` +
        `(function(c,l,a,r,i,t,y){` +
          `c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};` +
          `t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;` +
          `y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);` +
        `})(window,document,"clarity","script","${clarityId}");` +
      `</script>`
    );
  }

  if (snippets.length === 0) {
    return '';
  }

  return `\n    <!-- Analytics injected at build time -->\n    ${snippets.join('\n    ')}\n`;
}

function buildAssetManifestSnippet(assetManifest) {
  if (!assetManifest) {
    return '';
  }
  const safeJson = JSON.stringify(assetManifest).replace(/</g, '\\u003c');
  return `\n    <script nonce="__CSP_NONCE__">window.__ASSET_MANIFEST__=${safeJson};</script>\n`;
}

function applyAssetMappings(html, assetManifest) {
  if (!assetManifest || !assetManifest.assets) {
    return html;
  }
  let result = html;
  Object.entries(assetManifest.assets).forEach(([original, hashed]) => {
    if (original && hashed) {
      result = result.split(original).join(hashed);
    }
  });
  return result;
}

function buildIndexHtml(assetManifest) {
  const srcPath = path.join(ROOT_DIR, 'index.html');
  const destPath = path.join(DIST_DIR, 'index.html');
  const gaId = (process.env.GA_ID || process.env.GA_MEASUREMENT_ID || '').trim();
  const clarityId = (process.env.CLARITY_ID || '').trim();
  let html = fs.readFileSync(srcPath, 'utf-8');

  html = applyAssetMappings(html, assetManifest);

  const assetManifestSnippet = buildAssetManifestSnippet(assetManifest);
  const analyticsSnippet = buildAnalyticsSnippet(gaId, clarityId);
  const combinedSnippets = `${assetManifestSnippet}${analyticsSnippet}`;
  if (combinedSnippets) {
    if (!html.includes('</head>')) {
      throw new Error('index.html is missing </head> for injection.');
    }
    html = html.replace('</head>', `${combinedSnippets}</head>`);
  }
  if (analyticsSnippet) {
    console.log('📈 Analytics injected (GA/Clarity).');
  } else {
    console.log('📈 Analytics not configured (GA_ID/CLARITY_ID not set).');
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, html, 'utf-8');
}

function runCspNonceReplacement() {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, 'replace-csp-nonce.js')],
    {
      stdio: 'inherit',
      env: { ...process.env, OUTPUT_DIR: DIST_DIR }
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function validateNoncePlaceholders() {
  const targets = [
    path.join(DIST_DIR, 'index.html'),
    path.join(DIST_DIR, '_headers')
  ];
  for (const target of targets) {
    if (!fs.existsSync(target)) {
      continue;
    }
    const content = fs.readFileSync(target, 'utf-8');
    if (!content.includes('__CSP_NONCE__')) {
      console.warn(`⚠️  CSP nonce placeholder missing: ${target}`);
    }
  }
}

function main() {
  console.log('📦 Build started');
  ensureCleanDir(DIST_DIR);

  const assetManifest = buildAssetManifest();
  buildIndexHtml(assetManifest);

  for (const file of FILES_TO_COPY) {
    const src = path.join(ROOT_DIR, file);
    const dest = path.join(DIST_DIR, file);
    copyFile(src, dest);
  }

  if (CSP_NONCE_MODE === 'static') {
    runCspNonceReplacement();
  } else {
    console.log('🔐 CSP nonce replacement skipped (dynamic middleware mode).');
  }
  validateNoncePlaceholders();
  console.log('✅ Build completed');
}

main();
