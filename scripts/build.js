/**
 * Build script for Cloudflare Pages.
 * Copies only required assets into dist/ and replaces CSP nonce.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const FILES_TO_COPY = [
  'index.html',
  'style.css',
  'main.js',
  'ui.js',
  'image-processor.js',
  'i18n.js',
  'manifest.json',
  'logo.png',
  '_headers',
  'robots.txt',
  'sitemap.xml'
];

const DIRS_TO_COPY = [
  'locales'
];

function ensureCleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(srcPath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

function copyFileIfExists(srcPath, destPath, label) {
  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  Missing ${label}: ${srcPath}`);
    return;
  }
  copyFile(srcPath, destPath);
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

function copyDirIfExists(srcDir, destDir, label) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`⚠️  Missing ${label}: ${srcDir}`);
    return;
  }
  copyDir(srcDir, destDir);
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

function injectAnalytics() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return;
  }

  const gaId = process.env.GA_ID || process.env.GA_MEASUREMENT_ID || '';
  const clarityId = process.env.CLARITY_ID || '';

  let content = fs.readFileSync(indexPath, 'utf-8');

  const gaSnippet = gaId
    ? [
        '<script async src="https://www.googletagmanager.com/gtag/js?id=' + gaId + '"></script>',
        '<script nonce="__CSP_NONCE__">',
        '  window.dataLayer = window.dataLayer || [];',
        '  function gtag(){dataLayer.push(arguments);}',
        '  gtag(\'js\', new Date());',
        '  gtag(\'config\', \'' + gaId + '\');',
        '</script>'
      ].join('\n')
    : '';

  const claritySnippet = clarityId
    ? [
        '<script nonce="__CSP_NONCE__">',
        '  (function(c,l,a,r,i,t,y){',
        '    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};',
        '    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;',
        '    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);',
        '  })(window, document, "clarity", "script", "' + clarityId + '");',
        '</script>'
      ].join('\n')
    : '';

  content = content
    .replace('<!-- ANALYTICS:GA -->', gaSnippet)
    .replace('<!-- ANALYTICS:CLARITY -->', claritySnippet);

  fs.writeFileSync(indexPath, content);

  if (!gaId) {
    console.warn('⚠️  GA_ID is not set; GA snippet was not injected.');
  }
  if (!clarityId) {
    console.warn('⚠️  CLARITY_ID is not set; Clarity snippet was not injected.');
  }
}

function main() {
  console.log('📦 Build started');
  ensureCleanDir(DIST_DIR);

  for (const file of FILES_TO_COPY) {
    const src = path.join(ROOT_DIR, file);
    const dest = path.join(DIST_DIR, file);
    copyFileIfExists(src, dest, file);
  }

  for (const dir of DIRS_TO_COPY) {
    const src = path.join(ROOT_DIR, dir);
    const dest = path.join(DIST_DIR, dir);
    copyDirIfExists(src, dest, dir);
  }

  injectAnalytics();
  validateNoncePlaceholders();
  console.log('✅ Build completed');
}

main();
