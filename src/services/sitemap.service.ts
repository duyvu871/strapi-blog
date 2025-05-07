import { CategoryService } from './graphql/category.service';
import { ArticleService } from './graphql/article.service';
import { ComicService } from './comicService';

interface SitemapItem {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapService {
  private baseUrl: string;
  private categoryService: CategoryService;
  private articleService: ArticleService;

  constructor(baseUrl: string = 'https://regisna.site') {
    this.baseUrl = baseUrl;
    this.categoryService = new CategoryService();
    this.articleService = new ArticleService();
  }

  /**
   * Generate sitemap XML content
   */
  async generateSitemap(): Promise<string> {
    const items: SitemapItem[] = [];

    // Add static pages
    items.push(
      { loc: `${this.baseUrl}/`, changefreq: 'daily', priority: 1.0 },
      { loc: `${this.baseUrl}/comics`, changefreq: 'weekly', priority: 0.9 }
    );

    // Add dynamic items
    const [categories, articles, comics] = await Promise.all([
      this.getCategories(),
      this.getArticles(),
      this.getComics(),
    ]);

    // Combine all items
    return this.generateSitemapXML([...items, ...categories, ...articles, ...comics]);
  }

  /**
   * Get category sitemap items
   */
  private async getCategories(): Promise<SitemapItem[]> {
    try {
      const categories = await this.categoryService.getAllCategories();
      const parsedCategories = this.categoryService.categoriesParse(categories);

      return parsedCategories.map(category => ({
        loc: `${this.baseUrl}/category/${category.slug}`,
        changefreq: 'weekly',
        priority: 0.8,
      }));
    } catch (error) {
      console.error('Error fetching categories for sitemap:', error);
      return [];
    }
  }

  /**
   * Get article sitemap items
   */
  private async getArticles(): Promise<SitemapItem[]> {
    try {
      const articlesData = await this.articleService.getRelatedArticles({
        sort: ['publishedAt:desc'],
        pagination: { limit: 1000 } // Get a large amount to include in sitemap
      });

      return articlesData.map(article => ({
        loc: `${this.baseUrl}/article/${article.slug}`,
        lastmod: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
        changefreq: 'monthly',
        priority: 0.7,
      }));
    } catch (error) {
      console.error('Error fetching articles for sitemap:', error);
      return [];
    }
  }

  /**
   * Get comics sitemap items
   */
  private async getComics(): Promise<SitemapItem[]> {
    try {
      const comics = await ComicService.getAllComicSeries(1, 1000);

      return comics.map(comic => ({
        loc: `${this.baseUrl}/comic/${comic.slug}`,
        lastmod: comic.publishedAt ? new Date(comic.publishedAt).toISOString() : undefined,
        changefreq: 'weekly',
        priority: 0.8,
      }));
    } catch (error) {
      console.error('Error fetching comics for sitemap:', error);
      return [];
    }
  }

  /**
   * Generate sitemap XML from items
   */
  private generateSitemapXML(items: SitemapItem[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    items.forEach(item => {
      xml += '  <url>\n';
      xml += `    <loc>${item.loc}</loc>\n`;
      if (item.lastmod) {
        xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
      }
      if (item.changefreq) {
        xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
      }
      if (item.priority !== undefined) {
        xml += `    <priority>${item.priority.toFixed(1)}</priority>\n`;
      }
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }
}