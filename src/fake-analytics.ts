// this script is for fake analytics for google analytics
import axios, { AxiosRequestConfig } from 'axios';
import { log } from 'console';
import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import UserAgent from 'user-agents';
import * as useragent from 'useragent';
import { parse as parseUA } from 'useragent';

interface Proxy {
    host: string;
    port: string;
    username: string;
    password: string;
}

interface GoogleAnalyticsParams {
    v: string;           // Version của Google Analytics (v:2)
    tid: string;         // Tracking ID (G-EPLTRJB2W8)
    gtm: string;         // Google Tag Manager ID (45je5490h2v9217298722za200)
    _p: string;          // Timestamp của page view (1744244521193)
    gcd: string;         // Google Consent Data (13l3l3l3l1l1)
    npa: string;         // Non-Personalized Ads (0)
    dma: string;         // Digital Markets Act (0)
    tag_exp: string;     // Tag Experiments (102509683~102788824~...)
    cid: string;         // Client ID (358690647.1744243598)
    ul: string;          // User Language (vi)
    sr: string;          // Screen Resolution (1536x864)
    uaa: string;         // User Agent Architecture (x86)
    uab: string;         // User Agent Bit (64)
    uafvl: string;       // User Agent Full Version List (Microsoft Edge;...)
    uamb: string;        // User Agent Mobile (0)
    uam: string;         // User Agent Model
    uap: string;         // User Agent Platform (Windows)
    uapv: string;        // User Agent Platform Version (15.0.0)
    uaw: string;         // User Agent Wow64 (0)
    are: string;         // Ad Rendering Enabled (1)
    frm: string;         // Frame (0)
    pscdl: string;       // Personalization Storage Consent Decision List (noapi)
    _s: string;          // Session Hit Count (1)
    sid: string;         // Session ID (1744243598)
    sct: string;         // Session Count (1)
    seg: string;         // Session Engagement (1)
    dl: string;          // Document Location URL (https://regisna.site/)
    dt: string;          // Document Title (Trang chủ | Vietales)
    en: string;          // Event Name (page_view)
    _ee: string;         // Event Engagement (1)
    tfd: string;         // Time From Document (5281)
}

const GTM = 'GTM-XXXXXXX';
const TID = 'G-EPLTRJB2W8';
const ENDPOINT = 'https://www.google-analytics.com/g/collect';
const PROXY_FILE = path.join(process.cwd(), 'public/proxy.txt');
const PAGE_PATH = ['/', '/components'];

const parseProxy = (proxy: string): Proxy => {
    const [host, port, username, password] = proxy.split(':');
    return { host, port, username, password };
};

// Tạo sec-ch-ua dựa trên thông tin từ useragent
const generateSecChUa = (parsedUA: useragent.Agent) => {
    const browser = parsedUA.family || 'Unknown';
    const version = parsedUA.major || '0';
    const isChromium = /Chrome|Edge|Opera|Brave|Vivaldi|Samsung|YaBrowser/.test(browser);

    // Định dạng chuỗi sec-ch-ua
    let secChUa = `\"${browser}\";v=\"${version}\"`;

    // Thêm Not-A.Brand và Chromium nếu là trình duyệt dựa trên Chromium
    if (isChromium) {
        secChUa += `, \"Not-A.Brand\";v=\"8\"`;

        // Xác định phiên bản Chromium
        const chromiumVersion = parsedUA.major || '0';
        secChUa += `, \"Chromium\";v=\"${chromiumVersion}\"`;
    }

    return secChUa;
};


async function letCall(params: GoogleAnalyticsParams, proxy: Proxy, ua: UserAgent['data']) {
    try {
        const parsedUA = parseUA(ua.userAgent);
        
        console.log('sec-ch-ua: ', generateSecChUa(parsedUA));
        
        // Cấu hình request
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: ENDPOINT,
            params,
            headers: {
                "accept": "*/*",
                "accept-language": "vi,en-US;q=0.9,en;q=0.8",
                "priority": "u=1, i",
                "sec-ch-ua": generateSecChUa(parsedUA),
                "sec-ch-ua-mobile": parsedUA.device.family === 'iPhone' || parsedUA.device.family === 'iPad' || /Mobile|Android/.test(parsedUA.family) ? "?1" : "?0",
                "sec-ch-ua-platform": parsedUA.os.family,
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site",
                "sec-fetch-storage-access": "active"
            },
            proxy: {
                host: proxy.host,
                port: parseInt(proxy.port),
                auth: {
                    username: proxy.username,
                    password: proxy.password
                }
            }
        };
        
        // // Thực hiện gọi API
        // try {
        //     const response = await axios.request(config);
        //     console.log(`[${proxy.host}:${proxy.port}] Analytics request sent successfully`);
        //     return response.data;
        // } catch (err) {
        //     console.error(`[${proxy.host}:${proxy.port}] Error sending analytics:`, err.message);
        //     return null;
        // }
    } catch (error) {
        console.error('Error configuring analytics request:', error);
        return null;
    }
}

async function bootstrap() {
    const proxies = await fs.readFile(PROXY_FILE, 'utf-8');
    const proxyList: Proxy[] = proxies.split('\n').map(parseProxy);

    const userAgent = new UserAgent();
    const userAgents = Array(100).fill('').map(() => userAgent);
    // console.log(userAgents);
    const promises = userAgents.map(async (agent) => {
        const params: GoogleAnalyticsParams = {
            v: '2',
            tid: TID,
            gtm: GTM,
            _p: Date.now().toString(),
            gcd: '13l3l3l3l1l1',
            npa: '0',
            dma: '0',
            tag_exp: '',
            cid: '',
            ul: '',
            sr: '',
            uaa: '',
            uab: '',
            uafvl: '',
            uamb: '',
            uam: '',
            uap: '',
            uapv: '',
            uaw: '',
            are: '',
            frm: '',
            pscdl: '',
            _s: '',
            sid: '',
            sct: '',
            seg: '',
            dl: '',
            dt: '',
            en: '',
            _ee: '',
            tfd: ''
        } 

        const randomPage = PAGE_PATH[Math.floor(Math.random() * PAGE_PATH.length)];
        params.dl = randomPage;

        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        const parsedUA = parseUA(randomUserAgent.data.userAgent);

        params.ul = 'vi';
        params.sr = `${randomUserAgent.data.screenWidth}x${randomUserAgent.data.screenHeight}`;
        params.uaa = randomUserAgent.data.cpuClass || '';
        params.uab = '64';
        params.uafvl = parsedUA.toString();

        params.uamb = parsedUA.device.family === 'iPhone' || parsedUA.device.family === 'iPad' || /Mobile|Android/.test(parsedUA.family)? "1" : "0";
        params.uam = parsedUA.device.major || '';
        params.uap = parsedUA.os.family;
        params.uapv = parsedUA.os.major;

        params.uaw = '0';
        params.are = '1';
        params.frm = '0';
        params.pscdl = 'noapi';
        params._s = '1';
        params.sid = Date.now().toString();
        params.sct = '1';
        params.seg = '1';
        params.dt = 'Trang chủ | Vietales';

        const randomProxy = proxyList[Math.floor(Math.random() * proxyList.length)];

        return letCall(params, randomProxy, randomUserAgent.data);
    })
    
}

bootstrap();