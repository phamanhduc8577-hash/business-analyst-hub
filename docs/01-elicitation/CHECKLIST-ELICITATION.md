# 📋 Master Requirements Elicitation & Discovery Checklist

> **Standard:** BABOK v3 & Design Thinking Framework for Principal Business Analysts.  
> **Purpose:** Khung câu hỏi và phương pháp khơi gợi yêu cầu toàn diện, giúp bóc tách 100% mong muốn của Stakeholders thành đặc tả kỹ thuật, không bỏ sót góc khuất hay edge case.

---

## 🎯 GIAI ĐOẠN 1: KHỞI TẠO DỰ ÁN & MỤC TIÊU KINH DOANH (Business Intent)

### 1.1 Xác định bài toán cốt lõi & Giá trị kinh doanh
* [ ] **Vấn đề cốt lõi (Core Problem):** Khách hàng/Doanh nghiệp đang gặp nỗi đau (pain point) lớn nhất là gì?
* [ ] **Phân tích 5 Whys:** Tại sao vấn đề này xảy ra? Nguyên nhân gốc rễ là gì?
* [ ] **Hiện trạng (As-Is):** Hiện tại quy trình đang được xử lý như thế nào? (Thủ công qua Excel, giấy tờ, hay hệ sinh thái phần mềm cũ?)
* [ ] **Tương lai mong muốn (To-Be):** Khi hệ thống mới chạy, bức tranh vận hành sẽ thay đổi cụ thể ra sao?
* [ ] **Chỉ số đo lường thành công (Quantifiable KPIs/OKRs):**
  * Tăng trưởng doanh thu / tỷ lệ chuyển đổi bao nhiêu %?
  * Giảm bao nhiêu % thời gian xử lý thủ công (Operational Lead Time)?
  * Tiết kiệm bao nhiêu chi phí nhân sự / vận hành mỗi tháng?

### 1.2 Stakeholders & Ma trận quyền hạn (RACI Matrix)
* [ ] **Project Sponsor (Chủ đầu tư / C-Level):** Kỳ vọng gì về thời gian (Deadline) và Ngân sách (Budget)?
* [ ] **Product Owner / Business Owner:** Ai là người chốt quyết định cuối cùng (Final Sign-off)?
* [ ] **End Users (Người dùng cuối):** Ai trực tiếp thao tác hàng ngày? Trình độ công nghệ của họ ra sao?
* [ ] **Operations / Admin / CS Team:** Cần các công cụ quản trị (Backoffice/CMS/Dashboard) gì để xử lý sự cố?
* [ ] **Technical Lead / Architect:** Có ràng buộc kiến trúc nào về Tech Stack, Legacy Database, Cloud Provider không?

---

## 🔍 GIAI ĐOẠN 2: XÁC ĐỊNH PHẠM VI (Scope Definition & Boundaries)

### 2.1 Ma trận In-Scope vs. Out-of-Scope (Chống Scope Creep)
* [ ] **Must-Have (MVP):** Những tính năng nào bắt buộc phải có để hệ thống chạy được bản đầu tiên?
* [ ] **Should-Have / Nice-to-Have (Phase 2):** Những tính năng nào có giá trị cao nhưng có thể làm ở bản cập nhật tiếp theo?
* [ ] **Explicit Non-Goals (Dứt khoát không làm):** Những yêu cầu nào được thống nhất là **không làm** trong dự án này để tránh loãng nguồn lực?

### 2.2 Ràng buộc dự án (Constraints & Dependencies)
* [ ] **Thời gian (Timeline):** Có sự kiện ra mắt (Go-live event) cố định nào bắt buộc phải kịp không?
* [ ] **Pháp lý & Tuân thủ (Regulatory & Compliance):** Có cần tuân thủ Nghị định 13 (Bảo vệ dữ liệu cá nhân), Thông tư Ngân hàng Nhà nước, GDPR, PCI-DSS không?
* [ ] **Hệ thống phụ thuộc (External Dependencies):** Dự án có phụ thuộc vào bên thứ 3 (Cổng thanh toán, Đơn vị vận chuyển, SMS OTP, Core Banking) không? SLA của họ thế nào?

---

## ⚙️ GIAI ĐOẠN 3: BÓC TÁCH YÊU CẦU CHỨC NĂNG (Functional Elicitation)

### 3.1 Bóc tách Luồng người dùng (User Journeys & Roles)
* [ ] Hệ thống có bao nhiêu phân quyền người dùng (Roles & Permissions)?
* [ ] Ma trận phân quyền chi tiết (Role-Based Access Control - RBAC): Ai được Xem, Tạo, Sửa, Xóa, Phê duyệt?
* [ ] Luồng đi từng bước của người dùng từ lúc bắt đầu đến khi đạt mục đích (Happy Path).

### 3.2 Bộ câu hỏi đào sâu Edge Cases (Luồng ngoại lệ & Góc khuất)
* [ ] **Mạng chập chờn / Timeout:** Nếu đang thanh toán hoặc đang submit đơn hàng mà rớt mạng thì hệ thống xử lý sao? (Cơ chế Idempotency Key chống trừ tiền 2 lần).
* [ ] **Xung đột dữ liệu đồng thời (Concurrency / Race Condition):** Khi 2 khách hàng cùng bấm mua sản phẩm cuối cùng trong kho tại cùng 1 giây, ai được mua?
* [ ] **Giới hạn dữ liệu (Boundary Limits):** Giá trị nhỏ nhất / lớn nhất là bao nhiêu? Độ dài chuỗi, dung lượng file upload tối đa?
* [ ] **Hủy bỏ / Hoàn tác (Rollback / Cancellation):** Người dùng có được hủy đơn sau khi đã thanh toán không? Quy trình hoàn tiền (Refund) diễn ra tự động hay cần duyệt tay?

---

## 🛡️ GIAI ĐOẠN 4: YÊU CẦU PHI CHỨC NĂNG (Non-Functional Requirements - NFRs)

* [ ] **Hiệu năng & Tải (Performance & Concurrency):**
  * Hệ thống cần chịu tải bao nhiêu người dùng đồng thời (Concurrent Users)?
  * Lưu lượng tối đa lúc cao điểm (Peak Requests Per Second - RPS)?
  * Thời gian phản hồi API tối đa chấp nhận được (Response Time SLA: e.g. < 200ms)?
* [ ] **Bảo mật (Security):**
  * Dữ liệu nhạy cảm nào cần mã hóa (Mật khẩu, Số thẻ, CCCD)?
  * Cơ chế xác thực là gì (JWT, OAuth 2.0, Session Cookie, 2FA/MFA)?
  * Cơ chế Rate Limiting (Chống spam API, chống Brute Force).
* [ ] **Khả năng chịu lỗi & Sao lưu (Availability & Disaster Recovery):**
  * Uptime cam kết (99.9% hay 99.99%)?
  * RPO (Recovery Point Objective): Chấp nhận mất tối đa bao nhiêu phút dữ liệu khi có sự cố?
  * RTO (Recovery Time Objective): Mất tối đa bao lâu để khôi phục hệ thống khi sập server?

---

## 📝 GIAI ĐOẠN 5: CHUYỂN ĐỔI YÊU CẦU THÀNH ĐẶC TẢ EARS & GHERKIN BDD

Áp dụng cú pháp EARS để loại bỏ 100% từ ngữ mơ hồ trước khi bàn giao cho Dev:
1. **Event-Driven:** `KHI [Sự kiện kích hoạt] XẢY RA, HỆ THỐNG PHẢI [Hành động]`
2. **State-Driven:** `TRONG KHI HỆ THỐNG Ở TRẠNG THÁI [Trạng thái], HỆ THỐNG PHẢI [Hành vi]`
3. **Unwanted Behavior:** `NẾU [Lỗi / Hành vi bất thường] XẢY RA, THÌ HỆ THỐNG PHẢI [Xử lý fallback]`
4. **Ubiquitous:** `HỆ THỐNG PHẢI LUÔN LUÔN [Ràng buộc bất biến]`
