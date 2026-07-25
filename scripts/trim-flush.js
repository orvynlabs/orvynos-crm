const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function cropLosslessFlushLogo() {
  const inputPath = "C:\\Users\\muham\\.gemini\\antigravity-ide\\brain\\a11ecfed-4284-4f79-a857-5fca0ef52eda\\media__1784738498621.png";
  const outputPath = path.join(__dirname, "../public/brand/document-logo.png");

  const imageBuffer = fs.readFileSync(inputPath);
  const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const processedDataUrl = await page.evaluate(async (imgSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);

        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;

        let minX = tempCanvas.width;
        let minY = tempCanvas.height;
        let maxX = 0;
        let maxY = 0;

        // Find exact bounding box of logo mark & text without modifying pixel colors
        for (let y = 0; y < tempCanvas.height; y++) {
          for (let x = 0; x < tempCanvas.width; x++) {
            const idx = (y * tempCanvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // If non-white pixel (part of logo mark/text)
            if (r < 240 || g < 240 || b < 240) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const cropWidth = maxX - minX + 1;
        const cropHeight = maxY - minY + 1;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        const cropCtx = cropCanvas.getContext('2d');

        // Draw 100% pure original pixels tightly without left margin shift
        cropCtx.drawImage(
          img,
          minX, minY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );

        resolve(cropCanvas.toDataURL('image/png', 1.0));
      };
      img.src = imgSrc;
    });
  }, base64Image);

  await browser.close();

  const base64Data = processedDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
  console.log('Lossless tightly-cropped logo saved to:', outputPath);
}

cropLosslessFlushLogo().catch(console.error);
