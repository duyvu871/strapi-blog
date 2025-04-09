export interface Media {
    id:                number;
    documentId:        string;
    name:              string;
    alternativeText:   null;
    caption:           null;
    width:             number;
    height:            number;
    formats:           Formats;
    hash:              string;
    ext:               EXT;
    mime:              MIME;
    size:              number;
    url:               string;
    previewUrl:        null;
    provider:          string;
    provider_metadata: null;
    createdAt:         Date;
    updatedAt:         Date;
    publishedAt:       Date;
}

export enum EXT {
    GIF = ".gif",
    Jpg = ".jpg",
    Webp = ".webp",
}

export interface Formats {
    large:     MediaSize;
    small:     MediaSize;
    medium:    MediaSize;
    thumbnail: MediaSize;
}

export interface MediaSize {
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

export enum MIME {
    ImageGIF = "image/gif",
    ImageJPEG = "image/jpeg",
    ImageWebp = "image/webp",
}
