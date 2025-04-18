import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import morgan from 'morgan';
import { helpers } from './helpers';
import { mockSwiper } from './mock/series';
import { CategoryService } from './services/graphql/category.service';
import { ArticleService } from './services/graphql/article.service';
import helmet from 'helmet';
import { log } from 'console';

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 3000;

const categoryService = new CategoryService();
const articleService = new ArticleService();

// Sử dụng Morgan middleware để ghi log HTTP requests
app.use(morgan('dev'));
// app.use(helmet());

// Cấu hình Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(process.cwd(), 'src/views/layouts'),
    partialsDir: path.join(process.cwd(), 'src/views/partials'),
    helpers: helpers
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(process.cwd(), 'src/views'));

// Cấu hình static files
app.use('/script', express.static(path.join(process.cwd(), 'src/views/scripts')));
app.use('/style', express.static(path.join(process.cwd(), 'src/views/styles')));
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
    const relatedArticle = await articleService.getRelatedArticles({
        sort: ['publishedAt:desc'],
        pagination: {
            limit: 4,
        },
    });
    console.log('categories: ', categories);
    console.log('relatedArticle', relatedArticle);
    const categoriesParse = categoryService.categoriesParse(categories);
    const parsedRelatedArticle = articleService.articlesParse(relatedArticle);
    console.log('categoriesParse', categoriesParse);
    console.log('relatedArticleWithBaseUrl', parsedRelatedArticle);   
    res.render('home', {
        title: 'Lĩnh Nam Dạ Thoại - Trang chủ',
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
            keywords: 'lĩnh nam dạ thoại, regisna.site, trang chủ',
            ogTitle: 'Lĩnh Nam Dạ Thoại - Chuyện Người Việt Kể',
            ogDescription: 'Đưa câu chuyện Việt Nam ra thế giới và mang câu chuyện thế giới về Việt Nam',
            ogImage: '/assets/images/og-image.jpg',
            ogUrl: 'https://regisna.site'
        },
        categories: categoriesParse,
        relatedArticle: parsedRelatedArticle[0],
        articles: parsedRelatedArticle.slice(1),
    });
});

// Route cho trang article với slug
app.get('/article/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        // Lấy thông tin bài viết từ slug
        const articleData = await articleService.getArticleBySlug({
            filters: {
                slug: {
                    eq: slug
                }
            }
        });
        
        // Nếu không tìm thấy bài viết, trả về trang 404
        if (!articleData || articleData.length === 0) {
            return res.status(404).render('404', {
                title: 'Không tìm thấy trang | Lĩnh Nam Dạ Thoại',
                cssFiles: [
                    'font.css',
                    'theme.css',
                    'nav.css',
                    'style.css'
                ],
                meta: {
                    description: 'Trang bạn đang tìm kiếm không tồn tại',
                    keywords: 'không tìm thấy, 404, error, lĩnh nam dạ thoại',
                    ogTitle: 'Không tìm thấy trang - Lĩnh Nam Dạ Thoại',
                    ogDescription: 'Trang bạn đang tìm kiếm không tồn tại',
                    ogUrl: `https://regisna.site/article/${slug}`
                }
            });
        }
        
        // Parse dữ liệu bài viết
        const parsedArticle = articleService.articlesParseBySlug(articleData)[0];
        
        // Lấy danh mục để hiển thị trên thanh navigation
        const categories = await categoryService.getAllCategories();
        const categoriesParse = categoryService.categoriesParse(categories);
        
        // Tạo full URL cho tính năng chia sẻ
        const host = req.get('host');
        const protocol = req.protocol;
        const fullUrl = `${protocol}://${host}/article/${slug}`;
        
        // Render trang chi tiết bài viết
        res.render('article', {
            title: `${parsedArticle.title} | Lĩnh Nam Dạ Thoại`,
            currentPath: req.path,
            cssFiles: [
                'font.css',
                'theme.css',
                'nav.css',
                'article.css',
                'style.css'
            ],
            meta: {
                description: parsedArticle.description || parsedArticle.title,
                keywords: `${parsedArticle.title}, lĩnh nam dạ thoại, regisna.site`,
                ogTitle: `${parsedArticle.title} - Lĩnh Nam Dạ Thoại`,
                ogDescription: parsedArticle.description || parsedArticle.title,
                ogImage: parsedArticle.thumbnail?.url || '/assets/images/og-image.jpg',
                ogUrl: `https://regisna.site/article/${slug}`
            },
            article: parsedArticle,
            categories: categoriesParse,
            fullUrl: fullUrl // Pass the full URL for sharing
        });
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).render('error', {
            title: 'Lỗi hệ thống | Lĩnh Nam Dạ Thoại',
            message: 'Đã xảy ra lỗi khi tải bài viết. Vui lòng thử lại sau.'
        });
    }
});

// Route cho trang category với slug
app.get('/category/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        // Lấy thông tin danh mục từ slug
        const category = await categoryService.getCategoriesBySlug(slug);
        
        // Nếu không tìm thấy danh mục, vẫn render trang nhưng với thông báo không tìm thấy
        if (!category) {

            // Lấy danh mục để hiển thị trên thanh navigation
            return res.status(404).render('category', {
                title: 'Không tìm thấy danh mục | Lĩnh Nam Dạ Thoại',
                currentPath: req.path,
                cssFiles: [
                    'font.css',
                    'theme.css',
                    'nav.css',
                    'style.css'
                ],
                meta: {
                    description: 'Danh mục bạn đang tìm kiếm không tồn tại',
                    keywords: 'không tìm thấy, danh mục, lĩnh nam dạ thoại',
                    ogTitle: 'Không tìm thấy danh mục - Lĩnh Nam Dạ Thoại',
                    ogDescription: 'Danh mục bạn đang tìm kiếm không tồn tại',
                    ogUrl: `https://regisna.site/category/${slug}`
                },
                category: null,
                articles: [],
                categories: [],
                fullUrl: null // Pass null for the full URL since the category was not found
            });
        }
        
        const parsedCategory = categoryService.parseCategoriesBySlug(category)[0];

        // Lấy bài viết theo danh mục
        const articlesData = await articleService.getArtcleByCategory(slug, {
            sort: ['publishedAt:desc'],
            pagination: {
                limit: 12
            }
        });
        
        // Parse dữ liệu bài viết
        const parsedArticles = articleService.articlesParse(articlesData);
        
        // Lấy danh mục để hiển thị trên thanh navigation
        const categories = await categoryService.getAllCategories();
        const categoriesParse = categoryService.categoriesParse(categories);
        
        // Tạo full URL cho tính năng chia sẻ
        const host = req.get('host');
        const protocol = req.protocol;
        const fullUrl = `${protocol}://${host}/category/${slug}`;
        
        // Render trang danh mục
        res.render('category', {
            title: ` Lĩnh Nam Dạ Thoại`,
            currentPath: req.path,
            cssFiles: [
                'font.css',
                'theme.css',
                'nav.css',
                'style.css'
            ],
            meta: {
                description: parsedCategory.description || `Các bài viết thuộc danh mục ${parsedCategory.name}`,
                keywords: `${parsedCategory.name}, danh mục, lĩnh nam dạ thoại, regisna.site`,
                ogTitle: `${parsedCategory.name} - Lĩnh Nam Dạ Thoại`,
                ogDescription: parsedCategory.description || `Các bài viết thuộc danh mục ${parsedCategory.name}`,
                ogImage: parsedCategory.thumbnail || '/assets/images/og-image.jpg',
                ogUrl: `https://regisna.site/category/${slug}`
            },
            category: parsedCategory,
            relatedArticle: parsedArticles[0],
            articles: parsedArticles,
            categories: categoriesParse,
            fullUrl: fullUrl // Pass the full URL for sharing
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).render('error', {
            title: 'Lỗi hệ thống | Lĩnh Nam Dạ Thoại',
            message: 'Đã xảy ra lỗi khi tải danh mục. Vui lòng thử lại sau.'
        });
    }
});

// Global 404 handler - thêm trước phần khởi động server
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Không tìm thấy trang | Lĩnh Nam Dạ Thoại',
        cssFiles: [
            'font.css', 
            'theme.css',
            'nav.css',
            'style.css'
        ],
        meta: {
            description: 'Trang bạn đang tìm kiếm không tồn tại',
            keywords: 'không tìm thấy, 404, error, lĩnh nam dạ thoại, regisna.site',
            ogTitle: 'Không tìm thấy trang - Lĩnh Nam Dạ Thoại',
            ogDescription: 'Trang bạn đang tìm kiếm không tồn tại',
            ogUrl: 'https://regisna.site/404'
        }
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});