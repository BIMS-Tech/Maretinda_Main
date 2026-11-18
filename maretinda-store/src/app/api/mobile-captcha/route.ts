/**
 * The "verify you are human" check for the mobile app's sign-up. The app shows
 * this page in a WebView: Turnstile only runs on the hostnames its site key
 * allows, and this storefront's domain is one of them. The page posts the
 * token (or "off" when no site key is set) back to the app.
 */
export const dynamic = 'force-dynamic';

export function GET() {
	const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
	const key = JSON.stringify(siteKey).replace(/</g, '\\u003c');
	const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<style>html,body{margin:0;padding:0;background:transparent;display:flex;justify-content:center}</style>
</head>
<body>
<div id="check"></div>
<script>
  function send(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  var KEY = ${key};
  window.startCheck = function () {
    turnstile.render('#check', {
      sitekey: KEY,
      callback: function (token) { send({ type: 'token', token: token }); },
      'expired-callback': function () { send({ type: 'expired' }); },
      'error-callback': function () { send({ type: 'error' }); }
    });
  };
  if (!KEY) send({ type: 'off' });
</script>
${siteKey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=startCheck" async defer></script>' : ''}
</body>
</html>`;
	return new Response(html, {
		headers: {
			'cache-control': 'no-store',
			'content-type': 'text/html; charset=utf-8',
			'x-robots-tag': 'noindex',
		},
	});
}
