# My StreamKit Addon

Integration addon for StreamKit+.

- **Addon id:** `MyOrg/my-stream-addon`
- **Type:** `application`
- **Minimum StreamKit+:** `1.0.19`

## Development

1. Open **Settings** in StreamKit+ and install this folder.
2. Approve the requested permissions.
3. Enable the addon and configure settings.


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
