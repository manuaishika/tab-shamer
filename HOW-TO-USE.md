# HOW TO USE TAB SHAMER 🚀

## Step 1: Install Dependencies
```bash
pnpm install
```
(You need to run this first!)

## Step 2: Create the Icon
1. Open `scripts/create-icon.html` in your browser (double-click it)
2. Click the "Download icon.png (128x128)" button
3. Move the downloaded file to `public/icon.png`

## Step 3: Build
```bash
pnpm build
```
Wait for it to finish - should say "built successfully"

## Step 4: Load in Chrome
1. Open Chrome
2. Go to `chrome://extensions/`
3. Turn ON "Developer mode" (top right toggle)
4. Click "Load unpacked" button
5. Navigate to this project folder
6. Select the `dist` folder
7. Click "Select Folder"

## Step 5: Test It!
- Open 20+ tabs
- You should see a notification!
- Click the extension icon to see the popup

---

**Troubleshooting:**
- No icon? Make sure `public/icon.png` exists
- Extension not loading? Make sure you selected the `dist` folder, not the project root
- No notifications? Open 20+ tabs, wait a few seconds
- Check Chrome extensions page for errors (red text)

