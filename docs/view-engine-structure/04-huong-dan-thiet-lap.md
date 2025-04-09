# Hướng Dẫn Thiết Lập và Sử Dụng Hệ Thống

Tài liệu này cung cấp hướng dẫn từng bước để thiết lập và sử dụng hệ thống front-end với Handlebars, Express và Tailwind CSS.

## 1. Cấu Trúc Thư Mục

Tạo cấu trúc thư mục theo mô hình trong `01-cau-truc-thu-muc.md`:

```
src/
├── views/                  # Thư mục chứa tất cả các file view
│   ├── layouts/            # Các layout chính của ứng dụng
│   ├── partials/           # Các component có thể tái sử dụng
│   ├── scripts/            # JavaScript files
│   ├── styles/             # CSS files
│   └── *.handlebars        # Các trang cụ thể
```

## 2. Cấu Hình Express và Handlebars

Trong file `src/loaders/express.loader.ts`:

```typescript
import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path/posix';

class ExpressServer {
    private _app!: express.Express;

    private listen(): void {
        this._app = express();

        // Cấu hình Handlebars
        this._app.engine('handlebars', engine({
            defaultLayout: 'main',
            layoutsDir: path.join(process.cwd(), 'src/views/layouts'),
            partialsDir: path.join(process.cwd(), 'src/views/partials'),
        }));
        this._app.set('view engine', 'handlebars');
        this._app.set('views', path.join(process.cwd(), 'src/views'));

        // Cấu hình static files
        this._app.use('/statics/script', express.static(path.join(process.cwd(),'src/views/scripts')));
        this._app.use('/statics/style', express.static(path.join(process.cwd(), 'src/views/styles')));
        this._app.use('/statics', express.static('statics'));
        this._app.use('/storage', express.static('storage'));
    }
}
```

## 3. Thiết Lập Routes

Trong file `src/api/routes/page.route.ts`:

```typescript
import { Router } from 'express';
import { pageAuthenticate } from 'middlewares/page-authenticate';

const pageRouter = Router();

// Home page route (login/register page)
pageRouter.get('/', (req, res) => {
    res.render('home', {
        title: 'Authentication'
    });
});

// Dashboard page route
pageRouter.get('/dashboard', pageAuthenticate('/'), (req, res) => {
    res.render('dashboard', {
        title: 'User Dashboard'
    });
});

// File Manager page route
pageRouter.get('/file-manager', pageAuthenticate('/'), (req, res) => {
    res.render('file-manager', {
        title: 'File Manager'
    });
});

export default pageRouter;
```

Trong file `src/api/routes.ts`:

```typescript
import { Router } from "express";
import pageRoutes from "routes/page.route";

const apiRouter = Router();
const pageRouter = Router();

// Add page routes directly to the page router
pageRouter.use("/", pageRoutes);

export default {
    apiRoutes: apiRouter,
    pageRoutes: pageRouter
};
```

## 4. Tạo Layout và Views

### Layout Chính (`src/views/layouts/main.handlebars`)

```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <link href="/statics/style/tailwind.css" rel="stylesheet">
</head>
<body>
    {{{body}}}
    <script src="/statics/script/alpine.js"></script>
</body>
</html>
```

### Trang Home (`src/views/home.handlebars`)

```handlebars
<div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-4">{{title}}</h1>
    <!-- Nội dung trang -->
</div>
```

## 5. Khởi Chạy Ứng Dụng

Trong file `package.json`:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

Chạy ứng dụng:

```bash
# Chế độ development
npm run dev

# Hoặc build và chạy production
npm run build
npm start
```

## 6. Tích Hợp API

Trong file `src/views/scripts/api.js`:

```javascript
const api = {
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    get(url, options = {}) {
        return this.request(url, { method: 'GET', ...options });
    },
    
    post(url, data, options = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }
};
```

## 7. Triển Khai

### Chuẩn Bị Triển Khai

```bash
# Build project
npm run build

# Kiểm tra ứng dụng
npm start
```

### Triển Khai Production

1. **Sử dụng PM2**:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name "app-name"
   ```

2. **Cấu hình Nginx**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```