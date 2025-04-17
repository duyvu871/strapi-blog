// Script để chạy puppeteer-analytics.ts trực tiếp
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting puppeteer analytics script...');

try {
    // Đường dẫn đến thư mục gốc của dự án
    const projectRoot = path.resolve(__dirname, '..');
    
    // Chạy ts-node để thực thi file TypeScript trực tiếp
    const command = `npx ts-node ${path.join(projectRoot, 'src', 'puppeteer-analytics.ts')}`;
    
    console.log(`Executing command: ${command}`);
    
    // Thực thi lệnh và hiển thị output trực tiếp
    execSync(command, { 
        stdio: 'inherit',
        env: {
            ...process.env,
            // Có thể thêm các biến môi trường cần thiết ở đây
            SESSIONS_COUNT: '1',      // Chỉ chạy 1 phiên để test
            CONCURRENT_SESSIONS: '1'  // Chỉ chạy 1 phiên đồng thời
        }
    });
    
    console.log('Puppeteer analytics script completed successfully');
} catch (error) {
    console.error('Error running puppeteer analytics script:', error);
    process.exit(1);
}