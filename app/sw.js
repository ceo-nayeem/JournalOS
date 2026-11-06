{
  "id": "/app/",
  "name": "JournalOS",
  "short_name": "JournalOS",
  "description": "A private, AI-assisted journal. Write first; it remembers, organizes and reflects.",
  "start_url": "/app/",
  "scope": "/app/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#FBF7EF",
  "theme_color": "#0F6F6B",
  "lang": "bn",
  "icons": [
    { "src": "/app/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/app/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/app/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "নতুন জার্নাল", "short_name": "Write", "url": "/app/?action=write", "icons": [{ "src": "/app/icon-192.png", "sizes": "192x192" }] },
    { "name": "Mood লগ", "short_name": "Mood", "url": "/app/?action=mood", "icons": [{ "src": "/app/icon-192.png", "sizes": "192x192" }] },
    { "name": "লাইব্রেরি", "short_name": "Library", "url": "/app/?action=library", "icons": [{ "src": "/app/icon-192.png", "sizes": "192x192" }] },
    { "name": "Insights", "short_name": "Insights", "url": "/app/?action=insights", "icons": [{ "src": "/app/icon-192.png", "sizes": "192x192" }] }
  ]
}
