# Ví Dụ Code Cơ Bản

Tài liệu này cung cấp các ví dụ code cơ bản cho hệ thống front-end sử dụng Handlebars, Alpine.js và Tailwind CSS.

## 1. File Layout Handlebars

### `src/views/layouts/main.handlebars`

```handlebars
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{meta.description}}">
    <meta name="keywords" content="{{meta.keywords}}">
    <meta property="og:title" content="{{meta.ogTitle}}">
    <meta property="og:description" content="{{meta.ogDescription}}">
    <meta property="og:image" content="{{meta.ogImage}}">
    <meta property="og:url" content="{{meta.ogUrl}}">
    <meta name="twitter:card" content="summary_large_image">
    <title>{{title}} | Site Name</title>
    
    <!-- Tailwind CSS -->
    <link href="/style/tailwind.css" rel="stylesheet">
    
    <!-- Các CSS tùy chỉnh -->
    {{#each cssFiles}}
        <link href="/style/{{this}}" rel="stylesheet">
    {{/each}}
    
    <!-- Alpine.js -->
    <script defer src="/script/alpine.min.js"></script>
    
    <!-- Google Analytics -->
    {{> partials/analytics/google-analytics }}
</head>
<body class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    {{> partials/header/header }}
    
    <!-- Main Content -->
    <main class="flex-grow">
        {{{body}}}
    </main>
    
    <!-- Footer -->
    {{> partials/footer/footer }}
    
    <!-- Notification Component -->
    {{#if notification}}
        {{> partials/components/notification notification=notification }}
    {{/if}}
    
    <!-- Các JS tùy chỉnh -->
    {{#each jsFiles}}
        <script src="/script/{{this}}"></script>
    {{/each}}
</body>
</html>
```

## 2. File Partial Handlebars Component

### `src/views/partials/components/button/button.handlebars`

```handlebars
<button 
    x-data="button()"
    x-init="init()"
    x-on:click="handleClick"
    class="px-4 py-2 rounded-md transition-colors duration-200 {{#if primary}}bg-blue-600 hover:bg-blue-700 text-white{{else}}{{#if secondary}}bg-gray-200 hover:bg-gray-300 text-gray-800{{else}}{{#if danger}}bg-red-600 hover:bg-red-700 text-white{{else}}bg-gray-100 hover:bg-gray-200 text-gray-800{{/if}}{{/if}}{{/if}} {{#if disabled}}opacity-50 cursor-not-allowed{{/if}} {{className}}"
    {{#if disabled}}disabled{{/if}}
    {{#if id}}id="{{id}}"{{/if}}
    {{#if dataAttributes}}
        {{#each dataAttributes}}
            data-{{@key}}="{{this}}"
        {{/each}}
    {{/if}}
>
    {{#if isLoading}}
        <span class="inline-block animate-spin mr-2">&#9696;</span>
    {{/if}}
    {{#if icon}}
        <span class="mr-2">{{icon}}</span>
    {{/if}}
    {{label}}
</button>
```

### `src/views/partials/components/card/card.handlebars`

```handlebars
<div 
    x-data="card()"
    x-init="init()"
    class="rounded-lg overflow-hidden shadow-md {{#if hoverable}}hover:shadow-lg transition-shadow duration-300{{/if}} {{className}}"
    {{#if id}}id="{{id}}"{{/if}}
>
    {{#if image}}
    <div class="relative">
        <img src="{{image}}" alt="{{imageAlt}}" class="w-full h-48 object-cover">
        {{#if badge}}
        <span class="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">{{badge}}</span>
        {{/if}}
    </div>
    {{/if}}
    
    <div class="p-4">
        {{#if title}}
        <h3 class="text-lg font-semibold mb-2">{{title}}</h3>
        {{/if}}
        
        {{#if content}}
        <p class="text-gray-600 mb-4">{{content}}</p>
        {{/if}}
        
        {{#if footer}}
        <div class="border-t pt-3 mt-3">
            {{footer}}
        </div>
        {{/if}}
        
        {{#if actions}}
        <div class="flex justify-end space-x-2 mt-4">
            {{#each actions}}
                {{> partials/components/button/button this}}
            {{/each}}
        </div>
        {{/if}}
    </div>
</div>
```

### `src/views/partials/components/modal/modal.handlebars`

```handlebars
<div 
    x-data="modal()"
    x-init="init()"
    x-show="isOpen"
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="opacity-0 transform scale-90"
    x-transition:enter-end="opacity-100 transform scale-100"
    x-transition:leave="transition ease-in duration-300"
    x-transition:leave-start="opacity-100 transform scale-100"
    x-transition:leave-end="opacity-0 transform scale-90"
    class="fixed inset-0 z-50 overflow-y-auto" 
    style="display: none;"
>
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div 
            x-show="isOpen" 
            x-transition:enter="transition ease-out duration-300"
            x-transition:enter-start="opacity-0"
            x-transition:enter-end="opacity-100"
            x-transition:leave="transition ease-in duration-200"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            class="fixed inset-0 transition-opacity" 
            aria-hidden="true"
        >
            <div class="absolute inset-0 bg-gray-500 opacity-75" @click="close()"></div>
        </div>

        <!-- Modal panel -->
        <div 
            class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="modal-headline"
        >
            <!-- Header -->
            <div class="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <h3 class="text-lg font-medium text-gray-900" id="modal-headline">{{title}}</h3>
                <button @click="close()" class="text-gray-400 hover:text-gray-500">
                    <span class="sr-only">Close</span>
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <!-- Content -->
            <div class="px-4 py-3">
                {{#if content}}
                    {{content}}
                {{else}}
                    {{{body}}}
                {{/if}}
            </div>
            
            <!-- Footer -->
            {{#if footer}}
                <div class="bg-gray-50 px-4 py-3 border-t flex justify-end space-x-2">
                    {{footer}}
                </div>
            {{else}}
                <div class="bg-gray-50 px-4 py-3 border-t flex justify-end space-x-2">
                    <button @click="close()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200">
                        {{cancelText|default:"Hủy"}}
                    </button>
                    <button @click="confirm()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
                        {{confirmText|default:"Xác nhận"}}
                    </button>
                </div>
            {{/if}}
        </div>
    </div>
</div>
```

## 3. File Alpine.js Component

### `src/views/script/components/button.js`

```javascript
/**
 * Button component
 * @param {Object} options - Button options
 * @returns {Object} Alpine.js component data
 */
function button(options = {}) {
    return {
        isLoading: false,
        disabled: false,
        
        /**
         * Initialize the button
         */
        init() {
            // Merge options with defaults
            Object.assign(this, options);
            
            // Listen for custom events
            this.$el.addEventListener('set-loading', (event) => {
                this.isLoading = event.detail.loading;
            });
            
            this.$el.addEventListener('set-disabled', (event) => {
                this.disabled = event.detail.disabled;
            });
        },
        
        /**
         * Handle button click
         * @param {Event} event - Click event
         */
        handleClick(event) {
            if (this.disabled || this.isLoading) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            
            // Emit click event for parent components
            this.$dispatch('button-clicked', {
                id: this.$el.id,
                dataset: this.$el.dataset
            });
            
            // If there's a custom click handler defined, call it
            if (typeof this.onClick === 'function') {
                this.onClick(event);
            }
        },
        
        /**
         * Set loading state
         * @param {boolean} loading - Loading state
         */
        setLoading(loading) {
            this.isLoading = loading;
        },
        
        /**
         * Set disabled state
         * @param {boolean} disabled - Disabled state
         */
        setDisabled(disabled) {
            this.disabled = disabled;
        }
    };
}
```

### `src/views/script/components/card.js`

```javascript
/**
 * Card component
 * @param {Object} options - Card options
 * @returns {Object} Alpine.js component data
 */
function card(options = {}) {
    return {
        expanded: false,
        
        /**
         * Initialize the card
         */
        init() {
            // Merge options with defaults
            Object.assign(this, options);
        },
        
        /**
         * Toggle expanded state
         */
        toggleExpand() {
            this.expanded = !this.expanded;
            
            // Emit event for parent components
            this.$dispatch('card-expanded', {
                id: this.$el.id,
                expanded: this.expanded
            });
        }
    };
}
```

### `src/views/script/components/modal.js`

```javascript
/**
 * Modal component
 * @param {Object} options - Modal options
 * @returns {Object} Alpine.js component data
 */
function modal(options = {}) {
    return {
        isOpen: false,
        onConfirm: null,
        onCancel: null,
        onClose: null,
        
        /**
         * Initialize the modal
         */
        init() {
            // Merge options with defaults
            Object.assign(this, options);
            
            // Listen for custom events
            window.addEventListener('open-modal', (event) => {
                if (event.detail.id === this.$el.id) {
                    this.open(event.detail.data);
                }
            });
            
            window.addEventListener('close-modal', (event) => {
                if (event.detail.id === this.$el.id) {
                    this.close();
                }
            });
            
            // Close on escape key
            window.addEventListener('keydown', (event) => {
                if (this.isOpen && event.key === 'Escape') {
                    this.close();
                }
            });
        },
        
        /**
         * Open the modal
         * @param {Object} data - Data to pass to the modal
         */
        open(data = {}) {
            this.isOpen = true;
            document.body.classList.add('overflow-hidden');
            
            // Update modal data if provided
            if (data) {
                Object.assign(this, data);
            }
            
            // Emit event
            this.$dispatch('modal-opened', {
                id: this.$el.id
            });
        },
        
        /**
         * Close the modal
         */
        close() {
            this.isOpen = false;
            document.body.classList.remove('overflow-hidden');
            
            // Call onClose callback if defined
            if (typeof this.onClose === 'function') {
                this.onClose();
            }
            
            // Emit event
            this.$dispatch('modal-closed', {
                id: this.$el.id
            });
        },
        
        /**
         * Confirm the modal action
         */
        confirm() {
            // Call onConfirm callback if defined
            if (typeof this.onConfirm === 'function') {
                this.onConfirm();
            }
            
            // Emit event
            this.$dispatch('modal-confirmed', {
                id: this.$el.id
            });
            
            this.close();
        },
        
        /**
         * Cancel the modal action
         */
        cancel() {
            // Call onCancel callback if defined
            if (typeof this.onCancel === 'function') {
                this.onCancel();
            }
            
            // Emit event
            this.$dispatch('modal-cancelled', {
                id: this.$el.id
            });
            
            this.close();
        }
    };
}
```

## 4. File CSS

### `src/views/style/components/button.css`

```css
/* Custom styles for button component */
.btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.btn-icon svg {
    width: 1.25rem;
    height: 1.25rem;
}

.btn-loading {
    position: relative;
    color: transparent !important;
}

.btn-loading::after {
    content: '';
    position: absolute;
    width: 1rem;
    height: 1rem;
    top: calc(50% - 0.5rem);
    left: calc(50% - 0.5rem);
    border-radius: 50%;
    border: 2px solid currentColor;
    border-right-color: transparent;
    animation: button-loading-spinner 0.75s linear infinite;
}

@keyframes button-loading-spinner {
    from {
        transform: rotate(0turn);
    }
    to {
        transform: rotate(1turn);
    }
}
```

## 5. Cách Liên Kết Handlebars Partial với Alpine Component

### Sử dụng trong trang

```handlebars
{{!-- src/views/pages/home.handlebars --}}
<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Trang Chủ</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {{> partials/components/card/card 
            title="Card Tiêu Đề 1" 
            content="Nội dung card 1" 
            image="/assets/images/card1.jpg" 
            imageAlt="Card 1" 
            badge="Mới"
            hoverable=true
            className="h-full"
            actions=(array 
                (object label="Chi tiết" primary=true) 
                (object label="Hủy" secondary=true)
            )
        }}
        
        {{> partials/components/card/card 
            title="Card Tiêu Đề 2" 
            content="Nội dung card 2" 
            image="/assets/images/card2.jpg" 
            imageAlt="Card 2"
            hoverable=true
            className="h-full"
        }}
        
        {{> partials/components/card/card 
            title="Card Tiêu Đề 3" 
            content="Nội dung card 3" 
            image="/assets/images/card3.jpg" 
            imageAlt="Card 3"
            hoverable=true
            className="h-full"
        }}
    </div>
    
    <div class="mt-8 flex justify-center">
        {{> partials/components/button/button 
            label="Xem thêm" 
            primary=true 
            id="load-more-btn"
            dataAttributes=(object page="1" limit="3")
        }}
    </div>
</div>

{{!-- Thêm JS cho trang này --}}
<script src="/script/pages/home.js"></script>
```

### JS cho trang cụ thể

```javascript
// src/views/script/pages/home.js
document.addEventListener('alpine:init', () => {
    // Lắng nghe sự kiện từ button "Xem thêm"
    window.addEventListener('button-clicked', (event) => {
        if (event.detail.id === 'load-more-btn') {
            const button = document.getElementById('load-more-btn');
            
            // Đặt button vào trạng thái loading
            button.dispatchEvent(new CustomEvent('set-loading', {
                detail: { loading: true }
            }));
            
            // Giả lập API call
            setTimeout(() => {
                // Lấy thông tin từ data attributes
                const page = parseInt(event.detail.dataset.page);
                const limit = parseInt(event.detail.dataset.limit);
                
                // Gọi API để lấy thêm dữ liệu
                fetchMoreCards(page, limit)
                    .then(data => {
                        // Thêm cards mới vào grid
                        appendNewCards(data);
                        
                        // Cập nhật page trong data attribute
                        button.dataset.page = page + 1;
                        
                        // Nếu không còn dữ liệu, disable button
                        if (data.length < limit) {
                            button.dispatchEvent(new CustomEvent('set-disabled', {
                                detail: { disabled: true }
                            }));
                        }
                    })
                    .finally(() => {
                        // Tắt trạng thái loading
                        button.dispatchEvent(new CustomEvent('set-loading', {
                            detail: { loading: false }
                        }));
                    });
            }, 1000);
        }
    });
});

/**
 * Giả lập API call để lấy thêm cards
 * @param {number} page - Số trang
 * @param {number} limit - Số lượng items mỗi trang
 * @returns {Promise<Array>} - Mảng dữ liệu cards
 */
async function fetchMoreCards(page, limit) {
    // Giả lập API call
    return new Promise(resolve => {
        // Dữ liệu mẫu
        const mockData = [
            {
                title: `Card Tiêu Đề ${page * limit + 1}`,
                content: `Nội dung card ${page * limit + 1}`,
                image: `/assets/images/card${page * limit + 1}.jpg`,
                imageAlt: `Card ${page * limit + 1}`
            },
            {
                title: `Card Tiêu Đề ${page * limit + 2}`,
                content: `Nội dung card ${page * limit + 2}`,
                image: `/assets/images/card${page * limit + 2}.jpg`,
                imageAlt: `Card ${page * limit + 2}`
            },
            {
                title: `Card Tiêu Đề ${page * limit + 3}`,
                content: `Nội dung card ${page * limit + 3}`,
                image: `/assets/images/card${page * limit + 3}.jpg`,
                imageAlt: `Card ${page * limit + 3}`
            }
        ];
        
        // Trả về dữ liệu mẫu
        resolve(mockData);
    });
}

/**
 * Thêm cards mới vào grid
 * @param {Array} cards - Mảng dữ liệu cards
 */
function appendNewCards(cards) {
    const grid = document.querySelector('.grid');
    
    cards.forEach(card => {
        // Tạo card mới
        const cardElement = document.createElement('div');
        cardElement.className = 'rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full';
        cardElement.setAttribute('x-data', 'card()');
        cardElement.setAttribute('x-init', 'init()');
        
        // Thêm nội dung cho card
        cardElement.innerHTML = `
            <div class="relative">
                <img src="${card.image}" alt="${card.imageAlt}" class="w-full h-48 object-cover">
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold mb-2">${card.title}</h3>
                <p class="text-gray-600 mb-4">${card.content}</p>
            </div>
        `;
        
        // Thêm card vào grid
        grid.appendChild(cardElement);
    });
}
```

## 6. Sử Dụng Handlebars Helpers

### `src/views/script/helpers/format-date.js`

```javascript
module.exports = function(date, format) {
    const moment = require('moment');
    return moment(date).format(format);
};
```

### Sử dụng helper trong template

```handlebars
<p>Ngày đăng: {{format-date publishDate "DD/MM/YYYY"}}</p>
```

## 7. Tích Hợp Handlebars với Express

```javascript

```