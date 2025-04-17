import { initGraphQLClient } from './graphql-client';
import { ArticleBySlugResponse, ArticlesConnectionResponse, GetArticleBySlugVariables, GetRelatedArticlesVariables } from '../../types/article';
import { STRAPI_BASE_HOST } from '../../constants/app';
import { replaceStrapiUrls } from '../../constants/url-utils';

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
            processedContent = replaceStrapiUrls(processedContent)
        // Add custom style tag with theme-specific CSS
        const elementorStyles = `
        <style>
            .article-content {
                color: ${colors.text};
                background-color: ${colors.background};
                font-family: 'SVN-BasisGrotesquePro', sans-serif;
            }
            .article-content .article-section {
                margin-bottom: 2rem;
                width: 100%;
            }
            .article-content .article-column {
                padding: 0.5rem;
            }
            .article-content .article-heading h1, 
            .article-content .article-heading h2, 
            .article-content .article-heading h3, 
            .article-content .article-heading h4, 
            .article-content .article-heading h5, 
            .article-content .article-heading h6 {
                color: ${colors.primary};
                margin-bottom: 1rem;
                font-weight: 700;
            }
            .article-content .article-text {
                margin-bottom: 1rem;
                line-height: 1.8;
            }
            .article-content .article-image img {
                max-width: 100%;
                height: auto;
                border-radius: 0.5rem;
                margin: 1rem 0;
            }
            .article-content a {
                color: ${colors.primary};
                text-decoration: underline;
            }
            .article-content a:hover {
                text-decoration: none;
            }
            .article-content ul, .article-content ol {
                padding-left: 2rem;
                margin: 1rem 0;
            }
            .article-content li {
                margin-bottom: 0.5rem;
            }
            .article-content blockquote {
                border-left: 4px solid ${colors.secondary};
                padding-left: 1rem;
                font-style: italic;
                margin: 1.5rem 0;
            }
            /* Responsive layout fixes */
            @media (max-width: 768px) {
                .article-content .article-section {
                    flex-direction: column;
                }
                .article-content .article-column {
                    width: 100%;
                }
            }
        </style>
        `;
        
        return elementorStyles + processedContent;
    }

    async getRelatedArticles(variables: GetRelatedArticlesVariables = {}): Promise<ArticlesConnectionResponse['data']['articles_connection']['nodes']> {
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
                    url: `${STRAPI_BASE_HOST}${article.thumbnail.url}`,
                    alt: article.thumbnail.alternativeText || article.title
                } : null,
                publishedAt: article.publishedAt,
                slug: article.slug,
                type: article.type ? ArticleTypeEnum[article.type as keyof typeof ArticleTypeEnum] || article.type : '',
                url: `/article/${article.slug}`
            }
        });
    }

    async getArticleBySlug(variables: GetArticleBySlugVariables): Promise<ArticleBySlugResponse['data']['articles']> {
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
}