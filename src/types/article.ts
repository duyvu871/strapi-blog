
export interface ArticlesConnectionResponse {
    data: {
        articles_connection: {
            nodes: Array<{
                description: string;
                thumbnail: {
                    url: string;
                    alternativeText: string;
                };
                categories: {
                    name: string;
                    slug: string;
                };
                publishedAt: string;
                slug: string;
                type: string
                title: string
            }>;
        };
    }
}

export interface GetRelatedArticlesVariables {
    sort?: string[];
    pagination?: {
        limit?: number;
    };
}

export interface ArticleBySlugResponse {
    data: {
        articles: Array<{
            content: string;
            contentful: string;
            createdAt: string;
            description: string;
            documentId: string;
            postTime: string;
            publishedAt: string;
            slug: string;
            theme: string;
            thumbnail: {
                formats: any; // Define the type of formats if known
            };
            title: string;
            type: string;
            updatedAt: string;
        }>;
    };
}

export interface GetArticleBySlugVariables {
    filters: {
        slug: {
            eq: string;
        };
    };
}
