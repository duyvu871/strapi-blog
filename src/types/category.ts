export interface PaginationCateGoriesResponse {
    data: DataConnection;
}

export interface QueryCategoriesResponse {
    data: Data
}

export interface DataConnection {
    categories_connection: CategoriesConnection;
}

export interface Data {
    categories: CategoryNode[]
}

export interface CategoriesConnection {
    nodes:    CategoryNode[];
    pageInfo: PageInfo;
}

export interface CategoryNode {
    thumbnail:   Thumbnail;
    description: null;
    slug:        string;
    name:        string;
}

export interface Thumbnail {
    formats: Formats;
}

export interface Formats {
    large:     Large;
    small:     Large;
    medium:    Large;
    thumbnail: Large;
}

export interface Large {
    ext:         EXT;
    url:         string;
    hash:        string;
    mime:        MIME;
    name:        string;
    path:        null;
    size:        number;
    width:       number;
    height:      number;
    sizeInBytes: number;
}

export enum EXT {
    Jpg = ".jpg",
}

export enum MIME {
    ImageJPEG = "image/jpeg",
}

export interface PageInfo {
    page:      number;
    pageCount: number;
    pageSize:  number;
    total:     number;
}
