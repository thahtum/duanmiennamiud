# Dự án Vinhomes miền Nam – duanmiennam.online

Web tĩnh (HTML/JS/ảnh), triển khai bằng Cloudflare Pages từ nhánh `main` (thư mục gốc, không cần lệnh build).

- `gio-hang-cangio.js`: giỏ hàng Cần Giờ, tự cập nhật 2 lần/ngày (7h34 và 17h34) bởi tác vụ hẹn giờ của Claude, từ sheet "CG+LV+HLX+NT_QUỸ CĂN KDTD MN".
- `tools/sync_cangio.py`: `python3 tools/sync_cangio.py <file.xlsx> gio-hang-cangio.js`
