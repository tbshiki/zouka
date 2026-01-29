/**
 * Cloudflare Pages Functions Middleware
 * CSP nonce を動的に生成してレスポンスに挿入
 */

/**
 * ランダムな nonce を生成
 * @returns {string}
 */
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Middleware: すべてのリクエストを処理
 */
export async function onRequest(context) {
  const request = context.request;
  const host = request.headers.get('host');
  const hostname = host ? host.split(':')[0].toLowerCase() : '';

  if (hostname === 'zouka.pages.dev') {
    const url = new URL(request.url);
    url.hostname = 'zouka.taptoclicks.com';
    return Response.redirect(url.toString(), 308);
  }

  const response = await context.next();

  // HTML レスポンスのみ処理
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // nonce を生成
  const nonce = generateNonce();

  // HTML 本文を取得して nonce を置換
  let html = await response.text();
  html = html.replace(/__CSP_NONCE__/g, nonce);

  // 新しいヘッダーを作成
  const newHeaders = new Headers(response.headers);

  // CSP ヘッダーの nonce を置換
  const csp = newHeaders.get('Content-Security-Policy');
  if (csp) {
    newHeaders.set('Content-Security-Policy', csp.replace(/__CSP_NONCE__/g, nonce));
  }

  // 新しいレスポンスを返す
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
