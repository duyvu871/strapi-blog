import { initGraphQLClient } from './graphql-client';
import { PaginationCateGoriesResponse, QueryCategoriesResponse } from '../../types/category';
import { STRAPI_BASE_HOST } from '../../constants/app';
import { cacheService } from '../cache';

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

    // Cache keys
    private readonly CACHE_KEY_ALL_CATEGORIES = 'all_categories';
    private readonly CACHE_KEY_CATEGORY_BY_SLUG = 'category_by_slug_';
    
    // Cache TTL values (in seconds)
    private readonly CACHE_TTL_CATEGORIES = 3600; // 1 hour for categories

    async getAllCategories(): Promise<PaginationCateGoriesResponse> {
        try {
            // Check if data exists in cache
            const cachedData = cacheService.get<PaginationCateGoriesResponse>(this.CACHE_KEY_ALL_CATEGORIES);
            
            if (cachedData) {
                console.log('Categories fetched from cache');
                return cachedData;
            }
            
            // If not in cache, fetch from API
            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<PaginationCateGoriesResponse>(this.GET_CATEGORIES);
            
            // Store in cache
            cacheService.set(this.CACHE_KEY_ALL_CATEGORIES, response, this.CACHE_TTL_CATEGORIES);
            console.log('Categories fetched from API and cached');
            
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
            // Create a unique cache key for this slug
            const cacheKey = `${this.CACHE_KEY_CATEGORY_BY_SLUG}${slug}`;
            
            // Check if data exists in cache
            const cachedData = cacheService.get<QueryCategoriesResponse>(cacheKey);
            
            if (cachedData) {
                console.log(`Category by slug '${slug}' fetched from cache`);
                return cachedData;
            }
            
            // If not in cache, fetch from API
            const graphqlClient = await initGraphQLClient();
            const response = await graphqlClient.request<QueryCategoriesResponse>(this.GET_CATEGORIES_BY_SLUG, {
                filters: {
                    slug: {
                        eq: slug
                    }
                }
            });
            
            // Store in cache
            cacheService.set(cacheKey, response, this.CACHE_TTL_CATEGORIES);
            console.log(`Category by slug '${slug}' fetched from API and cached`);
            
            return response;
        } catch (error) {
            console.error('Error fetching categories:', error instanceof Error ? error.message : 'Unknown error');
            throw new Error('Failed to fetch categories');
        }
    }

    parseCategoriesBySlug (categories: QueryCategoriesResponse) {
        const categoriesParsed = categories.data.categories.map((category) => {
            return {
                thumbnail: `${STRAPI_BASE_HOST}${category.thumbnail.formats.medium.url}`,
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