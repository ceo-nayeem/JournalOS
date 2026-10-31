/* ==================================================================
   JournalOS — SITE CONFIG  (the ONE file you edit for plans & payments)
   Used by the landing page, /checkout/ and /payment/.
   ------------------------------------------------------------------
   • Change prices / add a plan here — all three pages update together.
   • Put your real bKash / Nagad numbers below (search for 01XXXXXXXXX).
   • Prices are in BDT (৳).
   ================================================================== */
window.JOURNALOS_SITE = {
  name: 'JournalOS',
  tagline: 'Write First. Everything Else Second.',
  appUrl: '/app/',
  currency: '৳',

  plans: [
    { id: 'monthly',   label: 'মাসিক',     labelEn: 'Monthly',  months: 1,  price: 149 },
    { id: 'quarterly', label: '৩ মাস',     labelEn: '3 months', months: 3,  price: 349 },
    { id: 'halfyear',  label: '৬ মাস',     labelEn: '6 months', months: 6,  price: 599 },
    { id: 'yearly',    label: '১২ মাস',    labelEn: '12 months', months: 12, price: 999, best: true }
  ],

  payment: {
    bkash: { name: 'bKash', number: '01XXXXXXXXX', kind: 'Personal — Send Money', color: '#E2136E' },
    nagad: { name: 'Nagad', number: '01XXXXXXXXX', kind: 'Personal — Send Money', color: '#F6921E' }
  },

  support: { email: 'ceo.nayeemuhammad@gmail.com' },

  /* A "pending" order gives full Pro access until you verify it. If you never
     verify/reject it, access stops after this many days. */
  pendingMaxDays: 14,

  /* Public Firebase web config (same project as the app — safe to be public). */
  firebase: {
    apiKey: "AIzaSyAFiBNpsVidZGSOdHujKpdQYHjvXIuFf4o",
    authDomain: "journalos-v1.firebaseapp.com",
    projectId: "journalos-v1",
    storageBucket: "journalos-v1.firebasestorage.app",
    messagingSenderId: "760962674361",
    appId: "1:760962674361:web:31f075aa7ec84807eb3568",
    measurementId: "G-QKNTSGXX9F"
  }
};
