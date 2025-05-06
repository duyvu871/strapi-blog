/**
 * Scroll to top functionality with enhanced smooth scrolling
 * Fixed iOS scrolling issues with improved accessibility
 */
document.addEventListener('DOMContentLoaded', function() {
  let scrollToTopBtn = document.getElementById('scrollToTopBtn');
  
  // Nếu không tìm thấy nút, tạo nút mới và thêm vào DOM
  if (!scrollToTopBtn) {
    scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.id = 'scrollToTopBtn';
    scrollToTopBtn.className = 'scroll-to-top-btn';
    scrollToTopBtn.setAttribute('aria-label', 'Lên đầu trang');
    scrollToTopBtn.setAttribute('title', 'Lên đầu trang');
    scrollToTopBtn.innerHTML = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>';
    document.body.appendChild(scrollToTopBtn);
  }
  
  // Phát hiện thiết bị iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Khởi tạo Lenis cho smooth scrolling nếu thư viện đã được tải
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: isIOS ? 0.8 : 1.2, // Giảm thời gian duration trên iOS
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: !isIOS, // Tắt smooth trên iOS nếu gây vấn đề
      smoothTouch: isIOS ? false : true, // Tắt smoothTouch trên iOS
      touchMultiplier: isIOS ? 1.5 : 2, // Giảm touchMultiplier trên iOS
      wheelMultiplier: isIOS ? 0.8 : 1, // Thêm wheelMultiplier cho iOS
      normalizeWheel: true
    });
    
    // Kết nối Lenis với GSAP để hoạt động mượt mà với ScrollTrigger (nếu có)
    if (window.gsap && window.ScrollTrigger) {
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      
      gsap.ticker.lagSmoothing(0);
    } else {
      // Fallback nếu không có GSAP
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
    
    // Thêm xử lý đặc biệt cho iOS
    if (isIOS) {
      // Cố định vấn đề scroll bounce trên iOS
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
      
      // Thêm sự kiện touch để ngăn chặn các hành vi mặc định trên iOS
      document.addEventListener('touchmove', function(e) {
        if (e.scale !== 1) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }
  
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
  
  // Hiển thị nút khi người dùng cuộn xuống 300px từ đầu trang
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
  
  // Sử dụng cả scroll và touchmove để phát hiện cuộn trên các thiết bị cảm ứng
  window.addEventListener('scroll', showHideButton, { passive: true });
  
  // Thêm touchmove listener cho iOS
  if (isIOS || isMobile) {
    document.addEventListener('touchmove', showHideButton, { passive: true });
  }
  
  // Phát hiện sự kiện cuộn thông qua bàn phím để hiển thị nút
  window.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End' || e.key === 'Space') {
      // Kiểm tra scroll position sau một khoảng thời gian ngắn
      setTimeout(showHideButton, 100);
    }
  });
  
  // Cuộn lên đầu trang khi nút được nhấn
  scrollToTopBtn.addEventListener('click', function(e) {
    e.preventDefault();
    scrollToTop();
  });
  
  // Hỗ trợ phím Enter/Space khi focus vào nút
  scrollToTopBtn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      scrollToTop();
    }
  });
  
  function scrollToTop() {
    announceToScreenReader('Đang cuộn lên đầu trang');
    
    // Sử dụng Lenis nếu có
    if (lenis) {
      lenis.scrollTo(0, { 
        duration: isIOS ? 0.8 : 1.2, // Giảm thời gian duration trên iOS
        force: isIOS // Thêm force cho iOS
      });
    } else if ('scrollBehavior' in document.documentElement.style && !isIOS) {
      // Sử dụng native smooth scrolling cho các trình duyệt hiện đại
      // Tránh sử dụng scrollBehavior: 'smooth' trên iOS vì có thể gây lỗi
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Fallback cho các trình duyệt cũ hoặc iOS với hiệu ứng mô phỏng
      const scrollStep = isIOS ? 4 : 8; // Tăng tốc độ cuộn trên iOS
      const scrollToTopAnimation = function() {
        const c = document.documentElement.scrollTop || document.body.scrollTop;
        if (c > 0) {
          window.requestAnimationFrame(scrollToTopAnimation);
          window.scrollTo(0, c - c / scrollStep);
        }
      };
      scrollToTopAnimation();
    }
  }
  
  // Thêm sự kiện cuộn nhanh bằng phím nóng
  document.addEventListener('keydown', function(e) {
    // Alt + Home để cuộn lên đầu trang
    if (e.altKey && (e.key === 'Home')) {
      e.preventDefault();
      scrollToTop();
    }
  });
  
  // Khởi tạo trạng thái ban đầu
  scrollToTopBtn.setAttribute('aria-hidden', 'true');
  showHideButton();
});