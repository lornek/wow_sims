# GitHub Pages analytics

The Pages workflow sets `GOOGLE_TAG_MANAGER_ID=GTM-WXMF34CV`. After building the site, `build.cjs` adds the standard Google Tag Manager head loader and noscript fallback to generated HTML, including standalone icon galleries. Redirect-only class routes are skipped to avoid duplicate page views. Rebuilds replace existing tags rather than duplicating them. Ordinary local and Sites builds omit tracking unless the variable is explicitly supplied.

This installs the GTM container, not a GA4 property. In Google Tag Manager, configure a Google tag using the GA4 web stream's Measurement ID (`G-...`), fire it on all pages, and Submit/Publish the container. Confirm collection in Google Analytics Realtime and with Tag Manager Preview/Tag Assistant. For in-page class/spec navigation, GA4 Enhanced Measurement can track browser-history page changes; avoid adding a second manual history page-view tag on top of that.

Local verification intercepted the external GTM request and verified the correct container URL and dataLayer initialization on the main menu, Healbot, and the icon galleries. This did not verify the published container contents or actual reporting in Google Analytics.
