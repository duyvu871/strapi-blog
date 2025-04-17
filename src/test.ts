import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Cấu hình puppeteer-extra plugins
puppeteerExtra.use(StealthPlugin());
puppeteerExtra.use(AnonymizeUAPlugin());
puppeteerExtra.use(RecaptchaPlugin({
    provider: {
        id: '2captcha',
        token: process.env.CAPTCHA_TOKEN || '' // Thêm token vào biến môi trường nếu cần
    },
    visualFeedback: true
}));
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

// Các hằng số và cấu hình
const WEBSITE_URLS = [
    'https://regisna.site',
    'https://regisna.site/components'
    // Thêm các URL khác nếu cần
];
const NUM_WINDOWS = 10; // Số lượng CỬA SỔ Chrome mở cùng lúc
const SESSION_DURATION_MS = 60 * 1000; // Thời gian mỗi phiên (1 phút)
const SCROLL_INTERVAL_MS = 500; // Thời gian giữa các lần scroll
const MAX_CYCLES = 10; // Số lần lặp lại quy trình
const PROXY_FILE_PATH = path.resolve(__dirname, '../public/proxy_check_log.txt'); // Đường dẫn tới file proxy
const PROXY_CHECK_URL = 'https://httpbin.org/ip'; // URL để kiểm tra proxy
const PROXY_CHECK_TIMEOUT = 10000; // Timeout 10 giây cho axios

let allProxiesFromFile: string[] = []; // Danh sách TẤT CẢ proxy đọc từ file
const usedProxiesThisRun = new Set<string>(); // Set để theo dõi proxy đã dùng trong cả phiên chạy script

// Hàm sleep để tạo độ trễ
async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Triển khai sự kiện first_open
async function trackFirstOpen(page: Page): Promise<void> {
    console.log('Tracking first_open event in page...');
    try {
        // Thực hiện hàm đánh dấu first_open trong trình duyệt
        await page.evaluate(() => {
            // Kiểm tra xem đây có phải là lần đầu tiên người dùng truy cập hay không
            const isFirstOpen = !localStorage.getItem('app_first_open');
            
            if (isFirstOpen) {
                // Đánh dấu đã mở ứng dụng lần đầu
                localStorage.setItem('app_first_open', Date.now().toString());
                
                // Lấy thông tin để gửi kèm với event first_open
                const previousGmpAppId = localStorage.getItem('previous_gmp_app_id') || '';
                const updatedWithAnalytics = !!localStorage.getItem('updated_with_analytics');
                const previousFirstOpenCount = parseInt(localStorage.getItem('previous_first_open_count') || '0');
                const systemApp = navigator.userAgent;
                const systemAppUpdate = localStorage.getItem('system_app_update') || '';
                const deferredAnalyticsCollection = false;
                const resetAnalyticsCause = localStorage.getItem('reset_analytics_cause') || '';
                const engagementTimeMillisec = 0;
                
                // Cập nhật số lần mở lần đầu
                localStorage.setItem('previous_first_open_count', (previousFirstOpenCount + 1).toString());
                
                // Kiểm tra xem thư viện gtag đã được tải chưa
                if (typeof (window as any).gtag === 'function') {
                    // Ghi nhận sự kiện first_open với Google Analytics
                    (window as any).gtag('event', 'first_open', {
                        'previous_gmp_app_id': previousGmpAppId,
                        'updated_with_analytics': updatedWithAnalytics,
                        'previous_first_open_count': previousFirstOpenCount,
                        'system_app': systemApp,
                        'system_app_update': systemAppUpdate,
                        'deferred_analytics_collection': deferredAnalyticsCollection,
                        'reset_analytics_cause': resetAnalyticsCause,
                        'engagement_time_msec': engagementTimeMillisec
                    });
                    
                    return 'First open event has been sent to Google Analytics';
                } else {
                    return 'Google Analytics (gtag) not available';
                }
            } else {
                return 'Not first open';
            }
        }).then((result) => {
            console.log(`First open tracking result: ${result}`);
        });
    } catch (error) {
        console.error('Error while tracking first_open event:', error);
    }
}

// Theo dõi thời gian tương tác của người dùng
async function trackUserEngagement(page: Page): Promise<void> {
    try {
        await page.evaluate(() => {
            // Lưu thời gian bắt đầu
            const startTime = Date.now();
            
            // Trước khi rời trang, ghi nhận thời gian tương tác
            window.addEventListener('beforeunload', () => {
                const engagementTimeMillisec = Date.now() - startTime;
                
                // Kiểm tra xem thư viện gtag đã được tải chưa
                if (typeof (window as any).gtag === 'function') {
                    // Ghi nhận sự kiện user_engagement với Google Analytics
                    (window as any).gtag('event', 'user_engagement', {
                        'engagement_time_msec': engagementTimeMillisec
                    });
                }
            });
        });
        console.log('User engagement tracking initialized');
    } catch (error) {
        console.error('Error while setting up engagement tracking:', error);
    }
}

// Hàm scroll ngẫu nhiên trong một tab
async function randomScrollTab(page: Page, durationMs: number): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < durationMs) {
        try {
            await page.evaluate(() => {
                const scrollHeight = document.body.scrollHeight;
                const viewportHeight = window.innerHeight;
                const currentScroll = window.scrollY;
                
                // Chọn hướng scroll ngẫu nhiên (lên hoặc xuống)
                const direction = Math.random() > 0.5 ? 1 : -1; 
                // Chọn khoảng cách scroll ngẫu nhiên
                const scrollAmount = Math.random() * viewportHeight * 0.8; 
                
                let targetScroll = currentScroll + direction * scrollAmount;
                
                // Đảm bảo không scroll ra ngoài giới hạn
                targetScroll = Math.max(0, Math.min(targetScroll, scrollHeight - viewportHeight));
                
                window.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            });
            await sleep(SCROLL_INTERVAL_MS + Math.random() * 500); // Thêm chút ngẫu nhiên
        } catch (error) {
            // Bỏ qua lỗi nếu tab đã bị đóng hoặc có vấn đề
            break; // Thoát vòng lặp nếu có lỗi
        }
    }
    console.log(`Finished scrolling for tab: ${page.url()}`);
}

// Hàm kiểm tra một proxy bằng Axios
async function checkProxyWithAxios(proxy: string): Promise<boolean> {
    console.log(`Checking proxy: ${proxy}`);
    const proxyUrl = `http://${proxy}`; // https-proxy-agent cần URL đầy đủ
    const agent = new HttpsProxyAgent(proxyUrl);
    const source = axios.CancelToken.source();

    const timeoutId = setTimeout(() => {
        source.cancel(`Timeout of ${PROXY_CHECK_TIMEOUT}ms exceeded`);
    }, PROXY_CHECK_TIMEOUT);

    try {
        const response = await axios.get(PROXY_CHECK_URL, {
            httpsAgent: agent,
            timeout: PROXY_CHECK_TIMEOUT, // Đặt timeout trực tiếp cho axios
            cancelToken: source.token,
            validateStatus: function (status) {
                return status >= 200 && status < 500; // Chấp nhận các status code client/server error để log
            },
        });

        clearTimeout(timeoutId); // Hủy timeout nếu request thành công

        if (response.status === 200 && response.data && response.data.origin) {
            console.log(`Proxy OK: ${proxy}`);
            return true;
        } else {
            console.log(`Proxy FAILED (Status: ${response.status}): ${proxy}`);
            return false;
        }
    } catch (error: any) {
        clearTimeout(timeoutId); // Hủy timeout nếu có lỗi
        if (axios.isCancel(error)) {
            console.log(`Proxy FAILED (Timeout): ${proxy}`);
        } else {
            console.log(`Proxy FAILED (Error): ${proxy}`);
        }
        return false;
    }
}

// Hàm đọc tất cả proxy từ file vào bộ nhớ
function loadAllProxiesFromFile(): void {
    console.log(`Reading all proxies from: ${PROXY_FILE_PATH}`);
    allProxiesFromFile = []; // Reset
    try {
        const proxyData = fs.readFileSync(PROXY_FILE_PATH, 'utf8');
        allProxiesFromFile = proxyData.split(/\r?\n/).filter(p => p.trim() !== '' && p.includes(':'));
        console.log(`Loaded ${allProxiesFromFile.length} proxies into memory.`);
        if (allProxiesFromFile.length === 0) {
            console.warn("Warning: Proxy file is empty or contains no valid entries.");
        }
    } catch (error) {
        console.error(`Error reading proxy file: ${error}`);
        console.warn("Warning: Could not load proxies. Script might run without proxies if fallback is enabled.");
        allProxiesFromFile = [];
    }
}

// Hàm tìm và chọn proxy hợp lệ chưa được sử dụng từ danh sách đầy đủ
async function findAndSelectUnusedProxyFromFullList(): Promise<string | null> {
    console.log(`Searching for an unused, working proxy from the full list (${allProxiesFromFile.length} total)...`);

    // Duyệt qua toàn bộ danh sách proxy đã đọc từ file
    for (const proxy of allProxiesFromFile) {
        if (!usedProxiesThisRun.has(proxy)) {
            // Nếu proxy này chưa được dùng trong lần chạy này -> Kiểm tra ngay
            console.log(`Checking unused proxy: ${proxy}`);
            const isWorking = await checkProxyWithAxios(proxy); // Kiểm tra ngay trước khi dùng
            if (isWorking) {
                // Nếu hoạt động -> Chọn proxy này
                usedProxiesThisRun.add(proxy); // Đánh dấu đã sử dụng
                console.log(`Selected proxy: ${proxy}. Total used: ${usedProxiesThisRun.size}`);
                return proxy; // Trả về proxy hợp lệ
            } else {
                 console.log(`Proxy ${proxy} failed check.`);
                 // Không cần làm gì thêm, sẽ thử proxy tiếp theo trong danh sách
            }
        }
        // Nếu proxy đã có trong usedProxiesThisRun -> bỏ qua, thử proxy tiếp theo
    }

    console.log("Finished searching the list. No suitable unused proxy found.");
    return null; // Không tìm thấy proxy phù hợp sau khi duyệt hết danh sách
}

// Hàm mô phỏng một phiên mở nhiều CỬA SỔ và scroll
async function simulateMultiWindowSession(): Promise<void> {
    const browsers: Browser[] = [];
    const scrollPromises: Promise<void>[] = [];
    let windowsLaunched = 0;
    console.log(`Starting new multi-window session. Target: ${NUM_WINDOWS} windows...`);

    try {
        // Mở các cửa sổ và bắt đầu scroll
        for (let i = 0; i < NUM_WINDOWS; i++) {
            let browser: Browser | null = null;
            // --- Tìm proxy từ danh sách đầy đủ ---
            const selectedProxy = await findAndSelectUnusedProxyFromFullList();
            // ------------------------------------

            if (!selectedProxy) {
                console.warn(`Window ${i + 1}: Could not find a suitable proxy after checking the list. Stopping search for this cycle or running without proxy.`);
                console.log(`Window ${i + 1}: Running without proxy as fallback.`);
            }

            const launchOptions: LaunchOptions = {
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    ...(selectedProxy ? [`--proxy-server=${selectedProxy}`] : [])
                ],
                defaultViewport: null
            };

            try {
                console.log(`Window ${i + 1}: Launching ${selectedProxy ? 'with proxy ' + selectedProxy : 'without proxy'}...`);
                browser = await puppeteer.launch(launchOptions);
                browsers.push(browser);
                windowsLaunched++;
                const pages = await browser.pages();
                const page = pages[0] || await browser.newPage();

                const randomUrl = WEBSITE_URLS[Math.floor(Math.random() * WEBSITE_URLS.length)];
                console.log(`Window ${i + 1}: Navigating to ${randomUrl}`);
                await page.goto(randomUrl, { waitUntil: 'networkidle2', timeout: 45000 });

                // Theo dõi sự kiện first_open
                await trackFirstOpen(page);
                
                // Theo dõi thời gian tương tác
                await trackUserEngagement(page);

                scrollPromises.push(randomScrollTab(page, SESSION_DURATION_MS));
                await sleep(500);
            } catch (windowError) {
                console.error(`Error opening or navigating window ${i + 1} ${selectedProxy ? 'with proxy ' + selectedProxy : ''}:`, windowError);
                if (browser) {
                    await browser.close().catch(() => {});
                    const index = browsers.indexOf(browser);
                    if (index > -1) browsers.splice(index, 1);
                }
            }
        }

        console.log(`${windowsLaunched} windows opened successfully. Scrolling for ${SESSION_DURATION_MS / 1000} seconds...`);
        if (scrollPromises.length > 0) {
            await Promise.all(scrollPromises);
            console.log('Session duration finished.');
        } else {
            console.log('No scrolling tasks were initiated.');
        }

    } catch (error) {
        console.error('Error during multi-window session:', error);
    } finally {
        console.log(`Closing ${browsers.length} browser windows...`);
        await Promise.all(browsers.map(browser => browser.close().catch(err => console.error('Error closing a browser window:', err))));
        console.log('All browser windows closed.');
    }
}

// Hàm chính để chạy lặp lại các phiên
async function runLoop(maxCycles: number): Promise<void> {
    // --- Đọc TẤT CẢ proxy vào bộ nhớ MỘT LẦN ---
    loadAllProxiesFromFile();
    // ------------------------------------------

    if (allProxiesFromFile.length === 0 && NUM_WINDOWS > 0) {
        console.error("Proxy file is empty or unreadable, and proxies are required. Stopping script.");
        return; // Dừng nếu không đọc được proxy và cần dùng proxy
    }

    let currentCycle = 0;
    while (currentCycle < maxCycles) {
        currentCycle++;
        console.log(`\n--- Starting Cycle ${currentCycle}/${maxCycles} ---`);
        console.log(`Proxies used so far in this run: ${usedProxiesThisRun.size} / ${allProxiesFromFile.length}`);

        // Kiểm tra xem liệu tất cả proxy đã bị dùng hết chưa
        if (usedProxiesThisRun.size >= allProxiesFromFile.length && allProxiesFromFile.length > 0) {
             console.log("All proxies from the file have been attempted in this run. Stopping.");
             break; // Dừng nếu không còn proxy nào để thử
        }

        await simulateMultiWindowSession();
        const delay = 500//5000 + Math.random() * 5000;
        console.log(`--- Cycle ${currentCycle} finished. Waiting ${Math.round(delay / 1000)}s before next cycle ---`);
        await sleep(delay);
    }
    console.log('\nMaximum cycles reached or ran out of proxies. Script finished.');
}

// Chạy script
console.log('Starting Puppeteer script with dynamic proxy checking and first_open tracking...');
runLoop(MAX_CYCLES).catch(error => {
    console.error('Fatal error in main loop:', error);
    process.exit(1);
});