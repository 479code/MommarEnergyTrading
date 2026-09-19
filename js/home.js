/* Night Shift — homepage only (L3): 3D tank farm, pinned storage gauge, scroll text effects. */
(() => {
  const { $, $$, reduce } = window.NS;
  const css = getComputedStyle(document.documentElement);
  const token = n => css.getPropertyValue(n).trim();
  const small = matchMedia('(max-width: 760px)').matches;
  const lowPower = (navigator.hardwareConcurrency || 8) < 4;

  /* ---------------- Wow 1 · real-time 3D tank farm ---------------- */
  const canvas = $('#farm'), fallback = $('.hero .fallback');
  /* The still image and the 3D engine are both loaded on demand, so phones never download
     Three.js and 3D-capable desktops never download the still image. */
  const showFallback = () => {
    canvas.hidden = true;
    if (!fallback.getAttribute('src')) {
      if (fallback.dataset.srcset) { fallback.srcset = fallback.dataset.srcset; fallback.sizes = '100vw'; }
      fallback.src = fallback.dataset.src;
    }
    fallback.hidden = false;
  };
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  const start3d = () => { try { initFarm(); } catch (e) { console.warn(e); showFallback(); } };
  if (webgl && !reduce && !small && !lowPower && window.THREE) {
    start3d(); // already on the page (single-file share build)
  } else if (webgl && !reduce && !small && !lowPower) {
    const lib = document.createElement('script');
    lib.src = 'vendor/three.min.js';
    lib.onload = () => { try { initFarm(); } catch (e) { console.warn(e); showFallback(); } };
    lib.onerror = showFallback;
    document.body.append(lib);
  } else {
    showFallback();
  }

  function initFarm() {
    const T = THREE, C = n => new T.Color(token(n));
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    const scene = new T.Scene();
    scene.background = C('--bg');
    scene.fog = new T.FogExp2(C('--bg'), 0.011);
    const camera = new T.PerspectiveCamera(36, 1, 0.1, 500);

    scene.add(new T.HemisphereLight(C('--moon'), C('--ground'), 0.7));
    scene.add(new T.AmbientLight(C('--steel'), 0.3));
    const moon = new T.DirectionalLight(C('--moon'), 1.3);
    moon.position.set(-40, 60, -30);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    Object.assign(moon.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 200 });
    scene.add(moon);

    const lampLight = C('--lamp'), hot = C('--accent'), red = C('--signal');
    const mat = {
      steel: new T.MeshStandardMaterial({ color: C('--tank'), roughness: .55, metalness: .18 }),
      dark: new T.MeshStandardMaterial({ color: C('--surface-alt'), roughness: .85, metalness: .3 }),
      slab: new T.MeshStandardMaterial({ color: C('--surface'), roughness: .95 }),
      pipe: new T.MeshStandardMaterial({ color: C('--steel'), roughness: .35, metalness: .75 }),
      red: new T.MeshStandardMaterial({ color: red, emissive: red, emissiveIntensity: .35, roughness: .5 }),
      lamp: new T.MeshBasicMaterial({ color: lampLight })
    };

    const ground = new T.Mesh(new T.PlaneGeometry(600, 600), new T.MeshStandardMaterial({ color: C('--ground'), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const grid = new T.GridHelper(220, 110, C('--grid'), C('--grid'));
    grid.material.transparent = true; grid.material.opacity = .4; grid.position.y = .02; scene.add(grid);

    /* soft glow sprite (white mask, tinted per sprite) */
    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.2, 'rgba(255,255,255,.6)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
      return new T.CanvasTexture(c);
    })();
    const glow = (x, y, z, s = 3, color = lampLight, opacity = .9) => {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending }));
      sp.position.set(x, y, z); sp.scale.set(s, s, 1); scene.add(sp); return sp;
    };
    const box = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };

    /* containment bund */
    box(40, .3, 40, mat.slab, 0, .15, 0);
    box(40.6, 1, .35, mat.dark, 0, .5, 20); box(40.6, 1, .35, mat.dark, 0, .5, -20);
    box(.35, 1, 40.6, mat.dark, 20, .5, 0); box(.35, 1, 40.6, mat.dark, -20, .5, 0);

    /* four storage tanks */
    const R = 5.2, H = 8;
    [[-9.5, -9.5], [9.5, -9.5], [-9.5, 9.5], [9.5, 9.5]].forEach(([x, z], i) => {
      const g = new T.Group(); g.position.set(x, .3, z); scene.add(g);
      const shell = new T.Mesh(new T.CylinderGeometry(R, R, H, 72), mat.steel); shell.position.y = H / 2; shell.castShadow = shell.receiveShadow = true; g.add(shell);
      const roof = new T.Mesh(new T.ConeGeometry(R * 1.01, 1.2, 72), mat.steel); roof.position.y = H + .6; roof.castShadow = true; g.add(roof);
      [H * .74, H * .81].forEach(y => { const b = new T.Mesh(new T.CylinderGeometry(R + .04, R + .04, .3, 72, 1, true), mat.red); b.position.y = y; g.add(b); });
      const rail = new T.Mesh(new T.TorusGeometry(R * .97, .06, 6, 72), mat.dark); rail.rotation.x = Math.PI / 2; rail.position.y = H + 1; g.add(rail);
      for (let s = 0; s < 26; s++) {
        const a = s * .12 + i * 1.7, step = new T.Mesh(new T.BoxGeometry(1, .08, .55), mat.dark);
        step.position.set(Math.cos(a) * (R + .55), .4 + s * (H / 26), Math.sin(a) * (R + .55)); step.rotation.y = -a; g.add(step);
      }
      const lamp = new T.Mesh(new T.SphereGeometry(.16, 10, 10), mat.lamp); lamp.position.y = H + 1.5; g.add(lamp);
      glow(x, H + 1.9, z, 4.2);
      const pl = new T.PointLight(lampLight, 1.4, 34, 1.6); pl.position.set(x * 1.25, H + 3, z * 1.25); scene.add(pl);
    });

    /* pipe racks + product flow pulses */
    const runs = [];
    const pipe = (a, b, r = .17) => {
      const A = new T.Vector3(...a), B = new T.Vector3(...b);
      const m = new T.Mesh(new T.CylinderGeometry(r, r, A.distanceTo(B), 14), mat.pipe);
      m.position.copy(A).lerp(B, .5);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize());
      m.castShadow = true; scene.add(m); runs.push([A, B]);
    };
    [-.6, 0, .6].forEach(o => { pipe([-34, 1.5, o], [46, 1.5, o]); pipe([o, 2.3, -34], [o, 2.3, 34]); });
    for (let x = -32; x <= 44; x += 4) { box(.18, 1.5, 1.8, mat.dark, x, .75, 0); }
    for (let z = -32; z <= 32; z += 4) { if (Math.abs(z) > 1) box(1.8, 2.3, .18, mat.dark, 0, 1.15, z); }

    /* loading gantry */
    box(14, .45, 8, mat.dark, 42, 6, 0);
    [[36, -3.6], [48, -3.6], [36, 3.6], [48, 3.6]].forEach(([x, z]) => box(.35, 6, .35, mat.pipe, x, 3, z));
    [38, 42, 46].forEach(x => { glow(x, 5.4, 0, 3.4, lampLight, .7); });
    const pool = new T.Mesh(new T.CircleGeometry(9, 48), new T.MeshBasicMaterial({ color: lampLight, transparent: true, opacity: .05, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(42, .05, 0); scene.add(pool);

    /* perimeter lamp posts */
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2, x = Math.cos(a) * 34, z = Math.sin(a) * 34;
      box(.2, 7, .2, mat.pipe, x, 3.5, z);
      glow(x, 7.2, z, 3, lampLight, .75);
    }

    /* distant flare stack — the unmistakable oil & gas silhouette */
    box(.8, 38, .8, mat.dark, -85, 19, -110);
    const flame = glow(-85, 40, -110, 14, hot, .95), flameCore = glow(-85, 39.5, -110, 6, lampLight, .9);

    const pulses = Array.from({ length: 26 }, (_, i) => ({ run: runs[i % runs.length], t: Math.random(), speed: .035 + Math.random() * .05, s: glow(0, 0, 0, 1.3, hot, .95) }));

    /* camera: slow orbit, pointer parallax, scroll dolly */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; }, { passive: true });
    let visible = true, scrollP = 0;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
    addEventListener('scroll', () => { scrollP = Math.min(1, scrollY / innerHeight); }, { passive: true });

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.setViewOffset(w, h, -w * .17, -h * .04, w, h); camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(canvas); resize();

    /* adaptive quality: step down on slow GPUs, fall back to the still image if still too slow */
    let frames = 0, slowSum = 0, tier = 0, stopped = false;
    const force = /[?&]force3d\b/.test(location.search); // design review only
    const adapt = raw => {
      if (force || tier > 1 || frames++ < 10) return;
      slowSum += raw;
      if (frames < 50) return;
      const avg = slowSum / 40; frames = 10; slowSum = 0;
      if (avg > .12 || (tier === 1 && avg > .05)) { stopped = true; showFallback(); renderer.dispose(); document.documentElement.classList.remove('webgl-on'); }
      else if (avg > .034 && tier === 0) { tier = 1; renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); resize(); }
      else tier = 2;
    };

    const clock = new T.Clock();
    const frame = () => {
      if (stopped) return;
      requestAnimationFrame(frame);
      if (!visible) { clock.getDelta(); return; }
      const raw = clock.getDelta(); adapt(raw);
      const dt = Math.min(raw, .05), t = clock.elapsedTime;
      mouse.x += (mouse.tx - mouse.x) * .04; mouse.y += (mouse.ty - mouse.y) * .04;
      const ang = -.72 + t * .025 + mouse.x * .35;
      const rad = 74 - scrollP * 16, hgt = 25 + scrollP * 26 - mouse.y * 6;
      camera.position.set(Math.cos(ang) * rad + 10, hgt, Math.sin(ang) * rad);
      camera.lookAt(-6 + scrollP * 6, 3, 0);
      pulses.forEach(p => { p.t = (p.t + p.speed * dt) % 1; p.s.position.copy(p.run[0]).lerp(p.run[1], p.t); });
      const flick = .85 + Math.sin(t * 9) * .06 + Math.sin(t * 23) * .04;
      flame.scale.set(14 * flick, 18 * flick, 1); flameCore.material.opacity = .7 + flick * .2;
      renderer.render(scene, camera);
    };
    frame();
    document.documentElement.classList.add('webgl-on');
  }

  /* HUD: rotating real facts (never fake "live" levels) */
  const hud = $('[data-hud]');
  if (hud) {
    const facts = [['Status', 'Under construction'], ['Agreement', '15-year lease'], ['Near term', 'Jet A1 depot'], ['Long term', 'ATK · AGO · DPK · PMS']];
    let i = 0;
    const show = () => {
      const [k, val] = facts[i++ % facts.length];
      hud.querySelector('[data-k]').textContent = k;
      hud.querySelector('[data-v]').textContent = val;
      hud.style.setProperty('--lvl', ((i - 1) % facts.length + 1) / facts.length * 100 + '%');
    };
    show(); if (!reduce) setInterval(show, 3200);
  }

  /* ---------------- Wow 2 · pinned Kaduna storage gauge ---------------- */
  const storage = $('.storage');
  if (storage) {
    const tanks = $$('.tank', storage), steps = $$('.steps li', storage), counter = $('[data-litres]', storage);
    const paint = p => {
      counter.textContent = Math.round(464000 * p).toLocaleString('en-NG');
      tanks.forEach((tk, i) => {
        const f = Math.max(0, Math.min(1, p * 8 - i));
        tk.style.setProperty('--f', f.toFixed(3)); tk.classList.toggle('full', f > .55);
        tk.querySelector('.vol').textContent = Math.round(58000 * f).toLocaleString('en-NG') + ' L';
      });
      const idx = Math.min(steps.length - 1, Math.floor(p * steps.length * .999));
      steps.forEach((s, i) => s.classList.toggle('on', i <= idx));
    };
    paint(0);
    if (window.gsap && window.ScrollTrigger && !reduce && !small) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.create({ trigger: storage, start: 'top top', end: 'bottom bottom', scrub: .6, onUpdate: self => paint(self.progress) });
    } else if (reduce) {
      paint(1);
    } else {
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return; io.disconnect();
        const t0 = performance.now();
        const run = t => { const p = Math.min(1, (t - t0) / 2600); paint(1 - Math.pow(1 - p, 3)); if (p < 1) requestAnimationFrame(run); };
        requestAnimationFrame(run);
      }, { threshold: .4 });
      io.observe(storage);
    }
  }

  if (!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  /* Hero copy drifts away as the camera rises */
  gsap.to('.hero .wrap', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.from('.hud', { opacity: 0, y: 20, duration: 1.2, delay: 1, ease: 'expo.out' });

  /* ScrollFloat · section headings */
  $$('[data-split="float"]').forEach(el => {
    gsap.fromTo($$('.w > span', el), { yPercent: 120, scaleY: 1.8, opacity: 0, transformOrigin: '50% 0%' },
      { yPercent: 0, scaleY: 1, opacity: 1, ease: 'back.out(1.4)', stagger: .04, scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 55%', scrub: 1 } });
  });

  /* ScrollReveal · body copy lights up word by word */
  $$('.reveal-words').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="rw">${w}</span>`).join(' ');
    gsap.to($$('.rw', el), { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true } });
  });

  /* Bento + panels entrance */
  ScrollTrigger.batch('.cell', { start: 'top 88%', onEnter: els => gsap.from(els, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08 }) });
  gsap.from('.panel', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.panels', start: 'top 85%' } });
})();
