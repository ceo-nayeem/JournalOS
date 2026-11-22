# CHANGES (vs uploaded files)
Only these were edited:
1. app/index.html - additive "UX polish v1": focus rings (2px accent), press feedback, 44px touch targets and 16px inputs on touch devices, tabular numbers, Bangla-safe editor line-height/letter-spacing, long-word wrapping, overscroll containment, global reduced-motion fallback, aria-label from title on icon buttons, aria-live on toast region. app-build bumped to 2026-11-22.1.
2. app/sw.js - VERSION 1.7.0 -> 1.7.1 so installed apps pick up the update.
Renamed from uploads: index_1.html->admin/index.html, index_96bae8.html->app/index.html, sw_1.js->app/sw.js, index_ca52f4.html->checkout/index.html, index_0ad5a6.html->payment/index.html, firestore_rules_1.txt->firestore.rules.
Left out: tmp, tmp_1, tmp_b9e295 (2-byte junk) and firestore_rules.txt (another app's rules).
NOT changed (awaiting decision): gmial.com admin typo (firestore.rules, admin/core.js, app/index.html x2), missing admins rule, admin read access to user journals, placeholders 01XXXXXXXXX and YOUR-DOMAIN.com.
