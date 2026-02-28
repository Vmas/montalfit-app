const _jimp = require('jimp');
const Jimp = _jimp.Jimp || _jimp.default || _jimp;
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const src = path.join(__dirname, '..', 'src', 'assets', 'logomontalfit.png');
    const out = path.join(__dirname, '..', 'assets');
    const playstore = path.join(out, 'playstore');
    if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
    if (!fs.existsSync(playstore)) fs.mkdirSync(playstore, { recursive: true });

    const image = await Jimp.read(src);

    // Keep a copy of the original high-res icon
    const origCopy = path.join(out, 'icon-1024.png');
    // helper to promisify .write
    const writeAsync = (img, filePath) => new Promise((resolve, reject) => {
      img.write(filePath, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await writeAsync(image.clone(), origCopy);
    console.log('Wrote', origCopy);

    const jobs = [
      { file: path.join(out, 'icon.png'), w: 512, h: 512 },
      { file: path.join(out, 'icon-512.png'), w: 512, h: 512 },
      { file: path.join(out, 'icon-192.png'), w: 192, h: 192 },
      { file: path.join(out, 'adaptive-icon-foreground.png'), w: 432, h: 432, transparent: true },
      { file: path.join(playstore, 'featureGraphic.png'), w: 1024, h: 500, bg: '#ffffff' }
    ];

    for (const job of jobs) {
      const img = image.clone();
      // Use resize(options) per new jimp API
      img.resize({ w: job.w, h: job.h, mode: Jimp.RESIZE_BICUBIC });

      if (job.transparent) {
        await writeAsync(img, job.file);
      } else if (job.bg) {
        const bg = new Jimp(job.w, job.h, job.bg);
        bg.composite(img, 0, 0);
        await writeAsync(bg, job.file);
      } else {
        await writeAsync(img, job.file);
      }
      console.log('Wrote', job.file);
    }

    console.log('All icons generated.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
