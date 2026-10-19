/* MOMAR · homepage: hero photo reel (Wow 1) and Kaduna capacity bar (Wow 2).
   The supply map (Wow 3) is pure CSS, triggered by the shared reveal observer in main.js. */
(() => {
  const { $, $$, reduce } = window.NS;

  /* ---------------- Wow 1 · real project photographs, slow cross-fade ---------------- */
  const hero = $('.hero');
  const slides = $$('.slide', hero);
  const reel = $('.reel', hero);
  if (slides.length > 1 && reel) {
    const bars = $$('.reel-bars button', reel);
    const title = $('[data-cap-t]', reel), sub = $('[data-cap-s]', reel);
    const HOLD = 7000;
    const pauseBtn = $('[data-reel-pause]', reel);
    /* autoplays by default; visitors can pause. Only a "reduce motion" system setting starts it paused */
    let userPaused = reduce;
    let i = 0, timer = 0, paused = false;
    reel.style.setProperty('--t', HOLD + 'ms');
    const syncPauseBtn = () => {
      pauseBtn.setAttribute('aria-pressed', userPaused);
      pauseBtn.textContent = userPaused ? 'Play' : 'Pause';
      reel.classList.toggle('paused', userPaused || paused);
    };
    pauseBtn.addEventListener('click', () => { userPaused = !userPaused; syncPauseBtn(); show(i); });
    const show = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('on', k === i));
      bars.forEach((b, k) => {
        b.classList.toggle('on', k === i);
        b.classList.toggle('done', k < i);
        b.setAttribute('aria-current', k === i);
        const span = b.firstElementChild; span.style.animation = 'none'; void span.offsetWidth; span.style.animation = '';
      });
      title.textContent = slides[i].dataset.title;
      sub.textContent = slides[i].dataset.sub;
      clearTimeout(timer);
      if (!userPaused && !paused) timer = setTimeout(() => show(i + 1), HOLD);
    };
    bars.forEach((b, k) => b.addEventListener('click', () => show(k)));
    /* pause while the hero is off screen or the tab is hidden */
    const setPaused = p => {
      if (p === paused) return;
      paused = p; syncPauseBtn();
      clearTimeout(timer);
      if (!p) show(i);
    };
    new IntersectionObserver(([e]) => setPaused(!e.isIntersecting)).observe(hero);
    document.addEventListener('visibilitychange', () => setPaused(document.hidden));
    syncPauseBtn();
    show(0);
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
