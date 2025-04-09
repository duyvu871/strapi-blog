
import axios, { AxiosInstance } from 'axios';

class GraphQLClient {
    private client: AxiosInstance;

    constructor(endpoint: string, options?: { headers?: Record<string, string> }) {
        this.client = axios.create({
            baseURL: endpoint,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
    }

    async request<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
        try {
            const { data } = await this.client.post('', {
                query,
                variables,
            });

            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('GraphQL request failed');
        }
    }
}

// Initialize the GraphQL client
const initGraphQLClient = async () => {
    const endpoint = process.env.STRAPI_GRAPHQL_URL || 'http://localhost:1337/graphql';
    return new GraphQLClient(endpoint);
};

export { initGraphQLClient, GraphQLClient };
