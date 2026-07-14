# PHẦN MỀM MÔ PHỎNG LỚP HỌC ẢO — Virtual Class

## CÁCH SỬ DỤNG

### 1. Chuẩn bị
- Đảm bảo đã build frontend và backend (mở terminal → `cd "Thư mục project" → docker compose up --build -d`)
- Trình duyệt: Chrome, Edge, hoặc Firefox (khuyên dùng Edge vì có giọng đọc tiếng Việt sẵn)
- Mở trình duyệt vào `http://localhost:5173`

### 2. Tải lên giáo án
- Trang chủ → nhấn **"Bắt đầu ngay"** hoặc vào **"Tải giáo án"**
- Chọn file PDF, DOCX hoặc PPTX (tối đa 10MB)
- Có thể dán thêm nội dung giáo án vào ô **"Nội dung bài học"** để AI hiểu rõ hơn
- Nhấn **"Bắt đầu buổi dạy"**

### 3. Tiến hành dạy
- **Đặt câu hỏi:** Gõ câu hỏi vào ô text, nhấn Enter để gửi
- **AI sẽ trả lời:** 2-4 học sinh ảo trả lời, mỗi em có tính cách riêng (giỏi, khá, trung bình, yếu, nhút nhát, sáng tạo...)
- **Phản hồi riêng một học sinh:** Nhấn **"Phản hồi [tên]"** dưới câu trả lời của em đó → gõ tin nhắn → Gửi
- **Đọc to câu trả lời:** Nhấn icon loa 🔊 trên mỗi thẻ học sinh
- **Tự động đọc:** Bật công tắc **"Tự đọc"** trên đầu trang → mỗi khi học sinh trả lời, phần mềm tự động đọc to từng em
- **Đọc to câu hỏi:** Nhấn icon loa 🔊 cạnh ô nhập liệu để đọc câu hỏi bạn vừa gõ
- **Đính kèm tài liệu:** Nhấn icon kẹp giấy 📎 cạnh ô nhập → chọn file PDF/DOCX/PPTX/TXT → nội dung file được gửi vào lớp học, học sinh ảo có thể "đọc" và trả lời dựa trên tài liệu đó
- **Xem lịch sử:** Nhấn **"Xem lịch sử"** trên đầu trang

### 4. Kết thúc và đánh giá
- Nhấn **"Nhận đánh giá"** trên đầu trang
- Hệ thống sẽ chấm điểm dựa trên 8 tiêu chí (Kỹ thuật đặt câu hỏi, Hỗ trợ học sinh, Quản lý lớp học, Khuyến khích, Chất lượng phản hồi, Lý luận sư phạm, Giao tiếp, Linh hoạt)
- Xem kết quả: điểm tổng thể (%), điểm từng tiêu chí (1-10), điểm mạnh, điểm cần cải thiện, gợi ý, đề xuất

---

## ƯU ĐIỂM

| Ưu điểm | Mô tả |
|---------|-------|
| **Dành riêng cho tiếng Việt** | Toàn bộ giao diện và nội dung bằng tiếng Việt, phù hợp với giáo viên người Việt |
| **Mô phỏng học sinh đa dạng** | 12 tính cách học sinh khác nhau (giỏi, khá, trung bình, yếu, nhút nhát, mất tập trung, sáng tạo...) |
| **Lớp học sống động** | Học sinh ngắt lời nhau, đặt câu hỏi, thể hiện hứng thú hoặc buồn chán |
| **Đọc giọng tiếng Việt** | Tích hợp TTS đọc câu trả lời bằng giọng Việt (qua Google Translate hoặc giọng Windows/Edge) |
| **Tự động đọc** | Có thể bật chế độ tự động đọc câu trả lời của học sinh — rất hữu ích cho người lớn tuổi |
| **Đánh giá sư phạm** | Tự động chấm điểm 8 tiêu chí sư phạm sau buổi dạy, có ví dụ và gợi ý cải thiện |
| **Đính kèm tài liệu trong khi dạy** | Cho phép gửi thêm tài liệu (file) cho học sinh ngay trong quá trình dạy |
| **Phản hồi riêng từng học sinh** | Giáo viên có thể tương tác riêng với từng em như trong lớp học thật |
| **Miễn phí** | Không mất phí sử dụng, chỉ cần API key OpenRouter (miễn phí) |
| **Nhẹ, chạy local** | Không cần đám mây, không lưu dữ liệu ra ngoài — tất cả đều trên máy người dùng |

---

## NHƯỢC ĐIỂM

| Nhược điểm | Mô tả |
|------------|-------|
| **Cần cài đặt kỹ thuật** | Yêu cầu Node.js, npm, kiến thức cơ bản về chạy terminal — không phải phần mềm cài đặt một bước |
| **Cần kết nối Internet** | AI và TTS đều cần gọi API online — không dùng được offline |
| **TTS chưa hoàn hảo** | Giọng đọc qua Google Translate có thể không tự nhiên bằng giọng người thật |
| **Chưa có giao diện trực quan** | Chỉ có text chat, không có hình ảnh học sinh, bảng đen, lớp học 3D |
| **Không có tài khoản người dùng** | Không có đăng nhập, ai dùng máy cũng xem được dữ liệu |
| **Lưu trữ dạng file JSON** | Dữ liệu buổi dạy lưu dạng file, không có database — dễ mất nếu xóa nhầm |
| **Phụ thuộc vào bên thứ ba** | Dùng OpenRouter (AI) và Google Translate (TTS) — nếu các dịch vụ này thay đổi hoặc ngừng hoạt động, phần mềm ảnh hưởng theo |
| **Giới hạn file 10MB** | Không tải lên được giáo án hoặc tài liệu quá lớn |

---

## CẢNH BÁO KHI DÙNG

### ⚠️ Bảo mật API Key
- **Không chia sẻ file `.env`** — file chứa API key OpenRouter và các khóa khác
- Nếu lộ API key, người khác có thể dùng key của bạn để gọi AI (tốn phí của bạn)

### ⚠️ Dữ liệu lưu trữ
- Toàn bộ dữ liệu buổi dạy lưu trong thư mục `data/sessions/` dưới dạng JSON
- **Không có sao lưu tự động** — nếu xóa thư mục `data/`, mất toàn bộ lịch sử
- Nên copy thư mục `data/` ra ngoài định kỳ nếu có dữ liệu quan trọng

### ⚠️ Kết nối mạng
- **Cần Internet** để gọi AI và TTS — mất mạng là mất hoàn toàn chức năng
- TTS dùng Google Translate — nếu mạng chậm, giọng đọc có thể bị trễ hoặc không phát được

### ⚠️ Trình duyệt
- Khuyên dùng **Microsoft Edge** để có giọng đọc tiếng Việt chuẩn nhất
- Chrome trên Windows cần cài thêm gói giọng Việt (Settings → Time & Language → Speech → Add voice → "Vietnamese (Vietnam)")
- Firefox có thể không ổn định với TTS

### ⚠️ Giới hạn AI
- AI có thể trả lời sai hoặc không chính xác — đây là bản chất của AI sinh, không phải lỗi phần mềm
- Không nên dùng kết quả đánh giá của AI làm căn cứ chính thức cho việc đánh giá giáo viên
- Nếu AI trả lời chậm hoặc lỗi, kiểm tra API key OpenRouter còn hạn không

### ⚠️ Khi chạy phần mềm
- Luôn mở **backend trước**, sau đó mới mở frontend
- Nếu thấy lỗi CORS (Cross-Origin Request Blocked), refresh lại trang frontend
- Nếu backend bị tắt, frontend sẽ không hoạt động — kiểm tra terminal backend còn chạy không
- Port 3000 (backend) và 5173 (frontend) không được bị ứng dụng khác chiếm

---

*Tài liệu này dành cho người dùng không chuyên về kỹ thuật, tập trung vào nghiệp vụ sư phạm.*
