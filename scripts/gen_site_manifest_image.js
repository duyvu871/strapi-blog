const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  16, 32, 48, 96, 128, 144, 152, 192, 384, 512
];

const inputImage = './public/ChatGPT Image 22_27_04 7 thg 5, 2025.png'; // ảnh gốc (nên là ảnh vuông và lớn, ví dụ 1024x1024)
const outputDir = path.join(process.cwd(), 'public', 'assets', 'icons');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✔ Created directory ${outputDir}`);
} else {
  console.log(`✔ Directory already exists: ${outputDir}`);
}

(async () => {
  try {
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);

      await sharp(inputImage)
        .resize(size, size)
        .toFile(outputFile);

      console.log(`✔ Created ${outputFile}`);
    }
  } catch (err) {
    console.error('⚠️ Error while resizing images:', err);
  }
})();
