const { copyFile, mkdir } = require('fs/promises');
const { join } = require('path');
const { glob } = require('glob');

async function copyAssets() {
    try {
        // Copy handlebars templates
        const templateFiles = glob.sync('src/views/**/*.handlebars');
        for (const file of templateFiles) {
            const destPath = file.replace('src/', 'dist/');
            await mkdir(join(process.cwd(), destPath, '..'), { recursive: true });
            await copyFile(file, destPath);
        }

        // Copy static assets if they exist
        const staticFiles = glob.sync('src/public/**/*');
        for (const file of staticFiles) {
            const destPath = file.replace('src/', 'dist/');
            await mkdir(join(process.cwd(), destPath, '..'), { recursive: true });
            await copyFile(file, destPath);
        }

        // Copy package.json to dist directory for bcrypt
        await copyFile('package.json', 'dist/package.json');

        console.log('✨ Assets copied successfully!');
    } catch (error) {
        console.error('Error copying assets:', error);
        process.exit(1);
    }
}

copyAssets();