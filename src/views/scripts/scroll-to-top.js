/**
 * Scroll to top functionality with enhanced smooth scrolling
 * Fixed iOS scrolling issues
 */
document.addEventListener('DOMContentLoaded', function() {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  
  if (!scrollToTopBtn) return;
  
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
  
  // Hiển thị nút khi người dùng cuộn xuống 300px từ đầu trang
  const showHideButton = function() {
    if (window.scrollY > 300) {
      if (!scrollToTopBtn.classList.contains('visible')) {
        scrollToTopBtn.classList.add('visible');
      }
    } else {
      if (scrollToTopBtn.classList.contains('visible')) {
        scrollToTopBtn.classList.remove('visible');
      }
    }
  };
  
  // Sử dụng cả scroll và touchmove để phát hiện cuộn trên các thiết bị cảm ứng
  window.addEventListener('scroll', showHideButton, { passive: true });
  
  // Thêm touchmove listener cho iOS
  if (isIOS || isMobile) {
    document.addEventListener('touchmove', showHideButton, { passive: true });
  }
  
  // Cuộn lên đầu trang khi nút được nhấn
  scrollToTopBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
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
      const scrollToTop = function() {
        const c = document.documentElement.scrollTop || document.body.scrollTop;
        if (c > 0) {
          window.requestAnimationFrame(scrollToTop);
          window.scrollTo(0, c - c / scrollStep);
        }
      };
      scrollToTop();
    }
  });
});