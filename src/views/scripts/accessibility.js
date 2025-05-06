/**
 * Accessibility Enhancements
 * Cải thiện tính năng tiếp cận cho toàn bộ trang web
 */
document.addEventListener('DOMContentLoaded', function() {
  // Thêm skip link vào trang nếu chưa có
  addSkipToContentLink();
  
  // Cải thiện các thuộc tính ARIA cho các phần tử tương tác
  enhanceInteractiveElements();
  
  // Đảm bảo tất cả các hình ảnh đều có alt text
  checkImagesForAltText();
  
  // Cải thiện điều hướng bàn phím
  enhanceKeyboardNavigation();
  
  // Thêm hỗ trợ cho người dùng sử dụng tính năng high contrast
  enhanceContrastSupport();
  
  // Thêm hỗ trợ cho người dùng sử dụng tính năng reduced motion
  respectReducedMotion();
  
  // Phát hiện thiết bị trợ năng và điều chỉnh UI phù hợp
  detectAssistiveTechnology();
});

/**
 * Thêm skip link để người dùng bàn phím có thể bỏ qua các phần điều hướng
 */
function addSkipToContentLink() {
  // Kiểm tra xem đã có skip link chưa
  if (!document.getElementById('skip-to-content')) {
    // Tạo skip link element
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-content';
    skipLink.className = 'skip-to-main';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Bỏ qua và đến nội dung chính';
    
    // Chèn vào đầu body
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Đảm bảo có một thẻ với id="main-content", nếu không thì thêm vào
    if (!document.getElementById('main-content')) {
      // Tìm phần tử có thể là nội dung chính (ví dụ: main, article, div.content)
      let mainContent = document.querySelector('main, article, .content, .article-content');
      
      if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('tabindex', '-1');
        
        // Thêm style để tránh outline focus khi click vào skip link
        const style = document.createElement('style');
        style.textContent = '#main-content:focus { outline: none; }';
        document.head.appendChild(style);
      }
    }
  }
}

/**
 * Cải thiện các thuộc tính ARIA cho các phần tử tương tác
 */
function enhanceInteractiveElements() {
  // Cải thiện các nút không có text hoặc ARIA label
  document.querySelectorAll('button').forEach(button => {
    if (!button.textContent.trim() && !button.getAttribute('aria-label') && !button.getAttribute('title')) {
      // Tìm icon trong nút
      const icon = button.querySelector('svg, img, i');
      if (icon) {
        // Thử đoán chức năng dựa vào lớp CSS
        let purpose = '';
        const className = icon.className.toLowerCase();
        
        if (className.includes('close') || className.includes('x-')) {
          purpose = 'Đóng';
        } else if (className.includes('menu') || className.includes('hamburger')) {
          purpose = 'Menu';
        } else if (className.includes('search')) {
          purpose = 'Tìm kiếm';
        } else if (className.includes('share')) {
          purpose = 'Chia sẻ';
        } else if (className.includes('arrow') && (className.includes('up') || className.includes('top'))) {
          purpose = 'Lên đầu trang';
        } else {
          purpose = 'Nút';
        }
        
        button.setAttribute('aria-label', purpose);
      }
    }
  });
  
  // Đảm bảo tất cả các liên kết đều có nội dung có thể truy cập được
  document.querySelectorAll('a').forEach(link => {
    // Kiểm tra xem link có nội dung không
    if (!link.textContent.trim() && !link.getAttribute('aria-label') && !link.getAttribute('title')) {
      // Nếu có hình ảnh, sử dụng alt text của ảnh
      const img = link.querySelector('img');
      if (img && img.alt) {
        link.setAttribute('aria-label', img.alt);
      } else {
        // Thử đoán mục đích dựa trên href
        const href = link.getAttribute('href') || '';
        
        if (href.includes('facebook.com')) {
          link.setAttribute('aria-label', 'Facebook');
        } else if (href.includes('twitter.com') || href.includes('x.com')) {
          link.setAttribute('aria-label', 'Twitter');
        } else if (href.includes('linkedin.com')) {
          link.setAttribute('aria-label', 'LinkedIn');
        } else if (href.includes('instagram.com')) {
          link.setAttribute('aria-label', 'Instagram');
        } else if (href.includes('tel:')) {
          link.setAttribute('aria-label', 'Gọi điện thoại: ' + href.replace('tel:', ''));
        } else if (href.includes('mailto:')) {
          link.setAttribute('aria-label', 'Gửi email: ' + href.replace('mailto:', ''));
        } else if (href === '#') {
          link.setAttribute('aria-label', 'Liên kết tương tác');
        }
      }
    }
    
    // Thêm thuộc tính rel="noopener" cho các liên kết ngoài
    if (link.hostname && link.hostname !== window.location.hostname && !link.rel.includes('noopener')) {
      link.setAttribute('rel', (link.rel ? link.rel + ' ' : '') + 'noopener');
    }
  });
}

/**
 * Kiểm tra và cảnh báo về các hình ảnh không có alt text
 */
function checkImagesForAltText() {
  document.querySelectorAll('img').forEach(img => {
    // Kiểm tra xem có alt text hay không
    if (!img.hasAttribute('alt')) {
      // Thêm alt rỗng cho hình ảnh trang trí
      if (img.classList.contains('decoration') || img.classList.contains('bg-image')) {
        img.alt = '';
      } else {
        // Hiện outline đỏ xung quanh hình ảnh không có alt text (chỉ trong dev mode)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          img.style.outline = '2px dashed red';
          console.warn('Hình ảnh không có thuộc tính alt:', img);
        }
        
        // Thử lấy tên tệp để làm alt tạm thời
        const src = img.getAttribute('src');
        if (src) {
          const fileName = src.split('/').pop().split('?')[0];
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
          const readableName = nameWithoutExt.replace(/[-_]/g, ' ');
          img.alt = readableName;
        } else {
          img.alt = '';
        }
      }
    }
  });
}

/**
 * Cải thiện điều hướng bàn phím
 */
function enhanceKeyboardNavigation() {
  // Thêm chỉ báo focus rõ ràng
  const style = document.createElement('style');
  style.textContent = `
    /* Focus indicator for keyboard users */
    :focus-visible {
      outline: 3px solid #9333ea !important;
      outline-offset: 2px !important;
      border-radius: 2px;
    }
  `;
  document.head.appendChild(style);
  
  // Thêm tabindex=-1 cho headings để có thể focus bằng JS (cho việc điều hướng tiêu đề)
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
    }
    
    // Thêm id nếu heading chưa có
    if (!heading.id) {
      const headingText = heading.textContent.trim().toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Loại bỏ ký tự đặc biệt
        .replace(/[\s_-]+/g, '-')  // Thay thế khoảng trắng và gạch dưới bằng gạch ngang
        .replace(/^-+|-+$/g, '');  // Loại bỏ gạch ngang ở đầu và cuối
      
      if (headingText) {
        heading.id = 'heading-' + headingText;
      }
    }
  });
  
  // Thêm phím tắt Alt+S để focus vào khung tìm kiếm
  document.addEventListener('keydown', function(e) {
    // Alt + S: focus vào ô tìm kiếm
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      const searchInput = document.querySelector('input[type="search"], .search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // Alt + H: quay về trang chủ
    if (e.altKey && e.key === 'h') {
      e.preventDefault();
      window.location.href = '/';
    }
  });
}

/**
 * Cải thiện hỗ trợ độ tương phản cao
 */
function enhanceContrastSupport() {
  // Kiểm tra xem người dùng có bật chế độ tương phản cao không
  if (window.matchMedia('(forced-colors: active)').matches) {
    // Apply specific styles for high contrast mode
    const highContrastStyles = document.createElement('style');
    highContrastStyles.textContent = `
      /* High Contrast Mode Adjustments */
      a {
        text-decoration: underline !important;
      }
      
      button, .button, [role="button"] {
        border: 1px solid ButtonText !important;
      }
      
      img, svg {
        background-color: transparent !important;
      }
    `;
    document.head.appendChild(highContrastStyles);
  }
}

/**
 * Tôn trọng tùy chọn reduced-motion
 */
function respectReducedMotion() {
  // Kiểm tra xem người dùng có bật chế độ giảm hiệu ứng chuyển động không
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Apply styles to reduce or eliminate animations
    const reducedMotionStyles = document.createElement('style');
    reducedMotionStyles.textContent = `
      /* Reduced Motion Adjustments */
      * {
        transition-duration: 0.001ms !important;
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
      }
      
      .animate, .animated, [data-aos], .fade, .slide {
        opacity: 1 !important;
        transform: none !important;
        animation: none !important;
      }
    `;
    document.head.appendChild(reducedMotionStyles);
    
    // Tắt các animation đang chạy
    document.querySelectorAll('.animated, [data-aos], .gsap-marker, .lottie').forEach(el => {
      if (typeof el.pause === 'function') {
        el.pause();
      }
    });
    
    // Vô hiệu hóa AOS animations nếu có
    if (window.AOS) {
      window.AOS.init({
        disable: true
      });
    }
    
    // Vô hiệu hóa smooth scrolling
    if (window.lenis) {
      window.lenis.destroy();
    }
  }
}

/**
 * Phát hiện công nghệ hỗ trợ và điều chỉnh UI phù hợp
 */
function detectAssistiveTechnology() {
  // Nếu phát hiện có trình đọc màn hình, điều chỉnh UI phù hợp
  if (document.documentElement.getAttribute('data-force-colors') === 'true' ||
      window.matchMedia('(forced-colors: active)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      
    // Thêm dự phòng cho các icon SVG
    document.querySelectorAll('svg').forEach(svg => {
      // Thêm role và aria-label cho SVG icon
      if (!svg.getAttribute('role')) {
        svg.setAttribute('role', 'img');
      }
      
      // Đảm bảo svg có vùng mô tả
      const title = svg.querySelector('title');
      if (!title && !svg.getAttribute('aria-label') && !svg.getAttribute('aria-hidden')) {
        svg.setAttribute('aria-hidden', 'true');
      }
    });
    
    // Đảm bảo các form control có nhãn
    document.querySelectorAll('input, select, textarea').forEach(control => {
      if (!control.id) return;
      
      // Kiểm tra xem đã có label hay chưa
      const hasLabel = document.querySelector(`label[for="${control.id}"]`);
      if (!hasLabel && !control.getAttribute('aria-label')) {
        // Tìm placeholder và chuyển đổi thành aria-label
        const placeholder = control.getAttribute('placeholder');
        if (placeholder) {
          control.setAttribute('aria-label', placeholder);
        }
      }
    });
  }
}

// Thêm thông báo trạng thái cho người dùng trình đọc màn hình
function announceToScreenReader(message, priority = 'polite') {
  let announcement = document.getElementById('a11y-announcement');
  
  if (!announcement) {
    announcement = document.createElement('div');
    announcement.id = 'a11y-announcement';
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority); // 'polite' hoặc 'assertive'
    announcement.style.cssText = 'position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;';
    document.body.appendChild(announcement);
  }
  
  // Đặt aria-live thành giá trị ưu tiên
  announcement.setAttribute('aria-live', priority);
  
  // Thông báo cho trình đọc màn hình
  announcement.textContent = '';
  setTimeout(() => {
    announcement.textContent = message;
  }, 50);
}

// Export hàm để có thể sử dụng ở các file khác
window.a11y = {
  announce: announceToScreenReader
};