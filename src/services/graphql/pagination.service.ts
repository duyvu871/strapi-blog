export interface PaginationState {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export class PaginationService {
    /**
     * Generates a pagination object based on the provided parameters.
     * @param totalItems - The total number of items.
     * @param currentPage - The current page number.
     * @param itemsPerPage - The number of items per page.
     * @returns An object containing pagination details.
     */
    static generatePagination(
        totalItems: number,
        currentPage: number,
        itemsPerPage: number
    ) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const hasNextPage = currentPage < totalPages;
        const hasPreviousPage = currentPage > 1;

        return {
            totalItems,
            currentPage,
            itemsPerPage,
            totalPages,
            hasNextPage,
            hasPreviousPage,
        };
    }

    /**
     * Adds or updates the 'page' query parameter to a given URL.
     * @param baseUrl - The base URL (e.g., /category/slug).
     * @param pageNum - The page number to set.
     * @returns The URL string with the page parameter.
     */
    private static addPageParam(baseUrl: string, pageNum: number): string {
        try {
            // Create a dummy full URL to leverage the URL API, in case baseUrl is just a path
            const dummyHost = 'http://example.com';
            const urlObj = new URL(baseUrl, dummyHost);
            urlObj.searchParams.set('page', String(pageNum));
            // Return path + search, or just search if baseUrl was only search params
            return baseUrl.startsWith('?') ? urlObj.search : urlObj.pathname + urlObj.search;
        } catch (e) {
            console.error('Error creating page URL:', e);
            // Fallback for simple path appending if URL parsing fails (e.g. if baseUrl is not a valid path for URL constructor)
            const separator = baseUrl.includes('?') ? '&' : '?';
            return `${baseUrl}${separator}page=${pageNum}`;
        }
    }

    /**
     * Generates a range of numbers.
     * @param start - The start of the range.
     * @param end - The end of the range.
     * @returns An array of numbers.
     */
    private static range(start: number, end: number): number[] {
        const result: number[] = []; // Explicitly type as number[]
        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        return result;
    }

    /**
     * Generates a specific range of page numbers to display, for ellipsis logic.
     * @param currentPage - The current active page.
     * @param totalPages - The total number of pages.
     * @returns An array of page numbers to display in the middle.
     */
    private static pageRange(currentPage: number, totalPages: number): number[] {
        const delta = 1; // Number of pages to show on either side of currentPage
        let start = Math.max(2, currentPage - delta);
        let end = Math.min(totalPages - 1, currentPage + delta);

        // Adjust to always show at least 3 pages in the middle (if possible and totalPages > 4)
        if (totalPages > 4 && (end - start + 1) < 3) {
            if (currentPage - start < end - currentPage) { // Closer to start
                end = Math.min(totalPages - 1, start + 2);
            } else { // Closer to end
                start = Math.max(2, end - 2);
            }
        }
        // Ensure start is not greater than end if adjustments made it so
        if (start > end) return [];

        const result: number[] = []; // Explicitly type as number[]
        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        return result;
    }

    /**
     * Renders the pagination component HTML.
     * @param pagination - The pagination state object.
     * @param baseUrl - The base URL for page links (e.g., /category/some-slug).
     * @returns HTML string for the pagination component.
     */
    static renderPaginationHTML(pagination: PaginationState, baseUrl: string): string {
        if (!pagination || pagination.totalPages <= 1) {
            return ''; // No pagination needed for 0 or 1 page
        }

        let html = '<nav class="pagination" role="navigation" aria-label="Phân trang"><div class="flex items-center justify-center flex-wrap gap-2 py-6">';

        // Previous Page Button
        if (pagination.hasPreviousPage) {
            html += `<a href="${this.addPageParam(baseUrl, pagination.currentPage - 1)}" class="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500" aria-label="Trang trước">
                       <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true" viewBox="0 0 1792 1792"><path d="M1203 544q0 13-10 23l-393 393 393 393q10 10 10 23t-10 23l-50 50q-10 10-23 10t-23-10l-466-466q-10-10-10-23t10-23l466-466q10-10 23-10t23 10l50 50q10 10 10 23z"/></svg>
                       <span class="sr-only md:not-sr-only md:ml-2">Trước</span>
                     </a>`;
        } else {
            html += `<span class="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-400 bg-gray-100 cursor-not-allowed" aria-disabled="true">
                       <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true" viewBox="0 0 1792 1792"><path d="M1203 544q0 13-10 23l-393 393 393 393q10 10 10 23t-10 23l-50 50q-10 10-23 10t-23-10l-466-466q-10-10-10-23t10-23l466-466q10-10 23-10t23 10l50 50q10 10 10 23z"/></svg>
                       <span class="sr-only md:not-sr-only md:ml-2">Trước</span>
                     </span>`;
        }

        // Page Numbers
        if (pagination.totalPages < 8) { // Less than 8 pages: show all
            this.range(1, pagination.totalPages).forEach(page => {
                if (page === pagination.currentPage) {
                    html += `<span aria-current="page" class="z-10 bg-purple-600 text-white relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">${page}</span>`;
                } else {
                    html += `<a href="${this.addPageParam(baseUrl, page)}" class="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">${page}</a>`;
                }
            });
        } else { // More than 7 pages: show ellipsis
            // First page
            const firstPageClass = (1 === pagination.currentPage) ? "z-10 bg-purple-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
            html += `<a href="${this.addPageParam(baseUrl, 1)}" class="${firstPageClass} relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">1</a>`;

            // Ellipsis or page 2
            if (pagination.currentPage > 3) {
                html += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md">...</span>`;
            } else { // Show page 2 if current page is 1, 2 or 3 (and page 2 is not current page)
                if (2 !== pagination.currentPage) {
                    const pageTwoClass = (2 === pagination.currentPage) ? "z-10 bg-purple-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
                    html += `<a href="${this.addPageParam(baseUrl, 2)}" class="${pageTwoClass} relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">2</a>`;
                } else { // Page 2 is current page
                    html += `<span aria-current="page" class="z-10 bg-purple-600 text-white relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">2</span>`;
                }
            }

            // Middle pages
            this.pageRange(pagination.currentPage, pagination.totalPages).forEach(page => {
                // This condition ensures we don't repeat page 2 if it was already rendered,
                // and that we only render pages that are part of the calculated "middle range".
                if (page > 1 && page < pagination.totalPages) { // pageRange should already handle this, but double check
                    if (page === pagination.currentPage) {
                        html += `<span aria-current="page" class="z-10 bg-purple-600 text-white relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">${page}</span>`;
                    } else {
                        html += `<a href="${this.addPageParam(baseUrl, page)}" class="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">${page}</a>`;
                    }
                }
            });

            // Ellipsis or second-last page
            if (pagination.currentPage < pagination.totalPages - 2) {
                html += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md">...</span>`;
            } else { // Show second last page if current page is totalPages, totalPages-1 or totalPages-2 (and it's not current page)
                const secondLastPage = pagination.totalPages - 1;
                if (secondLastPage > 1 && secondLastPage !== pagination.currentPage) { // Ensure it's not page 1 and not current
                    const pageSecondLastClass = (secondLastPage === pagination.currentPage) ? "z-10 bg-purple-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
                    html += `<a href="${this.addPageParam(baseUrl, secondLastPage)}" class="${pageSecondLastClass} relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">${secondLastPage}</a>`;
                } else if (secondLastPage > 1 && secondLastPage === pagination.currentPage) {
                    html += `<span aria-current="page" class="z-10 bg-purple-600 text-white relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">${secondLastPage}</span>`;
                }
            }

            // Last page
            const lastPageClass = (pagination.totalPages === pagination.currentPage) ? "z-10 bg-purple-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
            html += `<a href="${this.addPageParam(baseUrl, pagination.totalPages)}" class="${lastPageClass} relative inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md">${pagination.totalPages}</a>`;
        }

        // Next Page Button
        if (pagination.hasNextPage) {
            html += `<a href="${this.addPageParam(baseUrl, pagination.currentPage + 1)}" class="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500" aria-label="Trang kế tiếp">
                       <span class="sr-only md:not-sr-only md:mr-2">Sau</span>
                       <svg  class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true" viewBox="0 0 1792 1792"><path d="M1171 960q0 13-10 23l-466 466q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l393-393-393-393q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l466 466q10 10 10 23z"/></svg>
                     </a>`;
        } else {
            html += `<span class="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-400 bg-gray-100 cursor-not-allowed" aria-disabled="true">
                        <span class="sr-only md:not-sr-only md:mr-2">Sau</span>
                        <svg  class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true" viewBox="0 0 1792 1792"><path d="M1171 960q0 13-10 23l-466 466q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l393-393-393-393q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l466 466q10 10 10 23z"/></svg>
                     </span>`;
        }

        // Page info
        html += `<div class="text-sm text-gray-600 ml-2">Trang ${pagination.currentPage} / ${pagination.totalPages}</div>`;
        html += '</div></nav>';
        return html;
    }
}