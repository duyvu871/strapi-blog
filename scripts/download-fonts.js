const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const css = require('css');

// Đọc nội dung file CSS
const cssContent = fs.readFileSync(path.join(__dirname, '../src/views/styles/font.css'), 'utf8');

// Parse CSS để lấy các URL font
const ast = css.parse(cssContent);

// Hàm tải xuống font
async function downloadFont(url, outputPath) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        await fs.outputFile(outputPath, response.data);
        console.log(`✓ Đã tải xuống: ${path.basename(outputPath)}`);
    } catch (error) {
        console.error(`✗ Lỗi khi tải ${url}:`, error.message);
    }
}

async function downloadAllFonts() {
    const fontUrls = new Set();
    const fontDir = path.join(__dirname, '../public/fonts');

    // Tạo thư mục fonts nếu chưa tồn tại
    await fs.ensureDir(fontDir);

    // Lấy tất cả URL font từ CSS
    ast.stylesheet.rules.forEach(rule => {
        if (rule.type === 'font-face') {
            rule.declarations.forEach(declaration => {
                if (declaration.property === 'src') {
                    const urls = declaration.value.match(/url\(['"](.*?)['"]\)/g);
                    if (urls) {
                        urls.forEach(url => {
                            const fontUrl = url.match(/url\(['"](.*?)['"]\)/)[1];
                            fontUrls.add(fontUrl);
                        });
                    }
                }
            });
        }
    });

    console.log(`Tìm thấy ${fontUrls.size} font cần tải xuống...`);

    // Tải xuống tất cả font
    const downloads = Array.from(fontUrls).map(url => {
        const urlParts = url.split('/');
        const folderName = urlParts[urlParts.length - 2];
        const fileName = urlParts[urlParts.length - 1];
        const outputPath = path.join(fontDir, folderName, fileName);
        return fs.ensureDir(path.join(fontDir, folderName)).then(() => downloadFont(url, outputPath));
    });

    await Promise.all(downloads);
    console.log('\nHoàn thành tải xuống tất cả font!');
}

// Chạy script
downloadAllFonts().catch(console.error);