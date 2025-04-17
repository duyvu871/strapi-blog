// filepath: f:\CODE\vietales-clone\ssr-vietales-hbs\src\test-proxy.ts
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Cấu hình
const PROXY_FILE_PATH = path.resolve(__dirname, '../public/proxy.txt'); // Đường dẫn tới file proxy
const OUTPUT_DIR = path.resolve(__dirname, '../public'); // Thư mục đầu ra
const WORKING_PROXIES_FILE = path.resolve(OUTPUT_DIR, 'working_proxies.txt'); // File lưu proxy hoạt động
const PROXY_LOG_FILE = path.resolve(OUTPUT_DIR, 'proxy_check_log.txt'); // File lưu nhật ký kiểm tra
const PROXY_CHECK_URL = 'https://httpbin.org/ip'; // URL để kiểm tra proxy
const PROXY_CHECK_TIMEOUT = 8000; // Timeout 8 giây cho axios
const MAX_CONCURRENT_CHECKS = 25; // Số lượng proxy kiểm tra đồng thời
const PROXY_CHECK_RETRY = 1; // Số lần thử lại khi kiểm tra proxy

// Biến theo dõi tiến trình
let allProxiesFromFile: string[] = []; // Danh sách proxy đọc từ file
let workingProxies: string[] = []; // Danh sách proxy hoạt động
let totalProxiesChecked = 0;
let totalProxiesSuccess = 0;
let totalProxiesFailed = 0;
let startTime = Date.now();

// Tạo file log mới
fs.writeFileSync(PROXY_LOG_FILE, `--- PROXY CHECKING SESSION ${new Date().toISOString()} ---\n`);

// Hàm sleep để tạo độ trễ
async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Hiển thị thanh tiến trình
function renderProgressBar(percent: number, length: number = 30): string {
    const filledLength = Math.round(length * percent / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(length - filledLength);
    return `[${bar}] ${percent}%`;
}

// Định dạng thời gian từ giây sang phút:giây
function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Cập nhật và hiển thị tiến trình kiểm tra proxy
function updateProxyCheckProgress(isSuccess: boolean, proxy: string) {
    if (isSuccess) {
        totalProxiesSuccess++;
    } else {
        totalProxiesFailed++;
    }
    totalProxiesChecked++;
    
    // Tính phần trăm tiến trình
    const percentComplete = Math.round((totalProxiesChecked / allProxiesFromFile.length) * 100);
    
    // Tính thời gian đã trôi qua và thời gian còn lại
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const proxiesPerSecond = totalProxiesChecked / (elapsedSeconds || 1);
    const remainingProxies = allProxiesFromFile.length - totalProxiesChecked;
    const remainingTimeSeconds = Math.round(remainingProxies / proxiesPerSecond);
    
    // Xóa dòng hiện tại và hiển thị tiến trình mới
    process.stdout.write('\r');
    process.stdout.write(
        `Tiến trình: ${percentComplete}% | ` +
        `Đã kiểm tra: ${totalProxiesChecked}/${allProxiesFromFile.length} | ` +
        `Thành công: ${totalProxiesSuccess} | ` +
        `Thất bại: ${totalProxiesFailed} | ` +
        `Thời gian còn lại: ${formatTime(remainingTimeSeconds)}`
    );
    
    // Log kết quả proxy
    if (isSuccess) {
        fs.appendFileSync(
            PROXY_LOG_FILE, 
            `[${new Date().toISOString()}] SUCCESS - ${proxy}\n`
        );
    }
    
    // Xuống dòng khi đã hoàn thành 100%
    if (totalProxiesChecked === allProxiesFromFile.length) {
        process.stdout.write('\n');
    }
}

// Kiểm tra một proxy bằng Axios
async function checkProxyWithAxios(proxy: string): Promise<boolean> {
    const proxyUrl = `http://${proxy}`;
    const agent = new HttpsProxyAgent(proxyUrl);
    const source = axios.CancelToken.source();

    const timeoutId = setTimeout(() => {
        source.cancel(`Timeout của ${PROXY_CHECK_TIMEOUT}ms đã hết`);
    }, PROXY_CHECK_TIMEOUT);

    try {
        const response = await axios.get(PROXY_CHECK_URL, {
            httpsAgent: agent,
            timeout: PROXY_CHECK_TIMEOUT,
            cancelToken: source.token,
            validateStatus: function (status) {
                return status >= 200 && status < 500;
            },
        });

        clearTimeout(timeoutId);

        if (response.status === 200 && response.data && response.data.origin) {
            updateProxyCheckProgress(true, proxy);
            return true;
        } else {
            updateProxyCheckProgress(false, proxy);
            return false;
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        updateProxyCheckProgress(false, proxy);
        return false;
    }
}

// Kiểm tra một proxy với số lần thử lại
async function checkProxyWithRetry(proxy: string, retries: number = PROXY_CHECK_RETRY): Promise<boolean> {
    for (let i = 0; i <= retries; i++) {
        const isWorking = await checkProxyWithAxios(proxy);
        if (isWorking) {
            return true;
        }
        if (i < retries) {
            await sleep(500); // Chờ nửa giây trước khi thử lại
        }
    }
    return false;
}

// Đọc tất cả proxy từ file
function loadAllProxiesFromFile(): void {
    console.log(`Đang đọc danh sách proxy từ: ${PROXY_FILE_PATH}`);
    try {
        if (!fs.existsSync(PROXY_FILE_PATH)) {
            console.error('Lỗi: File proxy không tồn tại!');
            process.exit(1);
        }
        
        const proxyData = fs.readFileSync(PROXY_FILE_PATH, 'utf8');
        allProxiesFromFile = proxyData.split(/\r?\n/).filter(p => p.trim() !== '' && p.includes(':'));
        console.log(`Đã đọc ${allProxiesFromFile.length} proxy vào bộ nhớ.`);
        
        if (allProxiesFromFile.length === 0) {
            console.warn("Cảnh báo: File proxy trống hoặc không chứa mục nào hợp lệ.");
            process.exit(1);
        }
    } catch (error) {
        console.error(`Lỗi khi đọc file proxy: ${error}`);
        process.exit(1);
    }
}

// Kiểm tra một loạt proxy đồng thời
async function checkProxiesBatch(proxies: string[], batchSize: number): Promise<string[]> {
    const working: string[] = [];
    
    // Reset biến theo dõi tiến trình
    totalProxiesChecked = 0;
    totalProxiesSuccess = 0;
    totalProxiesFailed = 0;
    startTime = Date.now();
    
    console.log(`Bắt đầu kiểm tra ${proxies.length} proxy...`);
    console.log(`Đang sử dụng ${batchSize} kết nối đồng thời và ${PROXY_CHECK_RETRY} lần thử lại cho mỗi proxy`);
    
    for (let i = 0; i < proxies.length; i += batchSize) {
        const batch = proxies.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(proxies.length / batchSize);
        
        // Hiển thị thông tin batch mới
        process.stdout.write('\n');
        console.log(`\nĐang kiểm tra lô ${batchNumber}/${totalBatches} (${batch.length} proxy)`);
        console.log(renderProgressBar(Math.round(i / proxies.length * 100)));
        
        const results = await Promise.all(
            batch.map(async (proxy) => {
                const isWorking = await checkProxyWithRetry(proxy);
                return { proxy, isWorking };
            })
        );
        
        // Lọc và thêm các proxy hoạt động vào mảng kết quả
        const workingInBatch = results.filter(result => result.isWorking).map(result => result.proxy);
        working.push(...workingInBatch);
        
        // Hiển thị thông tin tổng hợp sau mỗi lô
        process.stdout.write('\n');
        console.log(`\nKết quả lô ${batchNumber}: Tìm thấy ${workingInBatch.length}/${batch.length} proxy hoạt động`);
        if (totalProxiesChecked > 0) {
            console.log(`Tổng proxy hoạt động đến hiện tại: ${working.length}/${totalProxiesChecked} (${Math.round(working.length / totalProxiesChecked * 100)}%)`);
        }
        console.log(renderProgressBar(Math.round(totalProxiesChecked / proxies.length * 100)));
    }
    
    return working;
}

// Lưu proxy hoạt động vào file
function saveWorkingProxies(proxies: string[]): void {
    try {
        fs.writeFileSync(WORKING_PROXIES_FILE, proxies.join('\n'));
        console.log(`\nĐã lưu ${proxies.length} proxy hoạt động vào: ${WORKING_PROXIES_FILE}`);
    } catch (error) {
        console.error(`Lỗi khi lưu proxy hoạt động: ${error}`);
    }
    
    // Lưu thêm một bản sao với timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const backupPath = path.resolve(OUTPUT_DIR, `working_proxies_${timestamp}.txt`);
    try {
        fs.writeFileSync(backupPath, proxies.join('\n'));
        console.log(`Đã tạo bản sao với timestamp tại: ${backupPath}`);
    } catch (error) {
        console.error(`Lỗi khi tạo bản sao: ${error}`);
    }
}

// Hàm chính kiểm tra tất cả proxy
async function checkAllProxies(): Promise<void> {
    console.log('===================================================');
    console.log('=== CÔNG CỤ KIỂM TRA PROXY TỰ ĐỘNG ===');
    console.log('===================================================');
    
    // Đọc danh sách proxy từ file
    loadAllProxiesFromFile();
    
    console.log('===================================================');
    
    // Bắt đầu kiểm tra
    const startTime = Date.now();
    workingProxies = await checkProxiesBatch(allProxiesFromFile, MAX_CONCURRENT_CHECKS);
    const endTime = Date.now();
    const timeElapsed = Math.round((endTime - startTime) / 1000);
    
    // Hiển thị kết quả
    console.log('\n===================================================');
    console.log('=== KIỂM TRA HOÀN TẤT ===');
    console.log('===================================================');
    console.log(`Thời gian: ${formatTime(timeElapsed)}`);
    console.log(`Tổng số proxy: ${allProxiesFromFile.length}`);
    console.log(`Hoạt động: ${workingProxies.length} (${Math.round(workingProxies.length / allProxiesFromFile.length * 100)}%)`);
    console.log(`Không hoạt động: ${allProxiesFromFile.length - workingProxies.length} (${Math.round((allProxiesFromFile.length - workingProxies.length) / allProxiesFromFile.length * 100)}%)`);
    console.log(`Tốc độ kiểm tra: ${(allProxiesFromFile.length / timeElapsed).toFixed(2)} proxy/giây`);
    
    // Lưu proxy hoạt động vào file
    saveWorkingProxies(workingProxies);
    
    console.log('===================================================');
    console.log('Bạn có thể sử dụng các proxy hoạt động để chạy file test.ts');
    console.log('Ví dụ: npm run test -- --use-proxies');
    console.log('===================================================');
}

// Chạy script
console.log('Khởi động công cụ kiểm tra proxy...');
checkAllProxies().catch(error => {
    console.error('Lỗi nghiêm trọng:', error);
    process.exit(1);
});