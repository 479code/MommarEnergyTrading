/* MOMAR · Night Shift — shared behaviour for every page (L2 baseline). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  window.NS = { $, $$, reduce, fine };
  if (reduce) $$('animateMotion').forEach(a => a.remove()); // supply-map tankers stay parked

  /* Header: transparent over the hero, solid once scrolled */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const menuBtn = $('.menu-btn'), nav = $('.nav');
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'Close' : 'Menu';
    header.classList.add('scrolled');
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav?.classList.contains('open')) menuBtn.click();
  });

  /* Split headings into words for staggered entrances */
  $$('[data-split]').forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = part;
            w.append(i); frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      });
    };
    walk(el);
    $$('.w > span', el).forEach((s, i) => s.style.setProperty('--i', i));
    el.classList.add('split');
  });
  /* CSS-driven so the entrance never waits on a busy main thread (e.g. WebGL warm-up) */
  const splitIn = (el, delay = 0) => {
    if (reduce) return;
    el.style.setProperty('--d', delay + 's');
    el.classList.add('play');
  };
  window.NS.splitIn = splitIn;
  $$('[data-split="load"]').forEach(el => splitIn(el, 0.25));

  /* Reveal on scroll */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    if (en.target.matches('[data-split="scroll"]')) splitIn(en.target);
    if (en.target.matches('.art')) en.target.classList.add('drawn');
    if (en.target.matches('.map')) $$('animateMotion', en.target).forEach((a, i) => setTimeout(() => {
      a.parentElement.style.opacity = 1; a.beginElement(); // each tanker runs its route once (no endless motion)
    }, 2600 + i * 400));
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('.rv, .stag, .angle-in, [data-split="scroll"]').forEach(el => io.observe(el));

  /* Line illustrations draw themselves once visible */
  $$('.art').forEach(art => {
    $$('svg *', art).forEach(el => { if (el.getTotalLength) { try { el.style.setProperty('--len', Math.ceil(el.getTotalLength()) + 1); } catch (e) {} } });
    reduce ? art.classList.add('drawn') : io.observe(art);
  });

  /* Count-up numbers */
  const fmt = n => Math.round(n).toLocaleString('en-NG');
  const countIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, to = +el.dataset.count;
    countIO.unobserve(el);
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* Magnetic CTAs (pointer devices only, rAF throttled) */
  if (fine && !reduce) $$('[data-magnet]').forEach(btn => {
    let raf = 0;
    btn.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .28).toFixed(1) + 'px');
        btn.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .38).toFixed(1) + 'px');
      });
    });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px'); });
  });

  /* Spotlight cards */
  if (fine) $$('.cell').forEach(cell => {
    let raf = 0;
    cell.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = cell.getBoundingClientRect();
        cell.style.setProperty('--x', (e.clientX - r.left) + 'px');
        cell.style.setProperty('--y', (e.clientY - r.top) + 'px');
      });
    });
  });

  /* The clever detail: live Abuja clock that knows which shift is on */
  const shift = $('[data-shift]');
  if (shift) {
    const tick = () => {
      const hm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' }).format(new Date());
      const h = +hm.slice(0, 2);
      shift.innerHTML = `<i></i><span>Abuja <b>${hm} WAT</b> · ${h >= 19 || h < 6 ? 'Night shift' : 'Day shift'} on</span>`;
    };
    tick(); setInterval(tick, 20000);
  }

  /* In-page index highlight (capabilities page) */
  const links = $$('.cap-index a');
  if (links.length) {
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const capIO = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('on', a === map.get(en.target.id)));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('.cap').forEach(c => capIO.observe(c));
  }

  /* Tabs (keyboard: arrow keys move between tabs) */
  $$('[data-tabs]').forEach(box => {
    const tabs = $$('[role=tab]', box);
    const select = tab => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        const next = tabs[(i + d + tabs.length) % tabs.length];
        select(next); next.focus();
      });
    });
    select(tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0]);
  });

  /* Tank picker (Kaduna page) */
  const picker = $('.picker');
  if (picker) {
    const line = $('.readline');
    picker.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', picker).forEach(x => x.setAttribute('aria-pressed', x === b));
      line.textContent = `${b.dataset.id} · Jet A-1 · 58,000 litres capacity · tank ${$$("button", picker).indexOf(b) + 1} of 8`;
    });
  }

  /* Enquiry flow (contact page): choose interest → details → review → send.
     With a form endpoint configured (build.py FORM_ENDPOINT) the enquiry is posted to it;
     without one, the review step prepares an email for the visitor's own mail app. */
  const flow = $('[data-enquiry]');
  if (flow) {
    const steps = $$('[data-step]', flow), form = $('form', flow);
    const endpoint = (form.dataset.endpoint || '').trim();
    const submitBtn = $('[data-submit]', flow), mailBtn = $('[data-send]', flow), error = $('[data-error]', flow);
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let interest = new URLSearchParams(location.search).get('interest') || '';
    submitBtn.hidden = !endpoint; mailBtn.hidden = !!endpoint;
    $$('[data-mode]', flow).forEach(el => { el.hidden = el.dataset.mode !== (endpoint ? 'online' : 'mail'); });
    const show = n => {
      steps.forEach(s => { s.hidden = s.dataset.step !== String(n); });
      $$('[data-interest-label]', flow).forEach(el => el.textContent = interest);
      const first = n === 4 ? $('[data-step="4"]', flow) : $(`[data-step="${n}"] input, [data-step="${n}"] [data-submit]:not([hidden]), [data-step="${n}"] a[data-send]:not([hidden])`, flow);
      if (first && n !== 1) first.focus({ preventScroll: true });
    };
    $$('[data-choice]', flow).forEach(b => b.addEventListener('click', () => { interest = b.dataset.choice; show(2); }));
    $$('[data-back]', flow).forEach(b => b.addEventListener('click', () => show(+b.dataset.back)));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = Object.fromEntries(new FormData(form));
      $('[data-summary]', flow).innerHTML = esc(`${interest}\n${d.name} · ${d.email}${d.organisation ? '\n' + d.organisation : ''}${d.phone ? '\n' + d.phone : ''}\n\n${d.details}`);
      const body = `Area of interest: ${interest}\nName: ${d.name}\nEmail: ${d.email}\nOrganisation: ${d.organisation}\nPhone: ${d.phone}\n\nProject details:\n${d.details}`;
      mailBtn.href = `mailto:info@momarenergy.com?subject=${encodeURIComponent('Project enquiry: ' + interest)}&body=${encodeURIComponent(body)}`;
      error.hidden = true;
      show(3);
    });
    submitBtn.addEventListener('click', async () => {
      form.elements.interest.value = interest;
      const data = new FormData(form);
      if (data.get('_gotcha') || data.get('bot-field')) { show(4); return; } // bot filled the hidden field: pretend success, send nothing
      const netlify = form.dataset.provider === 'netlify';
      if (netlify && form.elements.subject) form.elements.subject.value = 'Project enquiry: ' + interest; // Netlify email subject
      if (netlify) data.set('subject', 'Project enquiry: ' + interest);
      else data.append('_subject', 'Project enquiry: ' + interest);
      const label = submitBtn.innerHTML;
      submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; error.hidden = true;
      try {
        const res = await fetch(endpoint, netlify
          ? { method: 'POST', body: new URLSearchParams(data).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          : { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        show(4);
      } catch (err) {
        error.hidden = false;
      } finally {
        submitBtn.disabled = false; submitBtn.innerHTML = label;
      }
    });
    show(interest ? 2 : 1);
  }

  /* Single-step forms (supplier registration). Same delivery rules as the enquiry flow:
     Netlify / form endpoint when configured, otherwise an email prepared in the visitor's mail app. */
  $$('form[data-simple-form]').forEach(form => {
    const box = form.closest('[data-form-box]'), done = $('[data-done]', box), error = $('[data-error]', box);
    const endpoint = (form.dataset.endpoint || '').trim(), netlify = form.dataset.provider === 'netlify';
    const btn = $('button[type=submit]', form);
    $$('[data-mode]', box).forEach(el => { el.hidden = el.dataset.mode !== (endpoint ? 'online' : 'mail'); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const picked = $$('input[name=category]:checked', form).map(c => c.value);
      form.elements.categories.value = picked.join(', ') || 'Not specified';
      const data = new FormData(form);
      data.delete('category');
      if (data.get('_gotcha') || data.get('bot-field')) { form.hidden = true; done.hidden = false; return; }
      const subject = (form.dataset.subject || 'Website form') + ': ' + (data.get('company') || '');
      if (!endpoint) {
        const body = [...data.entries()].filter(([k]) => !/^(form-name|subject|bot-field|_gotcha)$/.test(k)).map(([k, v]) => `${k}: ${v}`).join('\n');
        location.href = `mailto:info@momarenergy.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        return;
      }
      if (netlify) data.set('subject', subject); else data.append('_subject', subject);
      const label = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Sending…'; error.hidden = true;
      try {
        const res = await fetch(endpoint, netlify
          ? { method: 'POST', body: new URLSearchParams(data).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          : { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
        form.reset(); form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
      } catch (err) {
        error.hidden = false;
      } finally {
        btn.disabled = false; btn.innerHTML = label;
      }
    });
  });


  /* Project page hero: the project's photographs slide in one after another */
  $$('[data-hero-slides]').forEach(hero => {
    const imgs = $$('.ph-slides img', hero);
    if (imgs.length < 2 || reduce) return;
    let i = 0, timer = 0;
    const next = () => {
      const prev = i;
      i = (i + 1) % imgs.length;
      imgs.forEach((im, k) => { im.classList.toggle('on', k === i); im.classList.toggle('out', k === prev); });
    };
    const run = on => { clearInterval(timer); if (on) timer = setInterval(next, 5500); };
    new IntersectionObserver(([e]) => run(e.isIntersecting && !document.hidden)).observe(hero);
    document.addEventListener('visibilitychange', () => run(!document.hidden));
  });

  /* Photo viewer: any image marked data-lightbox opens full screen; arrows, swipe and Esc */
  const shots = $$('img[data-lightbox]');
  if (shots.length) {
    const biggest = img => {
      const set = (img.getAttribute('srcset') || '').split(',').map(s => s.trim().split(/\s+/)).filter(p => p[0]);
      set.sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
      return set.length ? set[0][0] : img.currentSrc || img.src;
    };
    const caption = img => img.closest('figure')?.querySelector('figcaption')?.textContent || img.alt;
    let box = null, index = 0, opener = null;
    const show = n => {
      index = (n + shots.length) % shots.length;
      const img = $('img', box);
      img.src = biggest(shots[index]);
      img.alt = shots[index].alt;
      $('p', box).textContent = `${caption(shots[index])} · ${index + 1} of ${shots.length}`;
    };
    const close = () => {
      box.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => { box.remove(); box = null; }, 200);
      document.body.style.overflow = '';
      opener?.focus();
    };
    const onKey = e => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'Tab') { // keep focus inside the viewer
        const btns = $$('button', box), first = btns[0], last = btns[btns.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const open = n => {
      opener = document.activeElement;
      box = document.createElement('div');
      box.className = 'lb';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Photo viewer');
      box.innerHTML = '<button type="button" class="lb-close" aria-label="Close">×</button><button type="button" class="lb-prev" aria-label="Previous photo">←</button><img alt=""><button type="button" class="lb-next" aria-label="Next photo">→</button><p></p>';
      document.body.append(box);
      document.body.style.overflow = 'hidden';
      $('.lb-close', box).addEventListener('click', close);
      $('.lb-prev', box).addEventListener('click', () => show(index - 1));
      $('.lb-next', box).addEventListener('click', () => show(index + 1));
      box.addEventListener('click', e => { if (e.target === box) close(); });
      let x0 = null;
      box.addEventListener('pointerdown', e => { x0 = e.clientX; });
      box.addEventListener('pointerup', e => {
        if (x0 === null) return;
        const dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      });
      document.addEventListener('keydown', onKey);
      show(n);
      requestAnimationFrame(() => box.classList.add('open'));
      $('.lb-close', box).focus();
    };
    shots.forEach((img, k) => {
      const fig = img.closest('figure') || img;
      fig.setAttribute('tabindex', '0');
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', `View photo: ${img.alt}`);
      fig.addEventListener('click', () => open(k));
      fig.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(k); } });
    });
  }

  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
