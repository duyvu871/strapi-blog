/**
 * Generate social sharing links for different platforms
 */
export const socialShare = {
  /**
   * Generate Facebook share URL
   * @param url URL to share
   * @param title Optional title for the shared content
   * @returns Facebook sharing URL
   */
  facebook: (url: string, title?: string) => {
    const encodedUrl = encodeURIComponent(url);
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  },
  
  /**
   * Generate Twitter/X share URL
   * @param url URL to share
   * @param text Optional text for the tweet
   * @returns Twitter sharing URL
   */
  twitter: (url: string, text?: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = text ? encodeURIComponent(text) : '';
    return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  },
  
  /**
   * Generate LinkedIn share URL
   * @param url URL to share
   * @param title Optional title for the shared content
   * @param summary Optional summary for the shared content
   * @returns LinkedIn sharing URL
   */
  linkedin: (url: string, title?: string, summary?: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = title ? encodeURIComponent(title) : '';
    const encodedSummary = summary ? encodeURIComponent(summary) : '';
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedSummary}`;
  },
  
  /**
   * Generate WhatsApp share URL
   * @param url URL to share
   * @param text Optional text for the message
   * @returns WhatsApp sharing URL
   */
  whatsapp: (url: string, text?: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = text ? encodeURIComponent(text) + ' ' : '';
    return `https://api.whatsapp.com/send?text=${encodedText}${encodedUrl}`;
  }
};