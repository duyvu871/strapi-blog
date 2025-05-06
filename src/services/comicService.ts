import { ComicResponse, ComicSeries, ComicSeriesDetail } from '../types/comic';

export class ComicService {
  /**
   * Fetch all comic series with pagination
   */
  static async getAllComicSeries(page: number = 1, pageSize: number = 12): Promise<ComicSeries[]> {
    try {
      const query = `
        query Comic($pagination: PaginationArg) {
          multipleComicSeries_connection(pagination: $pagination) {
            nodes {
              description
              createdAt
              publishedAt
              slug
              title
            }
          }
        }
      `;

      const variables = {
        pagination: {
          page,
          pageSize
        }
      };

      const response = await fetch(process.env.STRAPI_API_URL || 'http://localhost:1337/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      const data: ComicResponse = await response.json();
      return data.data.multipleComicSeries_connection.nodes;
    } catch (error) {
      console.error('Failed to fetch comic series:', error);
      return [];
    }
  }

  /**
   * Fetch a single comic series by slug
   */
  static async getComicBySlug(slug: string): Promise<ComicSeriesDetail | null> {
    try {
      const query = `
        query ComicBySlug($slug: String!) {
          multipleComicSeries_connection(filters: { slug: { eq: $slug } }) {
            nodes {
              comic_episodes {
                content
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

      const variables = {
        slug
      };

      const response = await fetch(process.env.STRAPI_API_URL || 'http://localhost:1337/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      const data: ComicResponse = await response.json();
      const nodes = data.data.multipleComicSeries_connection.nodes;
      
      return nodes.length > 0 ? nodes[0] as ComicSeriesDetail : null;
    } catch (error) {
      console.error(`Failed to fetch comic series with slug ${slug}:`, error);
      return null;
    }
  }
}