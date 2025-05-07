// Menu Handlers
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.getElementById('open-sidebar');
  const sidebarMenu = document.getElementById('sidebar-menu');
  const closeSidebarButton = document.getElementById('close-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  // Exit if any required elements are missing
  if (!mobileMenuToggle || !sidebarMenu || !closeSidebarButton || !sidebarOverlay) {
    console.error('Menu elements not found in the DOM');
    return;
  }
  
  // Save initial scroll position
  let scrollPosition = 0;
  
  // Function to toggle menu visibility
  function toggleMenu() {
    const isOpen = sidebarMenu.classList.contains('active');
    
    if (isOpen) {
      // Close menu
      sidebarMenu.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.classList.remove('menu-open');
      
      // Restore scroll position
      window.scrollTo(0, scrollPosition);
      
      // Update ARIA attributes
      sidebarMenu.setAttribute('aria-hidden', 'true');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    } else {
      // Save current scroll position
      scrollPosition = window.pageYOffset;
      
      // Open menu
      sidebarMenu.classList.add('active');
      sidebarOverlay.classList.add('active');
      document.body.classList.add('menu-open');
      
      // Update ARIA attributes
      sidebarMenu.setAttribute('aria-hidden', 'false');
      mobileMenuToggle.setAttribute('aria-expanded', 'true');
      
      // Prevent background scrolling
    //   document.body.style.overflow = 'hidden';
    }
  }
  
  // Add click handlers
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMenu);
  }
  
  if (closeSidebarButton) {
    closeSidebarButton.addEventListener('click', toggleMenu);
  }
  
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', toggleMenu);
  }
  
  // Close menu on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && sidebarMenu.classList.contains('active')) {
      toggleMenu();
    }
  });
});