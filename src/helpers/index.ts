/**
 * Các helper functions cho Handlebars
 */

export const helpers = {
    /**
     * So sánh hai giá trị bằng nhau
     * @param a - Giá trị thứ nhất
     * @param b - Giá trị thứ hai
     * @returns true nếu hai giá trị bằng nhau, ngược lại false
     */
    eq: function (a: any, b: any) {
        return a === b;
    },

    /**
     * Format ngày tháng theo định dạng Việt Nam
     * @param date - Ngày cần format
     * @returns Chuỗi ngày tháng đã được format
     */
    formatDate: function (date: Date) {
        return new Date(date).toLocaleDateString('vi-VN');
    },

    /**
     * Lấy năm hiện tại
     * @returns Năm hiện tại
     */
    currentYear: function () {
        return new Date().getFullYear();
    },

    /**
     * Trả về thời gian hiện tại
     * @returns Đối tượng Date hiện tại
     */
    now: function () {
        return new Date();
    },

    /**
     * Tạo một mảng từ các tham số được truyền vào
     * @param args - Các tham số cần đưa vào mảng
     * @returns Mảng chứa các tham số
     */
    array: function (...args: any[]) {
        return args;
    },

    /**
     * Tạo một đối tượng từ các cặp key-value được truyền vào
     * @param args - Các cặp key-value cần đưa vào đối tượng
     * @returns Đối tượng chứa các cặp key-value
     */
    object: function (...args: any[]) {
        const obj: Record<string, any> = {};
        for (let i = 0; i < args.length - 1; i += 2) {
            obj[args[i]] = args[i + 1];
        }
        return obj;
    },

    /**
     * Nối hai hoặc nhiều chuỗi lại với nhau
     * @param args - Các chuỗi cần nối
     * @returns Chuỗi đã được nối
     */
    concat: function (...args: any[]) {
        // Loại bỏ tham số cuối cùng là options của Handlebars
        const strings = args.slice(0, -1);
        return strings.join('');
    }
};