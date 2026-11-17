const fs = require('node:fs');
const path = require('node:path');
const headMarker = /<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->\n?/g;
const bodyMarker = /<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->\n?/g;
function installGoogleTagManager(directory, id = '') {
  if (id && !/^GTM-[A-Z0-9]+$/.test(id)) throw new Error('Invalid Google Tag Manager container ID');
  const head = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>
<!-- End Google Tag Manager -->`;
  const body = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) installGoogleTagManager(file, id);
    else if (entry.isFile() && /\.html$/i.test(entry.name)) {
      let html = fs.readFileSync(file, 'utf8').replace(headMarker, '').replace(bodyMarker, '');
      // Redirect-only routes should not produce an additional page view.
      if (id && !/<meta[^>]+http-equiv=["']refresh["']/i.test(html)) {
        html = html.replace(/<head(?:\s[^>]*)?>/i, tag => tag + '\n' + head)
          .replace(/<body(?:\s[^>]*)?>/i, tag => tag + '\n' + body);
      }
      fs.writeFileSync(file, html);
    }
  }
}
module.exports = {installGoogleTagManager};
