import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import os from 'os';
import { execSync } from 'child_process';

declare global {
    interface Window {
        gtag: any;
        _scrollDepthTracker: any;
    }
}

// Cấu hình puppeteer-extra plugins
puppeteerExtra.use(StealthPlugin());
puppeteerExtra.use(AnonymizeUAPlugin());
puppeteerExtra.use(UserPreferencesPlugin({
    userPrefs: {
        webkit: {
            webprefs: {
                default_font_size: Math.floor(Math.random() * 4) + 14, // 14-17px
                default_fixed_font_size: Math.floor(Math.random() * 2) + 12 // 12-13px
            }
        }
    }
}));

// Cấu hình
const WEBSITE_URLS = [
    'https://regisna.site',
    'https://regisna.site/components',
    'https://regisna.site/article/sang-tac-nghiep-du',
    'https://regisna.site/category/lich-su'
    // Thêm các URL khác nếu cần
];

// Cấu hình số lượng cửa sổ Chrome và thời gian
const NUM_CHROME_INSTANCES = 5; // Số lượng Chrome chạy song song
const WINDOWS_PER_CHROME = 2;   // Số tab trong mỗi cửa sổ Chrome
const SESSION_DURATION_MS = 180 * 1000; // 3 phút cho mỗi phiên
const SCROLL_INTERVAL_MS = 500; // Khoảng thời gian giữa các lần scroll
const MAX_CYCLES = 5;           // Số chu kỳ chạy

// Cấu hình proxy
const PROXY_FILE_PATH = path.resolve(__dirname, '../public/proxy.txt');
const PROXY_CHECK_URL = 'https://httpbin.org/ip';
const PROXY_CHECK_TIMEOUT = 10000; // 10 giây timeout cho việc kiểm tra proxy

// Cấu hình đường dẫn lưu dữ liệu
const DATA_DIR = path.resolve(__dirname, '../data');
const COOKIES_DIR = path.join(DATA_DIR, 'cookies');
const SESSION_DATA_DIR = path.join(DATA_DIR, 'sessions');

// Mảng tất cả proxy đọc từ file
let allProxiesFromFile: string[] = [];
// Set để theo dõi proxy đã sử dụng
const usedProxiesThisRun = new Set<string>();

// Danh sách user agents đa dạng
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/96.0.4664.53 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/96.0.4664.45 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0'
];

// Tạo thư mục dữ liệu nếu chưa tồn tại
function ensureDirectories() {
    [DATA_DIR, COOKIES_DIR, SESSION_DATA_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// Hàm sleep để tạo độ trễ
async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Hàm kiểm tra proxy bằng Axios - nhanh hơn nhiều so với Puppeteer
async function checkProxyWithAxios(proxy: string): Promise<boolean> {
    console.log(`Checking proxy: ${proxy}`);
    const proxyUrl = `http://${proxy}`; // Format URL cho HttpsProxyAgent
    const agent = new HttpsProxyAgent(proxyUrl);
    const source = axios.CancelToken.source();

    const timeoutId = setTimeout(() => {
        source.cancel(`Timeout of ${PROXY_CHECK_TIMEOUT}ms exceeded`);
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

        // Kiểm tra response status và response data
        if (response.status === 200 && response.data && response.data.origin) {
            console.log(`Proxy OK: ${proxy}`);
            return true;
        } else {
            console.log(`Proxy FAILED (Status: ${response.status}): ${proxy}`);
            return false;
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (axios.isCancel(error)) {
            console.log(`Proxy FAILED (Timeout): ${proxy}`);
        } else {
            console.log(`Proxy FAILED (Error): ${proxy}`);
        }
        return false;
    }
}

// Đọc tất cả proxy từ file
function loadAllProxiesFromFile(): void {
    console.log(`Reading all proxies from: ${PROXY_FILE_PATH}`);
    allProxiesFromFile = [];
    try {
        const proxyData = fs.readFileSync(PROXY_FILE_PATH, 'utf8');
        allProxiesFromFile = proxyData.split(/\r?\n/).filter(p => p.trim() !== '' && p.includes(':'));
        console.log(`Loaded ${allProxiesFromFile.length} proxies into memory.`);
    } catch (error) {
        console.error(`Error reading proxy file: ${error}`);
        console.warn("Warning: Could not load proxies.");
        allProxiesFromFile = [];
    }
}

// Tìm proxy khả dụng chưa sử dụng
async function findAndSelectUnusedProxy(): Promise<string | null> {
    console.log(`Searching for an unused, working proxy...`);

    // Shuffle proxies để ngẫu nhiên hóa việc lựa chọn
    const shuffledProxies = [...allProxiesFromFile].sort(() => Math.random() - 0.5);

    for (const proxy of shuffledProxies) {
        if (!usedProxiesThisRun.has(proxy)) {
            console.log(`Checking unused proxy: ${proxy}`);
            const isWorking = await checkProxyWithAxios(proxy);
            if (isWorking) {
                usedProxiesThisRun.add(proxy); // Đánh dấu đã sử dụng
                console.log(`Selected proxy: ${proxy}. Total used: ${usedProxiesThisRun.size}`);
                return proxy;
            } else {
                console.log(`Proxy ${proxy} failed check.`);
            }
        }
    }

    console.log("No suitable unused proxy found.");
    return null;
}

// Hàm mô phỏng hành vi người dùng thực
async function simulateRealUserBehavior(page: Page, durationMs: number): Promise<void> {
    const startTime = Date.now();
    let eventsSent = 0;
    
    // Ghi nhận sự kiện page_view khi trang load xong
    await page.evaluate(() => {
        //@ts-ignore
        if (window.gtag) {
            // @ts-ignore
            window.gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname,
                non_interaction: false
            });
        }
    });
    eventsSent++;
    
    // Ghi nhận sự kiện tương tác ban đầu sau khi trang load
    await page.evaluate(() => {
        if (window.gtag) {
            // @ts-ignore
            window.gtag('event', 'user_engagement', {
                engagement_time_msec: 1000,
                non_interaction: false
            });
        }
    });
    eventsSent++;

    // Thiết lập tracking scroll depth
    await page.evaluate(() => {
        let maxScrollDepth = 0;
        let lastReportedDepth = 0;
        
        const reportScrollDepth = () => {
            const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const clientHeight = window.innerHeight;
            
            const scrollPercent = Math.floor((scrollTop / (scrollHeight - clientHeight)) * 100);
            maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
            
            // Báo cáo ở các mốc 25%, 50%, 75%, 100%
            const depthThresholds = [25, 50, 75, 100];
            const currentThreshold = depthThresholds.find(depth => maxScrollDepth >= depth && lastReportedDepth < depth);
            
            if (currentThreshold) {
                lastReportedDepth = currentThreshold;
                if (window.gtag) {
                    // @ts-ignore
                    window.gtag('event', 'scroll', {
                        percent_scrolled: currentThreshold,
                        non_interaction: false
                    });
                }
                console.log(`Scroll depth: ${currentThreshold}%`);
            }
        };
        
        // Theo dõi sự kiện scroll
        window.addEventListener('scroll', reportScrollDepth);
        
        // @ts-ignore
        window._scrollDepthTracker = reportScrollDepth;
    });

    while (Date.now() - startTime < durationMs) {
        try {
            // Chọn hành động ngẫu nhiên
            const action = Math.random();
            
            if (action < 0.5) { 
                // 50% thời gian: Scroll ngẫu nhiên
                await page.evaluate(() => {
                    const scrollHeight = document.body.scrollHeight;
                    const viewportHeight = window.innerHeight;
                    const currentScroll = window.scrollY;
                    
                    // Điều chỉnh hướng và tốc độ scroll để trông tự nhiên hơn
                    const direction = Math.random() > 0.3 ? 1 : -1; // 70% scroll xuống, 30% scroll lên
                    const scrollAmount = Math.random() * viewportHeight * 0.5; // Cuộn một lượng hợp lý
                    
                    let targetScroll = currentScroll + direction * scrollAmount;
                    targetScroll = Math.max(0, Math.min(targetScroll, scrollHeight - viewportHeight));
                    
                    window.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                    
                    // Kích hoạt theo dõi scroll depth 
                    // @ts-ignore
                    if (window._scrollDepthTracker) window._scrollDepthTracker();
                });
                
                await sleep(SCROLL_INTERVAL_MS + Math.random() * 1500);
            } else if (action < 0.7) {
                // 20% thời gian: Click vào các link nội bộ
                const links = await page.$$('a[href^="/"], a[href^="https://regisna.site"]');
                
                if (links.length > 0) {
                    const randomLink = links[Math.floor(Math.random() * links.length)];
                    
                    // Lấy URL trước khi click 
                    const currentUrl = page.url();
                    
                    try {
                        // Hover trước khi click (hành vi người thực)
                        await randomLink.hover();
                        await sleep(500 + Math.random() * 1000);
                        
                        // Gửi sự kiện click trong GA
                        await page.evaluate(() => {
                            if (window.gtag) {
                                // @ts-ignore
                                window.gtag('event', 'click', {
                                    event_category: 'engagement',
                                    event_label: 'link_click',
                                    non_interaction: false
                                });
                            }
                        });
                        eventsSent++;
                        
                        // Click với timeout phù hợp
                        await Promise.all([
                            page.waitForNavigation({timeout: 30000, waitUntil: 'domcontentloaded'}).catch(() => {}),
                            randomLink.click().catch(() => {})
                        ]);
                        
                        // Gửi page_view cho trang mới
                        if (page.url() !== currentUrl) {
                            await page.evaluate(() => {
                                if (window.gtag) {
                                    // @ts-ignore
                                    window.gtag('event', 'page_view', {
                                        page_title: document.title,
                                        page_location: window.location.href,
                                        page_path: window.location.pathname,
                                        non_interaction: false
                                    });
                                }
                            });
                            eventsSent++;
                            
                            // Đợi ngẫu nhiên trên trang mới (3-12s)
                            await sleep(3000 + Math.random() * 9000);
                            
                            // Quay lại trang trước (nếu có lịch sử)
                            try {
                                await page.goBack({waitUntil: 'domcontentloaded', timeout: 30000});
                                
                                // Ghi nhận pageview khi quay lại
                                await page.evaluate(() => {
                                    if (window.gtag) {
                                        // @ts-ignore
                                        window.gtag('event', 'page_view', {
                                            page_title: document.title,
                                            page_location: window.location.href,
                                            page_path: window.location.pathname,
                                            non_interaction: false
                                        });
                                    }
                                });
                                eventsSent++;
                            } catch (e) {
                                console.log("Could not go back, continuing with current page");
                            }
                        }
                    } catch (error) {
                        console.log("Navigation error, continuing...");
                    }
                }
                
                await sleep(1000 + Math.random() * 2000);
            } else if (action < 0.85) {
                // 15% thời gian: Hover các phần tử UI
                const selectors = [
                    'a', 'button', '.card', 'article', '.menu-item', 
                    'h1', 'h2', 'h3', 'img', '.nav-link', '.article-card'
                ];
                
                // Chọn một loại phần tử ngẫu nhiên
                const randomSelector = selectors[Math.floor(Math.random() * selectors.length)];
                const elements = await page.$$(randomSelector);
                
                if (elements.length > 0) {
                    const randomElement = elements[Math.floor(Math.random() * elements.length)];
                    await randomElement.hover().catch(() => {});
                    
                    // Gửi sự kiện hover trong GA (tùy chọn)
                    if (Math.random() > 0.7) { // Chỉ gửi ~30% các hover để không spam
                        await page.evaluate(() => {
                            if (window.gtag) {
                                // @ts-ignore
                                window.gtag('event', 'hover', {
                                    event_category: 'engagement',
                                    event_label: 'element_hover',
                                    non_interaction: true
                                });
                            }
                        });
                        eventsSent++;
                    }
                    
                    await sleep(800 + Math.random() * 1500);
                }
            } else {
                // 15% thời gian: Dừng đọc (đọc nội dung)
                const readTime = 4000 + Math.random() * 8000;
                console.log(`User reading content for ${Math.round(readTime/1000)}s`);
                
                // Gửi sự kiện thời gian đọc
                await page.evaluate((time) => {
                    if (window.gtag) {
                        // @ts-ignore
                        window.gtag('event', 'timing_complete', {
                            name: 'read_time',
                            value: time,
                            event_category: 'engagement',
                            non_interaction: false
                        });
                    }
                }, readTime);
                eventsSent++;
                
                await sleep(readTime);
            }
        } catch (error) {
            console.log("Error in user simulation:", error);
            break;
        }
    }
    
    // Báo cáo tổng thời gian tương tác khi kết thúc
    const totalTime = Date.now() - startTime;
    await page.evaluate((time) => {
        if (window.gtag) {
            // @ts-ignore
            window.gtag('event', 'user_engagement', {
                engagement_time_msec: time,
                non_interaction: false
            });
        }
    }, totalTime);
    eventsSent++;
    
    console.log(`Session ended with ${eventsSent} events sent to GA`);
}

// Hàm khởi động nhiều tiến trình Chrome độc lập
async function launchMultipleChromeInstances(numInstances: number): Promise<number[]> {
    const pids: number[] = [];
    const chromePath = getLocalChromePath();
    
    if (!chromePath) {
        console.error("Could not find Chrome installation path");
        return pids;
    }
    
    console.log(`Found Chrome at: ${chromePath}`);
    
    // Tạo nhiều tiến trình Chrome độc lập
    for (let i = 0; i < numInstances; i++) {
        try {
            const userDataDir = path.join(DATA_DIR, `chrome-profile-${i}`);
            if (!fs.existsSync(userDataDir)) {
                fs.mkdirSync(userDataDir, { recursive: true });
            }
            
            // Tạo random port để tránh xung đột
            const remoteDebuggingPort = 9222 + i;
            
            // Chuẩn bị các tham số dòng lệnh cho Chrome
            let chromeArgs = [
                `--remote-debugging-port=${remoteDebuggingPort}`,
                `--user-data-dir=${userDataDir}`,
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-popup-blocking',
                '--disable-extensions'
            ];
            
            // Tìm proxy chưa được sử dụng
            const proxy = await findAndSelectUnusedProxy();
            if (proxy) {
                chromeArgs.push(`--proxy-server=${proxy}`);
            }
            
            // Khởi động Chrome
            console.log(`Launching Chrome instance ${i+1} with debugging port ${remoteDebuggingPort}`);
            
            // Sử dụng spawn để khởi động Chrome không chặn
            let command;
            if (process.platform === 'win32') {
                command = `start /B "${chromePath}" ${chromeArgs.join(' ')}`;
            } else {
                command = `"${chromePath}" ${chromeArgs.join(' ')} &`;
            }
            
            // Chạy lệnh khởi động và lấy PID
            execSync(command, { stdio: 'ignore' });
            
            // Để Chrome có thời gian khởi động
            await sleep(2000);
            
            // Giả định rằng Chrome đã khởi động thành công
            // Trong thực tế, bạn cần tìm PID thực sự bằng lsof hoặc netstat
            pids.push(9222 + i); // Sử dụng port làm ID vì khó lấy PID chính xác
            
            console.log(`Chrome instance ${i+1} started with debugging port ${remoteDebuggingPort}`);
        } catch (error) {
            console.error(`Error launching Chrome instance ${i+1}:`, error);
        }
    }
    
    return pids;
}

// Hàm tìm đường dẫn Chrome cục bộ
function getLocalChromePath(): string | null {
    try {
        // Các đường dẫn phổ biến dựa trên hệ điều hành
        if (process.platform === 'win32') {
            const paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
            ];
            
            for (const path of paths) {
                if (fs.existsSync(path)) {
                    return path;
                }
            }
        } else if (process.platform === 'darwin') { // macOS
            return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        } else { // Linux
            const possiblePaths = [
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium'
            ];
            
            for (const path of possiblePaths) {
                if (fs.existsSync(path)) {
                    return path;
                }
            }
        }
    } catch (error) {
        console.error('Error finding Chrome path:', error);
    }
    
    return null;
}

// Hàm kết nối với cửa sổ Chrome đã mở
async function connectToDebugPort(port: number): Promise<Browser | null> {
    try {
        const browser = await puppeteer.connect({
            browserURL: `http://localhost:${port}`,
            defaultViewport: null
        });
        return browser;
    } catch (error) {
        console.error(`Failed to connect to Chrome on port ${port}:`, error);
        return null;
    }
}

// Hàm mô phỏng một phiên với nhiều cửa sổ Chrome song song
async function simulateMultiInstanceSession(chromePids: number[]): Promise<void> {
    const browsers: Browser[] = [];
    const allPages: Page[] = [];
    const allPromises: Promise<void>[] = [];
    
    console.log(`Starting multi-instance session with ${chromePids.length} Chrome instances...`);
    
    try {
        // Kết nối tới các tiến trình Chrome đã mở
        for (let i = 0; i < chromePids.length; i++) {
            const browser = await connectToDebugPort(chromePids[i]);
            if (browser) {
                browsers.push(browser);
                
                // Mở các tab trong mỗi cửa sổ Chrome
                for (let j = 0; j < WINDOWS_PER_CHROME; j++) {
                    try {
                        // Lấy tab hiện tại hoặc tạo tab mới
                        let pages = await browser.pages();
                        let page = (j === 0 && pages.length > 0) ? pages[0] : await browser.newPage();
                        
                        // Thiết lập UserAgent và kích thước viewport ngẫu nhiên
                        const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
                        await page.setUserAgent(randomUserAgent);
                        
                        // Đặt viewport ngẫu nhiên trong phạm vi hợp lý
                        await page.setViewport({
                            width: 1200 + Math.floor(Math.random() * 300),
                            height: 800 + Math.floor(Math.random() * 200),
                            deviceScaleFactor: 1
                        });
                        
                        // Load một trang ngẫu nhiên
                        const randomUrl = WEBSITE_URLS[Math.floor(Math.random() * WEBSITE_URLS.length)];
                        console.log(`Chrome ${i+1}, Tab ${j+1}: Navigating to ${randomUrl}`);
                        
                        await page.goto(randomUrl, { 
                            waitUntil: 'networkidle2', 
                            timeout: 60000 
                        });
                        
                        // Thêm page vào danh sách
                        allPages.push(page);
                        
                        // Chạy mô phỏng hành vi người dùng
                        const simulationPromise = simulateRealUserBehavior(page, SESSION_DURATION_MS);
                        allPromises.push(simulationPromise);
                        
                        // Chờ một chút giữa các tab để tránh quá tải
                        await sleep(1000);
                    } catch (tabError) {
                        console.error(`Error with Chrome ${i+1}, Tab ${j+1}:`, tabError);
                    }
                }
            }
        }
        
        console.log(`Started ${allPages.length} browsing sessions. Running for ${SESSION_DURATION_MS/1000} seconds...`);
        
        // Đợi tất cả các phiên hoàn thành
        await Promise.all(allPromises);
        console.log('All sessions completed.');
        
    } catch (error) {
        console.error('Error in multi-instance session:', error);
    } finally {
        // Đóng kết nối (Không đóng browser vì đó là các cửa sổ Chrome riêng biệt)
        for (const browser of browsers) {
            await browser.disconnect().catch(err => {
                console.error('Error disconnecting from browser:', err);
            });
        }
    }
}

// Hàm tắt Chrome đã mở bằng PID
async function closeChromeBrowsers(chromePids: number[]): Promise<void> {
    console.log('Closing all Chrome instances...');
    
    for (const pid of chromePids) {
        try {
            if (process.platform === 'win32') {
                execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            } else {
                execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            }
        } catch (error) {
            // Bỏ qua lỗi nếu quá trình không tồn tại
        }
    }
    
    // Đảm bảo tất cả đều đóng
    if (process.platform === 'win32') {
        try {
            execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' });
        } catch (error) {
            // Bỏ qua lỗi nếu không có Chrome nào chạy
        }
    }
    
    console.log('Chrome instances closed.');
}

// Hàm chính để chạy lặp lại các phiên
async function runLoop(maxCycles: number): Promise<void> {
    // Đảm bảo các thư mục tồn tại
    ensureDirectories();
    
    // Tải tất cả proxy vào bộ nhớ
    loadAllProxiesFromFile();
    
    if (allProxiesFromFile.length === 0) {
        console.warn("No proxies loaded. Running without proxies.");
    }
    
    let currentCycle = 0;
    while (currentCycle < maxCycles) {
        currentCycle++;
        console.log(`\n--- Starting Cycle ${currentCycle}/${maxCycles} ---`);
        
        try {
            // Khởi động nhiều cửa sổ Chrome
            const chromePids = await launchMultipleChromeInstances(NUM_CHROME_INSTANCES);
            
            if (chromePids.length === 0) {
                console.error("Failed to launch Chrome instances. Skipping cycle.");
                continue;
            }
            
            console.log(`Launched ${chromePids.length} Chrome instances`);
            
            // Chạy phiên mô phỏng
            await simulateMultiInstanceSession(chromePids);
            
            // Đóng tất cả trình duyệt
            await closeChromeBrowsers(chromePids);
            
            // Chờ một khoảng thời gian trước khi bắt đầu chu kỳ mới
            const delay = 10000 + Math.random() * 10000; // 10-20s
            console.log(`--- Cycle ${currentCycle} finished. Waiting ${Math.round(delay / 1000)}s before next cycle ---`);
            await sleep(delay);
            
        } catch (cycleError) {
            console.error(`Error in cycle ${currentCycle}:`, cycleError);
        }
    }
    
    console.log('\nMaximum cycles reached. Script finished.');
}

// Chạy script
console.log('Starting enhanced Puppeteer multi-instance script...');
runLoop(MAX_CYCLES).catch(error => {
    console.error('Fatal error in main loop:', error);
    process.exit(1);
});