/* =========================================================
   BILBY — интерактивность
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. ТЕМА (кнопка + авто по скроллу) ---------- */
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');

  const applyTheme = (dark) => {
    body.classList.toggle('dark', dark);
    themeToggle.textContent = dark ? '☀️' : '🌙';
  };

  // Начальная тема — из localStorage
  const savedTheme = localStorage.getItem('bilby-theme');
  applyTheme(savedTheme === 'dark');

  themeToggle.addEventListener('click', () => {
    const dark = !body.classList.contains('dark');
    applyTheme(dark);
    localStorage.setItem('bilby-theme', dark ? 'dark' : 'light');
  });

  /* ---------- 2. КУРСОР-ПТЕНЕЦ + свечение ---------- */
  const chick = document.getElementById('cursorChick');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;

  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

  (function follow() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    chick.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(follow);
  })();

  /* ---------- 3. ПАРАЛЛАКС ГЕРОЯ ---------- */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    parallaxEls.forEach(el => {
      const speed = parseFloat(el.dataset.parallax);
      el.style.transform = `translateY(${y * speed * 0.15}px)`;
    });
  });

  /* ---------- 4. REVEAL ПРИ СКРОЛЛЕ ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- 5. АВТО-СМЕНА ТЕМЫ ПО СЕКЦИЯМ ---------- */
  const darkSections = ['dangers', 'finale'];
  const themeByScroll = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio > 0.35) {
        if (darkSections.includes(e.target.id)) {
          applyTheme(true);
        } else if (e.target.id === 'opinions' || e.target.id === 'story') {
          applyTheme(false);
        }
      }
    });
  }, { threshold: [0.35, 0.6] });

  ['story', 'characters', 'dangers', 'finale', 'opinions'].forEach(id => {
    const el = document.getElementById(id);
    if (el) themeByScroll.observe(el);
  });

  /* ---------- 6. СЛАЙДЕР ОПАСНОСТЕЙ ---------- */
  const slides = document.querySelectorAll('.slide');
  const dotsWrap = document.getElementById('dots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  let current = 0;

  // точки
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' is-active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll('.dot');

  function goTo(index) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');

    // ВАУ: тряска при «опасных» слайдах
    const level = parseInt(slides[current].dataset.level, 10);
    if (level >= 4) {
      document.querySelector('.slider__stage').classList.remove('shake');
      void document.querySelector('.slider__stage').offsetWidth;
      document.querySelector('.slider__stage').classList.add('shake');
    }
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // авто-переключение каждые 4.5 сек
  let autoSlide = setInterval(() => goTo(current + 1), 4500);
  document.querySelector('.slider').addEventListener('mouseenter', () => clearInterval(autoSlide));
  document.querySelector('.slider').addEventListener('mouseleave', () => {
    autoSlide = setInterval(() => goTo(current + 1), 4500);
  });

  // свайп на мобилке
  let touchStartX = 0;
  const stage = document.getElementById('sliderStage');
  stage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) goTo(current + (diff < 0 ? 1 : -1));
  });

  /* ---------- 7. ЗВЁЗДЫ В ФОРМЕ ---------- */
  const starEls = document.querySelectorAll('#stars span');
  let rating = 0;
  starEls.forEach(star => {
    star.addEventListener('mouseenter', () => highlightStars(star.dataset.value));
    star.addEventListener('mouseleave', () => highlightStars(rating));
    star.addEventListener('click', () => {
      rating = parseInt(star.dataset.value, 10);
      highlightStars(rating);
    });
  });
  function highlightStars(val) {
    starEls.forEach(s => s.classList.toggle('active', s.dataset.value <= val));
  }

  /* ---------- 8. ФОРМА МНЕНИЙ + localStorage ---------- */
  const form = document.getElementById('opinionForm');
  const list = document.getElementById('opinionsList');
  const emptyNote = document.getElementById('emptyNote');
  const STORAGE_KEY = 'bilby-opinions';

  function loadOpinions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveOpinions(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function renderOpinions() {
    const data = loadOpinions();
    list.querySelectorAll('.opinion-item').forEach(n => n.remove());

    if (data.length === 0) {
      emptyNote.style.display = 'block';
      return;
    }
    emptyNote.style.display = 'none';

    data.forEach(op => {
      const item = document.createElement('article');
      item.className = 'opinion-item';
      const date = new Date(op.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
      item.innerHTML = `
        <div class="opinion-item__head">
          <span class="opinion-item__name">${escapeHtml(op.name)}${op.grade ? ' · ' + escapeHtml(op.grade) : ''}</span>
          <span class="opinion-item__meta">${date}</span>
        </div>
        <div class="opinion-item__stars">${'★'.repeat(op.rating)}${'☆'.repeat(5 - op.rating)}</div>
        <p class="opinion-item__text">${escapeHtml(op.text)}</p>
      `;
      list.appendChild(item);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const grade = form.grade.value.trim();
    const text = form.text.value.trim();

    if (!name || !text || rating === 0) {
      alert('Пожалуйста, укажи имя, мнение и поставь оценку звёздами.');
      return;
    }

    const op = { name, grade, text, rating, date: Date.now() };
    const arr = loadOpinions();
    arr.unshift(op);
    saveOpinions(arr);
    renderOpinions();
    form.reset();
    rating = 0;
    highlightStars(0);

    launchConfetti();
    document.getElementById('opinionsList').firstElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  renderOpinions();

  /* ---------- 9. КОНФЕТТИ ---------- */
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function launchConfetti() {
    const colors = ['#e76f51', '#f4a261', '#ffb703', '#2a9d8f', '#8ecae6', '#ffffff'];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1
      });
    }
  }

  function tickConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.008;

      if (p.life <= 0 || p.y > canvas.height + 50) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    requestAnimationFrame(tickConfetti);
  }
  tickConfetti();

  /* ---------- 10. ПЛАВНАЯ ПРОКРУТКА (для всех #hash) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});