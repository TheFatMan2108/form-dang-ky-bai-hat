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
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTwPiz6hXXR-p5uyd3DQfQJNGKYFQpj88YQ1XgcSMFANd9c3rE2tCvniiPjfl0lZmRKA/exec';

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

    // Step 1: Submit data via POST with no-cors (Apps Script doesn't return CORS headers)
    await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify(data)
    });

    // Step 2: Wait a bit for Apps Script to process
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 3: Verify by fetching the latest data
    try {
        const verifyUrl = `${APP_SCRIPT_URL}?email=${encodeURIComponent(data.email)}&t=${Date.now()}`;
        const verifyResponse = await fetch(verifyUrl, { redirect: 'follow' });
        const verifyData = await verifyResponse.json();

        // Check if count increased (song was added)
        const newCount = verifyData.count || 0;
        const lastSong = verifyData.songs && verifyData.songs[verifyData.songs.length - 1];

        if (lastSong && lastSong.songName.toLowerCase() === data.songName.toLowerCase() &&
            lastSong.artist.toLowerCase() === data.artist.toLowerCase()) {
            return {
                status: 'success',
                message: 'Đăng ký thành công!',
                count: newCount
            };
        }

        // If not found, check if already exists
        if (newCount >= 10) {
            return {
                status: 'error',
                message: 'Bạn đã đăng ký đủ 10 bài hát!'
            };
        }

        // Fallback - assume success if count is reasonable
        if (newCount > 0) {
            return {
                status: 'success',
                message: 'Đăng ký thành công!',
                count: newCount
            };
        }
    } catch (error) {
        console.error('Verify error:', error);
    }

    return {
        status: 'error',
        message: 'Không thể xác nhận đăng ký. Vui lòng kiểm tra lại!'
    };
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
        const url = `${APP_SCRIPT_URL}?email=${encodeURIComponent(email)}&t=${Date.now()}`;
        const response = await fetch(url, { redirect: 'follow' });
        const data = await response.json();

        document.getElementById('totalSongs').textContent = data.totalSongs || 0;
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;

        if (email && data.songs) {
            displayUserSongs(data.songs);
            document.getElementById('userSongCount').textContent = data.count || 0;
        }
    } catch (error) {
        console.log('Stats loading skipped:', error);
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
        const url = `${APP_SCRIPT_URL}?email=${encodeURIComponent(email)}&t=${Date.now()}`;
        const response = await fetch(url, { redirect: 'follow' });
        const data = await response.json();

        if (data.songs) {
            displayUserSongs(data.songs);
            document.getElementById('userSongCount').textContent = data.count || 0;
        }
    } catch (error) {
        console.log('User songs loading skipped:', error);
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

// ============================================
// 🎵 SONG SUGGESTIONS FEATURE
// ============================================

// Popular songs database
const popularSongs = [
    { name: "Yêu 5", artist: "Dế Choắt" },
    { name: "Havana", artist: "Camila Cabello" },
    { name: "Shape of You", artist: "Ed Sheeran" },
    { name: "Despacito", artist: "Luis Fonsi" },
    { name: "See You Again", artist: "Wiz Khalifa" },
    { name: "Chạy Ngay Đi", artist: "Sơn Tùng M-TP" },
    { name: "Buông Đôi Tay Nhau Ra", artist: "Mr Siro" },
    { name: "Nơi Này Có Anh", artist: "Sơn Tùng M-TP" },
    { name: "Mây Lang Thang", artist: "Hồ Quang Hiếu" },
    { name: "Em Của Ngày Hôm Qua", artist: "Sơn Tùng M-TP" },
    { name: "Muộn Rồi Mà Sao Còn", artist: "Sơn Tùng M-TP" },
    { name: "Có Chắc Yêu Là Đây", artist: "Sơn Tùng M-TP" },
    { name: "Lạc Trôi", artist: "Sơn Tùng M-TP" },
    { name: "Nàng Thơ", artist: "Hoàng Dũng" },
    { name: "Sau Lưng Anh Có Ai", artist: "Trung Quân Idol" },
    { name: "Bước Qua Nhau", artist: "Vũ." },
    { name: "Hãy Trao Cho Anh", artist: "Sơn Tùng M-TP ft. Snoop Dogg" },
    { name: "Đừng Như Thường", artist: "Trung Quân Idol" },
    { name: "Vì Yêu Cứ Đâm Đầu", artist: "Min" },
    { name: "Giả Vờ Nhé", artist: "Bùi Anh Tuấn" },
    { name: "Mình Từng Yêu", artist: "Minh Vương M4U" },
    { name: "Ghen", artist: "Min x Karik x Châu Khải Phong" },
    { name: "Đừng Hẹn Kiếp Sau", artist: "Khắc Việt" },
    { name: "Cánh Hoa Tàn", artist: "Lam Truong" },
    { name: "Thiên Đường", artist: "Hoa Vinh" },
    { name: "Túp Lều Vàng", artist: "Ngọc Sơn" },
    { name: "Không Phai", artist: "Cao Thi Thuy Trang" },
    { name: "Yêu Là Tha Thu", artist: "Em Chưa 18" },
    { name: "3107", artist: "DuongG" },
    { name: "Tình Yêu Diệu Vời", artist: "Đông Nhi" },
    { name: "Xin Đừng Im Lặng", artist: "Bùi Anh Tuấn" },
    { name: "Hơn Cả Yêu", artist: "Đông Nhi" },
    { name: "Để Cho Em Khóc", artist: "Minh Vương M4U" },
    { name: "Sao Anh Chưa Về", artist: "Bằng Kiều ft. Hương Tràm" },
    { name: "Người Yêu Tôi Lạnh Lùng", artist: "The Men" },
    { name: "Phai Dấu Cuộc Tình", artist: "Đông Nhi" },
    { name: "Nếu Em Còn Tồn Tại", artist: "Trung Quân Idol" },
    { name: "Bán Duyên", artist: "Minh Vương M4U" },
    { name: "Anh Khác Hay Em Khác", artist: "Hồ Quang Hiếu" },
    { name: "Cần Lắm", artist: "Bằng Kiều" },
    { name: "Tình Đơn Phương", artist: "JustaTee" },
    { name: "Rời Bỏ", artist: "Hương Tràm" },
    { name: "Điều Khác Lạ", artist: "The Men" },
    { name: "Mây Ơi", artist: "Quang Lê" },
    { name: "Nỗi Nhớ Gợi Mây", artist: "Đình Dũng" },
    { name: "Cố Cái Duyên", artist: "Ngọc Sơn" },
    { name: "Thành Phố Mưa", artist: "Huy Cung" },
    { name: "Đừng Nói Xin Lỗi", artist: "Hồ Quang Hiếu" },
    { name: "Tâm Sự Tuổi 30", artist: "Trung Quân Idol" },
    { name: "Kẹo Bông Gòn", artist: "Hương Tràm" }
];

// Popular artists
const popularArtists = [
    "Sơn Tùng M-TP",
    "Hương Tràm",
    "Bằng Kiều",
    "Min",
    "Mr Siro",
    "Đông Nhi",
    "Trung Quân Idol",
    "Hồ Quang Hiếu",
    "Lam Truong",
    "Quang Lê",
    "Ngọc Sơn",
    "Hoa Vinh",
    "Khắc Việt",
    "DuongG",
    "Vũ.",
    "Hoàng Dũng",
    "Willy",
    "Tóc Tiên",
    "Huy Cung",
    "JustaTee",
    "The Men",
    "Bùi Anh Tuấn",
    "Minh Vương M4U",
    "Cao Thi Thuy Trang"
];

// Initialize suggestions
function initSuggestions() {
    // Populate datalist for song name
    const songDatalist = document.getElementById('songSuggestions');
    popularSongs.forEach(song => {
        const option = document.createElement('option');
        option.value = `${song.name} - ${song.artist}`;
        songDatalist.appendChild(option);
    });

    // Populate datalist for artist
    const artistDatalist = document.getElementById('artistSuggestions');
    popularArtists.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist;
        artistDatalist.appendChild(option);
    });

    // Show suggestion tags
    showSuggestionTags();

    // Add input listeners
    const songInput = document.getElementById('songName');
    const artistInput = document.getElementById('artist');

    songInput.addEventListener('input', debounce(function() {
        updateSuggestionTags(this.value);
    }, 300));

    artistInput.addEventListener('input', debounce(function() {
        updateArtistSuggestions(this.value);
    }, 300));
}

// Show clickable suggestion tags
function showSuggestionTags() {
    const container = document.getElementById('suggestionTags');
    if (!container) return;

    let html = '<div class="suggestion-section-title"><i class="fas fa-fire"></i> Gợi ý bài hát hot</div>';
    html += '<div class="suggestion-tags">';

    // Show top 10 popular songs
    popularSongs.slice(0, 10).forEach(song => {
        html += `
            <span class="suggestion-tag" onclick="selectSongSuggestion('${escapeHtml(song.name)}', '${escapeHtml(song.artist)}')">
                <span class="tag-icon">🎵</span>
                <span class="tag-name">${escapeHtml(song.name)}</span>
            </span>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Update suggestion tags based on search
function updateSuggestionTags(query) {
    const container = document.getElementById('suggestionTags');
    if (!container) return;

    if (query.length < 2) {
        showSuggestionTags();
        return;
    }

    const filtered = popularSongs.filter(song =>
        song.name.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);

    if (filtered.length === 0) {
        container.innerHTML = '<div class="suggestion-section-title"><i class="fas fa-search"></i> Không tìm thấy bài hát phù hợp</div>';
        return;
    }

    let html = `<div class="suggestion-section-title"><i class="fas fa-search"></i> Kết quả tìm kiếm "${escapeHtml(query)}"</div>`;
    html += '<div class="suggestion-tags">';

    filtered.forEach(song => {
        html += `
            <span class="suggestion-tag" onclick="selectSongSuggestion('${escapeHtml(song.name)}', '${escapeHtml(song.artist)}')">
                <span class="tag-icon">🎵</span>
                <span class="tag-name">${escapeHtml(song.name)} - ${escapeHtml(song.artist)}</span>
            </span>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Update artist suggestions
function updateArtistSuggestions(query) {
    if (query.length < 2) return;

    const filtered = popularArtists.filter(artist =>
        artist.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    // Update datalist
    const artistDatalist = document.getElementById('artistSuggestions');
    artistDatalist.innerHTML = '';
    filtered.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist;
        artistDatalist.appendChild(option);
    });
}

// Select a suggestion
function selectSongSuggestion(songName, artistName) {
    document.getElementById('songName').value = songName;
    document.getElementById('artist').value = artistName;

    // Trigger input event to update suggestions
    document.getElementById('songName').dispatchEvent(new Event('input'));
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    loadStats();
    initSuggestions();
});
