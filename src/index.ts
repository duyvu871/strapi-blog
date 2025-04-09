import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import morgan from 'morgan';
import { helpers } from './helpers/index.ts';
import { mockSwiper } from './mock/series.ts';
import { CategoryService } from './services/graphql/category.service.ts';
import { ArticleService } from './services/graphql/article.service.ts';
import helmet from 'helmet';

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 3000;

const categoryService = new CategoryService();
const articleService = new ArticleService();

// Sử dụng Morgan middleware để ghi log HTTP requests
app.use(morgan('dev'));
app.use(helmet());

// Cấu hình Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: helpers
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Cấu hình static files
app.use('/script', express.static(path.join(__dirname, 'views/scripts')));
app.use('/style', express.static(path.join(__dirname, 'views/styles')));
app.use('/static/fonts', express.static(path.join(process.cwd(), 'public/fonts')));
app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
app.use('/assets', express.static(path.join(process.cwd(), 'public/assets')));


// Route cho trang demo component
app.get('/components', async (req, res) => {
    const categories = await categoryService.getAllCategories();
    const relatedArticle = await articleService.getRelatedArticles({
        "sort": [
            "publishedAt:desc"
        ],
        "pagination": {
            "limit": 1
        }
    });
    console.log('categories: ', categories);

    const categoriesParse = categoryService.categoriesParse(categories);
    res.render('components-demo', {
        title: 'Components Demo',
        jsFiles: [
            'series-swiper.js',
        ],
        cssFiles: [
            'swiper.css',
            'font.css',
            'theme.css'
        ],
        meta: {
            description: 'Trang demo các components Typography, Button, Card',
            keywords: 'components, typography, button, card, alpinejs, tailwindcss',
            ogTitle: 'Components Demo - Vietales',
            ogDescription: 'Xem demo các components Typography, Button, Card',
            ogImage: '/assets/images/og-image.jpg',
            ogUrl: 'https://example.com/components'
        },
        series: mockSwiper,
        categories: categoriesParse,
    });
});

// Routes
app.get('/', async (req, res) => {
    const categories = await categoryService.getAllCategories();
    const relatedArticle = await articleService.getRelatedArticles();
    console.log('categories: ', categories);
    console.log('relatedArticle', relatedArticle);
    const categoriesParse = categoryService.categoriesParse(categories);
    const relatedArticleWithBaseUrl = articleService.articlesParse(relatedArticle)[0];
    console.log('categoriesParse', categoriesParse);
    console.log('relatedArticleWithBaseUrl', relatedArticleWithBaseUrl);   
    res.render('home', {
        title: 'Trang chủ',
        currentPath: req.path,
        cssFiles: [
            'swiper.css',
            'font.css',
            'theme.css',
            'nav.css',
            'style.css'
        ],
        meta: {
            description: 'Đưa câu chuyện Việt Nam ra thế giới và mang câu chuyện thế giới về Việt Nam',
            keywords: 'từ khóa, trang chủ',
            ogTitle: 'Vietales - Chuyện Người Việt Kể',
            ogDescription: 'Đưa câu chuyện Việt Nam ra thế giới và mang câu chuyện thế giới về Việt Nam',
            ogImage: '/assets/images/og-image.jpg',
            ogUrl: 'https://example.com'
        },
        categories: categoriesParse,
        relatedArticle: relatedArticleWithBaseUrl,
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});