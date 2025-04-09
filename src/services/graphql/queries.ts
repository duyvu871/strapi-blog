// Định nghĩa các GraphQL queries

// Query lấy danh sách bài viết với phân trang
export const GET_ARTICLES = `
  query GetArticles($page: Int!, $pageSize: Int!) {
    articles(pagination: { page: $page, pageSize: $pageSize }) {
      data {
        id
        attributes {
          title
          slug
          excerpt
          publishedAt
          featuredImage {
            data {
              attributes {
                url
                alternativeText
              }
            }
          }
          category {
            data {
              attributes {
                name
                slug
              }
            }
          }
          author {
            data {
              attributes {
                name
                avatar {
                  data {
                    attributes {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
      meta {
        pagination {
          total
          pageCount
          page
          pageSize
        }
      }
    }
  }
`;

// Query lấy chi tiết một bài viết theo slug
export const GET_ARTICLE_BY_SLUG = `
  query GetArticleBySlug($slug: String!) {
    articles(filters: { slug: { eq: $slug } }) {
      data {
        id
        attributes {
          title
          content
          slug
          excerpt
          publishedAt
          featuredImage {
            data {
              attributes {
                url
                alternativeText
              }
            }
          }
          category {
            data {
              attributes {
                name
                slug
              }
            }
          }
          author {
            data {
              attributes {
                name
                avatar {
                  data {
                    attributes {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Query lấy danh sách danh mục
export const GET_CATEGORIES = `
  query GetCategories {
    categories {
      data {
        id
        attributes {
          name
          slug
          description
        }
      }
    }
  }
`;
