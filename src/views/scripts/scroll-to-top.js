/**
 * Scroll to top functionality with vanilla JavaScript
 * Improved accessibility and performance
 */
document.addEventListener('DOMContentLoaded', function() {
  let scrollToTopBtn = document.getElementById('scrollToTopBtn');
  
  // If button doesn't exist, create it
  if (!scrollToTopBtn) {
    scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.id = 'scrollToTopBtn';
    scrollToTopBtn.className = 'scroll-to-top-btn';
    scrollToTopBtn.setAttribute('aria-label', 'Lên đầu trang');
    scrollToTopBtn.setAttribute('title', 'Lên đầu trang');
    scrollToTopBtn.innerHTML = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>';
    document.body.appendChild(scrollToTopBtn);
  }
  
  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Accessibility announcement element
  const announceToScreenReader = (message) => {
    let announcement = document.getElementById('a11y-announcement');
    
    if (!announcement) {
      announcement = document.createElement('div');
      announcement.id = 'a11y-announcement';
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.style.cssText = 'position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;';
      document.body.appendChild(announcement);
    }
    
    announcement.textContent = message;
  };
  
  // Show/hide button based on scroll position
  const showHideButton = function() {
    const isVisible = scrollToTopBtn.classList.contains('visible');
    
    if (window.scrollY > 300) {
      if (!isVisible) {
        scrollToTopBtn.classList.add('visible');
        scrollToTopBtn.setAttribute('aria-hidden', 'false');
      }
    } else {
      if (isVisible) {
        scrollToTopBtn.classList.remove('visible');
        scrollToTopBtn.setAttribute('aria-hidden', 'true');
      }
    }
  };
  
  // Use passive event listeners for better performance
  window.addEventListener('scroll', showHideButton, { passive: true });
  
  // Add touchmove listener for mobile devices
  if (isMobile) {
    document.addEventListener('touchmove', showHideButton, { passive: true });
  }
  
  // Detect keyboard scrolling
  window.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End' || e.key === 'Space') {
      setTimeout(showHideButton, 100);
    }
  });
  
  // Scroll to top function
  scrollToTopBtn.addEventListener('click', function(e) {
    e.preventDefault();
    scrollToTop();
  });
  
  // Keyboard accessibility
  scrollToTopBtn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      scrollToTop();
    }
  });
  
  // Scroll to top with vanilla JS
  function scrollToTop() {
    announceToScreenReader('Đang cuộn lên đầu trang');
    
    // Check if native smooth scrolling is supported
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Fallback smooth scrolling for browsers that don't support scrollBehavior
      const duration = 500; // ms
      const startPos = window.pageYOffset;
      const startTime = performance.now();
      
      function step(currentTime) {
        const elapsed = currentTime - startTime;
        // Easing function: easeInOutQuad
        const position = elapsed < duration 
          ? startPos * (1 - (elapsed / duration) * (elapsed / duration))
          : 0;
        
        window.scrollTo(0, position);
        
        if (elapsed < duration) {
          window.requestAnimationFrame(step);
        }
      }
      
      window.requestAnimationFrame(step);
    }
  }
  
  // Alt + Home keyboard shortcut
  document.addEventListener('keydown', function(e) {
    if (e.altKey && (e.key === 'Home')) {
      e.preventDefault();
      scrollToTop();
    }
  });
  
  // Initialize button state
  scrollToTopBtn.setAttribute('aria-hidden', 'true');
  showHideButton();
});