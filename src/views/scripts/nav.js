$(document).ready(function() {
    const mainNav = $('#main-nav');
    const navItems = mainNav.find('.nav-item');
    const currentPath = window.location.pathname.split('/')[1] || '/';
    
    // Khôi phục trạng thái active từ localStorage
    const activeItem = localStorage.getItem('activeNavItem') || currentPath;
    
    // Thiết lập trạng thái active ban đầu
    navItems.each(function() {
        const $item = $(this);
        const itemPath = $item.data('path');
        
        if (itemPath === activeItem) {
            $item.addClass('font-semibold nav-active');
        }
    });
    
    // Xử lý sự kiện click
    navItems.on('click', function(e) {
        const $clickedItem = $(this);
        const itemPath = $clickedItem.data('path');
        
        // Xóa active class từ tất cả items
        navItems.removeClass('text-black font-semibold');
        
        // Thêm active class cho item được click
        $clickedItem.addClass('text-black font-semibold');
        
        // Lưu trạng thái vào localStorage
        localStorage.setItem('activeNavItem', itemPath);
    });
});