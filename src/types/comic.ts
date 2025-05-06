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
}

// These interfaces will be used for the detailed comic page (/comic/:slug)
export interface ComicSeriesDetail extends ComicSeries {
    comic_episodes: ComicEpisode[];
    labelThumbnail: Thumbnail;
    thumbnail: Thumbnail;
}

export interface ComicEpisode {
    content: string;
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