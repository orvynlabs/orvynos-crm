const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function processNewPhoto() {
  const inputPath = "C:\\Users\\muham\\.gemini\\antigravity-ide\\brain\\a11ecfed-4284-4f79-a857-5fca0ef52eda\\media__1784741285657.png";
  const outputPath = path.join(__dirname, "../public/brand/document-logo.png");

  const imageBuffer = fs.readFileSync(inputPath);
  const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const processedDataUrl = await page.evaluate(async (imgSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = img.width;
        srcCanvas.height = img.height;
        const srcCtx = srcCanvas.getContext('2d');
        srcCtx.drawImage(img, 0, 0);

        const imgData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
        const data = imgData.data;

        // Check if image is already a clean transparent PNG or if background is present
        let hasTransparency = false;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 200) {
            hasTransparency = true;
            break;
          }
        }

        let minX = srcCanvas.width;
        let minY = srcCanvas.height;
        let maxX = 0;
        let maxY = 0;

        // Extract logo mark & text pixels
        for (let y = 0; y < srcCanvas.height; y++) {
          for (let x = 0; x < srcCanvas.width; x++) {
            const idx = (y * srcCanvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Check if logo pixel (vibrant purple/blue: b > 100 or (r > 60 && b > 120))
            const isLogoPixel = (b > 100 && (b - g > 30 || r > 50)) && (a > 30);

            if (isLogoPixel) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            } else if (!hasTransparency) {
              // If background checkerboard/solid was saved in image, make transparent
              data[idx + 3] = 0;
            }
          }
        }

        // If background was solid/checkerboard, write modified data back
        if (!hasTransparency) {
          srcCtx.putImageData(imgData, 0, 0);
        }

        // Crop tightly around minX, minY, maxX, maxY
        if (minX < maxX && minY < maxY) {
          const cropWidth = maxX - minX + 1;
          const cropHeight = maxY - minY + 1;

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropWidth;
          cropCanvas.height = cropHeight;
          const cropCtx = cropCanvas.getContext('2d');

          cropCtx.drawImage(
            srcCanvas,
            minX, minY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
          );

          resolve(cropCanvas.toDataURL('image/png'));
        } else {
          resolve(srcCanvas.toDataURL('image/png'));
        }
      };
      img.src = imgSrc;
    });
  }, base64Image);

  await browser.close();

  const base64Data = processedDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
  console.log('New photo processed and saved to:', outputPath);
}

processNewPhoto().catch(console.error);
