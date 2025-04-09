const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { join } = require('path');
const { copyFile, mkdir } = require('fs/promises');
const { glob } = require('glob');
const { spawn } = require('child_process');

// Biến lưu trữ process node đang chạy
let nodeProcess = null;

// Hàm copy assets
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

    console.log('✨ Assets copied successfully!');
  } catch (error) {
    console.error('Error copying assets:', error);
  }
}

// Hàm khởi động lại server
function restartServer() {
  if (nodeProcess) {
    nodeProcess.kill();
    console.log('🔄 Restarting server...');
  }

  nodeProcess = spawn('node', ['dist/index.js'], { stdio: 'inherit' });
  
  nodeProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
  });

  nodeProcess.on('exit', (code) => {
    if (code !== null && code !== 0 && code !== 143) { // 143 là SIGTERM
      console.error(`Server process exited with code ${code}`);
    }
  });
}

// Chạy esbuild với chế độ watch
async function devBuild() {
  try {
    // Khởi tạo context esbuild
    const context = await esbuild.context({
      entryPoints: ['./src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node16',
      outdir: 'dist',
      format: 'cjs',
      sourcemap: true,
      plugins: [
        nodeExternalsPlugin(),
      ],
      define: {
        'process.env.NODE_ENV': '"development"'
      },
    });

    // Bắt đầu watch mode
    await context.watch();
    console.log('👀 Watching for changes...');

    // Copy assets ban đầu
    await copyAssets();

    // Khởi động server lần đầu
    restartServer();

    // Thiết lập watcher cho các file handlebars và assets
    const { watch } = require('fs');
    const viewsWatcher = watch('./src/views', { recursive: true });
    
    viewsWatcher.on('change', async () => {
      console.log('📄 Template files changed, copying assets...');
      await copyAssets();
      restartServer();
    });

    // Xử lý khi process chính kết thúc
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping development server...');
      if (nodeProcess) nodeProcess.kill();
      viewsWatcher.close();
      await context.dispose();
      process.exit(0);
    });

    // Thiết lập rebuild callback
    context.onEnd(async (result) => {
      if (result.errors.length > 0) {
        console.error('❌ Build errors:', result.errors);
        return;
      }
      console.log('🔨 Build completed, restarting server...');
      restartServer();
    });

  } catch (error) {
    console.error('❌ Dev build setup failed:', error);
    process.exit(1);
  }
}

devBuild();