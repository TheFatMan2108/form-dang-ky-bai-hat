/**
 * ============================================
 * Oder Bài Hát - Form Handler
 * ============================================
 *
 * Logic xử lý:
 * 1. Submit form → Gửi data lên Google Apps Script
 * 2. Check số bài đã đăng ký theo email
 * 3. Giới hạn tối đa 10 bài/email
 * 4. Load danh sách bài đã đăng ký
 *
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Tạo Google Sheet tên "Danh sách oder"
 * 2. Tạo Apps Script (xem hướng dẫn bên dưới)
 * 3. Deploy Apps Script và lấy Web App URL
 * 4. Paste URL vào biến APP_SCRIPT_URL bên dưới
 */

// ============================================
// ⚙️ CẤU HÌNH - THAY ĐỔI URL NÀY
// ============================================
const APP_SCRIPT_URL = 'https://docs.google.com/spreadsheets/d/1be2x0xbWOhOQ3avLgE8hHZzEZvqNeJ7j0f52NHfmZFI/edit?gid=0#gid=0';

// ============================================
// 📌 HƯỚNG DẪN TẠO GOOGLE APPS SCRIPT
// ============================================
/*
1. Mở Google Sheet "Danh sách oder"
2. Vào Extensions → Apps Script
3. Copy code bên dưới và paste vào
4. Nhấn Save (Ctrl+S)
5. Nhấn Deploy → New deployment
6. Chọn type: Web app
7. Execute as: Me
8. Who has access: Anyone
9. Nhấn Deploy
10. Copy URL Web app và paste vào biến APP_SCRIPT_URL ở trên

=== CODE APPS SCRIPT (copy từ đây) ===

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
    count: 0
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

=== KẾT THÚC CODE APPS SCRIPT ===
*/

// ============================================
// 🚀 LOGIC XỬ LÝ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Create particles
    createParticles();

    // Load initial data
    loadStats();
});

// Form submission
document.getElementById('songForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const songName = document.getElementById('songName').value.trim();
    const artist = document.getElementById('artist').value.trim();
    const submitBtn = document.getElementById('submitBtn');

    // Validate
    if (!email || !songName || !artist) {
        showMessage('error', 'Vui lòng điền đầy đủ thông tin!');
        return;
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('error', 'Email không hợp lệ!');
        return;
    }

    // Show loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Send to Google Apps Script
    sendToSheet({ email, songName, artist })
        .then(response => {
            if (response.status === 'success') {
                showMessage('success', `Đăng ký thành công! Bài hát thứ ${response.count}`);

                // Update user count
                document.getElementById('userSongCount').textContent = response.count;

                // Refresh user's songs list
                loadUserSongs(email);

                // Clear form (keep email)
                document.getElementById('songName').value = '';
                document.getElementById('artist').value = '';

                // Refresh stats
                loadStats();
            } else {
                showMessage('error', response.message || 'Có lỗi xảy ra!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('error', 'Không thể kết nối server! Vui lòng thử lại.');
        })
        .finally(() => {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        });
});

// Send data to Google Sheet
async function sendToSheet(data) {
    if (APP_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        // Demo mode - simulate response
        return simulateResponse(data);
    }

    const response = await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    return await response.json();
}

// Simulate response for demo
function simulateResponse(data) {
    return new Promise(resolve => {
        setTimeout(() => {
            // Get current count from localStorage or start at 0
            let count = parseInt(localStorage.getItem('songCount_' + data.email) || '0');

            if (count >= 10) {
                resolve({
                    status: 'error',
                    message: 'Bạn đã đăng ký đủ 10 bài hát. Không thể đăng ký thêm!'
                });
            } else {
                count++;
                localStorage.setItem('songCount_' + data.email, count.toString());

                // Save song to localStorage
                let songs = JSON.parse(localStorage.getItem('songs_' + data.email) || '[]');
                songs.push({
                    songName: data.songName,
                    artist: data.artist,
                    time: new Date().toISOString()
                });
                localStorage.setItem('songs_' + data.email, JSON.stringify(songs));

                resolve({
                    status: 'success',
                    message: 'Đăng ký thành công!',
                    count: count
                });
            }
        }, 800);
    });
}

// Load stats
async function loadStats() {
    const email = document.getElementById('email').value.trim();

    if (APP_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        // Demo mode
        if (email) {
            loadUserSongs(email);
        }
        return;
    }

    try {
        const response = await fetch(`${APP_SCRIPT_URL}?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        document.getElementById('totalSongs').textContent = data.totalSongs || 0;
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;

        if (email && data.songs) {
            displayUserSongs(data.songs);
            document.getElementById('userSongCount').textContent = data.count || 0;
        }
    } catch (error) {
        console.log('Stats loading skipped (demo mode or server unavailable)');
    }
}

// Load user's songs
async function loadUserSongs(email) {
    if (!email) return;

    if (APP_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        // Demo mode - load from localStorage
        const songs = JSON.parse(localStorage.getItem('songs_' + email) || '[]');
        const count = parseInt(localStorage.getItem('songCount_' + email) || '0');

        displayUserSongs(songs.map((s, i) => ({
            number: i + 1,
            songName: s.songName,
            artist: s.artist
        })));

        document.getElementById('userSongCount').textContent = count;
        return;
    }

    try {
        const response = await fetch(`${APP_SCRIPT_URL}?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.songs) {
            displayUserSongs(data.songs);
            document.getElementById('userSongCount').textContent = data.count || 0;
        }
    } catch (error) {
        console.log('User songs loading skipped');
    }
}

// Display user's songs
function displayUserSongs(songs) {
    const container = document.getElementById('mySongsCard');
    const list = document.getElementById('mySongsList');

    if (!songs || songs.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    list.innerHTML = songs.map((song, index) => `
        <div class="song-item">
            <div class="song-number">${index + 1}</div>
            <div class="song-info">
                <div class="song-name">${escapeHtml(song.songName)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
        </div>
    `).join('');
}

// Show message
function showMessage(type, text) {
    const container = document.getElementById('messageContainer');
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    // Hide all
    successMsg.classList.remove('show');
    errorMsg.classList.remove('show');

    if (type === 'success') {
        successMsg.querySelector('span').textContent = text;
        successMsg.classList.add('show');
    } else {
        errorText.textContent = text;
        errorMsg.classList.add('show');
    }

    // Auto hide after 5 seconds
    setTimeout(() => {
        successMsg.classList.remove('show');
        errorMsg.classList.remove('show');
    }, 5000);
}

// Create particles
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Email input - load user's songs when typing stops
let emailTimeout;
document.getElementById('email').addEventListener('input', function() {
    clearTimeout(emailTimeout);
    emailTimeout = setTimeout(() => {
        const email = this.value.trim();
        if (email) {
            loadUserSongs(email);
        }
    }, 500);
});
