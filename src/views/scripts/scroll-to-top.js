/**
 * Scroll to top functionality with enhanced smooth scrolling
 */
document.addEventListener('DOMContentLoaded', function() {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  
  if (!scrollToTopBtn) return;
  
  // Khởi tạo Lenis cho smooth scrolling nếu thư viện đã được tải
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2
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
  }
  
  // Hiển thị nút khi người dùng cuộn xuống 300px từ đầu trang
  window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
      if (!scrollToTopBtn.classList.contains('visible')) {
        scrollToTopBtn.classList.add('visible');
      }
    } else {
      if (scrollToTopBtn.classList.contains('visible')) {
        scrollToTopBtn.classList.remove('visible');
      }
    }
  });
  
  // Cuộn lên đầu trang khi nút được nhấn
  scrollToTopBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Sử dụng Lenis nếu có
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    } else if ('scrollBehavior' in document.documentElement.style) {
      // Sử dụng native smooth scrolling cho các trình duyệt hiện đại
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Fallback cho các trình duyệt cũ với hiệu ứng mô phỏng
      const scrollToTop = function() {
        const c = document.documentElement.scrollTop || document.body.scrollTop;
        if (c > 0) {
          window.requestAnimationFrame(scrollToTop);
          window.scrollTo(0, c - c / 8);
        }
      };
      scrollToTop();
    }
  });
});