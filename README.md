# Twitch Clip & VOD Downloader

Download public Twitch clips and stream recordings (VODs) through the bundled yt-dlp integration. Twitch API requests are proxied via the **Twitch** addon (`depends_on: ["twitch"]`).

- **Addon id:** `XXanderWP/streamkit-twitch-clip-downloader`
- **Type:** `application`
- **Minimum StreamKit+:** `1.0.19`
- **Requires:** Twitch addon installed and authorized

## Features

- Browse and download clips for your channel or any public channel by login
- Browse and download public VODs (archived broadcasts)
- Preview clips and VODs in an embedded Twitch player (click thumbnail or title)
- Sort loaded clips by date or view count (ascending / descending)
- Download by direct Twitch clip / VOD URL
- Configurable download folder and yt-dlp filename template in addon settings
- Download progress in the application window and completion notifications

## Development

1. Install and enable the **Twitch** addon in StreamKit+ and sign in.
2. Run `npm install && npm run build`.
3. Install the `dist/` folder via **Settings → Addons**.
4. Approve `WEB_CONTENT`, `WEB_END_POINTS`, `NETWORK_REQUEST`, `FILE_ACCESS`, and `NOTIFY`.
5. Set the download folder in addon settings, then open **Applications** in the main window.

## Build

```bash
npm install
npm run build
```

Install the `dist/` folder in StreamKit+ (contains `manifest.json`, worker, and assets).

## Release

Push to the `main` branch or run the **Release addon** GitHub Action manually.
Each push reads `version` from `manifest.json` and creates a GitHub Release when `v{version}` does not exist yet.
Then uploads `main.zip`, `manifest.json`, and the icon.

Docs: [StreamKit+ addon developer docs](https://rocketman-streamkit.github.io/types/)
