const axios = require('axios');

// Biến global để xác định phương thức gọi API: 0 = axios, 1 = fetch
const option = 0; // Mặc định sử dụng axios

// Tách phần cookie ra thành biến riêng để dễ dàng thêm/sửa
const cookies = {
    visitor_uuid: 'c4a6dcf2c5a14164b0b6e0b386107cb7',
    frontend_lang: 'vi_VN',
    tz: 'Asia/Saigon',
    session_id: 'acef7dab6237c64769b81528658270812cae7c80'
};

// Chuyển đổi object cookies thành chuỗi
const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');

// Tách headers thành object riêng
const headers = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "vi;q=0.5",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Brave\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "upgrade-insecure-requests": "1",
    "cookie": cookieString,
    "Referer": "https://lms.ptit.edu.vn/auth_oauth/signin",
    "Referrer-Policy": "strict-origin-when-cross-origin"
};

// Tạo payload data
const data = {
    "jsonrpc": "2.0",
    "method": "call",
    "id": Math.floor(Math.random() * 1000 * 1000 * 1000),
    "params": {
        "slide_id": 166
    }
};

// URL endpoint
const url = 'https://lms.ptit.edu.vn/slides/slide/quiz/get';

// Hàm gọi API sử dụng axios
async function callWithAxios() {
    // Cấu hình request
    const config = {
        method: 'post',
        url: url,
        headers: headers,
        data: data
    };

    // Thực hiện request với axios
    try {
        const response = await axios(config);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error (axios):', error);
        return null;
    }
}

// Hàm gọi API sử dụng fetch
async function callWithFetch() {
    // Cấu hình request
    const config = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    };

    // Thực hiện request với fetch
    try {
        const response = await fetch(url, config);
        const responseData = await response.json();
        console.log(responseData);
        return responseData;
    } catch (error) {
        console.error('Error (fetch):', error);
        return null;
    }
}

// Gọi API dựa vào biến option
if (option === 0) {
    console.log('Sử dụng phương thức: axios');
    callWithAxios();
} else {
    console.log('Sử dụng phương thức: fetch');
    callWithFetch();
}