# JournalOS — পুরো সাইট (Landing + Checkout + Payment + App)

GitHub-এ পুশ করলে Vercel নিজে ডিপ্লয় করবে। কোনো build step নেই।

```
/                       ← ল্যান্ডিং পেজ (লগইন ছাড়াই দেখা যায়)
├─ index.html           ল্যান্ডিং: ফিচার, কীভাবে কাজ করে, প্রাইসিং, রিভিউ, FAQ
├─ checkout/index.html  ধাপ ২: Google সাইন-ইন + নাম/ফোন
├─ payment/index.html   ধাপ ৩: bKash / Nagad + TrxID → ৫ সেকেন্ডে /app/
├─ app/                 ← আসল JournalOS (আগের index.html এখানে)
│   ├─ index.html
│   ├─ sw.js            Service worker (scope: /app/)
│   ├─ manifest.webmanifest   (start_url/scope: /app/)
│   └─ icon-*.png, apple-touch-icon.png
├─ assets/
│   ├─ site-config.js   ⭐ প্ল্যান, দাম, bKash/Nagad নম্বর — শুধু এই ফাইল এডিট করবে
│   ├─ site.css, site.js, logo.png, favicon-32.png
├─ sw.js                পুরনো ইনস্টল করা PWA-কে পরিষ্কার করার migration worker (মুছো না)
├─ firestore.rules      ⭐ Firebase-এ Publish করতে হবে
├─ vercel.json, robots.txt, sitemap.xml
```

## ডিপ্লয়ের আগে ৫টা কাজ

1. **পেমেন্ট নম্বর বসাও** — `assets/site-config.js`-এ দুই জায়গায় `01XXXXXXXXX` বদলাও।
2. **Firestore rules Publish করো** — Firebase Console → Firestore → Rules → `firestore.rules`-এর লেখা পেস্ট করে Publish।
   (না করলে অর্ডার সেভ হবে না। রিভিউ ও Payments ট্যাবও কাজ করবে না।)
3. **আইকন বদলাও** — `app/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`
   আমার বানানো অস্থায়ী (ছোট লোগো থেকে বড় করা)। তোমার আগের আসল আইকন ফাইলগুলো দিয়ে ওভাররাইট করো।
4. **ডোমেইন বসাও** — `robots.txt` ও `sitemap.xml`-এ `YOUR-DOMAIN.com` বদলাও।
5. **আগের রুটের ফাইল সরাও** — রিপোর পুরনো `index.html`, `sw.js`, `manifest.webmanifest`, আইকনগুলো মুছে এই ফোল্ডারের ফাইলগুলো রাখো।
   রুটের নতুন `sw.js` রেখে দাও — এটা পুরনো ইউজারদের ব্রাউজার থেকে আগের service worker সরিয়ে দেয়।

Firebase Auth → Settings → Authorized domains-এ তোমার ডোমেইন আগে থেকেই আছে; নতুন কিছু লাগবে না।

## কীভাবে চলে

1. ল্যান্ডিং → প্ল্যান বেছে `/checkout/?plan=…`
2. Checkout: Google সাইন-ইন (এখানেই লগইন হয়ে যায়) → নাম, ফোন → Gmail ও তথ্য `userDirectory/{uid}`-এ (ব্যাকএন্ডের Users ট্যাবে) চলে যায়।
3. Payment: bKash/Nagad নম্বরে Send Money → TrxID বসিয়ে সাবমিট → `orders/{id}` (status `pending`) তৈরি হয়।
4. ৫ সেকেন্ডে `/app/` — লগইন লাগে না (একই ডোমেইন, একই Firebase সেশন)। **Pending = পুরো Pro।**
5. তুমি ব্যাকএন্ড → **Payments** ট্যাবে TrxID মিলিয়ে **Verify** চাপলে ইউজার অ্যাপের ভেতরেই "ভেরিফাই হয়েছে" নোটিফিকেশন পায় এবং স্ট্যাটাস অ্যাক্টিভ হয়। **Reject** করলে অ্যাক্সেস বন্ধ।
   - একই TrxID দুইবার এলে ⚠ duplicate দেখায়।
   - Verify না/Reject না করলে pending অর্ডার ১৪ দিন পর আর কাজ করে না (`pendingMaxDays`)।
6. মেয়াদ শেষ হলে অ্যাপে "মেয়াদ শেষ" স্ক্রিন + রিনিউ বাটন। ডেটা মোছা হয় না। রিনিউ করলে নতুন মেয়াদ আগেরটার শেষ থেকে যোগ হয়।

## ব্যাকএন্ডে নতুন যা (শুধু অ্যাডমিন)

- **Payments** ট্যাব: সব অর্ডার, ফিল্টার, সার্চ (TrxID/ইমেইল/ফোন), Verify / Reject / Pending।
- **Reviews** ট্যাব: ল্যান্ডিং পেজের রিভিউ — ইউজার লিখলে এখানে আসে, তুমি Publish করলে ল্যান্ডিং-এ দেখায়।
- **App Config → Require Pro (paywall)**: বন্ধ করলে সবাই পেমেন্ট ছাড়া ঢুকতে পারে।
- **Users → ইউজার খুলে → Complimentary Pro**: নির্দিষ্ট ইউজারকে বিনামূল্যে Pro।

> ⚠ **পুরনো ইউজাররা:** paywall ডিফল্টে **চালু**। ডিপ্লয়ের পর যার প্ল্যান নেই সে লক স্ক্রিন দেখবে (অ্যাডমিন কখনো লক হয় না)।
> পুরনো ইউজারদের জন্য হয় Require Pro বন্ধ রাখো, নয়তো প্রত্যেককে Complimentary Pro দাও।

## প্ল্যান/দাম বদলানো

`assets/site-config.js`-এর `plans` অ্যারে — landing, checkout, payment তিন পেজই নিজে আপডেট হবে।
(Rules-এ অঙ্ক সর্বোচ্চ ৫০০০৳ ধরা আছে; এর বেশি দাম দিলে `firestore.rules`-এর `amount <= 5000` বদলাও।)

## জেনে রাখো

- Paywall ক্লায়েন্ট-সাইড: সাধারণ ইউজারের জন্য যথেষ্ট, কিন্তু কোনো টেক-সেভি ব্যক্তি কোড বদলে এড়াতে পারে। Rules নিশ্চিত করে কেউ নিজের অর্ডার নিজে "verified" করতে পারে না, কিন্তু ডেটা অ্যাক্সেস পুরোপুরি লক করতে চাইলে পরে Cloud Function লাগবে।
- পেমেন্ট ম্যানুয়াল (TrxID) — অটো-ভেরিফিকেশন নেই, তাই নিয়মিত Payments ট্যাব দেখো।
- ল্যান্ডিং-এর Year-in-Pixels ছবিটা নমুনা ডেটা (পেজে "নমুনা ডেটা" লেখা আছে)। রিভিউ শুধু আসল ইউজারের — কোনো বানানো রিভিউ নেই।
- ফন্ট/Firebase SDK CDN থেকে লোড হয়; অফলাইনে শুধু /app/ (service worker দিয়ে) চলবে।

## Round 6 — Header (admin-controllable)
Backend → App Config → **Header**: toggle the + button, "Add Mood", search, theme menu, day-streak chip and "Download the app"; choose hover/click menus; pick the 4 theme-menu colours. Changes apply live (stored in `appConfig/global.header`).
