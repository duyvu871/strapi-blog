import { initGraphQLClient } from './graphql-client';
import { ArticleBySlugResponse, ArticlesConnectionResponse, GetArticleBySlugVariables, GetRelatedArticlesVariables } from '../../types/article';
import { STRAPI_BASE_HOST } from '../../constants/app';
import { replaceStrapiUrls } from '../../constants/url-utils';
import { ArticleFiltersInput, CategoryArticlesArgs, Pagination } from 'src/types';
import { cacheService } from '../cache';

// Enum to translate article types to Vietnamese
enum ArticleTypeEnum {
    video = 'Video',
    podcast = 'Podcast',
    post = 'Bài đăng',
}

// Theme color mapping
interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    text: string;
}

const themeColorMap: Record<string, ThemeColors> = {
    default: {
        primary: '#0066cc',
        secondary: '#4CAF50',
        background: '#ffffff',
        text: '#333333',
    },
    dark: {
        primary: '#4a90e2',
        secondary: '#6ac289',
        background: '#282c35',
        text: '#f8f8f2',
    },
    light: {
        primary: '#0066cc',
        secondary: '#4CAF50',
        background: '#f9f9f9',
        text: '#292929',
    },
    sepia: {
        primary: '#704214',
        secondary: '#986c41',
        background: '#f4ecd8',
        text: '#5b4636',
    },
    // Add more themes as needed
};

export interface ArticlesWithPageInfo {
    nodes: ArticlesConnectionResponse['data']['articles_connection']['nodes'];
    pageInfo: Pagination;
}

export class ArticleService {
    private readonly GET_RELATED_ARTICLES = `
        query Nodes($filters: ArticleFiltersInput, $sort: [String], $pagination: PaginationArg) {
            articles_connection(filters: $filters, sort: $sort, pagination: $pagination) {
                nodes {
                    description
                    thumbnail {
                        url
                        alternativeText
                    }
                    categories {
                      name,
                      slug
                    }
                    publishedAt
                    slug
                    type
                    title
                }
                pageInfo {
                    page
                    pageCount
                    pageSize
                    total
                }
            }
        }
    `;


    private readonly GET_ARTICLE_BY_SLUG = `
        query Article($filters: ArticleFiltersInput) {
            articles(filters: $filters) {
                content
                contentful
                createdAt
                description
                documentId
                postTime
                publishedAt
                slug
                theme
                thumbnail {
                    url
                    alternativeText
                    formats
                }
                title
                type
                updatedAt
            }
        }
    `;

    private readonly GET_ARTICLES_BY_CATEGORY = `
        query ArticlesByCategory($filters: ArticleFiltersInput, $sort: [String], $pagination: PaginationArg) {
            articles_connection(filters: $filters, sort: $sort, pagination: $pagination) {
                nodes {
                    description
                    thumbnail {
                        url
                        alternativeText
                        formats
                    }
                    categories {
                      name
                      slug
                    }
                    publishedAt
                    slug
                    type
                    title
                }
            }
        }
    `;

    private readonly SEARCH_ARTICLES = `
        query SearchArticles($filters: ArticleFiltersInput, $sort: [String], $pagination: PaginationArg) {
            articles_connection(filters: $filters, sort: $sort, pagination: $pagination) {
                nodes {
                    description
                    thumbnail {
                        url
                        alternativeText
                        formats
                    }
                    categories {
                      name
                      slug
                    }
                    publishedAt
                    slug
                    type
                    title
                }
                pageInfo {
                    page
                    pageCount
                    pageSize
                    total
                }
            }
        }
    `;

    // Cache keys
    private readonly CACHE_KEY_RELATED_ARTICLES = 'related_articles_';
    private readonly CACHE_KEY_ARTICLE_BY_SLUG = 'article_by_slug_';
    private readonly CACHE_KEY_ARTICLES_BY_CATEGORY = 'articles_by_category_';
    private readonly CACHE_KEY_SEARCH_ARTICLES = 'search_articles_';

    // Cache TTL values (in seconds)
    private readonly CACHE_TTL_ARTICLES = 900; // 15 minutes for articles
    private readonly CACHE_TTL_ARTICLE_DETAIL = 1800; // 30 minutes for article details

    /**
     * Create a cache key for related articles based on sort and pagination parameters
     */
    private getRelatedArticlesCacheKey(variables: any): string {
        const filters = variables.filters ? variables.filters : {};
        const sort = variables.sort ? variables.sort.join('_') : 'default';
        const limit = variables.pagination?.limit || 'default';
        const pagination = variables.pagination ? variables.pagination : { page: 1, pageSize: 1 };
        return `${this.CACHE_KEY_RELATED_ARTICLES}${sort}_${limit}_${JSON.stringify(filters)}_${pagination.page}_${pagination.pageSize}`;
    }

    /**
     * Create a cache key for articles by category based on slug and parameters
     */
    private getArticlesByCategoryCacheKey(slug: string, variables: any): string {
        const sort = variables.sort ? variables.sort.join('_') : 'default_sort';
        const pageSize = variables.pagination?.limit || variables.pagination?.pageSize || 'default_size';
        const page = variables.pagination?.page || 1; // Default to page 1 if not specified
        return `${this.CACHE_KEY_ARTICLES_BY_CATEGORY}${slug}_${sort}_page${page}_size${pageSize}`;
    }

    /**
     * Create a cache key for search articles based on query and parameters
     */
    private getSearchArticlesCacheKey(query: string, variables: any): string {
        const sort = variables.sort ? variables.sort.join('_') : 'default_sort';
        const pageSize = variables.pagination?.pageSize || 'default_size';
        const page = variables.pagination?.page || 1;
        // Sanitize query for cache key: replace spaces with underscores, lowercase
        const sanitizedQuery = query.toLowerCase().replace(/\s+/g, '_');
        return `${this.CACHE_KEY_SEARCH_ARTICLES}${sanitizedQuery}_${sort}_page${page}_size${pageSize}`;
    }

    /**
     * Process Elementor content to ensure it displays correctly
     * @param content Content from Elementor
     * @param theme Theme color name
     * @returns Processed content with appropriate styles
     */
    private processElementorContent(content: string | null, theme: string = 'default'): string {
        if (!content) return '';

        const colors = themeColorMap[theme] || themeColorMap.default;

        // Add Elementor compatibility styles
        let processedContent = content;

        // Xóa các biến CSS chứa --tw trong thuộc tính style
        // processedContent = processedContent.replace(/var\(--tw-[^)]*\)/g, 'inherit');

        // Xóa các khai báo CSS Tailwind có dạng --tw-*: ;
        // processedContent = processedContent.replace(/--tw-[^:]*:\s*;/g, '');

        // Xóa các style không cần thiết
        // processedContent = processedContent.replace(/style="[^"]*"/g, '');

        // relace all heght and width to auto
        // processedContent = processedContent.replace(/height:\s*\d+px;/g, 'height: auto;');

        // Replace Elementor-specific classes with tailwind equivalents
        processedContent = processedContent
            // Convert Elementor section layouts to flexbox/grid
            .replace(/elementor-section/g, 'article-section')
            .replace(/elementor-container/g, 'container mx-auto px-4')
            .replace(/elementor-column/g, 'article-column')
            // Fix Elementor widgets
            .replace(/elementor-widget-text-editor/g, 'article-text')
            .replace(/elementor-widget-image/g, 'article-image')
            .replace(/elementor-widget-heading/g, 'article-heading')
            // Apply theme colors
            .replace(/color: ?var\( ?--e-global-color-primary ?\)/g, `color: ${colors.primary}`)
            .replace(/color: ?var\( ?--e-global-color-secondary ?\)/g, `color: ${colors.secondary}`)
            .replace(/background-color: ?var\( ?--e-global-color-primary ?\)/g, `background-color: ${colors.primary}`)
            .replace(/background-color: ?var\( ?--e-global-color-secondary ?\)/g, `background-color: ${colors.secondary}`);

        // replace all assets with strapi base host
        processedContent = replaceStrapiUrls(processedContent);

        return processedContent;
    }

    async getRelatedArticles(variables: CategoryArticlesArgs | Record<string, any> = {}): Promise<ArticlesConnectionResponse['data']['articles_connection']['nodes']> {
        try {
            // Generate cache key based on request parameters
            const cacheKey = this.getRelatedArticlesCacheKey(variables);

            // Check if data exists in cache
            const cachedData = cacheService.get<ArticlesConnectionResponse['data']['articles_connection']['nodes']>(cacheKey);

            if (cachedData) {
                console.log('Related articles fetched from cache');
                return cachedData;
            }

            // If not in cache, fetch from API
            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<ArticlesConnectionResponse>(this.GET_RELATED_ARTICLES, {
                filters: variables.filters || {},
                sort: variables.sort || ["publishedAt:desc"],
                pagination: variables.pagination || { limit: 1 }
            });

            // Store in cache
            cacheService.set(cacheKey, response.data.articles_connection.nodes, this.CACHE_TTL_ARTICLES);
            console.log('Related articles fetched from API and cached');

            return response.data.articles_connection.nodes;
        } catch (error) {
            console.error('Error fetching related articles:', error instanceof Error ? error.message : 'Unknown error');
            if (error instanceof Error) {
                throw new Error(`Failed to fetch related articles: ${error.message}`);
            }
            throw new Error('Failed to fetch related articles');
        }
    }

    async getRelatedArticlesWithPagination(variables: CategoryArticlesArgs | Record<string, any> = {}): Promise<ArticlesConnectionResponse['data']['articles_connection']> {
        try {
            // Generate cache key based on request parameters
            const cacheKey = this.getRelatedArticlesCacheKey(variables);

            // Check if data exists in cache
            const cachedData = cacheService.get<ArticlesConnectionResponse['data']['articles_connection']>(cacheKey);

            console.log('cacheKey:', cacheKey);
            // console.log('cachedData:', cachedData);

            if (cachedData) {
                console.log('Related articles fetched from cache');
                return cachedData;
            }

            // If not in cache, fetch from API
            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<ArticlesConnectionResponse>(this.GET_RELATED_ARTICLES, {
                filters: variables.filters || {},
                sort: variables.sort || ["publishedAt:desc"],
                pagination: variables.pagination || { limit: 1 }
            });

            console.log('response:', Object.keys(response.data.articles_connection), response.data.articles_connection.nodes.length);
            

            // Store in cache
            cacheService.set(cacheKey, response.data.articles_connection, this.CACHE_TTL_ARTICLES);
            console.log('Related articles fetched from API and cached');

            return response.data.articles_connection;
        } catch (error) {
            console.error('Error fetching related articles:', error instanceof Error ? error.message : 'Unknown error');
            if (error instanceof Error) {
                throw new Error(`Failed to fetch related articles: ${error.message}`);
            }
            throw new Error('Failed to fetch related articles');
        }
    }

    articlesParse(data: ArticlesConnectionResponse['data']['articles_connection']['nodes']) {
        return data.map(article => {
            return {
                ...article,
                title: article.title,
                thumbnail: article?.thumbnail ? {
                    url: `${STRAPI_BASE_HOST}${article.thumbnail?.formats?.medium?.url || article.thumbnail.url}`,
                    alt: article.thumbnail.alternativeText || article.title
                } : null,
                publishedAt: article.publishedAt,
                slug: article.slug,
                type: article.type ? ArticleTypeEnum[article.type as keyof typeof ArticleTypeEnum] || article.type : '',
                url: `/article/${article.slug}`
            }
        });
    }

    async getArticleBySlug(variables: { filters: ArticleFiltersInput }): Promise<ArticleBySlugResponse['data']['articles']> {
        try {
            if (!variables.filters || !variables.filters.slug) {
                throw new Error('Slug filter is required to fetch article by slug');
            }

            // Create a cache key based on the slug
            const slug = variables.filters.slug.eq;
            const cacheKey = `${this.CACHE_KEY_ARTICLE_BY_SLUG}${slug}`;

            // Check if data exists in cache
            const cachedData = cacheService.get<ArticleBySlugResponse['data']['articles']>(cacheKey);

            if (cachedData) {
                console.log(`Article by slug '${slug}' fetched from cache`);
                return cachedData;
            }

            // If not in cache, fetch from API
            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<ArticleBySlugResponse>(this.GET_ARTICLE_BY_SLUG, {
                filters: variables.filters
            });

            // Store in cache
            cacheService.set(cacheKey, response.data.articles, this.CACHE_TTL_ARTICLE_DETAIL);
            console.log(`Article by slug '${slug}' fetched from API and cached`);

            return response.data.articles;
        } catch (error) {
            console.error('Error fetching article by slug:', error instanceof Error ? error.message : 'Unknown error');
            if (error instanceof Error) {
                throw new Error(`Failed to fetch article by slug: ${error.message}`);
            }
            throw new Error('Failed to fetch article by slug');
        }
    }

    articlesParseBySlug(data: ArticleBySlugResponse['data']['articles']) {
        return data.map(article => {
            const thumbnailUrl = article?.thumbnail?.formats?.large?.url;
            const theme = article.theme || 'default';

            // Process content with Elementor styling
            let processedContent;
            if (article.contentful) {
                // If contentful field exists, it's from Elementor
                processedContent = this.processElementorContent(article.contentful, theme);
            } else if (article.content) {
                // Otherwise use regular content
                processedContent = article.content;
            } else {
                processedContent = '';
            }

            console.log('theme:', theme);


            return {
                ...article,
                title: article.title,
                thumbnail: thumbnailUrl ? {
                    url: `${STRAPI_BASE_HOST}${thumbnailUrl}`,
                    alt: article.title
                } : null,
                publishedAt: article.publishedAt,
                slug: article.slug,
                type: article.type ? ArticleTypeEnum[article.type as keyof typeof ArticleTypeEnum] || article.type : '',
                url: `/article/${article.slug}`,
                // Enhanced content with proper styling
                contentProcessed: processedContent,
                // Theme colors for article styling
                themeColors: theme,
                formattedDate: new Date(article.publishedAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
            }
        })
    }

    async getArtcleByCategory(categorySlug: string, variables: any = {}): Promise<ArticlesWithPageInfo | null> {
        try {
            if (!categorySlug) {
                throw new Error('Category slug is required to fetch articles by category');
            }

            // Create a cache key based on the category slug and query parameters
            const cacheKey = this.getArticlesByCategoryCacheKey(categorySlug, variables);

            // Check if data exists in cache
            const cachedData = cacheService.get<ArticlesWithPageInfo>(cacheKey);

            if (cachedData) {
                console.log(`Articles for category '${categorySlug}' (page ${variables.pagination?.page || 1}) fetched from cache`);
                return cachedData;
            }

            const filters: ArticleFiltersInput = {
                categories: {
                    slug: {
                        eq: categorySlug
                    }
                },
                // Ensure any existing filters in variables are preserved
                ...(variables.filters || {})
            };

            // Ensure pagination defaults if not fully provided
            const pagination = {
                page: variables.pagination?.page || 1,
                pageSize: variables.pagination?.limit || variables.pagination?.pageSize || 12,
                // Strapi uses 'limit' for pageSize in some contexts, ensure we use pageSize for the query
            };
            if (variables.pagination?.limit && !variables.pagination?.pageSize) {
                pagination.pageSize = variables.pagination.limit;
            }


            // console.log('variables:', JSON.stringify({
            //     filters,
            //     sort: variables.sort || ["publishedAt:desc"],
            //     pagination
            // }));


            const graphqlClient = await initGraphQLClient();
            // The GET_ARTICLES_BY_CATEGORY query already fetches pageInfo
            const response = await graphqlClient.request<{data: { articles_connection: ArticlesWithPageInfo }}>(this.GET_ARTICLES_BY_CATEGORY, {
                filters: filters,
                sort: variables.sort || ["publishedAt:desc"],
                pagination: pagination // Pass page and pageSize
            });

            // console.log('response:', JSON.stringify(response, null, 2));
            

            if (!response || !response.data.articles_connection) {
                console.warn(`No articles_connection data returned for category '${categorySlug}' page ${pagination.page}`);
                return null;
            }

            // Store in cache
            cacheService.set(cacheKey, response.data.articles_connection, this.CACHE_TTL_ARTICLES);
            console.log(`Articles for category '${categorySlug}' (page ${pagination.page}) fetched from API and cached`);

            return response.data.articles_connection;
        } catch (error) {
            console.error('Error fetching articles by category:', error instanceof Error ? error.message : 'Unknown error');
            // It's better to return null or an empty structure on error than to throw,
            // allowing the caller to handle it gracefully (e.g., show a message to the user).
            return null;
        }
    }

    async searchArticles(query: string, variables: any = {}): Promise<ArticlesWithPageInfo | null> {
        try {
            if (!query || query.trim() === '') {
                // Return null or empty result if query is empty, 
                // as Strapi might return all articles with an empty search query depending on configuration.
                return {
                    nodes: [],
                    pageInfo: { page: 1, pageCount: 0, pageSize: variables.pagination?.pageSize || 12, total: 0 }
                };
            }

            const cacheKey = this.getSearchArticlesCacheKey(query, variables);
            const cachedData = cacheService.get<ArticlesWithPageInfo>(cacheKey);
            if (cachedData) {
                console.log(`Search results for query '${query}' (page ${variables.pagination?.page || 1}) fetched from cache`);
                return cachedData;
            }

            const filters: ArticleFiltersInput = {
                or: [
                    { title: { containsi: query } }, // case-insensitive contains
                    { description: { containsi: query } },
                    // Add other fields to search if needed, e.g., content
                    // { content: { containsi: query } } 
                ],
                // Preserve any other filters if passed in variables
                ...(variables.filters || {})
            };

            const pagination = {
                page: variables.pagination?.page || 1,
                pageSize: variables.pagination?.pageSize || 12,
            };

            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<{data: { articles_connection: ArticlesWithPageInfo }}>(this.SEARCH_ARTICLES, {
                filters: filters,
                sort: variables.sort || ["publishedAt:desc"],
                pagination: pagination
            });

            // console.log('variables:', JSON.stringify({
            //     filters,
            //     sort: variables.sort || ["publishedAt:desc"],
            //     pagination
            // }));
            
            // console.log('response:', JSON.stringify(response, null, 2));
            

            if (!response || !response.data.articles_connection) {
                console.warn(`No articles_connection data returned for search query '${query}' page ${pagination.page}`);
                return null;
            }

            cacheService.set(cacheKey, response.data.articles_connection, this.CACHE_TTL_ARTICLES);
            console.log(`Search results for query '${query}' (page ${pagination.page}) fetched from API and cached`);
            
            return response.data.articles_connection;
        } catch (error) {
            console.error('Error searching articles:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    async countArticles(): Promise<number> {
        try {
            // Use a single article query with minimal data to get the total count
            const countResponse = await this.getRelatedArticles({
                pagination: {
                    limit: 1
                }
            });

            // Get the total from pageInfo
            const response = await this.getArtcleByCategory("", {
                pagination: {
                    page: 1,
                    pageSize: 1
                }
            });

            if (response && response.pageInfo) {
                return response.pageInfo.total;
            }
            
            // Fallback
            return countResponse.length > 0 ? 50 : 0;
        } catch (error) {
            console.error('Error counting articles:', error instanceof Error ? error.message : 'Unknown error');
            return 0;
        }
    }
}