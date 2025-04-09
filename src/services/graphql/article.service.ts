
import { initGraphQLClient } from './graphql-client.ts';
import { ArticlesConnectionResponse, GetRelatedArticlesVariables } from '../../types/article.ts';
import { STRAPI_BASE_HOST } from '../../constants/app.ts';

export class ArticleService {
    private readonly GET_RELATED_ARTICLES = `
        query Nodes($sort: [String], $pagination: PaginationArg) {
            articles_connection(sort: $sort, pagination: $pagination) {
                nodes {
                    description
                    thumbnail {
                        url
                    }
                    publishedAt
                    slug
                    type
                    title
                }
            }
        }
    `;

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
                thumbnail: {
                    url: `${STRAPI_BASE_HOST}${article.thumbnail.url}`,
                },
                publishedAt: article.publishedAt,
                slug: article.slug,
                type: article.type,
            }
        })
    }
}