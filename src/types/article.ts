
export interface ArticlesConnectionResponse {
    data: {
        articles_connection: {
            nodes: Array<{
                description: string;
                thumbnail: {
                    url: string;
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
