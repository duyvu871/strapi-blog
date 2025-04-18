import { CategoryFiltersInput, ComicEpisodeFiltersInput, MediaContentFiltersInput, SeriesFiltersInput } from "src/types";

type StringFilterInput = {
    eq?: string;
    ne?: string;
    contains?: string;
    notContains?: string;
    startsWith?: string;
    endsWith?: string;
    in?: string[];
    notIn?: string[];
    null?: boolean;
    notNull?: boolean;
  };
  
  type IDFilterInput = {
    eq?: string;
    ne?: string;
    in?: string[];
    notIn?: string[];
  };
  
  type DateTimeFilterInput = {
    eq?: string;
    ne?: string;
    lt?: string;
    lte?: string;
    gt?: string;
    gte?: string;
    between?: [string, string];
    null?: boolean;
    notNull?: boolean;
  };
  
  type ArticleFiltersInput = {
    documentId?: IDFilterInput;
    slug?: StringFilterInput;
    description?: StringFilterInput;
    content?: StringFilterInput;
    postTime?: DateTimeFilterInput;
    categories?: CategoryFiltersInput;
    media_contents?: MediaContentFiltersInput;
    series?: SeriesFiltersInput;
    type?: StringFilterInput;
    comic_episode?: ComicEpisodeFiltersInput;
    contentful?: StringFilterInput;
    title?: StringFilterInput;
    theme?: StringFilterInput;
    createdAt?: DateTimeFilterInput;
    updatedAt?: DateTimeFilterInput;
    publishedAt?: DateTimeFilterInput;
    and?: ArticleFiltersInput[];
    or?: ArticleFiltersInput[];
    not?: ArticleFiltersInput;
  };
  