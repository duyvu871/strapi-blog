/**
 * Sidebar Menu Drawer
 * Xử lý hiệu ứng đóng mở sidebar menu từ trái sang phải
 */
document.addEventListener('DOMContentLoaded', function() {
  // Các phần tử DOM cần thiết
  const sidebarMenu = document.getElementById('sidebar-menu');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const openSidebarBtn = document.getElementById('open-sidebar');
  const closeSidebarBtn = document.getElementById('close-sidebar');
  
  // Kiểm tra nếu các phần tử tồn tại
  if (!sidebarMenu || !sidebarOverlay || !openSidebarBtn || !closeSidebarBtn) return;
  
  // Phát hiện thiết bị iOS để xử lý đặc biệt
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // Mở sidebar
  function openSidebar() {
    sidebarMenu.classList.add('active');
    sidebarOverlay.classList.add('active');
    
    // Ngăn cuộn trang khi sidebar mở
    document.body.style.overflow = 'hidden';
    
    // Xử lý đặc biệt cho iOS
    if (isIOS) {
      // Ngăn chặn scroll trên iOS khi sidebar mở
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
  }
  
  // Đóng sidebar
  function closeSidebar() {
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    
    // Cho phép cuộn trang khi sidebar đóng
    document.body.style.overflow = '';
    
    // Xử lý đặc biệt cho iOS
    if (isIOS) {
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }
  
  // Sự kiện click cho các nút và overlay
  openSidebarBtn.addEventListener('click', openSidebar);
  closeSidebarBtn.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  
  // Đóng sidebar khi nhấn phím ESC
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && sidebarMenu.classList.contains('active')) {
      closeSidebar();
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