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
// 🎵 YOUTUBE SEARCH FEATURE
// ============================================

// YouTube search state
let youtubeSearchTimeout;
let youtubeResults = [];
let youtubeSelectedIndex = -1;
let isSearching = false;

// YouTube API (using Invidious instance - free, no API key needed)
const YOUTUBE_API_BASE = 'https://inv.nadeko.net/api/v1';

// Initialize YouTube search
function initYouTubeSearch() {
    const songInput = document.getElementById('songName');
    const dropdown = document.getElementById('songDropdown');

    // Input handler with debounce
    songInput.addEventListener('input', function() {
        const query = this.value.trim();

        clearTimeout(youtubeSearchTimeout);

        if (query.length < 2) {
            hideSongDropdown();
            return;
        }

        // Show loading state
        showLoadingState();

        // Debounce search
        youtubeSearchTimeout = setTimeout(() => {
            searchYouTube(query);
        }, 400);
    });

    // Focus handler
    songInput.addEventListener('focus', function() {
        const query = this.value.trim();
        if (query.length >= 2) {
            showLoadingState();
            searchYouTube(query);
        }
    });

    // Keyboard navigation
    songInput.addEventListener('keydown', handleYouTubeKeydown);

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.autocomplete-wrapper')) {
            hideSongDropdown();
        }
    });
}

// Show loading state in dropdown
function showLoadingState() {
    const dropdown = document.getElementById('songDropdown');
    dropdown.innerHTML = `
        <div class="youtube-loading">
            <i class="fab fa-youtube"></i>
            <span>Đang tìm kiếm YouTube...</span>
        </div>
    `;
    dropdown.classList.add('active');
}

// Search YouTube for videos
async function searchYouTube(query) {
    if (isSearching) return;
    isSearching = true;

    try {
        // Using Invidious API - free YouTube alternative
        const response = await fetch(`${YOUTUBE_API_BASE}/search?q=${encodeURIComponent(query)}&type=video&limit=8`);

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const data = await response.json();

        // Transform data
        youtubeResults = data.map(item => ({
            videoId: item.videoId,
            title: item.title,
            author: item.author,
            duration: formatDuration(item.duration),
            thumbnail: `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`
        }));

        displayYouTubeResults(query);

    } catch (error) {
        console.error('YouTube search error:', error);
        showSearchError();
    } finally {
        isSearching = false;
    }
}

// Display YouTube search results
function displayYouTubeResults(query) {
    const dropdown = document.getElementById('songDropdown');
    youtubeSelectedIndex = -1;

    if (youtubeResults.length === 0) {
        dropdown.innerHTML = `
            <div class="autocomplete-no-results">
                <i class="fab fa-youtube"></i>
                Không tìm thấy video nào
            </div>
        `;
    } else {
        dropdown.innerHTML = youtubeResults.map((video, index) => `
            <div class="youtube-item" data-index="${index}" data-title="${escapeHtml(video.title)}" data-author="${escapeHtml(video.author)}" data-video-id="${video.videoId}">
                <img class="youtube-thumb" src="${video.thumbnail}" alt="thumbnail" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 90%22><rect fill=%22%23f0f0f0%22 width=%22120%22 height=%2290%22/><text x=%2260%22 y=%2250%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22>🎵</text></svg>'">
                <div class="youtube-info">
                    <div class="youtube-title">${highlightText(video.title, query)}</div>
                    <div class="youtube-channel">${video.author}</div>
                </div>
                ${video.duration ? `<span class="youtube-duration">${video.duration}</span>` : ''}
            </div>
        `).join('');

        // Add click handlers
        dropdown.querySelectorAll('.youtube-item').forEach(item => {
            item.addEventListener('click', function() {
                const title = this.dataset.title;
                const author = this.dataset.author;
                const videoId = this.dataset.videoId;
                selectYouTubeVideo(title, author, videoId);
            });
        });
    }

    dropdown.classList.add('active');
}

// Show search error
function showSearchError() {
    const dropdown = document.getElementById('songDropdown');
    dropdown.innerHTML = `
        <div class="autocomplete-no-results">
            <i class="fas fa-exclamation-triangle"></i>
            Không thể tìm kiếm. Thử lại sau!
        </div>
    `;
    dropdown.classList.add('active');
}

// Handle keyboard navigation
function handleYouTubeKeydown(e) {
    const dropdown = document.getElementById('songDropdown');
    const items = dropdown.querySelectorAll('.youtube-item');

    if (!dropdown.classList.contains('active') || items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        youtubeSelectedIndex = Math.min(youtubeSelectedIndex + 1, items.length - 1);
        updateYouTubeSelection(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        youtubeSelectedIndex = Math.max(youtubeSelectedIndex - 1, -1);
        updateYouTubeSelection(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (youtubeSelectedIndex >= 0 && youtubeResults[youtubeSelectedIndex]) {
            const video = youtubeResults[youtubeSelectedIndex];
            selectYouTubeVideo(video.title, video.author, video.videoId);
        }
    } else if (e.key === 'Escape') {
        hideSongDropdown();
    }
}

// Update selection highlight
function updateYouTubeSelection(items) {
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === youtubeSelectedIndex);
    });
    if (youtubeSelectedIndex >= 0 && items[youtubeSelectedIndex]) {
        items[youtubeSelectedIndex].scrollIntoView({ block: 'nearest' });
    }
}

// Select a YouTube video
function selectYouTubeVideo(title, author, videoId) {
    // Extract song name (remove common suffixes like "(Official MV)", "[MV]" etc.)
    let songName = title
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\|.*$/g, '')
        .replace(/ft\.|feat\.|ft$/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Clean up author name
    let artistName = author
        .replace('- Topic', '')
        .replace('VEVO', '')
        .replace('Official', '')
        .replace('Music', '')
        .trim();

    // Set values
    document.getElementById('songName').value = songName;
    document.getElementById('artist').value = artistName;

    hideSongDropdown();

    // Focus artist input
    document.getElementById('artist').focus();
}

// Hide dropdown
function hideSongDropdown() {
    const dropdown = document.getElementById('songDropdown');
    dropdown.classList.remove('active');
    youtubeSelectedIndex = -1;
}

// Format duration (seconds to MM:SS)
function formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Highlight matching text
function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<span class="autocomplete-item-highlight">$1</span>');
}

// Escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    loadStats();
    initYouTubeSearch();
});
