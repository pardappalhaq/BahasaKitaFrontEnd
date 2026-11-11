// ==================== STATE MANAGEMENT ====================
const state = {
  currentPage: 'home',
  profile: null,
  grade: 'SD',
  theme: 'light',
  textSize: 'normal',
  comfortable: false,
  contrast: false,
  assessment: null,
  mastered: [],
  attempts: [],
  sidebarOpen: false,
  activeAssessment: null,
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function () {
  loadState();
  document.querySelectorAll('[data-ui-icon]').forEach(function (element) {
    element.innerHTML = icon(element.dataset.uiIcon, 16);
  });
  updateIcons();

  // Show splash, then transition
  setTimeout(function () {
    document.getElementById('splash-screen').style.display = 'none';
    if (state.profile) {
      showApp();
    } else {
      showPage('login');
    }
  }, 2000);

  // Register form role toggle
  document.querySelectorAll('input[name="reg-role"]').forEach(function (roleInput) {
    roleInput.addEventListener('change', function () {
      document.getElementById('reg-grade-field').style.display =
        this.value === 'student' ? '' : 'none';
    });
  });

  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
});

function loadState() {
  try {
    const saved = localStorage.getItem('bahasakita-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    }
    state.theme = localStorage.getItem('bahasakita-theme') || 'light';
    state.textSize = localStorage.getItem('bahasakita-textSize') || 'normal';
    state.comfortable = localStorage.getItem('bahasakita-comfortable') === 'true';
    state.contrast = localStorage.getItem('bahasakita-contrast') === 'true';
  } catch (e) { /* ignore */ }
}

function saveState() {
  try {
    localStorage.setItem('bahasakita-state', JSON.stringify({
      profile: state.profile,
      grade: state.grade,
      assessment: state.assessment,
      mastered: state.mastered,
      attempts: state.attempts,
    }));
    localStorage.setItem('bahasakita-theme', state.theme);
    localStorage.setItem('bahasakita-textSize', state.textSize);
    localStorage.setItem('bahasakita-comfortable', String(state.comfortable));
    localStorage.setItem('bahasakita-contrast', String(state.contrast));
  } catch (e) { /* ignore */ }
}

// ==================== AUTH FUNCTIONS ====================
function showPage(page) {
  document.getElementById('splash-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('auth-page').style.display = '';

  document.getElementById('login-page').style.display = page === 'login' ? '' : 'none';
  document.getElementById('register-page').style.display = page === 'register' ? '' : 'none';
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  if (!email || !password) {
    errorEl.textContent = 'Isi email dan kata sandi.';
    errorEl.style.display = '';
    return;
  }

  // Check stored profile
  const stored = localStorage.getItem('bahasakita-users');
  if (stored) {
    const users = JSON.parse(stored);
    const user = users.find(function (u) { return u.email === email.toLowerCase(); });
    if (user && user.password === password) {
      state.profile = user;
      state.grade = user.grade || 'SD';
      saveState();
      showApp();
      return;
    }
  }

  // Demo login
  state.profile = { name: email.split('@')[0], email: email, grade: 'SD', role: 'student' };
  state.grade = 'SD';
  saveState();
  showApp();
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const role = document.querySelector('input[name="reg-role"]:checked').value;
  const grade = document.querySelector('input[name="reg-grade"]:checked').value;
  const errorEl = document.getElementById('register-error');

  if (!name) { errorEl.textContent = 'Isi nama panggilanmu.'; errorEl.style.display = ''; return; }
  if (password !== confirm) { errorEl.textContent = 'Konfirmasi kata sandi belum cocok.'; errorEl.style.display = ''; return; }
  if (password.length < 8) { errorEl.textContent = 'Kata sandi minimal 8 karakter.'; errorEl.style.display = ''; return; }

  const user = {
    name: displayName(name),
    email: email.toLowerCase(),
    password: password,
    role: role,
    grade: role === 'student' ? grade : null,
    goal: 'Mengenal kata',
  };

  // Save user
  let users = [];
  try { users = JSON.parse(localStorage.getItem('bahasakita-users') || '[]'); } catch (e) { users = []; }
  users.push(user);
  localStorage.setItem('bahasakita-users', JSON.stringify(users));

  state.profile = user;
  state.grade = user.grade || 'SD';
  state.assessment = null;
  state.mastered = [];
  state.attempts = [];
  saveState();
  showApp();
}

function animateProviderButton(button) {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !state.comfortable) {
    button.getAnimations().forEach(animation => animation.cancel());
    button.animate([
      { transform: 'scale(.97)', boxShadow: '0 0 0 3px var(--primary-light)' },
      { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
    ], { duration: 220, easing: 'ease-out' });
  }
}

function demoLogin() {
  state.profile = { name: 'Teman Belajar', email: 'demo@bahasakita.id', grade: 'SD', role: 'student' };
  state.grade = 'SD';
  saveState();
  showApp();
}

function logout() {
  closeSignCamera();
  state.profile = null;
  state.assessment = null;
  state.mastered = [];
  state.attempts = [];
  state.activeAssessment = null;
  saveState();
  showPage('login');
}

function togglePassword(btn) {
  const input = btn.previousElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '';
  } else {
    input.type = 'password';
    btn.textContent = '';
  }
}

// ==================== APP SHELL ====================
function showApp() {
  document.getElementById('splash-screen').style.display = 'none';
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app-shell').style.display = '';
  buildNavigation();
  const accountButton = document.querySelector('.astro-login');
  if (accountButton) {
    accountButton.textContent = state.profile ? 'Profil saya' : 'Masuk';
    accountButton.onclick = function () { state.profile ? navigate('profile') : showPage('login'); };
  }
  navigate('home');
}

function buildNavigation() {
  const navItems = [
    { id: 'home', icon: 'home', label: 'Beranda' },
    { id: 'learning', icon: 'graduation', label: 'Belajar' },
    { id: 'dictionary', icon: 'dictionary', label: 'Kamus visual' },
    { id: 'profile', icon: 'tablerUser', label: 'Profil saya' },
  ];

  // Sidebar nav
  const sidebarNav = document.getElementById('sidebar-nav');
  sidebarNav.innerHTML = navItems.map(function (item) {
    return '<a href="#" data-nav="' + item.id + '" onclick="navigate(\'' + item.id + '\');return false">' +
      icon(item.icon, 20) + item.label + '</a>';
  }).join('');

  // Bottom nav
  const bottomNav = document.getElementById('bottom-nav');
  bottomNav.innerHTML = navItems.map(function (item) {
    return '<a href="#" data-nav="' + item.id + '" onclick="navigate(\'' + item.id + '\');return false">' +
      icon(item.icon, 22) + '<span>' + item.label + '</span></a>';
  }).join('');

  // Sidebar profile
  updateSidebarProfile();
}

function updateSidebarProfile() {
  const el = document.getElementById('sidebar-profile');
  if (!state.profile) return;
  el.innerHTML =
    '<div class="sidebar-profile-info">' +
    '<div class="sidebar-avatar">' + icon('profile', 20) + '</div>' +
    '<div><strong>' + displayName(state.profile.name) + '</strong>' +
    '<small>' + (state.profile.grade || 'Siswa') + '</small></div>' +
    '</div>' +
    '<button class="sidebar-logout-btn" onclick="logout()" aria-label="Keluar">' + icon('logout', 18) + '</button>';
}

function toggleSidebar() {
  const sidebar = document.getElementById('primary-sidebar');
  state.sidebarOpen = !state.sidebarOpen;
  sidebar.classList.toggle('open', state.sidebarOpen);
  const menuButton = document.querySelector('.mobile-menu');
  menuButton.setAttribute('aria-expanded', String(state.sidebarOpen));
  menuButton.setAttribute('aria-label', state.sidebarOpen ? 'Tutup menu' : 'Buka menu');
  if (state.sidebarOpen) {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.onclick = function () { toggleSidebar(); };
    document.body.appendChild(backdrop);
  } else {
    const backdrop = document.querySelector('.menu-backdrop');
    if (backdrop) backdrop.remove();
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : '');
  if (state.theme === 'light') document.documentElement.removeAttribute('data-theme');
  saveState();
  updateIcons();
}

function updateIcons() {
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) themeIcon.innerHTML = icon(state.theme === 'dark' ? 'moon' : 'sun', 22);
  const menuIcon = document.getElementById('menu-icon');
  if (menuIcon) menuIcon.innerHTML = icon('menu', 24);
  const bcIcon = document.getElementById('breadcrumb-icon');
  if (bcIcon) bcIcon.innerHTML = icon('chevron', 15);
}

// ==================== NAVIGATION / ROUTER ====================
const pageTitles = {
  home: 'Beranda',
  learning: 'Jalur belajar',
  dictionary: 'Kamus visual',
  progress: 'Kemajuan saya',
  profile: 'Profil saya',
  settings: 'Pengaturan',
  assessment: 'Asesmen awal',
};

function navigate(page, params) {
  closeSignCamera();
  state.currentPage = page;
  window.scrollTo(0, 0);

  // Update active nav
  document.querySelectorAll('[data-nav]').forEach(function (el) {
    el.classList.toggle('active', el.getAttribute('data-nav') === page);
  });

  // Update breadcrumb
  document.getElementById('breadcrumb-title').textContent = pageTitles[page] || 'Sesi belajar';

  // Close sidebar on mobile
  if (state.sidebarOpen) toggleSidebar();

  // Render page
  const main = document.getElementById('main');
  switch (page) {
    case 'home': main.innerHTML = renderHome(); break;
    case 'learning': main.innerHTML = renderLearning(); break;
    case 'dictionary': main.innerHTML = renderDictionary(); break;
    case 'progress': main.innerHTML = renderProgress(); break;
    case 'profile': main.innerHTML = renderProfile(); break;
    case 'settings': main.innerHTML = renderSettings(); break;
    case 'assessment': main.innerHTML = renderAssessment(); break;
    case 'lesson': main.innerHTML = renderLesson(params); break;
    default: main.innerHTML = renderMissing();
  }
}

// ==================== HOME DASHBOARD ====================
function renderHome() {
  const grade = state.grade || 'SD';
  const lessons = lessonCatalog[grade] || [];
  const next = lessons.find(l => !state.mastered.includes(l.id));
  const action = !state.profile ? "showPage('login')" : !state.assessment ? "navigate('assessment')" : next ? "navigate('lesson', {id:'" + next.id + "'})" : "navigate('progress')";
  const cards = [
    {title:'Kosakata',description:'Kenali kata, temukan maknanya.',image:'kosakata.jpg',page:'dictionary'},
    {title:'Cerita & bacaan',description:'Jelajahi cerita dan pengetahuan baru.',image:'sejarah.jpg',page:'learning'},
    {title:'Dunia hewan',description:'Belajar dari teman-teman di alam.',image:'hewan.jpg',page:'dictionary'},
    {title:'Belajar visual',description:'Pahami lewat gambar dan isyarat.',image:'belajar.jpg',page:'learning'},
    {title:'Alam sekitar',description:'Kenali dunia yang penuh keajaiban.',image:'bumi.jpg',page:'dictionary'}
  ];
  return `<div class="astro-home">
    <section class="astro-hero" aria-labelledby="astro-title">
      <h1 id="astro-title">RUANG UNTUK <span>BELAJAR</span><br>DAN TUMBUH BERSAMA</h1>
      <p>Kenali dunia lewat kata, visual, dan bahasa isyarat.</p>
      <button class="btn astro-cta" onclick="${action}">${state.assessment ? 'Lanjutkan belajar' : 'Mulai petualangan'}</button>
    </section>
    <section class="hanging-gallery" aria-label="Jelajahi ruang belajar">
      <svg class="gallery-string" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true"><path d="M-40 0 Q720 250 1480 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      <div class="hanging-track">${cards.map((card,i)=>`<a class="hanging-card hanging-${i}" href="#" onclick="navigate('${card.page}');return false"><span class="green-clip" aria-hidden="true"></span><img src="images/${card.image}" alt="" width="500" height="360"><div><h2>${card.title}</h2><p>${card.description}</p></div></a>`).join('')}</div>
    </section>
    <div class="astro-values" aria-label="Pendekatan belajar">
      <span>${icon('tablerHand', 25)} BISINDO</span>
      <span>${icon('bookReader', 25)} Belajar visual</span>
      <span>${icon('tablerSchool', 25)} SD · SMP · SMA</span>
      <span>${icon('tablerGrid', 25)} 4 aspek belajar</span>
      <span>${icon('tablerTrend', 25)} Bertumbuh bersama</span>
    </div>
    <section class="astro-continue"><div><h2>Caramu belajar. Ritmemu sendiri.</h2><p>Mulai dari asesmen singkat, lalu ikuti materi yang sesuai dengan kemampuanmu.</p></div><button class="btn" onclick="${action}">Temukan langkahmu ${icon('arrow',18)}</button></section>
    ${renderVideoCarousel(grade,youtubeMaterials[grade] || youtubeMaterials.SD)}
    <footer class="home-footer"><span>BahasaKita · Ruang untuk bertumbuh</span><button onclick="navigate('settings')"></button></footer>
  </div>`;
}

function renderBookArt() {
  return '<div class="book-art" aria-hidden="true"><div class="art-scene">' +
    '<span class="art-star one">✦</span><span class="art-dot"></span>' +
    '<div class="art-orbit"></div>' +
    '<div class="art-card card-back"></div>' +
    '<div class="art-card card-front">' + icon('hand', 54) + '<span>ISYARAT</span></div>' +
    '<div class="art-book"><div class="book-page left"><i></i><i></i><i></i></div>' +
    '<div class="book-page right"><span>✦</span><i></i><i></i></div></div>' +
    '</div></div>';
}

function renderVideoCarousel(grade, videos) {
  let html = '<section class="home-video-section" aria-labelledby="home-videos-title">' +
    '<div class="home-section-heading"><div>' +
    '<h2 id="home-videos-title">Caramu belajar, <span>cerita hebatmu.</span></h2>' +
    '<p>Amati isyarat dan visual dari video pembelajaran sesuai jenjangmu.</p></div>' +
    '<div class="home-video-controls">' +
    '<button type="button" class="home-icon-button" aria-label="Geser ke kiri" onclick="scrollCarousel(-1)">' + icon('arrowLeft', 20) + '</button>' +
    '<button type="button" class="home-icon-button" aria-label="Geser ke kanan" onclick="scrollCarousel(1)">' + icon('arrow', 20) + '</button>' +
    '</div></div>';

  html += '<div id="home-video-track" class="home-video-track">';
  videos.forEach(function (video) {
    html += '<button type="button" class="home-video-card" onclick="openVideoDialog(\'' + video.id + '\', \'' + escapeAttr(video.title) + '\', \'' + escapeAttr(video.description) + '\', \'' + grade + '\', \'' + escapeAttr(video.topic) + '\')">' +
      '<span class="home-video-thumbnail"><img src="' + youtubeThumbnail(video.id) + '" alt="" loading="lazy" width="480" height="360" draggable="false"></span>' +
      '<span class="home-video-copy">' +
      '<span class="home-video-topic">' + video.topic + '</span>' +
      '<strong>' + video.title + '</strong>' +
      '<span class="home-video-play">' + icon('play', 17) + 'Tonton video</span>' +
      '</span></button>';
  });
  html += '</div></section>';
  return html;
}

function scrollCarousel(direction) {
  const track = document.getElementById('home-video-track');
  if (!track) return;
  const card = track.querySelector('.home-video-card');
  const scrollAmount = (card ? card.offsetWidth : track.clientWidth) + 16;
  track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// ==================== LEARNING PATH ====================
function renderLearning() {
  const grade = state.grade || 'SD';
  const lessons = lessonCatalog[grade] || [];
  const entries = dictionaryEntries[grade] || [];
  const assessed = !!state.assessment;

  const completedCount = lessons.filter(function (lesson) { return state.mastered.includes(lesson.id); }).length;
  let html = '<div class="learning-page"><header class="page-heading"><div>' +
    '<h1>Jalur yang dibuat untukmu.</h1>' +
    '<p>Materi ' + grade + ' mengikuti jenjang dan kemampuanmu. Selesaikan materi secara berurutan.</p>' +
    '</div><span class="tag neutral">' + completedCount + '/' + lessons.length + ' materi selesai</span></header>';

  if (!assessed) {
    html += '<div class="notice">' + icon('info') + '<p>Selesaikan asesmen awal untuk menyusun dan membuka jalurmu.</p>' +
      '<a href="#" class="btn" onclick="navigate(\'assessment\');return false">Mulai asesmen</a></div>';
  }

  html += '<section class="panel sign-camera-card"><div><h2>Latihan huruf isyarat</h2>' +
    '<p>Tirukan contoh pose dan lihat hurufnya langsung dari kamera.</p></div>' +
    '<button type="button" class="btn" onclick="openSignCamera()">Buka latihan kamera</button></section>';

  html += '<div class="path-list">';
  lessons.forEach(function (lesson, i) {
    const complete = state.mastered.includes(lesson.id);
    const available = assessed && (i === 0 || state.mastered.includes(lessons[i - 1].id));
    const aspect = aspects.find(function (a) { return a.id === lesson.aspect; });
    const cover = entries.find(function (entry) { return entry.word === lesson.words[0]; });

    html += '<div class="path-row ' + (!available && !complete ? 'locked' : '') + '">' +
      '<div class="path-number ' + (complete ? 'complete' : available ? 'current' : '') + '">' +
      (complete ? icon('check') : available ? (i + 1) : icon('lock', 19)) + '</div>' +
      '<article class="panel path-card">' +
      renderWordPhoto(cover, 'lesson-picture') +
      '<div class="path-card-content">' +
      '<div class="inline-tags">' +
      '<span class="tag ' + (aspect ? aspect.color : '') + '">' + (aspect ? aspect.name : '') + '</span>' +
      '<span class="tag neutral">' + lesson.grade + '</span>' +
      '</div>' +
      '<h2>' + lesson.title + '</h2>' +
      '<p>' + lesson.description + '</p>' +
      '<span class="lesson-meta">' + icon('clock', 15) + lesson.time + ' menit · 4 tahap · ' + lesson.level + '</span>' +
      '<p class="lesson-word-summary">Kosakata: ' + (lesson.words || []).join(', ') + '</p>' +
      '</div>' +
      (available && !complete ?
        '<a href="#" class="btn" onclick="navigate(\'lesson\', {id:\'' + lesson.id + '\'});return false">Mulai belajar' + icon('arrow', 17) + '</a>' :
        complete ? '<span class="tag purple">Selesai ' + icon('check', 12) + '</span>' :
          '<span class="locked-label">' + icon('lock', 16) + (assessed ? 'Selesaikan materi sebelumnya' : 'Selesaikan asesmen awal') + '</span>') +
      '</article></div>';
  });
  return html + '</div></div>';
}

// ==================== DICTIONARY ====================
function renderDictionary() {
  const grade = state.grade || 'SD';
  const entries = dictionaryEntries[grade] || [];
  const categories = [...new Set(entries.map(function (e) { return e.category; }))];

  let html = '<div class="dictionary-page">' +
    '<div class="page-heading"><div><h1>Kamus visual</h1>' +
    '<p>Kosakata dan video pembelajaran sesuai jenjangmu.</p></div></div>';

  // Grade tabs
  html += '<div class="dictionary-filters" role="search" aria-label="Pencarian Kamus Visual">' +
    '<div class="filter-tabs" id="dict-grade-tabs" role="group" aria-label="Jenjang belajar">';
  ['SD', 'SMP', 'SMA'].forEach(function (g) {
    html += '<button class="' + (g === grade ? 'active' : '') + '" onclick="changeDictGrade(\'' + g + '\')">' + g + '</button>';
  });
  html += '</div>';

  // Search
  html += '<div class="dictionary-search">' + icon('search', 20) +
    '<input type="search" id="dict-search" aria-label="Cari kata" placeholder="Cari kata..." oninput="filterDictionary()">' +
    '</div>';

  // Category filters
  html += '<div class="filter-tabs" id="dict-cat-tabs" role="group" aria-label="Kategori kosakata">' +
    '<button class="active" onclick="filterDictCategory(\'all\', this)">Semua</button>';
  categories.forEach(function (cat) {
    html += '<button onclick="filterDictCategory(\'' + cat + '\', this)">' + cat + '</button>';
  });
  html += '</div></div>';

  // Cards grid
  html += '<div class="dictionary-grid" id="dict-grid">';
  entries.forEach(function (entry) {
    html += renderDictCard(entry, grade);
  });
  html += '</div>';

  // YouTube lessons
  html += renderYoutubeLessons(grade);

  html += '</div>';
  return html;
}

function renderDictCard(entry, grade) {
  return '<button class="panel dictionary-card" data-word="' + entry.word + '" data-category="' + entry.category + '" onclick="openWordDialog(\'' + escapeAttr(JSON.stringify(entry).replace(/'/g, "\\'")) + '\', \'' + grade + '\')">' +
    renderWordPhoto(entry, 'dictionary-image') +
    '<div><span class="tag">' + entry.category + '</span>' +
    '<h2>' + entry.word + '</h2>' +
    '<p>' + entry.meaning + '</p></div></button>';
}

function changeDictGrade(grade) {
  state.grade = grade;
  saveState();
  navigate('dictionary');
}

function filterDictionary() {
  const search = document.getElementById('dict-search').value.toLowerCase();
  document.querySelectorAll('.dictionary-card').forEach(function (card) {
    const word = card.getAttribute('data-word').toLowerCase();
    card.style.display = word.includes(search) ? '' : 'none';
  });
}

function filterDictCategory(category, btn) {
  document.querySelectorAll('#dict-cat-tabs button').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');

  document.querySelectorAll('.dictionary-card').forEach(function (card) {
    if (category === 'all') { card.style.display = ''; return; }
    card.style.display = card.getAttribute('data-category') === category ? '' : 'none';
  });
}

function renderYoutubeLessons(grade) {
  const videos = youtubeMaterials[grade] || [];
  let html = '<section class="youtube-section"><div class="section-heading"><div>' +
    '<h2>Video pembelajaran ' + grade + '</h2>' +
    '<p>Video dari sumber resmi untuk siswa tunarungu.</p></div></div>' +
    '<div class="youtube-lessons-grid">';

  videos.forEach(function (video) {
    html += '<article class="panel youtube-lesson">' +
      '<div class="home-video-thumbnail"><img src="' + youtubeThumbnail(video.id) + '" alt="" loading="lazy" width="480" height="360"></div>' +
      '<span class="home-video-topic">' + video.topic + '</span>' +
      '<h3>' + video.title + '</h3>' +
      '<p>' + video.description + '</p>' +
      '<button class="btn secondary" onclick="openVideoDialog(\'' + video.id + '\', \'' + escapeAttr(video.title) + '\', \'' + escapeAttr(video.description) + '\', \'' + grade + '\', \'' + escapeAttr(video.topic) + '\')">' +
      icon('play', 17) + 'Tonton</button></article>';
  });

  html += '</div></section>';
  return html;
}

// ==================== ASSESSMENT ====================
function renderAssessment() {
  const grade = state.grade || 'SD';
  const questions = assessmentQuestions[grade] || [];

  // Already assessed
  if (state.assessment) {
    return '<div class="assessment-results"><header class="panel result-summary">' +
      '<div class="icon-tile green" aria-hidden="true">' + icon('trophy') + '</div>' +
      '<div class="result-summary-copy"><h1>Asesmen selesai</h1>' +
      '<p>Hasilmu sudah tersimpan, kamu bisa melanjutkan belajar.</p></div>' +
      '<a href="#" class="btn" onclick="navigate(\'learning\');return false">Lanjut belajar' + icon('arrow', 17) + '</a></header>' +
      '<section aria-labelledby="assessment-scores"><h2 id="assessment-scores">Hasil per aspek</h2>' +
      renderProfileGrid() + '</section></div>';
  }

  // Active assessment
  if (state.activeAssessment) {
    return renderAssessmentQuestion();
  }

  // Intro
  return '<div class="assessment-start"><header class="page-heading"><div>' +
    '<h1>Ini titik awalmu.</h1>' +
    '<p>Jawab sesuai yang kamu pahami & tidak perlu terburu-buru.</p></div></header>' +
    '<section class="panel assessment-intro" aria-labelledby="assessment-intro-title">' +
    '<div class="icon-tile green" aria-hidden="true">' + icon('clipboardList') + '</div>' +
    '<div class="assessment-intro-copy"><span class="tag neutral">Jenjang ' + grade + '</span>' +
    '<h2 id="assessment-intro-title">' + questions.length + ' soal, ' + aspects.length + ' aspek kemampuan</h2>' +
    '<p>Kosakata, kalimat, bacaan, dan matematika dasar.</p>' +
    '<button class="btn" type="button" onclick="startAssessment()">Mulai asesmen' + icon('arrow', 17) + '</button>' +
    '</div></section></div>';
}

function startAssessment() {
  const grade = state.grade || 'SD';
  const questions = assessmentQuestions[grade] || [];
  state.activeAssessment = {
    questions: shuffleArray([...questions]),
    current: 0,
    answers: [],
    grade: grade,
  };
  navigate('assessment');
}

function renderAssessmentQuestion() {
  const aa = state.activeAssessment;
  const q = aa.questions[aa.current];
  const aspect = aspects.find(function (a) { return a.id === q.aspect; });

  let html = '<div class="page-heading"><div><h1>Satu soal, satu langkah.</h1>' +
    '<p>Setiap jawaban disimpan saat kamu melanjutkan.</p></div></div>' +
    '<div class="quiz-container panel">' +
    '<div class="quiz-top">' +
    '<span class="tag ' + (aspect ? aspect.color : '') + '">' + (aspect ? aspect.name : '') + ' · ' + aa.grade + '</span>' +
    '<span>Soal ' + (aa.current + 1) + ' dari ' + aa.questions.length + '</span></div>' +
    '<progress max="' + aa.questions.length + '" value="' + aa.current + '" aria-label="Kemajuan asesmen"></progress>';

  html += renderWordPhoto(q, 'assessment-question-photo');

  html += '<h2>' + q.prompt + '</h2>' +
    '<div class="answer-options">';

  q.options.forEach(function (opt, i) {
    html += '<button type="button" class="answer-option" onclick="selectAssessmentAnswer(' + i + ', this)">' +
      '<span>' + String.fromCharCode(65 + i) + '</span>' + opt + '</button>';
  });

  html += '</div><div class="quiz-actions">' +
    '<button class="btn secondary" onclick="submitAssessmentAnswer(null)">Saya belum tahu</button>' +
    '<button class="btn" id="assessment-next-btn" disabled onclick="submitAssessmentAnswer()">Lanjut</button>' +
    '</div></div>';

  return html;
}

let selectedAssessmentAnswer = null;

function selectAssessmentAnswer(index, btn) {
  selectedAssessmentAnswer = index;
  document.querySelectorAll('.answer-option').forEach(function (b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  document.getElementById('assessment-next-btn').disabled = false;
}

function submitAssessmentAnswer(skip) {
  const aa = state.activeAssessment;
  const q = aa.questions[aa.current];
  const answer = skip === null ? null : selectedAssessmentAnswer;
  const correct = answer === q.answer;

  aa.answers.push({ questionId: q.id, aspect: q.aspect, answer: answer, correct: correct });
  aa.current++;
  selectedAssessmentAnswer = null;

  if (aa.current >= aa.questions.length) {
    finishAssessment();
    return;
  }

  navigate('assessment');
}

function finishAssessment() {
  const aa = state.activeAssessment;
  const scores = {};
  aspects.forEach(function (a) { scores[a.id] = 0; });

  const aspectCounts = {};
  aspects.forEach(function (a) { aspectCounts[a.id] = 0; });

  aa.answers.forEach(function (a) {
    aspectCounts[a.aspect] = (aspectCounts[a.aspect] || 0) + 1;
    if (a.correct) scores[a.aspect] = (scores[a.aspect] || 0) + 1;
  });

  aspects.forEach(function (a) {
    scores[a.id] = aspectCounts[a.id] > 0 ? Math.round(scores[a.id] / aspectCounts[a.id] * 100) : 0;
  });

  state.assessment = scores;
  state.attempts.push({
    type: 'assessment',
    grade: aa.grade,
    scores: scores,
    date: new Date().toISOString(),
    title: 'Asesmen awal ' + aa.grade,
  });
  state.activeAssessment = null;
  saveState();
  navigate('assessment');
}

// ==================== LESSON ====================
function renderWordPhoto(entry, className, alt = '') {
  if (!entry || !entry.photo) return '';

  return '<img class="' + className + '" src="images/materi/' + entry.photo + '.jpg" alt="' + alt + '" loading="lazy">';
}

function renderLesson(params) {
  if (!params || !params.id) return renderMissing();

  const grade = state.grade || 'SD';
  const lessons = lessonCatalog[grade] || [];
  const lesson = lessons.find(function (l) { return l.id === params.id; });
  if (!lesson) return renderMissing();

  const entries = dictionaryEntries[grade] || [];
  const relatedWords = entries.filter(function (e) { return (lesson.words || []).includes(e.word); });

  // Simple 4-stage lesson
  const stageKey = 'lesson-stage-' + lesson.id;
  let stage = parseInt(sessionStorage.getItem(stageKey) || '0');

  let html = '<div class="learning-page lesson-page"><a href="#" class="back-link" onclick="navigate(\'learning\');return false">' + icon('arrowLeft', 14) + 'Kembali belajar</a>' +
    '<div class="page-heading"><div><h1>' + lesson.title + '</h1><p>' + lesson.description + '</p></div></div>' +
    '<div class="inline-tags"><span class="tag">' + lesson.grade + '</span></div>';

  // Stage nav
  html += '<div class="stage-nav" aria-label="Tahap belajar">';
  ['Pengantar', 'Isyarat & visual', 'Latihan', 'Evaluasi'].forEach(function (s, i) {
    html += '<span class="stage' + (stage === i ? ' active' : i < stage ? ' done' : '') + '"' +
      (stage === i ? ' aria-current="step"' : '') + '><b class="stage-number">' + (i + 1) + '</b>' + s + '</span>';
  });
  html += '</div>';

  html += '<div class="panel lesson-main">';

  if (stage === 0) {
    // Intro
    const cover = relatedWords.find(function (entry) { return entry.word === lesson.words[0]; });
    html += renderWordPhoto(cover, 'lesson-big-visual', cover ? cover.word : '') +
      '<h2>Hari ini, kita belajar…</h2>' +
      '<p>Kamu akan mengenal kosakata baru melalui isyarat dan visual. Materi ini membahas: ' + (lesson.words || []).join(', ') + '</p>' +
      '<button class="btn" onclick="setLessonStage(\'' + lesson.id + '\', 1)">Mulai belajar</button>';
  } else if (stage === 1) {
    // Visual & Sign
    html += '<h2>Amati, baca, dan pahami</h2>';
    relatedWords.forEach(function (word) {
      html += '<div class="visual-explanation">' +
        renderWordPhoto(word, 'lesson-word-photo') +
        '<div><h3>' + word.word + '</h3>' +
        '<p><strong>Arti:</strong> ' + word.meaning + '</p>' +
        '<p class="example">"' + word.example + '"</p>' +
        (word.videoId ? '<button class="btn secondary" style="margin-top:10px" onclick="openVideoDialog(\'' + word.videoId + '\', \'' + escapeAttr(word.word) + '\', \'' + escapeAttr(word.meaning) + '\', \'' + grade + '\', \'' + escapeAttr(word.category) + '\')">' + icon('play', 17) + 'Lihat video</button>' : '') +
        '</div></div>';
    });
    html += '<div class="quiz-actions">' +
      '<button class="btn secondary" onclick="setLessonStage(\'' + lesson.id + '\', 0)">Kembali</button>' +
      '<button class="btn" onclick="setLessonStage(\'' + lesson.id + '\', 2)">Lanjut ke latihan</button></div>';
  } else if (stage === 2) {
    // Practice
    html += '<span class="tag">LATIHAN PENGUATAN</span>';
    const practiceQ = generatePracticeQuestion(lesson, entries);
    html += renderWordPhoto(practiceQ.word, 'lesson-question-photo') +
      '<h2>' + practiceQ.prompt + '</h2>' +
      '<div class="answer-options">';
    practiceQ.options.forEach(function (opt, i) {
      html += '<button class="answer-option" onclick="checkPractice(' + i + ', ' + practiceQ.answer + ', this, \'' + lesson.id + '\')">' +
        '<span class="option-letter">' + String.fromCharCode(65 + i) + '</span>' + opt + '</button>';
    });
    html += '</div><div id="practice-feedback"></div>' +
      '<div class="quiz-actions">' +
      '<button class="btn secondary" onclick="setLessonStage(\'' + lesson.id + '\', 1)">Lihat materi lagi</button>' +
      '<button class="btn" id="practice-next-btn" style="display:none" onclick="setLessonStage(\'' + lesson.id + '\', 3)">Mulai evaluasi</button></div>';
  } else if (stage === 3) {
    // Evaluation
    const evalQ = generateEvalQuestion(lesson, entries);
    html += '<span class="tag">EVALUASI</span>' +
      renderWordPhoto(evalQ.word, 'lesson-question-photo') +
      '<h2>' + evalQ.prompt + '</h2>' +
      '<div class="answer-options">';
    evalQ.options.forEach(function (opt, i) {
      html += '<button class="answer-option" onclick="checkEval(' + i + ', ' + evalQ.answer + ', this, \'' + lesson.id + '\')">' +
        '<span class="option-letter">' + String.fromCharCode(65 + i) + '</span>' + opt + '</button>';
    });
    html += '</div><div id="eval-feedback"></div>';
  }

  return html + '</div></div>';
}

function setLessonStage(lessonId, stage) {
  sessionStorage.setItem('lesson-stage-' + lessonId, stage);
  navigate('lesson', { id: lessonId });
}

function generatePracticeQuestion(lesson, entries) {
  const word = entries.find(function (e) { return (lesson.words || []).includes(e.word); });
  if (!word) return { prompt: 'Latihan', options: ['A', 'B', 'C', 'D'], answer: 0 };

  const wrong = entries.filter(function (e) { return e.word !== word.word; }).slice(0, 3).map(function (e) { return e.meaning; });
  const options = shuffleArray([word.meaning, ...wrong]);

  return {
    prompt: 'Apa arti kata "' + word.word + '"?',
    word,
    options: options,
    answer: options.indexOf(word.meaning),
  };
}

function generateEvalQuestion(lesson, entries) {
  const word = entries.find(function (e) { return (lesson.words || []).includes(e.word); });
  if (!word) return { prompt: 'Evaluasi', options: ['A', 'B', 'C', 'D'], answer: 0 };

  const wrong = entries.filter(function (e) { return e.word !== word.word; }).slice(0, 3).map(function (e) { return e.word; });
  const options = shuffleArray([word.word, ...wrong]);

  return {
    prompt: '"' + word.example + '" — Kata yang dimaksud adalah...',
    word,
    options: options,
    answer: options.indexOf(word.word),
  };
}

function checkPractice(selected, correct, btn, lessonId) {
  document.querySelectorAll('.answer-option').forEach(function (b) { b.disabled = true; });
  btn.classList.add('selected');

  const feedback = document.getElementById('practice-feedback');
  if (selected === correct) {
    feedback.innerHTML = '<div class="feedback correct" role="status"><p>Tepat! Kamu sudah memahami contoh ini.</p></div>';
  } else {
    feedback.innerHTML = '<div class="feedback" role="status"><p>Mari perhatikan lagi materinya.</p></div>';
  }
  document.getElementById('practice-next-btn').style.display = '';
}

function checkEval(selected, correct, btn, lessonId) {
  document.querySelectorAll('.answer-option').forEach(function (b) { b.disabled = true; });
  btn.classList.add('selected');

  const feedback = document.getElementById('eval-feedback');
  const mastered = selected === correct;

  if (mastered && !state.mastered.includes(lessonId)) {
    state.mastered.push(lessonId);
  }

  state.attempts.push({
    type: 'lesson',
    lessonId: lessonId,
    mastered: mastered,
    score: mastered ? 100 : 40,
    date: new Date().toISOString(),
    title: 'Evaluasi materi',
  });
  saveState();
  sessionStorage.removeItem('lesson-stage-' + lessonId);

  feedback.innerHTML = '<div class="panel result-summary" style="margin-top:20px">' +
    icon(mastered ? 'trophy' : 'leaf', 40) +
    '<div><h2>' + (mastered ? 'Materi sudah kamu kuasai!' : 'Kita coba penguatan lagi.') + '</h2>' +
    '<p>' + (mastered ? 'Langkahmu sudah tercatat.' : 'Coba pelajari materi lagi.') + '</p></div>' +
    '<a href="#" class="btn" onclick="navigate(\'learning\');return false">Lanjut ke jalur belajar</a>' +
    '<button class="btn secondary" onclick="setLessonStage(\'' + lessonId + '\', 0);navigate(\'lesson\', {id:\'' + lessonId + '\'})">Latihan lagi</button></div>';
}

// ==================== PROGRESS ====================
function renderProgress() {
  const assessed = !!state.assessment;
  const lessonAttempts = state.attempts.filter(function (a) { return a.type === 'lesson'; });

  let html = '<div class="progress-page"><header class="page-heading"><div><h1>Kemajuan saya</h1>' +
    '<p>Pantau materi yang sudah kamu kuasai dan lihat kembali sesi belajarmu.</p></div></header>';

  // Stats
  html += '<section class="progress-section"><h2>Ringkasan belajar</h2><div class="learning-stats">' +
    renderStatCard('medal', 'purple', state.mastered.length + ' materi', 'Sudah kamu kuasai') +
    renderStatCard('history', 'blue', lessonAttempts.length + ' sesi', 'Usaha belajar yang tercatat') +
    renderStatCard('tablerClock', 'pink', (lessonAttempts.length * 8) + ' menit', 'Estimasi waktu belajar') +
    '</div></section>';

  // Profile grid
  html += '<section class="progress-section"><h2>Profil kemampuanmu</h2>' +
    '<p>' + (assessed ? 'Diperbarui setelah setiap evaluasi.' : 'Selesaikan asesmen untuk melihat profil awal.') + '</p>' +
    renderProfileGrid({ vocabulary: 'spellCheck', sentence: 'penToSquare', reading: 'bookReader', math: 'calculator' }) + '</section>';

  // History
  html += '<section class="panel progress-section history-panel"><h2>Jejak belajarmu</h2>';
  if (!state.attempts.length) {
    html += '<div class="empty-card"><h3>Cerita belajarmu dimulai di sini.</h3>' +
      '<p>Mulai asesmen, lalu catat langkah pertamamu.</p>' +
      '<a href="#" class="btn" onclick="navigate(\'assessment\');return false">Mulai asesmen</a></div>';
  } else {
    html += '<ul class="history-list" role="list">';
    [...state.attempts].reverse().forEach(function (a) {
      const isAssessment = a.type === 'assessment';
      const entryIcon = isAssessment ? 'clipboardList' : a.mastered ? 'circleCheck' : 'tablerBook';
      const color = isAssessment ? 'blue' : a.mastered ? 'green' : 'purple';
      html += '<li class="history-row">' +
        '<div class="icon-tile ' + color + '">' + icon(entryIcon) + '</div>' +
        '<div><h3>' + (a.title || 'Sesi belajar') + '</h3>' +
        '<p>' + new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p></div></li>';
    });
    html += '</ul>';
  }
  return html + '</section></div>';
}

function renderStatCard(iconName, color, value, label) {
  return '<div class="stat-card"><div class="icon-tile ' + color + '">' + icon(iconName) + '</div>' +
    '<div><strong>' + value + '</strong><p>' + label + '</p></div></div>';
}

function renderProfileGrid(aspectIcons = {}) {
  let html = '<div class="profile-grid">';
  aspects.forEach(function (a) {
    const score = state.assessment ? (state.assessment[a.id] || 0) : 0;
    html += '<div class="panel profile-card">' +
      '<div class="icon-tile ' + a.color + '">' + icon(aspectIcons[a.id] || a.icon) + '</div>' +
      '<h3>' + a.name + '</h3>' +
      '<strong>' + score + '<small>%</small></strong>' +
      '<progress value="' + score + '" max="100" aria-label="Kemampuan ' + a.name + '"></progress>' +
      '<span class="tag ' + a.color + '">' + (state.assessment ? levelLabel(score) : 'Belum dinilai') + '</span></div>';
  });
  html += '</div>';
  return html;
}

// ==================== PROFILE ====================
function renderProfile() {
  const profile = state.profile;
  const name = displayName(profile?.name || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const lessonAttempts = state.attempts.filter(function (a) { return a.type === 'lesson'; });

  let html = '<div class="profile-page"><header class="page-heading"><div><h1>Profil saya</h1>' +
    '<p>Kenali dirimu dan perjalanan belajarmu.</p></div>' +
    '<a href="#" class="btn secondary" onclick="navigate(\'settings\');return false">' + icon('tablerUserEdit', 17) + 'Edit profil</a></header>';

  html += '<section class="panel profile-overview">' +
    '<div class="profile-main-avatar" aria-hidden="true">' + icon('tablerUser', 32) + '</div>' +
    '<div class="profile-identity"><h2>' + (name || 'Teman belajar') + '</h2>' +
    '<p>Belajar dengan caramu, bertumbuh dengan ritmemu.</p></div></section>';

  html += '<section class="panel profile-details"><h2>Profil belajarmu</h2><dl>' +
    '<div><dt>Nama panggilan</dt><dd>' + (name || 'Belum diisi') + '</dd></div>' +
    '<div><dt>Jenjang belajar</dt><dd>' + (profile?.grade || 'Belum dipilih') + '</dd></div>' +
    '<div><dt>Tujuan belajar</dt><dd>' + (profile?.goal || 'Mengenal kata') + '</dd></div></dl></section>';

  html += '<section class="profile-progress"><div class="profile-progress-heading"><h2>Ringkasan belajar</h2>' +
    '<a href="#" class="btn secondary" onclick="navigate(\'progress\');return false">Lihat kemajuan' + icon('tablerArrowRight', 17) + '</a></div>' +
    '<div class="learning-stats">' +
    renderStatCard('medal', 'purple', state.mastered.length + ' materi', 'Sudah dikuasai') +
    renderStatCard('clipboardList', 'blue', (state.assessment ? 'Sudah selesai' : 'Belum dimulai'), 'Asesmen awal') +
    renderStatCard('history', 'pink', lessonAttempts.length + ' sesi', 'Sesi belajar tercatat') +
    '</div></section>';
  return html + '</div>';
}

// ==================== SETTINGS ====================
function renderSettings() {
  const name = (state.profile?.name || '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  return '<div class="settings-page"><header class="page-heading"><div><h1>Pengaturan</h1>' +
    '<p>Kelola profil belajar dan akunmu.</p></div></header>' +
    '<section class="panel settings-panel"><h2>Profil belajar</h2>' +
    '<p>Ubah nama panggilan dan jenjang belajarmu.</p>' +
    '<form onsubmit="saveProfile();return false"><div class="settings-fields">' +
    '<label class="field">Nama panggilan<input type="text" id="set-name" value="' + name + '"></label>' +
    '<label class="field">Jenjang belajar<select id="set-grade">' +
    '<option value="SD"' + (state.grade === 'SD' ? ' selected' : '') + '>SD</option>' +
    '<option value="SMP"' + (state.grade === 'SMP' ? ' selected' : '') + '>SMP</option>' +
    '<option value="SMA"' + (state.grade === 'SMA' ? ' selected' : '') + '>SMA</option></select></label></div>' +
    '<div class="settings-form-actions"><p id="settings-notice" role="status"></p>' +
    '<button class="btn" type="submit">Simpan profil</button></div></form></section>' +
    '<section class="panel settings-panel"><h2>Akun dan data</h2>' +
    '<div class="settings-account-row"><div><h3>Keluar dari akun</h3>' +
    '<p>Kembali ke halaman masuk.</p></div>' +
    '<button class="btn secondary" type="button" onclick="logout()">Keluar</button></div>' +
    '<div class="settings-account-row"><div><h3>Reset data belajar</h3>' +
    '<p>Hapus hasil asesmen, kemajuan materi, dan riwayat belajar.</p></div>' +
    '<button class="btn secondary settings-reset" type="button" onclick="resetAccount()">Reset data belajar</button></div></section></div>';
}

function saveProfile() {
  const name = document.getElementById('set-name').value.trim();
  const grade = document.getElementById('set-grade').value;
  if (name) state.profile.name = displayName(name);
  state.grade = grade;
  if (state.profile) state.profile.grade = grade;
  saveState();
  updateSidebarProfile();
  const notice = document.getElementById('settings-notice');
  notice.textContent = 'Profil tersimpan!';
  notice.style.display = '';
  setTimeout(function () { notice.style.display = 'none'; }, 3000);
}

function resetAccount() {
  if (!confirm('Yakin ingin mereset semua data belajar? Tindakan ini tidak bisa dibatalkan.')) return;
  state.assessment = null;
  state.mastered = [];
  state.attempts = [];
  state.activeAssessment = null;
  saveState();
  navigate('home');
}

// ==================== MISSING PAGE ====================
function renderMissing() {
  return '<div class="panel empty-card">' + icon('path', 48) +
    '<h1>Halaman ini belum ditemukan.</h1>' +
    '<p>Kembali ke ruang belajar dan lanjutkan perjalananmu.</p>' +
    '<a href="#" class="btn" onclick="navigate(\'home\');return false">Kembali ke beranda</a></div>';
}

// ==================== DIALOGS ====================
function openWordDialog(entryJSON, grade) {
  const entry = JSON.parse(entryJSON);
  const dialog = document.getElementById('word-dialog');
  const content = document.getElementById('word-dialog-content');

  content.innerHTML =
    renderWordPhoto(entry, 'dictionary-detail-photo') +
    '<h2>' + entry.word + '</h2>' +
    '<p>' + entry.meaning + '</p>' +
    '<div style="margin:16px 0;padding:16px;background:var(--soft);border-radius:12px">' +
    '<p style="color:var(--text)"><strong>Contoh:</strong> "' + entry.example + '"</p></div>' +
    '<div class="inline-tags" style="justify-content:center"><span class="tag">' + entry.category + '</span><span class="tag neutral">' + grade + '</span></div>' +
    (entry.videoId ? '<div style="margin-top:16px"><button class="btn" onclick="closeWordDialog();openVideoDialog(\'' + entry.videoId + '\', \'' + escapeAttr(entry.word) + '\', \'' + escapeAttr(entry.meaning) + '\', \'' + grade + '\', \'' + escapeAttr(entry.category) + '\')">' + icon('play', 17) + 'Lihat video konteks (mulai ' + videoTime(entry.start || 0) + ')</button></div>' : '');

  dialog.showModal();
}

function closeWordDialog() {
  document.getElementById('word-dialog').close();
}

function openVideoDialog(videoId, title, description, grade, topic) {
  const dialog = document.getElementById('video-dialog');
  const content = document.getElementById('video-dialog-content');
  const player = location.protocol === 'file:'
    ? '<p>Buka BahasaKita melalui localhost atau server web untuk memutar video di halaman ini.</p>'
    : '<div class="youtube-frame"><iframe src="' + youtubeEmbedUrl(videoId) + '" title="Video ' + grade + ': ' + title + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';

  content.innerHTML =
    '<div class="inline-tags"><span class="tag">' + grade + ' · ' + topic + '</span></div>' +
    '<h2>' + title + '</h2>' +
    '<p class="home-video-description">' + description + '</p>' +
    player;

  dialog.showModal();
}

function closeVideoDialog() {
  document.getElementById('video-dialog').close();
}

document.getElementById('video-dialog').addEventListener('close', function () {
  if (!this.open) {
    document.getElementById('video-dialog-content').replaceChildren();
  }
});

// Close dialogs on backdrop click
document.addEventListener('click', function (e) {
  if (e.target.tagName === 'DIALOG') {
    e.target.close();
  }
});

// ==================== UTILITIES ====================
function escapeAttr(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
