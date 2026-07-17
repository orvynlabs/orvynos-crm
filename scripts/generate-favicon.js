const sharp = require("sharp");
const path = require("path");

async function generateFavicon() {
  const logoPath = path.join(__dirname, "..", "public", "brand", "logo.png");
  const iconPath = path.join(__dirname, "..", "src", "app", "icon.png");
  const applePath = path.join(__dirname, "..", "src", "app", "apple-icon.png");

  // Trim whitespace first, then resize to fill the icon area tightly
  await sharp(logoPath)
    .trim()  // Remove surrounding whitespace/transparency
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(iconPath);

  await sharp(logoPath)
    .trim()
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(applePath);

  const info = await sharp(iconPath).metadata();
  console.log(`✓ icon.png: ${info.width}x${info.height}`);
  console.log("Done!");
}

generateFavicon().catch(console.error);
