$(document).ready(function() {
    const mainNav = $('#main-nav');
    const navItems = mainNav.find('.nav-item');
    const currentPath = window.location.pathname.split('/')[1] || '/';
    
    // Khôi phục trạng thái active từ localStorage
    const activeItem = localStorage.getItem('activeNavItem') || currentPath;
    
    // Cải thiện accessibility cho menu chính
    mainNav.attr('role', 'navigation');
    mainNav.attr('aria-label', 'Menu chính');
    
    // Thiết lập trạng thái active ban đầu
    navItems.each(function() {
        const $item = $(this);
        const itemPath = $item.data('path');
        
        // Thêm thuộc tính ARIA cho các mục menu
        $item.attr('role', 'menuitem');
        
        if (itemPath === activeItem) {
            $item.addClass('font-semibold nav-active');
            $item.attr('aria-current', 'page');
        }
    });
    
    // Xử lý sự kiện click
    navItems.on('click', function(e) {
        const $clickedItem = $(this);
        const itemPath = $clickedItem.data('path');
        
        // Xóa active class và ARIA từ tất cả items
        navItems.removeClass('text-black font-semibold');
        navItems.removeAttr('aria-current');
        
        // Thêm active class cho item được click
        $clickedItem.addClass('text-black font-semibold');
        $clickedItem.attr('aria-current', 'page');
        
        // Thông báo cho screen reader về việc thay đổi trang
        announcePageChange($clickedItem.text().trim());
        
        // Lưu trạng thái vào localStorage
        localStorage.setItem('activeNavItem', itemPath);
    });
    
    // Xử lý điều hướng bằng bàn phím
    navItems.on('keydown', function(e) {
        const $currentItem = $(this);
        let $targetItem;
        
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                $targetItem = $currentItem.next('.nav-item');
                if (!$targetItem.length) {
                    $targetItem = navItems.first(); // Quay vòng đến phần tử đầu tiên
                }
                $targetItem.focus();
                break;
                
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                $targetItem = $currentItem.prev('.nav-item');
                if (!$targetItem.length) {
                    $targetItem = navItems.last(); // Quay vòng đến phần tử cuối cùng
                }
                $targetItem.focus();
                break;
                
            case 'Home':
                e.preventDefault();
                navItems.first().focus();
                break;
                
            case 'End':
                e.preventDefault();
                navItems.last().focus();
                break;
        }
    });
    
    // Thông báo cho người dùng đang sử dụng trình đọc màn hình
    function announcePageChange(pageName) {
        // Tạo hoặc lấy phần tử thông báo
        let announcement = $('#a11y-announcement');
        
        if (!announcement.length) {
            announcement = $('<div>', {
                id: 'a11y-announcement',
                role: 'status',
                'aria-live': 'polite',
                css: {
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    margin: '-1px',
                    padding: '0',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: '0'
                }
            }).appendTo('body');
        }
        
        // Thông báo cho trình đọc màn hình
        announcement.text('Đang chuyển đến trang ' + pageName);
    }
});