# Quick Start Guide

## First Time Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

2. **Create the icon:**
   - Open `scripts/create-icon.html` in your browser
   - Click "Download icon.png (128x128)"
   - Move the downloaded file to `public/icon.png`

3. **Build the extension:**
   ```bash
   pnpm build
   ```

4. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

5. **Test it:**
   - Open a bunch of tabs (more than 20)
   - You should see a notification!
   - Click the extension icon to see the popup
   - Right-click the extension icon → "Options" to see settings

## Development

While developing, use:
```bash
pnpm dev
```

This watches for changes and rebuilds automatically. After changes, reload the extension in Chrome (click the reload icon on `chrome://extensions/`).

## Notes

- TypeScript linter errors about `chrome` not being found are normal and won't affect the build
- The extension never closes tabs automatically - all actions require your confirmation
- Tab age tracking starts when you install the extension (tabs open before install are marked from install time)

