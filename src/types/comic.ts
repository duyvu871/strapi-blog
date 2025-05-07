export interface ComicResponse {
    data: ComicData;
}

export interface ComicData {
    multipleComicSeries_connection: MultipleComicSeriesConnection;
}

export interface MultipleComicSeriesConnection {
    nodes: ComicSeries[];
}

export interface ComicSeries {
    description: string;
    createdAt: string;
    publishedAt: string;
    slug: string;
    title: string;
    thumbnail?: Thumbnail;
    comic_episodes?: ComicEpisode[];
    labelThumbnail?: Thumbnail;
}

export interface ComicEpisode {
    id: number;
    title?: string;
    content: string;
    description?: string;
    subTitle?: string;
    type?: string;
    createdAt?: string;
    pages?: {
        formats: Formats;
    }[];
}

export interface Thumbnail {
    formats: Formats;
}

export interface Formats {
    large: ImageFormat;
    small: ImageFormat;
    medium: ImageFormat;
    thumbnail: ImageFormat;
}

export interface ImageFormat {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: null;
    size: number;
    width: number;
    height: number;
    sizeInBytes: number;
}