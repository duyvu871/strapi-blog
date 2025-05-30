/**
 * Sidebar Menu Drawer
 * Xử lý hiệu ứng đóng mở sidebar menu từ trái sang phải với hỗ trợ accessibility
 */
document.addEventListener('DOMContentLoaded', function() {
  // Các phần tử DOM cần thiết
  const sidebarMenu = document.getElementById('sidebar-menu');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const openSidebarBtn = document.getElementById('open-sidebar');
  const closeSidebarBtn = document.getElementById('close-sidebar');
  
  // Kiểm tra nếu các phần tử tồn tại
  if (!sidebarMenu || !sidebarOverlay || !openSidebarBtn || !closeSidebarBtn) return;

  // Thêm thuộc tính aria cho accessibility
  openSidebarBtn.setAttribute('aria-expanded', 'false');
  openSidebarBtn.setAttribute('aria-controls', 'sidebar-menu');
  openSidebarBtn.setAttribute('aria-label', 'Mở menu');
  
  closeSidebarBtn.setAttribute('aria-label', 'Đóng menu');
  
  sidebarMenu.setAttribute('role', 'navigation');
  sidebarMenu.setAttribute('aria-label', 'Menu chính');
  sidebarMenu.setAttribute('aria-hidden', 'true');
  
  // Phát hiện thiết bị iOS để xử lý đặc biệt
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // Lưu vị trí scroll khi mở menu
  let scrollPosition = 0;
  
  // Thông báo cho người dùng đang sử dụng trình đọc màn hình
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
  
  // Phương pháp mạnh mẽ hơn để ngăn cuộn trang - ngăn sự kiện wheel và touchmove
  function preventScroll(e) {
    // Kiểm tra xem sự kiện có bắt nguồn từ menu hay không
    const isFromMenu = e.target.closest('#sidebar-menu');
    
    if (!isFromMenu) {
      // Nếu không phải từ menu, chặn sự kiện
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Ở đây sự kiện bắt nguồn từ menu
    const isAtTop = e.target.scrollTop <= 0;
    const isAtBottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight;
    
    // Nếu menu đã ở đầu và đang cuộn lên hoặc đã ở cuối và đang cuộn xuống
    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Cho phép cuộn trong menu
    e.stopPropagation();
  }
  
  // Mở sidebar
  function openSidebar() {
    // Lưu vị trí cuộn hiện tại trước khi khóa
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    sidebarMenu.classList.add('active');
    sidebarOverlay.classList.add('active');
    
    // Cập nhật thuộc tính ARIA
    sidebarMenu.setAttribute('aria-hidden', 'false');
    openSidebarBtn.setAttribute('aria-expanded', 'true');
    
    // Sử dụng ScrollLock utility thay vì code cũ
    if (window.ScrollLock) {
      window.ScrollLock.lock(sidebarMenu);
    } else {
      // Fallback nếu ScrollLock chưa được tải
      document.body.style.overflow = 'hidden';
    }
    
    // Thông báo cho trình đọc màn hình
    announceToScreenReader('Menu đã mở');
    
    // Di chuyển focus vào nút đóng menu cho tương tác bàn phím
    setTimeout(() => {
      closeSidebarBtn.focus();
    }, 100);
    
    // Thiết lập focus trap
    setupFocusTrap();
  }
  
  // Đóng sidebar
  function closeSidebar() {
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    
    // Cập nhật thuộc tính ARIA
    sidebarMenu.setAttribute('aria-hidden', 'true');
    openSidebarBtn.setAttribute('aria-expanded', 'false');
    
    // Sử dụng ScrollLock utility để mở khóa cuộn
    if (window.ScrollLock) {
      window.ScrollLock.unlock();
    } else {
      // Fallback nếu ScrollLock chưa được tải
      document.body.style.overflow = '';
    }
    
    // Thông báo cho trình đọc màn hình
    announceToScreenReader('Menu đã đóng');
    
    // Di chuyển focus về nút mở menu
    openSidebarBtn.focus();
    
    // Xóa focus trap
    removeFocusTrap();
  }
  
  // Thiết lập focus trap trong sidebar để cải thiện trải nghiệm điều hướng bàn phím
  let focusTrapEnabled = false;
  let firstFocusableElement;
  let lastFocusableElement;
  
  function setupFocusTrap() {
    // Tìm tất cả các phần tử có thể focus trong sidebar
    const focusableElements = sidebarMenu.querySelectorAll(
      'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex="0"]'
    );
    
    if (focusableElements.length === 0) return;
    
    firstFocusableElement = focusableElements[0];
    lastFocusableElement = focusableElements[focusableElements.length - 1];
    
    // Thêm sự kiện keydown để bẫy focus
    document.addEventListener('keydown', handleTabKeyForFocusTrap);
    focusTrapEnabled = true;
  }
  
  function removeFocusTrap() {
    if (focusTrapEnabled) {
      document.removeEventListener('keydown', handleTabKeyForFocusTrap);
      focusTrapEnabled = false;
    }
  }
  
  function handleTabKeyForFocusTrap(e) {
    if (!focusTrapEnabled) return;
    
    // Nếu không phải phím Tab, bỏ qua
    if (e.key !== 'Tab') return;
    
    // Nếu shift + tab và đang ở firstFocusableElement
    if (e.shiftKey && document.activeElement === firstFocusableElement) {
      e.preventDefault();
      lastFocusableElement.focus();
    }
    // Nếu tab (không shift) và đang ở lastFocusableElement
    else if (!e.shiftKey && document.activeElement === lastFocusableElement) {
      e.preventDefault();
      firstFocusableElement.focus();
    }
  }
  
  // Ngăn cuộn bên trong sidebar menu lan sang body
  sidebarMenu.addEventListener('wheel', function(e) {
    // Ngăn sự kiện lan ra document
    e.stopPropagation();
  }, { passive: false });
  
  // Sự kiện click cho các nút và overlay
  openSidebarBtn.addEventListener('click', openSidebar);
  closeSidebarBtn.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  
  // Đóng sidebar khi nhấn phím ESC
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && sidebarMenu.classList.contains('active')) {
      closeSidebar();
      event.preventDefault(); // Ngăn chặn các hành động mặc định
    }
  });
  
  // Xử lý swipe để đóng sidebar trên thiết bị di động
  let touchStartX = 0;
  let touchEndX = 0;
  
  sidebarMenu.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });
  
  sidebarMenu.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    // Nếu swipe từ trái sang phải (đóng menu)
    if (touchStartX < touchEndX && touchEndX - touchStartX > 70) {
      closeSidebar();
    }
  }
});