  (function(){
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- Publication filter (with live counts) ---- */
    const buttons = document.querySelectorAll('.pub-filter button');
    const items = document.querySelectorAll('.pub-item');
    buttons.forEach(btn=>{
      const f = btn.dataset.filter;
      const n = (f==='all') ? items.length
        : document.querySelectorAll('.pub-item[data-type="'+f+'"]').length;
      const c = document.createElement('span');
      c.className = 'count'; c.textContent = '('+n+')';
      btn.appendChild(c);
      btn.setAttribute('aria-pressed', btn.classList.contains('active'));
      btn.addEventListener('click', ()=>{
        buttons.forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed','true');
        items.forEach(item=>{
          item.style.display = (f==='all' || item.dataset.type===f) ? '' : 'none';
        });
      });
    });

    /* ---- Mobile menu ---- */
    const menuBtn = document.getElementById('menu-btn');
    const nav = document.getElementById('site-nav');
    if(menuBtn && nav){
      menuBtn.addEventListener('click', ()=>{
        const open = nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open);
        menuBtn.textContent = open ? 'Close' : 'Menu';
      });
      nav.querySelectorAll('a').forEach(a=>{
        a.addEventListener('click', ()=>{
          nav.classList.remove('open');
          menuBtn.setAttribute('aria-expanded','false');
          menuBtn.textContent = 'Menu';
        });
      });
    }

    /* ---- Scroll reveals ---- */
    const revealTargets = document.querySelectorAll(
      'section .post, section .pub-item, section .course, section .feature-block, ' +
      'section .award-item, section .press-item, .figure, .foci .wrap > div'
    );
    revealTargets.forEach(el=>el.classList.add('reveal'));
    if('IntersectionObserver' in window && !reduceMotion){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin:'0px 0px -8% 0px', threshold:0.05 });
      revealTargets.forEach(el=>io.observe(el));
    } else {
      revealTargets.forEach(el=>el.classList.add('in'));
    }

    /* ---- Sticky scrollspy nav ---- */
    const spy = document.getElementById('spy');
    const spyLinks = spy ? Array.from(spy.querySelectorAll('a')) : [];
    const sections = spyLinks
      .map(a=>document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    const hero = document.querySelector('.hero');

    function setCurrent(){
      const y = window.scrollY;
      if(spy && hero){ spy.classList.toggle('show', y > hero.offsetHeight); }
      let active = null;
      sections.forEach(sec=>{
        if(sec.getBoundingClientRect().top <= 110) active = sec.id;
      });
      spyLinks.forEach(a=>{
        a.classList.toggle('current', a.getAttribute('href') === '#'+active);
      });
      const fab = document.getElementById('fab-top');
      if(fab) fab.classList.toggle('show', y > 900);
    }
    window.addEventListener('scroll', setCurrent, { passive:true });
    setCurrent();

    const fab = document.getElementById('fab-top');
    if(fab) fab.addEventListener('click', ()=>{
      window.scrollTo({ top:0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    /* ---- Stat counter (numeric stats only) ---- */
    const stats = document.querySelectorAll('.feature-block .stat');
    stats.forEach(el=>{
      const raw = el.textContent.trim();
      const m = raw.match(/^([\d,]+)(\+?)$/);
      if(!m || reduceMotion) return;
      const target = parseInt(m[1].replace(/,/g,''),10);
      const suffix = m[2];
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(!e.isIntersecting) return;
          io.disconnect();
          const t0 = performance.now(), dur = 1400;
          (function tick(t){
            const p = Math.min((t - t0)/dur, 1);
            const eased = 1 - Math.pow(1-p, 3);
            el.textContent = Math.round(target*eased).toLocaleString('en-CA') + (p===1 ? suffix : '');
            if(p < 1) requestAnimationFrame(tick);
          })(t0);
        });
      }, { threshold:0.4 });
      io.observe(el);
    });

    /* ---- Lightbox for photos ---- */
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbCap = document.getElementById('lightbox-cap');
    const lbClose = document.getElementById('lightbox-close');
    let lastFocus = null;

    document.querySelectorAll('.figure').forEach(fig=>{
      const img = fig.querySelector('img');
      if(!img) return;
      fig.classList.add('zoomable');
      img.setAttribute('tabindex','0');
      img.setAttribute('role','button');
      img.setAttribute('aria-label','Enlarge photo');
      const open = ()=>{
        lastFocus = document.activeElement;
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        const cap = fig.querySelector('figcaption');
        lbCap.textContent = cap ? cap.textContent.trim() : '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
        lbClose.focus();
      };
      img.addEventListener('click', open);
      img.addEventListener('keydown', e=>{
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(); }
      });
    });
    function closeLb(){
      lb.classList.remove('open');
      lbImg.src = '';
      document.body.style.overflow = '';
      if(lastFocus) lastFocus.focus();
    }
    if(lb){
      lbClose.addEventListener('click', closeLb);
      lb.addEventListener('click', e=>{ if(e.target === lb) closeLb(); });
      document.addEventListener('keydown', e=>{
        if(e.key==='Escape' && lb.classList.contains('open')) closeLb();
      });
    }

    /* ---- Space-Track scoreboard (data/spacetrack.json, refreshed by GitHub Action) ---- */
    function animateNum(el, target){
      if(reduceMotion || !('IntersectionObserver' in window)){
        el.textContent = target.toLocaleString('en-CA'); return;
      }
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(!e.isIntersecting) return;
          io.disconnect();
          const t0 = performance.now(), dur = 1200;
          (function tick(t){
            const p = Math.min((t - t0)/dur, 1);
            const eased = 1 - Math.pow(1-p, 3);
            el.textContent = Math.round(target*eased).toLocaleString('en-CA');
            if(p < 1) requestAnimationFrame(tick);
          })(t0);
        });
      }, { threshold:0.4 });
      io.observe(el);
    }

    const stNums = document.querySelectorAll('.st-num');
    // Animate the baked-in fallback values regardless
    stNums.forEach(el=>{
      const v = parseInt(el.textContent.replace(/[^\d]/g,''),10);
      if(!isNaN(v)) animateNum(el, v);
    });
    // Then try to refresh from the JSON the Action keeps current
    fetch('data/spacetrack.json', { cache:'no-store' })
      .then(r=>{ if(!r.ok) throw 0; return r.json(); })
      .then(d=>{
        if(d.updated){ const el=document.getElementById('st-date'); if(el) el.textContent=d.updated; }
        if(d.alert){
          const t=document.getElementById('st-alert-text'); if(t) t.textContent=d.alert;
        } else {
          const a=document.getElementById('st-alert'); if(a) a.style.display='none';
        }
        if(d.scoreboard){
          stNums.forEach(el=>{
            const v = d.scoreboard[el.dataset.key];
            if(typeof v === 'number') el.textContent = v.toLocaleString('en-CA');
          });
        }
      })
      .catch(()=>{ /* keep baked-in values (e.g. local preview) */ });

    /* ================= LIVE GROUND TRACKS ================= */
    (function(){
      const NS = 'http://www.w3.org/2000/svg';
      const map = document.getElementById('gt-map');
      if(!map) return;
      const CAT = {
        station:{ color:'#d6a341', label:'Station' },
        payload:{ color:'#f3ecdc', label:'Payload' },
        defunct:{ color:'#948e7e', label:'Defunct' },
        debris: { color:'#c1572f', label:'Debris' },
        rb:     { color:'#7e95bd', label:'Rocket body' }
      };
      const W=1000, H=500;
      const proj = (lon,lat)=>[ (lon+180)/360*W, (90-lat)/180*H ];

      // graticule
      const grat = document.getElementById('gt-grat');
      for(let lon=-150; lon<=150; lon+=30){
        const l=document.createElementNS(NS,'line'); const x=proj(lon,0)[0];
        l.setAttribute('x1',x); l.setAttribute('x2',x); l.setAttribute('y1',0); l.setAttribute('y2',H);
        grat.appendChild(l);
      }
      for(let lat=-60; lat<=60; lat+=30){
        const l=document.createElementNS(NS,'line'); const y=proj(0,lat)[1];
        l.setAttribute('y1',y); l.setAttribute('y2',y); l.setAttribute('x1',0); l.setAttribute('x2',W);
        grat.appendChild(l);
      }

      const info = document.getElementById('gt-info');
      const clockEl = document.getElementById('gt-clock');
      function fail(msg){
        info.innerHTML = '<span style="color:var(--ink-faint)">'+msg+'</span>';
      }

      function start(){
        if(typeof satellite === 'undefined'){ fail('SGP4 library failed to load — live tracks unavailable.'); return; }
        fetch('data/tles.json', { cache:'no-store' })
          .then(r=>{ if(!r.ok) throw 0; return r.json(); })
          .then(init)
          .catch(()=>fail('Orbital element data unavailable (works once hosted — local previews can\u2019t fetch data files).'));
      }

      function init(data){
        const satsG = document.getElementById('gt-sats');
        const trackG = document.getElementById('gt-track');
        const objs = [];
        (data.objects||[]).forEach(o=>{
          try{
            const rec = satellite.twoline2satrec(o.line1, o.line2);
            if(rec.error) return;
            objs.push({ ...o, rec });
          }catch(e){}
        });
        if(!objs.length){ fail('No propagatable elements in data file.'); return; }

        // legend (only categories present)
        const legend = document.getElementById('gt-legend');
        const seen = [...new Set(objs.map(o=>o.cat))];
        legend.innerHTML = seen.map(c=>{
          const k = CAT[c]||CAT.payload;
          return '<span><i style="background:'+k.color+'"></i>'+k.label+'</span>';
        }).join('');

        // build dot + label + hit-target per object
        objs.forEach(o=>{
          const k = CAT[o.cat]||CAT.payload;
          o.dot = document.createElementNS(NS,'circle');
          o.dot.setAttribute('r','4.5'); o.dot.setAttribute('fill',k.color);
          o.dot.setAttribute('stroke','#1f2c44'); o.dot.setAttribute('stroke-width','1.5');
          o.dot.classList.add('gt-dot');
          o.hit = document.createElementNS(NS,'circle');
          o.hit.setAttribute('r','13'); o.hit.classList.add('gt-hit');
          o.txt = document.createElementNS(NS,'text');
          o.txt.classList.add('gt-label'); o.txt.textContent = o.name;
          [o.hit, o.dot].forEach(el=>el.addEventListener('click', ()=>select(o)));
          satsG.appendChild(o.txt); satsG.appendChild(o.dot); satsG.appendChild(o.hit);
        });

        function geo(o, date){
          const pv = satellite.propagate(o.rec, date);
          if(!pv.position) return null;
          const gmst = satellite.gstime(date);
          const gd = satellite.eciToGeodetic(pv.position, gmst);
          return {
            lat: satellite.degreesLat(gd.latitude),
            lon: satellite.degreesLong(gd.longitude),
            alt: gd.height,
            spd: Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z)
          };
        }

        let sel = null;
        function select(o){
          sel = o;
          drawTrack();
          paintInfo();
        }

        function drawTrack(){
          trackG.innerHTML = '';
          if(!sel) return;
          const k = CAT[sel.cat]||CAT.payload;
          const now = Date.now();
          let seg = [];
          const flush = ()=>{
            if(seg.length>1){
              const p = document.createElementNS(NS,'polyline');
              p.setAttribute('points', seg.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' '));
              p.setAttribute('stroke', k.color); p.setAttribute('stroke-width','1.3');
              p.setAttribute('opacity','.75');
              trackG.appendChild(p);
            }
            seg = [];
          };
          let prevLon = null;
          for(let m=-50; m<=50; m+=2){
            const g = geo(sel, new Date(now + m*60000));
            if(!g){ flush(); continue; }
            if(prevLon!==null && Math.abs(g.lon-prevLon)>180) flush(); // dateline
            seg.push(proj(g.lon, g.lat)); prevLon = g.lon;
          }
          flush();
        }

        function paintInfo(){
          if(!sel){ return; }
          const g = geo(sel, new Date());
          if(!g) return;
          const k = CAT[sel.cat]||CAT.payload;
          const ageDays = ((Date.now()/86400000 + 2440587.5) - sel.rec.jdsatepoch).toFixed(1);
          info.innerHTML =
            '<span class="nm">'+sel.name+'</span>' +
            '<span><b>NORAD</b>'+sel.id+'</span>' +
            '<span><b>Class</b>'+k.label+'</span>' +
            '<span><b>Alt</b>'+g.alt.toFixed(0)+' km</span>' +
            '<span><b>Speed</b>'+g.spd.toFixed(2)+' km/s</span>' +
            '<span><b>Lat</b>'+g.lat.toFixed(2)+'°</span>' +
            '<span><b>Lon</b>'+g.lon.toFixed(2)+'°</span>' +
            '<span><b>TLE age</b>'+ageDays+' d</span>';
        }

        let tick = 0;
        function update(){
          const now = new Date();
          objs.forEach(o=>{
            const g = geo(o, now);
            if(!g) return;
            const [x,y] = proj(g.lon, g.lat);
            o.dot.setAttribute('cx',x); o.dot.setAttribute('cy',y);
            o.hit.setAttribute('cx',x); o.hit.setAttribute('cy',y);
            o.txt.setAttribute('x',x+8); o.txt.setAttribute('y',y-7);
            if(o===sel) o.dot.setAttribute('r','6'); else o.dot.setAttribute('r','4.5');
          });
          clockEl.textContent = now.toISOString().slice(0,19).replace('T',' ') + ' UTC';
          if(sel){
            paintInfo();
            if(++tick % 150 === 0) drawTrack(); // refresh track ~ every 5 min
          }
        }
        if(data.updated){
          document.getElementById('gt-note').textContent =
            'TLE source: CelesTrak · elements updated '+data.updated+' · propagation: satellite.js (SGP4), running in your browser.';
        }
        select(objs[0]);
        update();
        setInterval(update, 2000);
      }
      // deferred script: DOM + SGP4 ready, start now
      start();
    })();

    /* ================= STREAK DETECTION DEMO ================= */
    (function(){
      const cv = document.getElementById('sd-canvas');
      if(!cv) return;
      const ctx = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      const status = document.getElementById('sd-status');
      let stars, streak, phase, t0, raf;

      function newScene(){
        stars = Array.from({length:140}, ()=>({
          x: Math.random()*W, y: Math.random()*H,
          r: .5 + Math.random()*1.6,
          b: .25 + Math.random()*.75
        }));
        const margin = 70;
        const x0 = margin + Math.random()*(W-2*margin);
        const y0 = margin + Math.random()*(H-2*margin);
        const ang = Math.random()*Math.PI*2;
        const len = 90 + Math.random()*70;
        streak = { x0, y0, x1: x0+Math.cos(ang)*len, y1: y0+Math.sin(ang)*len,
                   snr: (4 + Math.random()*5).toFixed(1) };
      }

      function drawBase(noiseSeed){
        ctx.fillStyle = '#0c111c'; ctx.fillRect(0,0,W,H);
        // sensor noise
        for(let i=0;i<420;i++){
          const v = 18 + Math.random()*26;
          ctx.fillStyle = 'rgba('+v+','+(v+4)+','+(v+12)+',.55)';
          ctx.fillRect(Math.random()*W, Math.random()*H, 1, 1);
        }
        stars.forEach(s=>{
          const g = ctx.createRadialGradient(s.x,s.y,0, s.x,s.y,s.r*2.4);
          g.addColorStop(0,'rgba(243,236,220,'+s.b+')');
          g.addColorStop(1,'rgba(243,236,220,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r*2.4,0,7); ctx.fill();
        });
      }

      function drawStreak(frac){
        const x = streak.x0 + (streak.x1-streak.x0)*frac;
        const y = streak.y0 + (streak.y1-streak.y0)*frac;
        ctx.strokeStyle = 'rgba(214,209,196,.5)';
        ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(streak.x0, streak.y0); ctx.lineTo(x,y); ctx.stroke();
        return [x,y];
      }

      function drawBox(){
        const pad = 16;
        const x = Math.min(streak.x0,streak.x1)-pad, y = Math.min(streak.y0,streak.y1)-pad;
        const w = Math.abs(streak.x1-streak.x0)+2*pad, h = Math.abs(streak.y1-streak.y0)+2*pad;
        ctx.strokeStyle = '#d6a341'; ctx.lineWidth = 1.2; ctx.setLineDash([5,4]);
        ctx.strokeRect(x,y,w,h); ctx.setLineDash([]);
        [[streak.x0,streak.y0],[streak.x1,streak.y1]].forEach(p=>{
          ctx.strokeStyle = '#c1572f'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(p[0],p[1],5,0,7); ctx.stroke();
        });
        ctx.fillStyle = '#d6a341';
        ctx.font = '11px "IBM Plex Mono", monospace';
        ctx.fillText('RSO CANDIDATE · SNR '+streak.snr, Math.max(6,x), Math.max(14,y-7));
      }

      const reduceM = reduceMotion;
      function loop(ts){
        if(!t0) t0 = ts;
        const t = (ts - t0)/1000;
        if(phase==='expose'){
          drawBase();
          drawStreak(Math.min(t/4.5, 1));
          status.textContent = 'Exposing — object drifting through field ('+Math.min(t/4.5*100,100).toFixed(0)+'%)';
          if(t>4.5){ phase='scan'; t0=ts; }
        } else if(phase==='scan'){
          drawBase(); drawStreak(1);
          const x = (t/1.1)*W;
          ctx.strokeStyle = 'rgba(193,87,47,.65)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
          status.textContent = 'Running detection…';
          if(t>1.1){ phase='lock'; t0=ts; }
        } else {
          drawBase(); drawStreak(1); drawBox();
          status.textContent = 'Detection — streak endpoints extracted, ready for catalogue association';
          if(t>4){ newScene(); phase='expose'; t0=ts; }
        }
        raf = requestAnimationFrame(loop);
      }

      function staticFrame(){
        drawBase(); drawStreak(1); drawBox();
        status.textContent = 'Detection — streak endpoints extracted (animation off: reduced motion)';
      }

      function run(){
        cancelAnimationFrame(raf); t0 = 0;
        newScene();
        if(reduceM){ staticFrame(); }
        else { phase='expose'; raf = requestAnimationFrame(loop); }
      }
      document.getElementById('sd-replay').addEventListener('click', run);
      run();
    })();

    /* ================= POPULATION TIMELINE ================= */
    (function(){
      const svg = document.getElementById('tl-chart');
      if(!svg) return;
      const NS='http://www.w3.org/2000/svg';
      const W=1000, H=380, M={l:64,r:24,t:18,b:42};
      const YR0=1957, YR1=2026, NMAX=52000;
      const data = [
        [1957,1],[1960,40],[1965,1300],[1970,2300],[1975,3500],[1980,4700],
        [1985,5800],[1990,7000],[1995,8000],[2000,8800],[2005,9400],[2007,9900],
        [2008,12800],[2009,13100],[2010,15300],[2013,16700],[2016,17800],
        [2019,19400],[2020,21500],[2021,24500],[2023,27500],[2024,30000],[2026,50800]
      ];
      const events = [
        [1957,'Sputnik 1','The first artificial satellite — and the first tracked object.'],
        [1996,'Cerise','First recorded accidental collision: a fragment from an Ariane stage strikes the Cerise satellite.'],
        [2007,'Fengyun-1C ASAT','Chinese anti-satellite test destroys a weather satellite, adding 3,000+ tracked fragments — the single worst debris event.'],
        [2009,'Iridium–Cosmos','First collision of two intact satellites: Iridium 33 and the defunct Cosmos 2251, ~2,000 fragments.'],
        [2019,'Starlink era','Large constellations begin scaling active-payload numbers by thousands.'],
        [2020,'Space Fence','New US radar comes online; thousands of small analyst objects enter tracking.'],
        [2021,'Cosmos-1408 ASAT','Russian anti-satellite test adds ~1,500 tracked fragments to busy LEO altitudes.'],
        [2026,'Today','objects on the Space-Track scoreboard — the population my research helps monitor.']
      ];
      const x = yr => M.l + (yr-YR0)/(YR1-YR0)*(W-M.l-M.r);
      const xInv = px => YR0 + (px-M.l)/(W-M.l-M.r)*(YR1-YR0);
      const y = n  => H-M.b - (n/NMAX)*(H-M.t-M.b);

      function el(tag, attrs, parent){
        const e = document.createElementNS(NS, tag);
        for(const k in attrs) e.setAttribute(k, attrs[k]);
        (parent||svg).appendChild(e); return e;
      }
      function countAt(yr){
        if(yr<=data[0][0]) return data[0][1];
        for(let i=1;i<data.length;i++){
          if(yr<=data[i][0]){
            const [y0,n0]=data[i-1],[y1,n1]=data[i];
            return n0 + (n1-n0)*(yr-y0)/((y1-y0)||1);
          }
        }
        return data[data.length-1][1];
      }

      // grid + axes
      [0,10000,20000,30000,40000,50000].forEach(v=>{
        el('line',{x1:M.l,x2:W-M.r,y1:y(v),y2:y(v),stroke:'#e1d8c4','stroke-width':1});
        const t = el('text',{x:M.l-8,y:y(v)+3,'text-anchor':'end',class:'tl-axis'});
        t.textContent = v ? (v/1000)+'k' : '0';
      });
      [1957,1970,1980,1990,2000,2010,2020,2026].forEach(yr=>{
        const t = el('text',{x:x(yr),y:H-M.b+18,'text-anchor':'middle',class:'tl-axis'});
        t.textContent = yr;
      });

      // gradient (navy deepens to rust as congestion accelerates) + reveal clip
      const defs = el('defs',{});
      const lg = el('linearGradient',{id:'tl-grad',x1:'0',y1:'0',x2:'1',y2:'0'},defs);
      el('stop',{offset:'0%','stop-color':'#1f2c44'},lg);
      el('stop',{offset:'78%','stop-color':'#1f2c44'},lg);
      el('stop',{offset:'100%','stop-color':'#c1572f'},lg);
      const clip = el('clipPath',{id:'tl-clip'},defs);
      const clipRect = el('rect',{x:0,y:0,width:reduceMotion?W:0,height:H},clip);

      // area + line inside reveal clip
      const plot = el('g',{'clip-path':'url(#tl-clip)'});
      let dLine='', dArea='M'+x(YR0)+' '+y(0);
      data.forEach(([yr,n],i)=>{
        dLine += (i?'L':'M')+x(yr).toFixed(1)+' '+y(n).toFixed(1);
        dArea += 'L'+x(yr).toFixed(1)+' '+y(n).toFixed(1);
      });
      dArea += 'L'+x(YR1)+' '+y(0)+'Z';
      el('path',{d:dArea, fill:'rgba(31,44,68,.08)'}, plot);
      el('path',{d:dLine, fill:'none', stroke:'url(#tl-grad)','stroke-width':2}, plot);

      // event markers
      const tip = document.getElementById('tl-tip');
      const panel = svg.parentElement;
      const marks = events.map(([yr,name,desc])=>{
        const cx = x(yr), cy = y(countAt(yr));
        const isToday = yr===YR1;
        el('line',{x1:cx,x2:cx,y1:cy,y2:H-M.b,stroke:'rgba(193,87,47,.25)','stroke-width':1}, plot);
        const dot = el('circle',{cx,cy,r:isToday?7:5.5,fill:isToday?'#d6a341':'#c1572f',
          stroke:'#fff','stroke-width':1.5,tabindex:0,role:'button'});
        dot.classList.add('tl-event');
        if(!reduceMotion) dot.classList.add('off');
        if(isToday) dot.classList.add('tl-today');
        const m = {yr,name,desc,dot,cx,cy};
        dot.setAttribute('aria-label', name+': '+desc);
        function show(){
          tip.innerHTML = '<span class="yr">'+yr+' — '+name+'</span><br>'+(isToday? todayCount.toLocaleString('en-CA')+' '+desc : desc);
          tip.classList.add('on');
          const r = panel.getBoundingClientRect(), rs = svg.getBoundingClientRect();
          const px = (rs.left-r.left) + cx/W*rs.width, py = (rs.top-r.top) + cy/H*rs.height;
          tip.style.left = Math.min(px+12, r.width-240)+'px';
          tip.style.top  = Math.max(py-10, 8)+'px';
        }
        dot.addEventListener('mouseenter', show);
        dot.addEventListener('mouseleave', ()=>tip.classList.remove('on'));
        dot.addEventListener('focus', show);
        dot.addEventListener('blur', ()=>tip.classList.remove('on'));
        dot.addEventListener('click', e=>{ e.stopPropagation(); show(); });
        return m;
      });
      document.addEventListener('click', ()=>tip.classList.remove('on'));

      // scrub crosshair
      const cross = el('g',{class:'tl-cross'});
      const cLine = el('line',{y1:M.t,y2:H-M.b,stroke:'#c1572f','stroke-width':1,'stroke-dasharray':'2 3'},cross);
      const cDot  = el('circle',{r:4.5,fill:'#1f2c44',stroke:'#fff','stroke-width':1.5},cross);

      // readout
      const cEl = document.getElementById('tl-count');
      const yEl = document.getElementById('tl-yr');
      const fEl = document.getElementById('tl-flash');
      let todayCount = 50800;
      const IDLE = 'Drag across the chart to travel through time';
      function setReadout(yr){
        const n = yr>=YR1 ? todayCount : countAt(yr);
        cEl.textContent = Math.round(n).toLocaleString('en-CA');
        yEl.textContent = Math.round(yr);
      }

      // ---- replay animation ----
      let playing = false, played = false, rafId;
      function play(){
        if(reduceMotion){ finishInstant(); return; }
        cancelAnimationFrame(rafId);
        playing = true;
        marks.forEach(m=>m.dot.classList.add('off'));
        let start;
        const DUR = 5000;
        function frame(ts){
          if(!start) start = ts;
          let p = Math.min((ts-start)/DUR, 1);
          p = 1-Math.pow(1-p,2.2); // ease-out: history accelerates, ending lingers
          const yr = YR0 + (YR1-YR0)*p;
          clipRect.setAttribute('width', x(yr));
          setReadout(yr);
          marks.forEach(m=>{
            if(m.yr<=yr && m.dot.classList.contains('off')){
              m.dot.classList.remove('off');
              fEl.textContent = m.yr+' — '+m.name;
            }
          });
          if(p<1){ rafId = requestAnimationFrame(frame); }
          else { playing = false; played = true; fEl.textContent = IDLE; }
        }
        rafId = requestAnimationFrame(frame);
      }
      function finishInstant(){
        clipRect.setAttribute('width', W);
        marks.forEach(m=>m.dot.classList.remove('off'));
        setReadout(YR1);
        playing = false; played = true;
      }
      document.getElementById('tl-replay').addEventListener('click', play);

      // autoplay once on scroll into view
      if(!reduceMotion && 'IntersectionObserver' in window){
        const io = new IntersectionObserver(es=>{
          es.forEach(e=>{
            if(e.isIntersecting && !played && !playing){ io.disconnect(); play(); }
          });
        }, { threshold:.45 });
        io.observe(svg);
      } else {
        finishInstant();
      }
      setReadout(YR1);

      // ---- scrubbing ----
      function scrub(e){
        if(playing) return;
        if(!played) finishInstant();
        const r = svg.getBoundingClientRect();
        const px = (e.clientX-r.left)/r.width*W;
        const yr = Math.max(YR0, Math.min(YR1, xInv(px)));
        const cx = x(yr), cy = y(yr>=YR1? Math.min(todayCount,NMAX) : countAt(yr));
        cLine.setAttribute('x1',cx); cLine.setAttribute('x2',cx);
        cDot.setAttribute('cx',cx); cDot.setAttribute('cy',cy);
        cross.classList.add('on');
        setReadout(yr);
      }
      svg.addEventListener('pointermove', scrub);
      svg.addEventListener('pointerdown', scrub);
      svg.addEventListener('pointerleave', ()=>{
        cross.classList.remove('on');
        setReadout(YR1);
        if(!playing) fEl.textContent = IDLE;
      });

      // sync the endpoint with the live scoreboard
      fetch('data/spacetrack.json', { cache:'no-store' })
        .then(r=>{ if(!r.ok) throw 0; return r.json(); })
        .then(d=>{
          const t = d.scoreboard && d.scoreboard.total;
          if(typeof t === 'number' && t > 0){
            todayCount = t;
            data[data.length-1][1] = Math.min(t, NMAX);
            if(!playing) setReadout(YR1);
          }
        }).catch(()=>{});
    })();

    /* ---- Pause SVG orbit animation if reduced motion ---- */
    if(reduceMotion){
      const svg = document.querySelector('.hero-art svg');
      if(svg && svg.pauseAnimations) svg.pauseAnimations();
    }
  })();
