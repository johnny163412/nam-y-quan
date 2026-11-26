# Bản Thiết Kế Tổng Thể: Nam Y Quán — Tuệ Tâm Đường

- **Ngày lập:** 2026-11-26
- **Triết lý:** "Nam dược trị Nam nhân" — học Y học cổ truyền qua nhập vai thầy thuốc mở Y quán, trực quan hóa Bát Cương, Ngũ Hành, Quân-Thần-Tá-Sứ và Kinh lạc trên web.
- **Tam giác học tập:**
  1. **Bàn Khám Y Quán:** 10 ca bệnh cốt truyện chia 3 chương + Khách Vãng Lai sinh tự động; Bộ 4 công cụ Tứ Chẩn xúc giác (Soi Lưỡi 5 vùng, Văn chẩn, Thập Vấn 4/6 lượt, Bắt Mạch 2 tầng Phù/Trầm trên Canvas 60fps); La Bàn Bát Cương; Cân Tiểu Ly 4 ngăn (Quân x1.5, Thần x1.2, Tá x0.9, Sứ x0.6) & Điểm Huyệt; Cảnh báo Cấm kỵ Y gia.
  2. **Tàng Thư Các Mở:** Bản Thảo Nam Dược (20 vị + ghi chú cá nhân), Đồ Hình Kinh Lạc & Bàn Xoay 12 Canh Giờ Tý Ngọ Lưu Chú (14 huyệt), Sa Bàn Âm Dương - Ngũ Hành tương tác (Sinh/Khắc/Thừa/Vũ).
  3. **Khảo Thí Y Miếu:** Sát hạch 5 thử thách lặp lại ngắt quãng ưu tiên phần hay nhầm để thăng bậc Y Sinh -> Học Đồ -> Lương Y -> Danh Y.
- **Kiến trúc kỹ thuật:** React 18 + TypeScript + Vite, DOM/SVG + HTML5 Canvas + Web Audio API, Local-first (`localStorage` + Export/Import JSON), Deterministic YHCT Rule Engine (`src/engine/tcmEngine.ts`).
