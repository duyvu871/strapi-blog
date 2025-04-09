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
}