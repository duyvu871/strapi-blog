# Cấu Trúc Thư Mục Hệ Thống Front-end

Cấu trúc thư mục được thiết kế để tối ưu hóa việc tái sử dụng code, phân tách rõ ràng giữa logic và giao diện, đồng thời dễ dàng mở rộng và bảo trì.

## Cấu Trúc Tổng Quan

```
src/
├── views/                  # Thư mục chứa tất cả các file view
│   ├── layouts/            # Các layout chính của ứng dụng
│   │   ├── main.handlebars # Layout chính
│   │   └── admin.handlebars # Layout cho admin panel
│   ├── partials/           # Các component có thể tái sử dụng
│   │   ├── header/         # Component header
│   │   │   ├── header.handlebars
│   │   │   └── header.js   # Logic Alpine.js cho header
│   │   ├── footer/
│   │   ├── navigation/
│   │   └── components/     # Các UI component nhỏ
│   │       ├── button/
│   │       │   ├── button.handlebars
│   │       │   ├── button.js
│   │       │   └── button.css (nếu cần style riêng)
│   │       ├── card/
│   │       ├── modal/
│   │       └── form/
│   ├── script/                 # JavaScript files
│   │   ├── components/     # Alpine.js components
│   │   │   ├── button.js
│   │   │   ├── card.js
│   │   │   └── modal.js
│   │   ├── helpers/            # Handlebars helpers
│   │   │       └── format-date.js
│   │   ├── utils/          # Utility functions
│   │   │   ├── api.js
│   │   │   └── validation.js
│   │   └── pages/          # JS cho từng trang cụ thể
│   │       ├── home.js
│   │       └── contact.js
│   ├── style/                # CSS files
│   │   ├── tailwind.css    # File Tailwind CSS chính
│   │   ├── components/     # CSS cho components (nếu cần)
│   │   └── pages/          # CSS cho từng trang (nếu cần)
│   ├── pages/              # Các trang cụ thể
│   │   ├── home.handlebars
│   │   ├── about.handlebars
│   │   └── contact.handlebars
├── public/                 # Tài nguyên tĩnh
│   └── assets/             # Hình ảnh, fonts, etc.
├── config/                 # Cấu hình
│   └── tailwind.config.js  # Cấu hình Tailwind CSS
└── build/                  # Thư mục build (sau khi biên dịch)
```

## Giải Thích Chi Tiết

### 1. Thư Mục `views`

- **layouts**: Chứa các template layout chính được sử dụng xuyên suốt ứng dụng.
- **partials**: Chứa các component có thể tái sử dụng, được tổ chức theo chức năng hoặc vị trí.
  - Mỗi component được tổ chức trong một thư mục riêng, bao gồm file `.handlebars` và file `.js` tương ứng.
- **pages**: Chứa các trang cụ thể của ứng dụng.
- **helpers**: Chứa các Handlebars helpers để mở rộng chức năng của Handlebars.
- **script/components**: Chứa các Alpine.js components được tách riêng.
  - Mỗi component có một file JS riêng, chứa logic tương ứng.
- **script/utils**: Chứa các utility functions có thể tái sử dụng.
- **script/pages**: Chứa JS cho từng trang cụ thể.
- **script/helpers**: Chứa các js helpers.
- **style**: Chứa các file CSS, bao gồm file Tailwind CSS chính và các CSS tùy chỉnh (nếu cần).
- **assets**: Chứa các tài nguyên tĩnh như hình ảnh, fonts, etc.
