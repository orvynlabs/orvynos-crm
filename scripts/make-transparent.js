const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function convertToTransparent() {
  const sourcePath = "C:\\Users\\Techon\\.gemini\\antigravity-ide\\brain\\0084bb93-7793-43d3-b987-dad8b95c0810\\media__1784281744452.png";
  const outputPng = path.join(__dirname, "..", "src", "app", "icon.png");
  const outputApple = path.join(__dirname, "..", "src", "app", "apple-icon.png");
  const outputSvg = path.join(__dirname, "..", "src", "app", "icon.svg");

  console.log("Reading source image...");
  
  // 1. First trim the white border and read the image
  const trimmedBuffer = await sharp(sourcePath)
    .trim({ background: "white", threshold: 10 })
    .png()
    .toBuffer();

  // 2. Load the trimmed image and get raw pixel data to remove white background
  const image = sharp(trimmedBuffer);
  const metadata = await image.metadata();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Create a new buffer with alpha channel
  const outBuffer = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0; i < info.width * info.height; i++) {
    const rIdx = i * info.channels;
    const gIdx = rIdx + 1;
    const bIdx = rIdx + 2;
    const aIdx = info.channels === 4 ? rIdx + 3 : -1;

    const r = data[rIdx];
    const g = data[gIdx];
    const b = data[bIdx];
    const a = aIdx !== -1 ? data[aIdx] : 255;

    const outIdx = i * 4;
    outBuffer[outIdx] = r;
    outBuffer[outIdx + 1] = g;
    outBuffer[outIdx + 2] = b;

    // If pixel is white/very light grey, make it fully transparent
    if (r > 240 && g > 240 && b > 240) {
      outBuffer[outIdx + 3] = 0;
    } else {
      outBuffer[outIdx + 3] = a;
    }
  }

  // 3. Write standard browser icon (32x32) with high quality
  await sharp(outBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .resize(32, 32, { fit: "contain" })
    .png()
    .toFile(outputPng);

  // 4. Write Apple touch icon (180x180)
  await sharp(outBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .resize(180, 180, { fit: "contain" })
    .png()
    .toFile(outputApple);

  // 5. Generate a simple SVG file referencing the transparent base64 image 
  // to ensure perfect vector scaling behavior in modern browsers!
  const base64Png = await sharp(outBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .resize(128, 128, { fit: "contain" })
    .png()
    .toBuffer();

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <image width="128" height="128" href="data:image/png;base64,${base64Png.toString("base64")}" />
</svg>`;
  fs.writeFileSync(outputSvg, svgContent);

  console.log("✓ Successfully created transparent icon.png (32x32)");
  console.log("✓ Successfully created transparent apple-icon.png (180x180)");
  console.log("✓ Successfully created transparent icon.svg");
}

convertToTransparent().catch(console.error);
