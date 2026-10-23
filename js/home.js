/* MOMAR · homepage: hero slideshow and Kaduna capacity bar (Wow 2).
   The supply map (Wow 3) is pure CSS, triggered by the shared reveal observer in main.js. */
(() => {
  const { $, $$, reduce } = window.NS;

  /* ---------------- Hero slideshow: slow zoom on each photo, label changes with it ----------------
     Autoplays; visitors can pause, and a "reduce motion" system setting starts it paused.
     Pauses while the hero is off screen or the tab is hidden. */
  const hero = $('[data-slideshow]');
  const slides = hero ? $$('.p-slide', hero) : [];
  if (slides.length > 1) {
    const dots = $$('.p-dots button:not([data-pause])', hero);
    const pauseBtn = $('[data-pause]', hero);
    const kicker = $('[data-slide-kicker]', hero);
    const HOLD = 6000;
    hero.style.setProperty('--hold', HOLD + 'ms');
    let i = 0, timer = 0, userPaused = reduce, offscreen = false;
    const running = () => !userPaused && !offscreen;
    const show = n => {
      const prev = i;
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.classList.toggle('on', k === i);
        s.classList.toggle('out', k === prev && k !== i);
      });
      dots.forEach((d, k) => {
        d.setAttribute('aria-current', k === i);
        const bar = d.firstElementChild; bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      });
      if (kicker) {
        kicker.classList.remove('swap'); void kicker.offsetWidth;
        kicker.textContent = slides[i].dataset.kicker; kicker.classList.add('swap');
      }
      clearTimeout(timer);
      if (running()) timer = setTimeout(() => show(i + 1), HOLD);
    };
    const sync = () => {
      pauseBtn.setAttribute('aria-pressed', userPaused);
      pauseBtn.textContent = userPaused ? 'Play' : 'Pause';
      hero.classList.toggle('paused', !running());
    };
    pauseBtn.addEventListener('click', () => { userPaused = !userPaused; sync(); show(i); });
    dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
    const setOffscreen = v => { if (v === offscreen) return; offscreen = v; sync(); clearTimeout(timer); if (!v) show(i); };
    new IntersectionObserver(([e]) => setOffscreen(!e.isIntersecting)).observe(hero);
    document.addEventListener('visibilitychange', () => setOffscreen(document.hidden));
    sync();
    show(0);
  }

  /* ---------------- Featured projects: background photos of the three projects, one after another ---------------- */
  const band = $('[data-band-slides]');
  if (band && !reduce) {
    const imgs = $$('img', band);
    let k = 0, timer = 0;
    const next = () => { imgs[k].classList.remove('on'); k = (k + 1) % imgs.length; imgs[k].classList.add('on'); };
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = setInterval(next, 5000);
    }).observe(band);
  }

  /* ---------------- Wow 2 · 464,000 L counted into eight 58,000 L tanks ---------------- */
  const fig = $('[data-capacity]');
  if (fig) {
    const out = $('[data-litres]', fig), segs = $$('.capbar i', fig);
    const total = +fig.dataset.capacity;
    const paint = p => {
      out.textContent = Math.round(total * p).toLocaleString('en-NG');
      segs.forEach((s, k) => s.style.setProperty('--f', Math.min(1, Math.max(0, p * segs.length - k)).toFixed(3)));
    };
    if (reduce) { paint(1); return; }
    paint(0);
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 2600;
      const tick = t => {
        const p = Math.min(1, (t - t0) / dur);
        paint(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: .5 }).observe(fig);
  }
})();
