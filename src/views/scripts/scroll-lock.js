/**
 * ScrollLock Utility
 * Quản lý khóa cuộn cho các popup, modal và menu
 */
const ScrollLock = (function() {
  let scrollableElements = [];
  let scrollPosition = 0;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  /**
   * Ngăn chặn cuộn cho body nhưng cho phép cuộn trong các container cụ thể
   * @param {string|Element} scrollableSelector - CSS selector hoặc Element có thể cuộn
   */
  function lockScroll(scrollableSelector) {
    // Lưu vị trí cuộn
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Khóa cuộn trên body
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';
    document.documentElement.classList.add('scroll-locked');
    
    // Xử lý đặc biệt cho iOS
    if (isIOS) {
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollPosition}px`;
    }
    
    // Thêm container có thể cuộn
    if (scrollableSelector) {
      const elements = typeof scrollableSelector === 'string' 
        ? document.querySelectorAll(scrollableSelector)
        : [scrollableSelector];
      
      elements.forEach(el => {
        if (el) {
          // Đặt style cho container có thể cuộn
          el.style.overflowY = 'auto';
          el.style.overscrollBehavior = 'contain';
          
          // Thêm event listener cho sự kiện wheel
          el.addEventListener('wheel', handleWheel, { passive: false });
          el.addEventListener('touchmove', handleTouchMove, { passive: false });
          
          scrollableElements.push({
            element: el,
            wheelHandler: handleWheel,
            touchMoveHandler: handleTouchMove
          });
        }
      });
    }
    
    // Ngăn cuộn trên document
    document.addEventListener('wheel', preventAllScroll, { passive: false });
    document.addEventListener('touchmove', preventAllScroll, { passive: false });
  }
  
  /**
   * Mở khóa cuộn
   */
  function unlockScroll() {
    // Xóa tất cả listeners cho scrollable elements
    scrollableElements.forEach(({ element, wheelHandler, touchMoveHandler }) => {
      element.removeEventListener('wheel', wheelHandler);
      element.removeEventListener('touchmove', touchMoveHandler);
      element.style.overflowY = '';
      element.style.overscrollBehavior = '';
    });
    scrollableElements = [];
    
    // Xóa style và class từ body/html
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.body.style.touchAction = '';
    document.documentElement.classList.remove('scroll-locked');
    
    // Xử lý đặc biệt cho iOS
    if (isIOS) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPosition);
    }
    
    // Gỡ bỏ listeners ngăn cuộn trên document
    document.removeEventListener('wheel', preventAllScroll);
    document.removeEventListener('touchmove', preventAllScroll);
  }
  
  // Xử lý sự kiện wheel trong container có thể cuộn
  function handleWheel(e) {
    const container = e.currentTarget;
    const isAtTop = container.scrollTop <= 0;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 1;
    
    // Ngăn cuộn quá giới hạn
    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.preventDefault();
    }
    
    // Ngăn lan sự kiện ra document
    e.stopPropagation();
  }
  
  // Xử lý sự kiện touchmove trong container có thể cuộn
  function handleTouchMove(e) {
    // Ngăn lan sự kiện ra document
    e.stopPropagation();
  }
  
  // Ngăn tất cả cuộn trên document
  function preventAllScroll(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // API công khai
  return {
    lock: lockScroll,
    unlock: unlockScroll
  };
})();

// Export để sử dụng trong các file khác
window.ScrollLock = ScrollLock;