import { ArticleService } from './article.service';
import { ArticlesConnectionResponse } from '../../types/article';
import { cacheService } from '../cache';

/**
 * Service for retrieving latest articles
 */
export class LatestArticlesService {
    private static readonly CACHE_KEY_LATEST_ARTICLES = 'latest_articles_';
    private static readonly CACHE_TTL_LATEST_ARTICLES = 600; // 10 minutes

    /**
     * Get the latest articles
     * @param limit Number of articles to retrieve (default: 4)
     * @returns The latest articles
     */
    static async getLatestArticles(limit: number = 4) {
        try {
            // Generate cache key based on limit
            const cacheKey = `${this.CACHE_KEY_LATEST_ARTICLES}${limit}`;
            
            // Check if data exists in cache
            const cachedData = cacheService.get<any[]>(cacheKey);
            
            if (cachedData) {
                console.log(`Latest ${limit} articles fetched from cache`);
                return cachedData as ArticlesConnectionResponse[];
            }
            
            // If not in cache, fetch from API using the ArticleService
            const articleService = new ArticleService();
            const articles = await articleService.getRelatedArticles({
                sort: ["publishedAt:desc"],
                pagination: { limit }
            });
            
            // Parse the articles to the correct format
            const parsedArticles = articleService.articlesParse(articles);
            
            // Store in cache
            cacheService.set(cacheKey, parsedArticles, this.CACHE_TTL_LATEST_ARTICLES);
            console.log(`Latest ${limit} articles fetched from API and cached`);
            
            return parsedArticles;
        } catch (error) {
            console.error('Error fetching latest articles:', error instanceof Error ? error.message : 'Unknown error');
            if (error instanceof Error) {
                throw new Error(`Failed to fetch latest articles: ${error.message}`);
            }
            throw new Error('Failed to fetch latest articles');
            
            // Return empty array in case of error to prevent app crash
            return [];
        }
    }
}