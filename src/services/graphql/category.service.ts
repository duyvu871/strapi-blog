import { initGraphQLClient } from './graphql-client';
import { PaginationCateGoriesResponse, QueryCategoriesResponse } from '../../types/category';
import { STRAPI_BASE_HOST } from '../../constants/app';

export class CategoryService {
    private readonly GET_CATEGORIES = `
        query QueryCategories {
            categories_connection {
                nodes {
                    thumbnail {
                        formats
                    }
                    description
                    slug
                    name
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

    private readonly GET_CATEGORIES_BY_SLUG = `
        query Category($filters: CategoryFiltersInput) {
            categories(filters: $filters) {
                createdAt
                description
                name
                publishedAt
                slug
                thumbnail {
                    formats
                }
                totalArticle
                updatedAt
            }
        }
    `;

    async getAllCategories(): Promise<PaginationCateGoriesResponse> {
        try {
            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<PaginationCateGoriesResponse>(this.GET_CATEGORIES);
            return response;
        } catch (error) {
            console.error('Error fetching categories:', error instanceof Error ? error.message : 'Unknown error');
            if (error instanceof Error) {
                throw new Error(`Failed to fetch categories: ${error.message}`);
            }
            throw new Error('Failed to fetch categories');
        }
    }

    categoriesParse (categories: PaginationCateGoriesResponse) {
        const categoriesParsed = categories.data.categories_connection.nodes.map((category) => {
            return {
                thumbnail: `${STRAPI_BASE_HOST}${category.thumbnail.formats.small.url}`,
                description: category.description,
                slug: category.slug,
                name: category.name
            }
        });
        return categoriesParsed;
    }

    async getCategoriesBySlug(slug: string): Promise<QueryCategoriesResponse> {
        try {
            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<QueryCategoriesResponse>(this.GET_CATEGORIES_BY_SLUG, {
                filters: {
                    slug: {
                        eq: slug
                    }
                }
            });
            return response;
        } catch (error) {
            console.error('Error fetching categories:', error instanceof Error ? error.message : 'Unknown error');
            throw new Error('Failed to fetch categories');
        }
    }

    parseCategoriesBySlug (categories: QueryCategoriesResponse) {
        const categoriesParsed = categories.data.categories.map((category) => {
            return {
                thumbnail: `${STRAPI_BASE_HOST}${category.thumbnail.formats.large.url}`,
                description: category.description,
                slug: category.slug,
                name: category.name,
                totalArticle: category.totalArticle,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            }
        });
        return categoriesParsed;
    }
}