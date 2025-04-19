import { initGraphQLClient } from './graphql-client';
import { ArticleBySlugResponse, ArticlesConnectionResponse, GetArticleBySlugVariables, GetRelatedArticlesVariables } from '../../types/article';
import { STRAPI_BASE_HOST } from '../../constants/app';
import { replaceStrapiUrls } from '../../constants/url-utils';
import { ArticleFiltersInput, CategoryArticlesArgs } from 'src/types';

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

export class ArticleService {
    private readonly GET_RELATED_ARTICLES = `
        query Nodes($sort: [String], $pagination: PaginationArg) {
            articles_connection(sort: $sort, pagination: $pagination) {
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
                pageInfo {
                    page
                    pageCount
                    pageSize
                    total
                }
            }
        }
    `;

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
            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<ArticlesConnectionResponse>(this.GET_RELATED_ARTICLES, {
                sort: variables.sort || ["publishedAt:desc"],
                pagination: variables.pagination || { limit: 1 }
            });
            return response.data.articles_connection.nodes;
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
                    url: `${STRAPI_BASE_HOST}${article.thumbnail?.formats?.large?.url || article.thumbnail.url}`,
                    alt: article.thumbnail.alternativeText || article.title
                } : null,
                publishedAt: article.publishedAt,
                slug: article.slug,
                type: article.type ? ArticleTypeEnum[article.type as keyof typeof ArticleTypeEnum] || article.type : '',
                url: `/article/${article.slug}`
            }
        });
    }

    async getArticleBySlug(variables: {filters: ArticleFiltersInput}): Promise<ArticleBySlugResponse['data']['articles']> {
        try {
            if (!variables.filters || !variables.filters.slug) {
                throw new Error('Slug filter is required to fetch article by slug');
            }
            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<ArticleBySlugResponse>(this.GET_ARTICLE_BY_SLUG, {
                filters: variables.filters
            });
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

    async getArtcleByCategory(categorySlug: string, variables: any = {}): Promise<ArticlesConnectionResponse['data']['articles_connection']['nodes']> {
        try {
            if (!categorySlug) {
                throw new Error('Category slug is required to fetch articles by category');
            }

            const filters: ArticleFiltersInput = {
                categories: {
                    slug: {
                        eq: categorySlug
                    }
                },
                ...variables.filters
            };

            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<ArticlesConnectionResponse>(this.GET_ARTICLES_BY_CATEGORY, {
                filters: filters,
                sort: variables.sort || ["publishedAt:desc"],
                pagination: variables.pagination || { limit: 12 }
            });
            
            return response.data.articles_connection.nodes;
        } catch (error) {
            console.error('Error fetching articles by category:', error instanceof Error ? error.message : 'Unknown error');
            if (error instanceof Error) {
                throw new Error(`Failed to fetch articles by category: ${error.message}`);
            }
            throw new Error('Failed to fetch articles by category');
        }
    }
}