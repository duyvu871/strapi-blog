/**
 * Pagination helper functions for Handlebars templates
 */

const paginationHelpers = {
  /**
   * Get the current URL (excluding query parameters)
   * @param {Object} options - Handlebars options
   * @returns {String} The current URL path
   */
  currentUrl: function(options) {
    if (!options || !options.data || !options.data.root || !options.data.root.req) {
      return '/';
    }
    return options.data.root.req.originalUrl.split('?')[0];
  },

  /**
   * Add or update page parameter in URL
   * @param {String} url - The current URL
   * @param {Number} pageNum - The page number to set
   * @returns {String} URL with page parameter
   */
  addPageParam: function(url, pageNum) {
    // Base case: if no URL or pageNum is invalid
    if (!url || isNaN(pageNum)) return url || '/';

    // Parse the URL and update/add the page parameter
    try {
      const parsedUrl = new URL(url, 'http://example.com'); // Using a dummy base if url is relative
      parsedUrl.searchParams.set('page', pageNum);
      
      // Return only pathname + search, not the full URL with host
      return `${parsedUrl.pathname}${parsedUrl.search}`;
    } catch (e) {
      console.error('Error updating URL:', e);
      return url;
    }
  },

  /**
   * Check if value1 is less than value2
   * @param {Number} value1 - First value to compare
   * @param {Number} value2 - Second value to compare
   * @param {Object} options - Handlebars options
   * @returns {Boolean} True if value1 < value2
   */
  lessThan: function(value1, value2, options) {
    return value1 < value2 ? options.fn(this) : options.inverse(this);
  },

  /**
   * Check if value1 is greater than value2
   * @param {Number} value1 - First value to compare
   * @param {Number} value2 - Second value to compare
   * @param {Object} options - Handlebars options
   * @returns {Boolean} True if value1 > value2
   */
  greaterThan: function(value1, value2, options) {
    return value1 > value2 ? options.fn(this) : options.inverse(this);
  },

  /**
   * Check if two values are equal
   * @param {*} value1 - First value to compare
   * @param {*} value2 - Second value to compare
   * @param {Object} options - Handlebars options
   * @returns {Boolean} True if values are equal
   */
  eq: function(value1, value2, options) {
    return value1 === value2 ? options.fn(this) : options.inverse(this);
  },

  /**
   * Subtract value2 from value1
   * @param {Number} value1 - Value to subtract from
   * @param {Number} value2 - Value to subtract
   * @returns {Number} The result of value1 - value2
   */
  subtract: function(value1, value2) {
    return Number(value1) - Number(value2);
  },

  /**
   * Add value1 and value2
   * @param {Number} value1 - First value
   * @param {Number} value2 - Second value
   * @returns {Number} The result of value1 + value2
   */
  add: function(value1, value2) {
    return Number(value1) + Number(value2);
  },

  /**
   * Create an array of numbers from start to end (inclusive)
   * @param {Number} start - Starting number
   * @param {Number} end - Ending number
   * @returns {Array} Array of numbers
   */
  range: function(start, end) {
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  },

  /**
   * Generate a range of page numbers around the current page
   * @param {Number} currentPage - The current page number
   * @param {Number} totalPages - Total number of pages
   * @returns {Array} Array of page numbers to display
   */
  pageRange: function(currentPage, totalPages) {
    const range = [];
    const delta = 1; // Number of pages to show on either side
    
    let start = Math.max(2, currentPage - delta);
    let end = Math.min(totalPages - 1, currentPage + delta);
    
    // Adjust to always show at least 3 pages in the middle (if possible)
    if (end - start < 2 && totalPages > 4) {
      if (currentPage - start < end - currentPage) {
        end = Math.min(totalPages - 1, start + 2);
      } else {
        start = Math.max(2, end - 2);
      }
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  },

  /**
   * Check if value1 and value2 are both true
   * @param {*} value1 - First value
   * @param {*} value2 - Second value
   * @param {Object} options - Handlebars options
   * @returns {Boolean} True if both values are truthy
   */
  and: function(value1, value2, options) {
    return value1 && value2 ? options.fn(this) : options.inverse(this);
  }
};

module.exports = paginationHelpers;