# 🎵 Oder Bài Hát - Karaoke Night Registration

Website đăng ký bài hát theo phong cách game RPG (lấy cảm hứng từ RiseOn Gaming Studio).

## ✨ Tính năng

- ✅ Đăng ký bài hát với tên bài và người hát
- ✅ Giới hạn **10 bài/email**
- ✅ Kiểm tra số bài đã đăng ký theo email
- ✅ Hiển thị danh sách bài đã đăng ký
- ✅ Giao diện game RPG với animations
- ✅ Responsive trên mobile/desktop

## 📁 Cấu trúc files

```
form-dang-ky-bai-hat/
├── index.html      # Trang chính
├── style.css       # Styling (RiseOn Gaming style)
├── script.js       # Logic xử lý form
└── README.md       # Hướng dẫn
```

## 🚀 Cách cài đặt

### Bước 1: Tạo Google Sheet

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo sheet mới, đặt tên: **"Danh sách oder"**
3. Thêm header ở dòng 1:

| A | B | C | D |
|---|---|---|---|
| Thời gian | Email | Tên bài hát | Người hát |

### Bước 2: Tạo Google Apps Script

1. Trong Google Sheet → **Extensions** → **Apps Script**
2. Xóa code mặc định, paste code bên dưới:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  var email = data.email;
  var songName = data.songName;
  var artist = data.artist;

  // Đếm số bài đã đăng ký của email này
  var existingCount = 0;
  var lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    var emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < emails.length; i++) {
      if (emails[i][0] == email) {
        existingCount++;
      }
    }
  }

  // Kiểm tra giới hạn 10 bài
  if (existingCount >= 10) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Bạn đã đăng ký đủ 10 bài hát. Không thể đăng ký thêm!'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Thêm dữ liệu vào sheet
  var timestamp = new Date();
  sheet.appendRow([timestamp, email, songName, artist]);

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Đăng ký thành công!',
      count: existingCount + 1
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var email = e.parameter.email;

  var result = {
    songs: [],
    count: 0,
    totalSongs: 0,
    totalUsers: 0
  };

  if (email) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
      for (var i = 0; i < data.length; i++) {
        if (data[i][1] == email) {
          result.songs.push({
            number: i + 1,
            time: data[i][0],
            songName: data[i][2],
            artist: data[i][3]
          });
        }
      }
      result.count = result.songs.length;
    }
  }

  // Đếm tổng số bài và người tham gia
  var totalRow = sheet.getLastRow();
  result.totalSongs = totalRow > 1 ? totalRow - 1 : 0;

  if (totalRow > 1) {
    var allEmails = sheet.getRange(2, 2, totalRow - 1, 1).getValues();
    var uniqueEmails = [...new Set(allEmails.map(function(e) { return e[0]; }))];
    result.totalUsers = uniqueEmails.length;
  } else {
    result.totalUsers = 0;
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Nhấn **Save** (💾)
4. Nhấn **Deploy** → **New deployment**
5. Chọn type: **Web app**
6. Cấu hình:
   - Description: `Oder Bai Hat API`
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Nhấn **Deploy**
8. Copy **Web app URL**

### Bước 3: Cập nhật script.js

Mở `script.js`, tìm dòng:
```javascript
const APP_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
```

Thay bằng URL đã copy ở Bước 2:
```javascript
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
```

### Bước 4: Chạy website

Cách 1 - Local server:
```bash
# Dùng Python
python -m http.server 8000

# Hoặc dùng Node.js
npx serve
```

Cách 2 - Upload lên hosting:
- Upload 3 files (`index.html`, `style.css`, `script.js`) lên GitHub Pages, Netlify, hoặc Vercel

## 🎮 Demo Mode

Nếu chưa cài đặt Google Apps Script, website vẫn hoạt động ở **demo mode**:
- Data được lưu tạm trong localStorage của trình duyệt
- Mỗi email vẫn bị giới hạn 10 bài
- Chỉ hoạt động trên máy tính đó

## 📊 Data Flow

```
User nhập form
    ↓
Website gửi POST request
    ↓
Google Apps Script nhận request
    ↓
Kiểm tra số bài đã đăng ký của email
    ↓
├── < 10 bài → Lưu vào Sheet → Trả success
└── = 10 bài → Trả error
    ↓
Website hiển thị kết quả
```

## 🎨 Design

Phong cách RiseOn Gaming Studio:
- Màu tím/violet chủ đạo (#7c3aed)
- Màu cam accent (#f97316)
- Font Nunito
- Animations mượt
- Badge/achievement style
- Particles background

---

Made with ❤️ for Karaoke Night
