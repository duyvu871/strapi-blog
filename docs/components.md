# Tài liệu hướng dẫn sử dụng Components

Tài liệu này mô tả cách sử dụng các component Typography, Button và Card được xây dựng với Alpine.js và Tailwind CSS.

## Typography

Component Typography cung cấp các kiểu văn bản khác nhau, giúp đồng nhất giao diện văn bản trong toàn bộ ứng dụng.

### Cách sử dụng

```handlebars
{{> components/typography/typography variant="h1" text="Tiêu đề" class="my-custom-class"}}
```

### Các tham số

- `variant`: Loại văn bản (h1, h2, h3, h4, h5, h6, p, lead, small, link)
- `text`: Nội dung văn bản
- `class`: Các class CSS tùy chỉnh (tùy chọn)
- `href`: URL cho variant "link" (chỉ áp dụng khi variant="link")

### Ví dụ

```handlebars
{{> components/typography/typography variant="h1" text="Tiêu đề chính" }}
{{> components/typography/typography variant="p" text="Đây là đoạn văn bản thông thường." }}
{{> components/typography/typography variant="link" text="Đây là một liên kết" href="#" }}
```

## Button

Component Button cung cấp các loại nút với nhiều biến thể khác nhau, tích hợp với Alpine.js để xử lý tương tác.

### Cách sử dụng

```handlebars
{{> components/button/button variant="primary" text="Nút" onClick="console.log('Clicked')" class="my-custom-class"}}
```

### Các tham số

- `variant`: Kiểu nút (primary, secondary, outline, danger, success, link)
- `text`: Nội dung hiển thị trên nút
- `onClick`: Hàm JavaScript được gọi khi nút được nhấp
- `class`: Các class CSS tùy chỉnh (tùy chọn)
- `disabled`: Vô hiệu hóa nút (true/false, mặc định là false)
- `size`: Kích thước nút (sm, lg, mặc định là trung bình)
- `type`: Loại nút HTML (button, submit, reset, mặc định là button)
- `id`: ID của nút (tùy chọn)
- `icon`: HTML cho biểu tượng ở bên trái (tùy chọn)
- `iconRight`: HTML cho biểu tượng ở bên phải (tùy chọn)

### Ví dụ

```handlebars
{{> components/button/button variant="primary" text="Đăng nhập" onClick="login()" }}
{{> components/button/button variant="outline" text="Hủy" size="sm" onClick="cancel()" }}
{{> components/button/button variant="success" text="Lưu" disabled=isFormInvalid }}
```

## Card

Component Card cung cấp các thẻ hiển thị nội dung với nhiều biến thể khác nhau.

### Cách sử dụng

```handlebars
{{> components/card/card title="Tiêu đề" content="Nội dung" variant="default" class="my-custom-class"}}
```

### Các tham số

- `variant`: Kiểu card (default, bordered, shadowed, interactive)
- `title`: Tiêu đề card
- `subtitle`: Tiêu đề phụ (tùy chọn)
- `content`: Nội dung chính của card
- `class`: Các class CSS tùy chỉnh (tùy chọn)
- `image`: URL hình ảnh (tùy chọn)
- `imageAlt`: Văn bản thay thế cho hình ảnh (tùy chọn)
- `badge`: Văn bản hiển thị trong badge (tùy chọn)
- `footer`: HTML cho phần footer (tùy chọn)
- `actions`: HTML cho các nút hành động (tùy chọn)
- `hasSlot`: Cho phép chèn nội dung tùy chỉnh (true/false, mặc định là false)
- `slot`: HTML cho nội dung tùy chỉnh (chỉ áp dụng khi hasSlot=true)

### Ví dụ

```handlebars
{{> components/card/card 
    variant="shadowed" 
    title="Bài viết mẫu" 
    subtitle="Đăng ngày {{formatDate (now)}}"
    content="Đây là nội dung bài viết."
    image="/assets/images/article.jpg"
    imageAlt="Ảnh bài viết"
    actions="{{> components/button/button variant=\"primary\" text=\"Đọc thêm\" size=\"sm\" onClick=\"readMore()\" }}"
}}
```

## Article Card

Component Article Card cung cấp giao diện hiển thị bài viết với hình ảnh, tiêu đề, mô tả ngắn và thông tin nguồn.

### Cách sử dụng

```handlebars
{{> components/article-card/article-card title="Tiêu đề bài viết" excerpt="Mô tả ngắn" image="/path/to/image.jpg" url="/link-to-article"}}
```

### Các tham số

- `title`: Tiêu đề bài viết
- `excerpt`: Mô tả ngắn về bài viết
- `image`: URL hình ảnh bài viết
- `imageAlt`: Văn bản thay thế cho hình ảnh (tùy chọn)
- `category`: Danh mục bài viết (tùy chọn)
- `author`: Tên tác giả (tùy chọn)
- `publishDate`: Ngày đăng bài (tùy chọn)
- `readTime`: Thời gian đọc (tùy chọn)
- `url`: Đường dẫn đến bài viết đầy đủ
- `variant`: Kiểu card (mặc định hoặc bordered)
- `class`: Các class CSS tùy chỉnh (tùy chọn)
- `hasSlot`: Cho phép chèn nội dung tùy chỉnh (true/false, mặc định là false)
- `slot`: HTML cho nội dung tùy chỉnh (chỉ áp dụng khi hasSlot=true)
- `actions`: HTML cho các nút hành động (tùy chọn)

### Ví dụ

```handlebars
{{> components/article-card/article-card 
    title="Việt Nam kỹ nghệ: Kỹ thuật khảm tam khí" 
    excerpt="Lịch sử hơn ngàn năm của nền kỹ nghệ Việt Nam đã chứng kiến không ít những kỹ thuật gia công kim khí độc đáo. Trong đó, khảm tam khí là một trong những kỹ thuật chế tác đặc sắc nhất." 
    image="/assets/images/articles/kham-tam-khi.jpg" 
    imageAlt="Kỹ thuật khảm tam khí Việt Nam"
    category="Văn hóa"
    author="Long Tự"
    publishDate="12/05/2023"
    readTime="5 phút"
    url="/bai-viet/ky-thuat-kham-tam-khi"
}}
```

## Kết hợp các Components

Các component có thể được kết hợp với nhau để tạo ra các giao diện phức tạp hơn.

### Ví dụ

```handlebars
{{> components/card/card 
    variant="shadowed" 
    title="Thông báo quan trọng" 
    content="Đây là một thông báo quan trọng cần được chú ý."
    actions="{{> components/button/button variant=\"primary\" text=\"Xác nhận\" size=\"sm\" onClick=\"confirm()\" }} {{> components/button/button variant=\"outline\" text=\"Bỏ qua\" size=\"sm\" onClick=\"dismiss()\" }}"
}}
```

## Xem Demo

Bạn có thể xem demo tất cả các component tại đường dẫn `/components` của ứng dụng.