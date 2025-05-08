import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import morgan from 'morgan';
import { helpers } from './helpers';
import { mockSwiper } from './mock/series';
import { CategoryService } from './services/graphql/category.service';
import { ArticleService } from './services/graphql/article.service';
import { LatestArticlesService } from './services/graphql/latest-articles.service';
import { ComicService } from './services/comicService';
import { SitemapService } from './services/sitemap.service';
import helmet from 'helmet';
import { configDotenv } from 'dotenv';
import { ComicEpisode, ComicSeries } from './types/comic'; // Added ComicSeries for type usage if needed elsewhere
import { Pagination } from './types'; // Assuming Pagination type is defined in src/types.d.ts or similar
import { PaginationService, PaginationState } from './services/graphql/pagination.service'; // Import PaginationService and PaginationState

configDotenv({
    path: '.env'
});

// Define a type for the parsed article, if not already available globally
// This is a simplified version, adjust according to your actual parsed article structure
interface ParsedArticle {
    title: string;
    thumbnail: { url: string; alt: string; } | null;
    publishedAt: string;
    slug: string;
    type: string;
    url: string;
    description?: string; // Make optional if not always present
    categories?: { name: string; slug: string; }; // Make optional if not always present
    // Add other properties as needed
}

interface PaginationInfo {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Khởi tạo Express app
const app = express();

const categoryService = new CategoryService();
const articleService = new ArticleService();
// ComicService uses static methods, no need to instantiate

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
app.use('/favicon.ico', express.static(path.join(process.cwd(), 'public/favicon.ico')));
app.use('/robots.txt', express.static(path.join(process.cwd(), 'public/robots.txt')));
app.use('/site.webmanifest', express.static(path.join(process.cwd(), 'public/site.webmanifest')));

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
    const articles = await articleService.getRelatedArticles({
        sort: ['publishedAt:desc'],
        pagination: {
            limit: 8,
        },
    });
    // console.log('categories: ');
    console.log('relatedArticle', articles.map((item) => item.thumbnail.formats));
    const categoriesParse = categoryService.categoriesParse(categories);
    const parsedRelatedArticle = articleService.articlesParse(articles);
    const relatedArticle = articleService.parseRelatedArticles([articles[0]]);
    console.log('relatedArticleWithBaseUrl', relatedArticle);
    // console.log('categoriesParse', categoriesParse);
    // console.log('relatedArticleWithBaseUrl', parsedRelatedArticle);
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
        relatedArticle: relatedArticle[0],
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
    const slug = req.params.slug;
    const currentPage = parseInt(req.query.page as string) || 1;
    const articlesPerPage = 6;
    const baseUrl = req.path; // Base URL for pagination links (e.g., /category/some-slug)

    try {
        const category = await categoryService.getCategoriesBySlug(slug);
        const categories = await categoryService.getAllCategories();
        const categoriesParse = categoryService.categoriesParse(categories);

        if (!category || category.data.categories.length === 0) {
            return res.status(404).render('404', {
                title: 'Không tìm thấy danh mục | Lĩnh Nam Dạ Thoại',
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
                categories: categoriesParse, 
                fullUrl: null,
                paginationHTML: '' // Add empty paginationHTML for 404 case
            });
        }

        const parsedCategory = categoryService.parseCategoriesBySlug(category)[0];

        const articlesData = await articleService.getArtcleByCategory(slug, {
            sort: ['publishedAt:desc'],
            pagination: {
                page: currentPage,
                pageSize: articlesPerPage
            }
        });
        
        let articles: ParsedArticle[] = [];
        let paginationHTML = '';

        if (articlesData && articlesData.nodes) {
            articles = articleService.articlesParse(articlesData.nodes);
            if (articlesData.pageInfo && articlesData.pageInfo.total > articlesPerPage) { // Only generate pagination if more than one page
                const paginationState: PaginationState = {
                    totalItems: articlesData.pageInfo.total,
                    currentPage: articlesData.pageInfo.page,
                    itemsPerPage: articlesData.pageInfo.pageSize,
                    totalPages: articlesData.pageInfo.pageCount,
                    hasNextPage: articlesData.pageInfo.page < articlesData.pageInfo.pageCount,
                    hasPreviousPage: articlesData.pageInfo.page > 1,
                };
                paginationHTML = PaginationService.renderPaginationHTML(paginationState, baseUrl);
            }
        }

        const relatedArticleData = await articleService.getRelatedArticles({
            filters: {
                categories: {
                    slug: {
                        eq: slug
                    }
                }
            },
            sort: ['publishedAt:desc'],
            pagination: {
                limit: 1
            }
        });
        const parsedRelatedArticle = relatedArticleData.length > 0 ? articleService.parseRelatedArticles(relatedArticleData)[0] : null;

        const host = req.get('host');
        const protocol = req.protocol;
        const fullUrl = `${protocol}://${host}${req.originalUrl}`;

        res.render('category', {
            title: `${parsedCategory.name} | Lĩnh Nam Dạ Thoại`,
            currentPath: req.path,
            cssFiles: [
                'font.css',
                'theme.css',
                'nav.css',
                'style.css'
            ],
            meta: {
                description: parsedCategory.description || `Các bài viết thuộc danh mục ${parsedCategory.name}`,
                keywords: `${parsedCategory.name}, lĩnh nam dạ thoại, ${parsedCategory.description}`,
                ogTitle: `${parsedCategory.name} - Lĩnh Nam Dạ Thoại`,
                ogDescription: parsedCategory.description || `Tổng hợp các bài viết thuộc danh mục ${parsedCategory.name}`,
                ogImage: parsedCategory.thumbnail || '/assets/images/og-image.jpg',
                ogUrl: `https://regisna.site/category/${slug}`
            },
            category: parsedCategory,
            articles: articles,
            paginationHTML: paginationHTML, // Pass generated HTML to template
            categories: categoriesParse,
            relatedArticle: parsedRelatedArticle,
            fullUrl: fullUrl
        });
    } catch (error) {
        console.error('Error fetching category page:', error);
        res.status(500).render('error', {
            title: 'Lỗi hệ thống | Lĩnh Nam Dạ Thoại',
            message: 'Đã xảy ra lỗi khi tải trang danh mục. Vui lòng thử lại sau.',
            paginationHTML: '' // Add empty paginationHTML for error case
        });
    }
});

// Route cho trang comic series giới thiệu tất cả các series
app.get('/comics', async (req, res) => {
    try {
        // Lấy tất cả comic series
        const comicSeries = await ComicService.getAllComicSeries(1, 20);

        // Lấy danh mục để hiển thị trên thanh navigation
        const categories = await categoryService.getAllCategories();
        const categoriesParse = categoryService.categoriesParse(categories);

        // Tạo full URL cho tính năng chia sẻ
        const host = req.get('host');
        const protocol = req.protocol;
        const fullUrl = `${protocol}://${host}/comics`;

        // Render trang comics
        res.render('comics', {
            title: 'Comic Series | Lĩnh Nam Dạ Thoại',
            currentPath: req.path,
            cssFiles: [
                'font.css',
                'theme.css',
                'nav.css',
                'style.css'
            ],
            meta: {
                description: 'Khám phá các series truyện tranh độc đáo và hấp dẫn',
                keywords: 'comic, series, truyện tranh, lĩnh nam dạ thoại',
                ogTitle: 'Comic Series - Lĩnh Nam Dạ Thoại',
                ogDescription: 'Khám phá các series truyện tranh độc đáo và hấp dẫn',
                ogImage: '/assets/images/og-image.jpg',
                ogUrl: `https://regisna.site/comics`
            },
            comics: comicSeries,
            categories: categoriesParse,
            fullUrl: fullUrl
        });
    } catch (error) {
        console.error('Error fetching comic series:', error);
        res.status(500).render('error', {
            title: 'Lỗi hệ thống | Lĩnh Nam Dạ Thoại',
            message: 'Đã xảy ra lỗi khi tải comic series. Vui lòng thử lại sau.'
        });
    }
});

// Route cho trang chi tiết comic series với slug và có thêm tham số episode_id
app.get('/comic/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const episodeId = req.query.episode_id ? parseInt(req.query.episode_id as string) : 0;

        // Lấy thông tin comic series từ slug
        const comic = await ComicService.getComicBySlug(slug);
        // console.log('comic: ', comic?.comic_episodes);

        // Nếu không tìm thấy comic series, trả về trang 404
        if (!comic) {
            return res.status(404).render('404', {
                title: 'Không tìm thấy comic series | Lĩnh Nam Dạ Thoại',
                cssFiles: [
                    'font.css',
                    'theme.css',
                    'nav.css',
                    'style.css'
                ],
                meta: {
                    description: 'Comic series bạn đang tìm kiếm không tồn tại',
                    keywords: 'không tìm thấy, comic series, error, lĩnh nam dạ thoại',
                    ogTitle: 'Không tìm thấy comic series - Lĩnh Nam Dạ Thoại',
                    ogDescription: 'Comic series bạn đang tìm kiếm không tồn tại',
                    ogUrl: `https://regisna.site/comic/${slug}`
                }
            });
        }

        // Lấy các bài viết mới nhất
        const latestArticles = await LatestArticlesService.getLatestArticles(4);

        // console.log('latestArticles: ', latestArticles);

        // Xử lý hiển thị episode
        let currentEpisode: ComicEpisode | null = null;
        let currentEpisodeIndex = 0;
        let previousEpisode: number | null = null;
        let nextEpisode: number | null = null;

        if (comic.comic_episodes && comic.comic_episodes.length > 0) {
            // Nếu có episodeId, tìm episode tương ứng
            if (episodeId >= 0 && episodeId < comic.comic_episodes.length) {
                currentEpisodeIndex = episodeId;
                if (currentEpisodeIndex > -1) {
                    currentEpisode = comic.comic_episodes[currentEpisodeIndex];

                    // Đánh dấu episode hiện tại là active
                    if (currentEpisode) {
                        comic.comic_episodes = comic.comic_episodes.map((ep, index) => ({
                            ...ep,
                            active: index === episodeId
                        }));

                        // Tìm episode trước và sau
                        if (currentEpisodeIndex > 0) {
                            previousEpisode = currentEpisodeIndex - 1;
                        }

                        if (currentEpisodeIndex < comic.comic_episodes.length - 1) {
                            nextEpisode = currentEpisodeIndex + 1;
                        }
                    }
                }
            }
            // Nếu không có episodeId, hiển thị episode đầu tiên
            else {
                console.log('episodeId: ', episodeId);
                
                currentEpisode = comic.comic_episodes[0];
                currentEpisodeIndex = 0;
                if (comic.comic_episodes.length > 1) {
                    nextEpisode = 0;
                }
            }
        } else {
            // Nếu không có episode nào, trả về trang 404
            return res.status(404).render('404', {
                title: 'Không tìm thấy comic series | Lĩnh Nam Dạ Thoại',
                cssFiles: [
                    'font.css',
                    'theme.css',
                    'nav.css',
                    'style.css'
                ],
                meta: {
                    description: 'Comic series bạn đang tìm kiếm không tồn tại',
                    keywords: 'không tìm thấy, comic series, error, lĩnh nam dạ thoại',
                    ogTitle: 'Không tìm thấy comic series - Lĩnh Nam Dạ Thoại',
                    ogDescription: 'Comic series bạn đang tìm kiếm không tồn tại',
                    ogUrl: `https://regisna.site/comic/${slug}`
                }
            });
        }

        // format currnetEpisode page thumbnail
        //@ts-ignore
        currentEpisode.page_thumbnail_url = currentEpisode?.pages?.[0]?.formats?.medium?.url || '/assets/images/og-image.jpg';

        // console.log(comic.comic_episodes);
        

        // Lấy danh mục để hiển thị trên thanh navigation
        const categories = await categoryService.getAllCategories();
        const categoriesParse = categoryService.categoriesParse(categories);

        // Tạo full URL cho tính năng chia sẻ
        const host = req.get('host');
        const protocol = req.protocol;
        const fullUrl = episodeId
            ? `${protocol}://${host}/comic/${slug}?episode_id=${episodeId}`
            : `${protocol}://${host}/comic/${slug}`;

        // Render trang chi tiết comic series
        res.render('comic-detail', {
            title: `${comic.title} | Comic Series | Lĩnh Nam Dạ Thoại`,
            currentPath: req.path,
            cssFiles: [
                'font.css',
                'theme.css',
                'nav.css',
                'comic.css',
                'style.css'
            ],
            meta: {
                description: comic.description || comic.title,
                keywords: `${comic.title}, comic series, truyện tranh, lĩnh nam dạ thoại`,
                ogTitle: `${comic.title} - Comic Series - Lĩnh Nam Dạ Thoại`,
                ogDescription: comic.description || comic.title,
                ogImage: comic.thumbnail?.formats?.medium?.url || '/assets/images/og-image.jpg',
                ogUrl: fullUrl
            },
            comic: comic,
            currentEpisode: currentEpisode,
            currentEpisodeIndex: currentEpisodeIndex + 1, // +1 để hiển thị số tập từ 1
            previousEpisode: previousEpisode,
            nextEpisode: nextEpisode,
            latestArticles: latestArticles,
            categories: categoriesParse,
            fullUrl: fullUrl
        });
    } catch (error) {
        console.error('Error fetching comic series:', error);
        res.status(500).render('error', {
            title: 'Lỗi hệ thống | Lĩnh Nam Dạ Thoại',
            message: 'Đã xảy ra lỗi khi tải comic series. Vui lòng thử lại sau.'
        });
    }
});

// Route for search results page
app.get('/tim-kiem', async (req, res) => {
    const query = req.query.q as string || '';
    const currentPage = parseInt(req.query.page as string) || 1;
    const articlesPerPage = 6; // Or get from config
    const baseUrl = `/tim-kiem?q=${encodeURIComponent(query)}`; // Base URL for pagination, preserving the query

    try {
        const categories = await categoryService.getAllCategories();
        const categoriesParse = categoryService.categoriesParse(categories);

        if (!query.trim()) {
            // Optionally, render a page prompting for a search term or show popular searches
            return res.render('search-results', {
                title: 'Tìm kiếm | Lĩnh Nam Dạ Thoại',
                cssFiles: ['font.css', 'theme.css', 'nav.css', 'style.css'],
                meta: {
                    description: 'Tìm kiếm bài viết trên Lĩnh Nam Dạ Thoại',
                    keywords: 'tìm kiếm, search, lĩnh nam dạ thoại',
                    ogTitle: 'Tìm kiếm - Lĩnh Nam Dạ Thoại',
                    ogDescription: 'Tìm kiếm bài viết trên Lĩnh Nam Dạ Thoại',
                    ogUrl: `https://regisna.site/tim-kiem`
                },
                query: '',
                articles: [],
                categories: categoriesParse,
                paginationHTML: '',
                message: 'Vui lòng nhập từ khóa để tìm kiếm.'
            });
        }

        const articlesData = await articleService.searchArticles(query, {
            sort: ['publishedAt:desc'],
            pagination: {
                page: currentPage,
                pageSize: articlesPerPage
            }
        });

        let articles: ParsedArticle[] = [];
        let paginationHTML = '';
        let message = '';

        if (articlesData && articlesData.nodes) {
            articles = articleService.articlesParse(articlesData.nodes);
            if (articlesData.pageInfo && articlesData.pageInfo.total > 0 && articlesData.pageInfo.total > articlesPerPage) {
                const paginationState: PaginationState = {
                    totalItems: articlesData.pageInfo.total,
                    currentPage: articlesData.pageInfo.page,
                    itemsPerPage: articlesData.pageInfo.pageSize,
                    totalPages: articlesData.pageInfo.pageCount,
                    hasNextPage: articlesData.pageInfo.page < articlesData.pageInfo.pageCount,
                    hasPreviousPage: articlesData.pageInfo.page > 1,
                };
                paginationHTML = PaginationService.renderPaginationHTML(paginationState, baseUrl);
            }
            if (articlesData.nodes.length === 0) {
                message = `Không tìm thấy kết quả nào cho từ khóa "${query}".`;
            }
        } else {
            message = `Đã có lỗi xảy ra trong quá trình tìm kiếm. Vui lòng thử lại.`;
        }
        
        const host = req.get('host');
        const protocol = req.protocol;
        const fullUrl = `${protocol}://${host}${req.originalUrl}`;

        res.render('search-results', {
            title: `Kết quả tìm kiếm cho "${query}" | Lĩnh Nam Dạ Thoại`,
            currentPath: req.path,
            cssFiles: ['font.css', 'theme.css', 'nav.css', 'style.css'],
            meta: {
                description: `Kết quả tìm kiếm bài viết cho từ khóa "${query}" trên Lĩnh Nam Dạ Thoại.`,
                keywords: `tìm kiếm, search, ${query}, lĩnh nam dạ thoại`,
                ogTitle: `Kết quả tìm kiếm cho "${query}" - Lĩnh Nam Dạ Thoại`,
                ogDescription: `Kết quả tìm kiếm bài viết cho từ khóa "${query}" trên Lĩnh Nam Dạ Thoại.`,
                ogImage: '/assets/images/og-image.jpg',
                ogUrl: fullUrl
            },
            query: query,
            articles: articles,
            paginationHTML: paginationHTML,
            categories: categoriesParse,
            message: message,
            fullUrl: fullUrl
        });
    } catch (error) {
        console.error('Error fetching search results page:', error);
        res.status(500).render('error', {
            title: 'Lỗi hệ thống | Lĩnh Nam Dạ Thoại',
            message: 'Đã xảy ra lỗi khi tải trang tìm kiếm. Vui lòng thử lại sau.'
        });
    }
});

// Route for sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
    try {
        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;

        // Initialize sitemap service
        const sitemapService = new SitemapService(baseUrl);

        // Generate sitemap XML content
        const sitemapXML = await sitemapService.generateSitemap();

        // Set correct content type for XML
        res.header('Content-Type', 'application/xml');

        // Send sitemap XML
        res.send(sitemapXML);

        console.log('Sitemap.xml generated and served successfully');
    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});

// Route for "/viegazine" to display all articles with pagination
app.get('/viegazine', async (req, res) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const articlesPerPage = 9;  // Show more articles per page in magazine view
    const baseUrl = '/viegazine';  // Base URL for pagination links

    try {
        // Get all categories for navigation
        const categories = await categoryService.getAllCategories();
        const categoriesParse = categoryService.categoriesParse(categories);

        // Get all articles with pagination
        const articlesData = await articleService.getRelatedArticlesWithPagination({
            sort: ['publishedAt:desc'],
            pagination: {
                page: currentPage,
                pageSize: articlesPerPage
            }
        });

        let articles: ParsedArticle[] = [];
        let paginationHTML = '';

        // console.log('articlesData: ', articlesData.nodes);
        

        if (articlesData && articlesData.nodes.length > 0) {
            // Parse articles for display
            articles = articleService.articlesParse(articlesData.nodes);
            
            // If we have articles and page info, generate pagination
            if (articlesData.pageInfo) {
                const totalArticles = articlesData.pageInfo.total;
                
                if (totalArticles > articlesPerPage) {
                    const paginationState: PaginationState = {
                        totalItems: totalArticles,
                        currentPage: currentPage,
                        itemsPerPage: articlesPerPage,
                        totalPages: Math.ceil(totalArticles / articlesPerPage),
                        hasNextPage: currentPage < Math.ceil(totalArticles / articlesPerPage),
                        hasPreviousPage: currentPage > 1,
                    };
                    paginationHTML = PaginationService.renderPaginationHTML(paginationState, baseUrl);
                }
            }
        }

        // Create full URL for sharing
        const host = req.get('host');
        const protocol = req.protocol;
        const fullUrl = `${protocol}://${host}${req.originalUrl}`;

        // Render the viegazine page
        res.render('viegazine', {
            title: 'Viegazine | Lĩnh Nam Dạ Thoại',
            currentPath: req.path,
            cssFiles: ['font.css', 'theme.css', 'nav.css', 'style.css'],
            meta: {
                description: 'Tổng hợp tất cả bài viết từ Lĩnh Nam Dạ Thoại',
                keywords: 'viegazine, bài viết, tạp chí, lĩnh nam dạ thoại',
                ogTitle: 'Viegazine - Lĩnh Nam Dạ Thoại',
                ogDescription: 'Tổng hợp tất cả bài viết từ Lĩnh Nam Dạ Thoại',
                ogImage: '/assets/images/og-image.jpg',
                ogUrl: fullUrl
            },
            articles: articles,
            paginationHTML: paginationHTML,
            categories: categoriesParse,
            fullUrl: fullUrl
        });
    } catch (error) {
        console.error('Error fetching viegazine page:', error);
        res.status(500).render('error', {
            title: 'Lỗi hệ thống | Lĩnh Nam Dạ Thoại',
            message: 'Đã xảy ra lỗi khi tải trang Viegazine. Vui lòng thử lại sau.',
            paginationHTML: '' // Add empty paginationHTML for error case
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

// Global error handler middleware - thêm trước global 404 handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error caught by global error handler:', err);

    // Lấy message từ error object nếu có
    const errorMessage = err.message || 'Đã xảy ra lỗi không xác định';
    const statusCode = err.statusCode || 500;

    // Log chi tiết lỗi cho việc debug
    console.error('Error details:', {
        message: errorMessage,
        stack: err.stack,
        status: statusCode,
        path: req.path,
        method: req.method,
        query: req.query,
        headers: req.headers
    });

    // Render trang error với message phù hợp
    res.status(statusCode).render('error', {
        title: 'Lỗi hệ thống | Lĩnh Nam Dạ Thoại',
        message: errorMessage,
        cssFiles: [
            'font.css',
            'theme.css',
            'nav.css',
            'style.css'
        ],
        meta: {
            description: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu của bạn',
            keywords: 'lỗi, hệ thống, lĩnh nam dạ thoại, regisna.site',
            ogTitle: 'Lỗi hệ thống - Lĩnh Nam Dạ Thoại',
            ogDescription: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu của bạn',
            ogUrl: 'https://regisna.site/error'
        }
    });
});

// Khởi động server
const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, HOST, () => {
    console.log(`Server đang chạy tại http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});