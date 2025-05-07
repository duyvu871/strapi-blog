import { ComicResponse, ComicSeries } from '../types/comic';
import { cacheService } from './cache';
import { STRAPI_BASE_HOST } from '../constants/app';
import { initGraphQLClient } from './graphql/graphql-client';

export class ComicService {
  // Cache keys
  private static readonly CACHE_KEY_ALL_COMICS = 'all_comic_series_';
  private static readonly CACHE_KEY_COMIC_BY_SLUG = 'comic_series_by_slug_';
  
  // Cache TTL values (in seconds)
  private static readonly CACHE_TTL_COMICS = 1800; // 30 minutes for comic series list
  private static readonly CACHE_TTL_COMIC_DETAIL = 3600; // 1 hour for comic series details

  // GraphQL queries
  private static readonly GET_ALL_COMICS = `
    query Comic($pagination: PaginationArg) {
      multipleComicSeries_connection(pagination: $pagination) {
        nodes {
          comic_episodes {
            content
            description
            subTitle
            title
            type
            createdAt
            pages {
              formats
            }
          }
          description
          createdAt
          labelThumbnail {
            formats
          }
          publishedAt
          slug
          thumbnail {
            formats
          }
          title
        }
      }
    }
  `;

  private static readonly GET_COMIC_BY_SLUG = `
    query ComicBySlug($slug: String!) {
      multipleComicSeries_connection(filters: { slug: { eq: $slug } }) {
        nodes {
          comic_episodes {
            content
            description
            subTitle
            title
            type
            createdAt
            pages {
              formats
            }
          }
          description
          createdAt
          labelThumbnail {
            formats
          }
          publishedAt
          slug
          thumbnail {
            formats
          }
          title
        }
      }
    }
  `;

  /**
   * Create a cache key for comic series based on pagination parameters
   */
  private static getComicSeriesCacheKey(page: number, pageSize: number): string {
    return `${this.CACHE_KEY_ALL_COMICS}${page}_${pageSize}`;
  }

  /**
   * Format comic series data to include proper thumbnail URLs
   */
  private static formatComicSeriesData(comics: any[]): ComicSeries[] {
    return comics.map(comic => ({
      ...comic,
      thumbnail: comic.thumbnail?.formats?.medium?.url 
        ? `${STRAPI_BASE_HOST}${comic.thumbnail.formats.medium.url}`
        : null,
      // Format data for article-card compatibility
      type: 'Comic',
      excerpt: comic.description,
      publishDate: new Date(comic.publishedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      url: `/comic/${comic.slug}`,
      // Store original thumbnail data for popup
      originalThumbnail: comic.thumbnail
    }));
  }

  /**
   * Fetch all comic series with pagination
   */
  static async getAllComicSeries(page: number = 1, pageSize: number = 12): Promise<ComicSeries[]> {
    try {
      // Generate cache key based on request parameters
      const cacheKey = this.getComicSeriesCacheKey(page, pageSize);
      
      // Check if data exists in cache
      const cachedData = cacheService.get<ComicSeries[]>(cacheKey);
      
      if (cachedData) {
        console.log('Comic series fetched from cache');
        return cachedData;
      }
      
      // Initialize GraphQL client
      const graphqlClient = await initGraphQLClient();
      
      // Make GraphQL request
      const response = await graphqlClient.request<ComicResponse>(this.GET_ALL_COMICS, {
        pagination: {
          page,
          pageSize
        }
      });
      
      const comicSeries = this.formatComicSeriesData(response.data.multipleComicSeries_connection.nodes);
      
      // Store in cache
      cacheService.set(cacheKey, comicSeries, this.CACHE_TTL_COMICS);
      console.log('Comic series fetched from API and cached');
      
      return comicSeries;
    } catch (error) {
      console.error('Failed to fetch comic series:', error);
      return [];
    }
  }

  /**
   * Fetch a single comic series by slug
   */
  static async getComicBySlug(slug: string): Promise<ComicSeries | null> {
    try {
      // Create a unique cache key for this slug
      const cacheKey = `${this.CACHE_KEY_COMIC_BY_SLUG}${slug}`;
      
      // Check if data exists in cache
      const cachedData = cacheService.get<ComicSeries>(cacheKey);
      
      if (cachedData) {
        console.log(`Comic series by slug '${slug}' fetched from cache`);
        return cachedData;
      }
      
      // Initialize GraphQL client
      const graphqlClient = await initGraphQLClient();
      
      // Make GraphQL request
      const response = await graphqlClient.request<ComicResponse>(this.GET_COMIC_BY_SLUG, {
        slug
      });
      
      const nodes = response.data.multipleComicSeries_connection.nodes;
      let comic = nodes.length > 0 ? nodes[0] : null;
      
      if (comic) {
        // Format thumbnail URLs
        if (comic.thumbnail?.formats?.medium?.url) {
          comic = {
            ...comic,
            thumbnail: {
              ...comic.thumbnail,
              formats: {
                ...comic.thumbnail.formats,
                medium: {
                  ...comic.thumbnail.formats.medium,
                  url: `${STRAPI_BASE_HOST}${comic.thumbnail.formats.medium.url}`
                },
                small: {
                  ...comic.thumbnail.formats.small,
                  url: `${STRAPI_BASE_HOST}${comic.thumbnail.formats.small.url}`
                },
                thumbnail: {
                  ...comic.thumbnail.formats.thumbnail,
                  url: `${STRAPI_BASE_HOST}${comic.thumbnail.formats.thumbnail.url}`
                }
              }
            }
          };
        }
        
        // Format labelThumbnail URLs if it exists
        if (comic.labelThumbnail?.formats?.thumbnail?.url) {
          comic = {
            ...comic,
            labelThumbnail: {
              ...comic.labelThumbnail,
              formats: {
                ...comic.labelThumbnail.formats,
                thumbnail: {
                  ...comic.labelThumbnail.formats.thumbnail,
                  url: `${STRAPI_BASE_HOST}${comic.labelThumbnail.formats.thumbnail.url}`
                }
              }
            }
          };
        }

        // Format comic_episodes pages if they exist
        if (comic.comic_episodes && comic.comic_episodes.length > 0) {
          comic.comic_episodes = comic.comic_episodes.map(episode => {
            if (episode.pages && episode.pages.length > 0) {
              return {
                ...episode,
                pages: episode.pages.map(page => {
                  if (page.formats) {
                    return {
                      formats: {
                        ...page.formats,
                        medium: page.formats.medium ? {
                          ...page.formats.medium,
                          url: `${STRAPI_BASE_HOST}${page.formats.medium.url}`
                        } : page.formats.medium,
                        small: page.formats.small ? {
                          ...page.formats.small,
                          url: `${STRAPI_BASE_HOST}${page.formats.small.url}`
                        } : page.formats.small,
                        thumbnail: page.formats.thumbnail ? {
                          ...page.formats.thumbnail,
                          url: `${STRAPI_BASE_HOST}${page.formats.thumbnail.url}`
                        } : page.formats.thumbnail
                      }
                    };
                  }
                  return page;
                })
              };
            }
            return episode;
          });
        }

        // Add fields for article-card compatibility
        comic = {
          ...comic,
          type: 'Comic',
          excerpt: comic.description,
          publishDate: new Date(comic.publishedAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          url: `/comic/${comic.slug}`
        };

        // Store in cache
        cacheService.set(cacheKey, comic, this.CACHE_TTL_COMIC_DETAIL);
        console.log(`Comic series by slug '${slug}' fetched from API and cached`);
      }
      
      return comic;
    } catch (error) {
      console.error(`Failed to fetch comic series with slug ${slug}:`, error);
      return null;
    }
  }
}