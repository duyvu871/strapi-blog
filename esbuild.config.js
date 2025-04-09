const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { join } = require('path');
const { copyFile, mkdir } = require('fs/promises');
const { glob } = require('glob');

// Hàm copy assets từ scripts/copy-assets.js
async function copyAssets() {
    try {
        // Copy handlebars templates
        const templateFiles = glob.sync('src/views/**/*.handlebars');
        for (const file of templateFiles) {
            const destPath = file.replace('src/', 'dist/');
            await mkdir(join(process.cwd(), destPath, '..'), { recursive: true });
            await copyFile(file, destPath);
            console.log(`Copied ${file} to ${destPath}`);
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

// Cấu hình esbuild
async function build() {
    try {
        // Build với esbuild
        await esbuild.build({
            entryPoints: ['./src/index.ts'],
            bundle: true,
            platform: 'node',
            target: 'node16',
            outdir: 'dist',
            format: 'cjs',
            sourcemap: true,
            minify: process.env.NODE_ENV === 'production',
            plugins: [
                // Không bundle các node_modules
                nodeExternalsPlugin(),
            ],
            banner: {
                js: '#!/usr/bin/env node',
            },
            define: {
                'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`
            },
        });

        // Copy assets sau khi build
        await copyAssets();

        console.log('✅ Build completed successfully!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Chạy build nếu file được gọi trực tiếp
if (require.main === module) {
    build();
}

module.exports = { build };