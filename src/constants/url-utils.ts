import { STRAPI_BASE_HOST } from './app';

/**
 * Replaces hardcoded Strapi URLs with the configured base host
 * @param content The string or HTML content that may contain Strapi URLs
 * @returns The content with all Strapi URLs replaced with the configured base host
 */
export function replaceStrapiUrls(content: string): string {
  if (!content) return '';
  
  // Replace hardcoded Strapi URLs (both with and without http/https)
  return content
    .replace(/http:\/\/192\.168\.1\.109:1337\//g, `${STRAPI_BASE_HOST}/`)
    .replace(/https:\/\/192\.168\.1\.109:1337\//g, `${STRAPI_BASE_HOST}/`)
    .replace(/\/\/192\.168\.1\.109:1337\//g, `//${new URL(STRAPI_BASE_HOST).host}/`);
}