/**
 * Service for handling comic popup functionality
 */
export class ComicPopupService {
  /**
   * Initialize the comic popup functionality by attaching event listeners
   * This should be called when the page loads
   */
  static initialize() {
    if (typeof window === 'undefined') return;
    
    // Create popup container if it doesn't exist yet
    this.createPopupContainer();
    
    // Close popup on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closePopup();
    });
  }
  
  /**
   * Create the popup container in the DOM
   */
  static createPopupContainer() {
    if (typeof window === 'undefined') return;
    
    // Check if container already exists
    if (document.getElementById('comic-popup-container')) return;
    
    const container = document.createElement('div');
    container.id = 'comic-popup-container';
    container.classList.add(
      'fixed', 'inset-0', 'bg-black/80', 'z-50', 
      'hidden', 'items-center', 'justify-center', 
      'overflow-y-auto', 'p-3', 'md:p-8'
    );
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.classList.add(
      'absolute', 'top-3', 'right-3', 'text-white', 
      'bg-gray-800/90', 'rounded-full', 'p-2', 
      'hover:bg-gray-700', 'focus:outline-none',
      'z-10', 'shadow-lg'
    );
    closeBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    closeBtn.addEventListener('click', () => this.closePopup());
    
    // Add content container
    const content = document.createElement('div');
    content.id = 'comic-popup-content';
    content.classList.add(
      'relative', 'bg-white', 'rounded-xl', 'shadow-2xl', 
      'w-full', 'max-w-4xl', 'max-h-[90vh]', 'overflow-y-auto',
      'transform', 'transition-all', 'my-4',
      'md:my-8'
    );
    
    // Assemble popup
    container.appendChild(closeBtn);
    container.appendChild(content);
    document.body.appendChild(container);
    
    // Close when clicking outside content
    container.addEventListener('click', (e) => {
      if (e.target === container) this.closePopup();
    });

    // Add CSS for animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #comic-popup-content {
        animation: fadeIn 0.3s ease-out;
      }
      body.popup-open,
      body.menu-open {
        overflow: hidden !important;
        position: relative !important;
      }
      body.popup-open {
        touch-action: none;
      }
      
      /* Hide episode list on mobile */
      @media (max-width: 768px) {
        .mobile-hide-episodes {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Open the popup and display comic details
   */
  static openPopup(comic) {
    if (typeof window === 'undefined') return;
    
    this.createPopupContainer();
    const container = document.getElementById('comic-popup-container');
    const content = document.getElementById('comic-popup-content');
    
    if (!container || !content) return;
    
    // Populate content
    content.innerHTML = this.renderComicDetails(comic);
    
    // Show popup with animation
    container.classList.remove('hidden');
    container.classList.add('flex');
    
    // Prevent body scroll while popup is open
    document.body.classList.add('popup-open');
    
    // Save scroll position
    document.body.style.top = `-${window.scrollY}px`;
    
    // Tạm dừng Lenis smooth scrolling nếu đang sử dụng
    if (window.lenis) {
      window.lenis.stop();
    }
    
    // Initialize episode navigation if episodes exist
    if (comic.comic_episodes && comic.comic_episodes.length > 0) {
      this.initializeEpisodeNavigation(comic);
    }
  }
  
  /**
   * Close the popup
   */
  static closePopup() {
    if (typeof window === 'undefined') return;
    
    const container = document.getElementById('comic-popup-container');
    if (!container) return;
    
    container.classList.add('hidden');
    container.classList.remove('flex');
    
    // Re-enable body scroll
    document.body.classList.remove('popup-open');
    
    // Restore scroll position
    const scrollY = document.body.style.top;
    document.body.style.top = '';
    
    // Khôi phục Lenis trước khi scroll để đảm bảo smooth scrolling
    if (window.lenis) {
      window.lenis.start();
    }
    
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }
  
  /**
   * Initialize episode navigation events
   */
  static initializeEpisodeNavigation(comic) {
    if (typeof window === 'undefined') return;
    
    // Add click event listeners to episode tabs
    const episodeTabs = document.querySelectorAll('.comic-popup-episode-tab');
    episodeTabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Get episode index
        const index = tab.getAttribute('data-index');
        if (!index) return;
        
        // Update active tab
        episodeTabs.forEach((t) => t.classList.remove('bg-purple-100', 'border-l-purple-600'));
        tab.classList.add('bg-purple-100', 'border-l-purple-600');
        
        // Show content
        const episodeContents = document.querySelectorAll('.comic-popup-episode-content');
        episodeContents.forEach((content) => {
          content.classList.add('hidden');
          if (content.getAttribute('data-index') === index) {
            content.classList.remove('hidden');
          }
        });
      });
    });
  }
  
  /**
   * Render comic details HTML
   */
  static renderComicDetails(comic) {
    const thumbnailUrl = comic.thumbnail instanceof Object 
      ? comic.thumbnail.formats?.medium?.url 
      : comic.thumbnail;
      
    const hasEpisodes = comic.comic_episodes && comic.comic_episodes.length > 0;
    
    let html = `
      <div class="p-5 md:p-6">
        <div class="flex flex-col md:flex-row gap-5 md:gap-6">
          
          <div class="w-full md:w-1/3">
            ${thumbnailUrl ? `
              <div class="aspect-[3/4] rounded-lg overflow-hidden shadow-md">
                <img src="${thumbnailUrl}" alt="${comic.title}" class="w-full h-full object-cover">
              </div>
            ` : `
              <div class="aspect-[3/4] rounded-lg bg-gradient-to-br from-purple-500 to-purple-800 shadow-md"></div>
            `}
          </div>
          
          <div class="w-full md:w-2/3">
            <h2 class="text-xl md:text-2xl lg:text-3xl font-tiempos-headline text-purple-700 mb-2">${comic.title}</h2>
            
            <div class="flex flex-wrap items-center text-sm text-gray-600 mb-4">
              <span class="inline-flex items-center text-purple-600 font-semibold mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Comic Series
              </span>
              <span class="mx-2 hidden md:inline">-</span>
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ${comic.publishDate}
              </span>
            </div>
            
            <div class="prose prose-sm max-w-none mb-6 text-gray-700">
              <p>${comic.description}</p>
            </div>
            
            <div class="mt-4">
              <a href="/comic/${comic.slug}" class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                Xem chi tiết
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
    `;
    
    // Add episodes section if available
    if (hasEpisodes) {
      html += `
        <div class="mt-6 border-t pt-6">
          <h3 class="text-lg md:text-xl font-semibold mb-4 text-gray-800">Các tập</h3>
          
          <div class="flex flex-col md:flex-row">
            <div class="md:w-1/3 lg:w-1/4 border-r mobile-hide-episodes">
              <div class="pr-2 max-h-[300px] overflow-y-auto">
                <ul>
      `;
      
      // Add episode tabs
      comic.comic_episodes.forEach((episode, index) => {
        const isActive = index === 0;
        const episodeTitle = episode.title || `Tập ${index + 1}`;
        
        html += `
          <li>
            <button 
              class="comic-popup-episode-tab w-full text-left px-3 py-2 border-l-4 text-purple-600 ${isActive ? 'bg-purple-100 border-l-purple-600' : 'border-l-transparent hover:bg-gray-100'} transition-colors"
              data-index="${index}"
            >
              ${episodeTitle}
            </button>
          </li>
        `;
      });
      
      html += `
                </ul>
              </div>
            </div>
            
            <div class="md:w-2/3 lg:w-3/4 md:pl-6 mt-4 md:mt-0">
      `;
      
      // Add episode content
      comic.comic_episodes.forEach((episode, index) => {
        const isActive = index === 0;
        const episodeTitle = episode.title || `Tập ${index + 1}`;
        
        html += `
          <div class="comic-popup-episode-content ${isActive ? '' : 'hidden'}" data-index="${index}">
            <h4 class="text-lg font-medium text-purple-700 mb-2">${episodeTitle}</h4>
            
            ${episode.subTitle ? `<p class="text-sm text-gray-600 mb-3">${episode.subTitle}</p>` : ''}
            ${episode.description ? `<p class="mb-4 text-gray-700">${episode.description}</p>` : ''}
            
            <a href="/comic/${comic.slug}?episode_id=${index}" class="text-sm text-purple-600 hover:underline inline-flex items-center">
              Xem nội dung đầy đủ
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        `;
      });
      
      html += `
            </div>
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
    return html;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize comic popup functionality
  ComicPopupService.initialize();
});