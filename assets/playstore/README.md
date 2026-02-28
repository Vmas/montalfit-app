Play Store assets and screenshots

This folder contains placeholder assets and guidelines for the Google Play listing.

Files included:
- `screenshots/` : placeholder SVG screenshots (1080x1920 recommended) named `screenshot-1.svg` .. `screenshot-4.svg`.
- `featureGraphic.svg` : placeholder feature graphic (1024x500 recommended).
- `playstore-metadata.txt` : suggested store listing texts (title, short & full descriptions, keywords).

Conversion to PNG/JPG (recommended before uploading):
- Install ImageMagick (https://imagemagick.org) or use any image editor.
- Convert SVG to PNG (lossless) with: `magick convert screenshot-1.svg -resize 1080x1920 screenshot-1.png`
- Or bulk convert in the `assets/playstore/screenshots` folder:
  ```bash
  for f in *.svg; do magick convert "$f" "${f%.svg}.png"; done
  ```

Play Store recommended sizes:
- Phone screenshots: 1080 x 1920 (portrait) or 1920 x 1080 (landscape). Provide at least 2 portrait screenshots; 4-8 recommended.
- Feature Graphic: 1024 x 500 (PNG or JPEG)
- High-res icon: 512 x 512
- Promo graphic (optional): 180 x 120

Replace the placeholder SVGs with real screenshots taken from your device or an emulator, then convert to PNG before uploading.
