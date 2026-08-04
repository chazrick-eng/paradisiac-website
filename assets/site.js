/* ============================================================
   PARADISIAC BEACH CLUB — shared site script
   Loaded on every page. All blocks are guarded so a page only
   runs the logic for the components it actually contains.
   ============================================================ */

/* ---------- PRELOADER (home load-up) ---------- */
(function(){
  const pl=document.getElementById('preloader');
  if(!pl)return;
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){pl.remove();return;}
  document.body.classList.add('pl-lock');
  const hold=parseInt(pl.dataset.ms,10)||2950; // per-page hold; residence intros pass a shorter value
  let done=false;
  const finish=()=>{if(done)return;done=true;pl.classList.add('done');document.body.classList.remove('pl-lock');
    setTimeout(()=>pl.remove(),2100);};
  // Skip control: quick fade past the intro
  const skipNow=()=>{if(done)return;done=true;pl.classList.add('pl-skipped');document.body.classList.remove('pl-lock');
    setTimeout(()=>pl.remove(),400);};
  const skip=document.createElement('button');
  skip.type='button';skip.className='pl-skip';skip.textContent='Skip';
  skip.setAttribute('aria-label','Skip intro');
  skip.addEventListener('click',skipNow);
  pl.appendChild(skip);
  const onKey=e=>{if(e.key==='Escape'){skipNow();removeEventListener('keydown',onKey);}};
  addEventListener('keydown',onKey);
  const start=Date.now();
  if(document.readyState==='complete')setTimeout(finish,hold);
  else addEventListener('load',()=>setTimeout(finish,Math.max(0,hold-(Date.now()-start))));
  setTimeout(finish,hold+3050); // safety net
})();

/* ---------- HEADER SCROLL STATE ---------- */
(function(){
  const hdr=document.getElementById('hdr');
  if(!hdr)return;
  const solid=hdr.classList.contains('solid');
  if(!solid)addEventListener('scroll',()=>hdr.classList.toggle('scrolled',scrollY>40));
})();

/* ---------- MOBILE NAV (with focus management) ---------- */
(function(){
  const burger=document.getElementById('burger'),
        nav=document.getElementById('mobileNav'),
        ov=document.getElementById('overlay');
  if(!burger||!nav)return;
  burger.setAttribute('aria-expanded','false');
  burger.setAttribute('aria-controls','mobileNav');
  const closeBtn=document.getElementById('mobileClose');
  const open=()=>{nav.classList.add('open');ov.classList.add('show');document.body.style.overflow='hidden';
    burger.setAttribute('aria-expanded','true');(closeBtn||nav).focus();};
  const close=()=>{nav.classList.remove('open');ov.classList.remove('show');document.body.style.overflow='';
    burger.setAttribute('aria-expanded','false');burger.focus();};
  burger.addEventListener('click',open);
  ov.addEventListener('click',close);
  closeBtn?.addEventListener('click',close);
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open'))close();});
  // focus trap
  nav.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const f=nav.querySelectorAll('a,button'); if(!f.length)return;
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
})();

/* ---------- VISIT TRACKING (first-party) ----------
   Replace with Google Analytics (snippet in each <head>) or POST
   to your own endpoint for production analytics. */
(function(){
  let total=+(localStorage.getItem('pbc_visits')||0)+1;
  localStorage.setItem('pbc_visits',total);
  let first=localStorage.getItem('pbc_first');
  if(!first){first=new Date().toLocaleDateString();localStorage.setItem('pbc_first',first);}
  const log=JSON.parse(localStorage.getItem('pbc_visitlog')||'[]');
  log.push({t:new Date().toISOString(),ref:document.referrer||'direct',page:location.pathname.split('/').pop()||'index.html'});
  localStorage.setItem('pbc_visitlog',JSON.stringify(log.slice(-200)));
  const badge=document.getElementById('visitBadge');
  if(badge)badge.textContent='Visit #'+total+' · since '+first;
  // Inspect anytime: console.table(JSON.parse(localStorage.pbc_visitlog))
})();

/* ---------- LEAD FUNNEL + BOOKING ---------- */
(function(){
  const form=document.getElementById('leadForm');
  if(!form)return;
  let chosenSlot=null;
  const val=id=>document.getElementById(id)?.value||'';

  document.querySelectorAll('#slots .slot').forEach(s=>{
    s.addEventListener('click',()=>{
      document.querySelectorAll('#slots .slot').forEach(x=>x.classList.remove('sel'));
      s.classList.add('sel');chosenSlot=s.textContent;
    });
  });
  // default date = tomorrow
  const td=document.getElementById('tdate');
  if(td){const d=new Date();d.setDate(d.getDate()+1);td.value=d.toISOString().slice(0,10);}

  window.goStep=function(n){
    if(n===2){
      const e=val('email'),f=val('fname');
      if(!f||!/.+@.+\..+/.test(e)){alert('Please add your name and a valid email so we can process your application.');return;}
    }
    document.querySelectorAll('.form-step').forEach(s=>s.classList.toggle('active',+s.dataset.step===n));
    document.querySelectorAll('.steps .dot').forEach(d=>d.classList.toggle('active',+d.dataset.d<=n));
  };

  window.submitLead=function(){
    const f=val('fname'), e=val('email');
    if(!f||!/.+@.+\..+/.test(e)){alert('Please add your name and a valid email so we can process your application.');goStep(1);return;}
    const lead={
      name:val('fname'), address:val('address'), email:e, phone:val('phone'), maritalStatus:val('marital'),
      idNumber:val('idnum'), idType:val('idtype')==='Other'?(val('idother')||'Other'):val('idtype'),
      occupation:val('occupation'), employmentLength:val('tenure'),
      netIncome:val('income'), currency:val('currency'),
      placeOfWork:val('placeofwork'), workPhone:val('workphone'), previousWork:val('prevwork'),
      residence:val('interest'), condoBedrooms:val('condobeds'), preferredLot:val('lot'), reasonToBuy:val('prompted'),
      financingArranged:val('financing'), financingType:val('fintype'), preQualified:val('prequal'),
      source:location.pathname.split('/').pop()||'index.html', submitted:new Date().toISOString()};
    const leads=JSON.parse(localStorage.getItem('pbc_leads')||'[]');
    leads.push(lead);localStorage.setItem('pbc_leads',JSON.stringify(leads));
    console.log('APPLICATION CAPTURED →',lead);
    /* PRODUCTION: fetch('/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)}); */
    form.style.display='none';
    document.querySelector('.steps').style.display='none';
    document.getElementById('successMsg').textContent=
      'Thank you, '+val('fname')+'. Your application has been received — the Paradisiac team will review it and be in touch by phone or email shortly.';
    document.getElementById('success').classList.add('show');
  };

  window.resetForm=function(){
    form.reset();form.style.display='block';
    document.querySelector('.steps').style.display='flex';
    document.getElementById('success').classList.remove('show');
    chosenSlot=null;document.querySelectorAll('#slots .slot').forEach(x=>x.classList.remove('sel'));
    goStep(1);
  };
})();

/* ---------- LIVE CHAT (demo) ---------- */
(function(){
  const fab=document.getElementById('chatFab');
  if(!fab)return;
  let chatOpen=false;
  const box=document.getElementById('chatBox'),badge=document.getElementById('chatBadge'),
        body=document.getElementById('chatBody'),input=document.getElementById('chatInput');
  function pushMsg(text,who){
    const m=document.createElement('div');m.className='msg '+who;m.textContent=text;
    body.appendChild(m);body.scrollTop=body.scrollHeight;
  }
  window.toggleChat=function(){
    chatOpen=!chatOpen;box.classList.toggle('open',chatOpen);
    badge.style.display=chatOpen?'none':'flex';
    if(chatOpen)setTimeout(()=>input.focus(),200);
  };
  window.sendChat=function(){
    const t=input.value.trim();if(!t)return;
    pushMsg(t,'me');input.value='';
    const log=JSON.parse(localStorage.getItem('pbc_chat')||'[]');
    log.push({t,at:Date.now()});localStorage.setItem('pbc_chat',JSON.stringify(log));
    setTimeout(()=>{
      let r="Thanks for reaching out — the Paradisiac team will reply here shortly. In the meantime, would you like to apply for a home or book a model-unit visit?";
      if(/price|cost|how much|budget/i.test(t)) r="Prices and availability are shared on application. Pop your details on our Apply page and the team will be in touch with everything.";
      if(/tour|visit|view|model|see|appointment|book/i.test(t)) r="Our Ruby and Onyx model units are open to visit — Mon–Fri 9–5 and Sat 9–3. Head to the Apply page to pick a time and we'll confirm.";
      if(/apply|buy|purchase|home|own/i.test(t)) r="Wonderful — you can apply on our Apply page, or call 876-513-3190. We'll guide you through the next steps.";
      if(/hello|hi|hey/i.test(t)) r="Hello, and welcome to Paradisiac Beach Club. How can we help today?";
      pushMsg(r,'bot');
    },900);
  };
  input.addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();});
})();

/* ---------- PHOTO FAB (residence detail → jump to gallery) ---------- */
(function(){
  const fab=document.getElementById('photoFab');
  const target=document.getElementById('photos');
  if(!fab||!target)return;
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>fab.classList.toggle('hidden', e.isIntersecting));
    },{threshold:0.06});
    io.observe(target);
  }
})();

/* ---------- GALLERY LIGHTBOX (accessible) ---------- */
(function(){
  const lb=document.getElementById('lightbox');
  if(!lb)return;
  const buttons=[...document.querySelectorAll('.gallery button')];
  const imgs=buttons.map(b=>b.querySelector('img'));
  const lbImg=document.getElementById('lbImg');
  const cap=document.getElementById('lbCap'), cnt=document.getElementById('lbCount');
  let i=0, opener=null;
  const show=n=>{
    i=(n+imgs.length)%imgs.length;
    const im=imgs[i];
    lbImg.src=im.dataset.full||im.src; lbImg.alt=im.alt;
    if(cap)cap.textContent=im.alt||''; if(cnt)cnt.textContent=(i+1)+' / '+imgs.length;
    [i+1,i-1].forEach(k=>{const j=(k+imgs.length)%imgs.length;const pre=new Image();pre.src=imgs[j].dataset.full||imgs[j].src;});
  };
  buttons.forEach((b,idx)=>{
    b.addEventListener('click',()=>{opener=b;lb.classList.add('open');lb.setAttribute('aria-modal','true');
      show(idx);document.body.style.overflow='hidden';document.getElementById('lbClose').focus();});
  });
  const close=()=>{lb.classList.remove('open');lb.removeAttribute('aria-modal');document.body.style.overflow='';
    if(opener)opener.focus();};
  document.getElementById('lbClose').addEventListener('click',close);
  document.getElementById('lbPrev').addEventListener('click',()=>show(i-1));
  document.getElementById('lbNext').addEventListener('click',()=>show(i+1));
  lb.addEventListener('click',e=>{if(e.target===lb)close();});
  addEventListener('keydown',e=>{
    if(!lb.classList.contains('open'))return;
    if(e.key==='Escape')close();
    else if(e.key==='ArrowLeft')show(i-1);
    else if(e.key==='ArrowRight')show(i+1);
    else if(e.key==='Tab'){ // trap
      const f=lb.querySelectorAll('button'); const first=f[0], last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
})();

/* ---------- FAQ ACCORDION ---------- */
(function(){
  document.querySelectorAll('.faq-q').forEach(q=>{
    q.addEventListener('click',()=>{
      const open=q.getAttribute('aria-expanded')==='true';
      q.setAttribute('aria-expanded',!open);
      const a=q.nextElementSibling;
      a.style.maxHeight=open?null:a.scrollHeight+'px';
    });
  });
})();

/* ---------- POLISH: favicon, image fade-in, scroll reveal ---------- */
(function(){
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // favicon (inject once, sitewide)
  if(!document.querySelector("link[rel~='icon']")){
    const l=document.createElement('link');
    l.rel='icon'; l.type='image/svg+xml'; l.href='assets/favicon.svg';
    document.head.appendChild(l);
  }

  // image fade-in on load
  document.querySelectorAll('main img').forEach(img=>{
    img.decoding='async';
    if(reduce) return;
    img.setAttribute('data-fade','');
    if(img.complete && img.naturalWidth) img.classList.add('loaded');
    else img.addEventListener('load',()=>img.classList.add('loaded'),{once:true});
  });

  // scroll reveal with stagger
  const sel=['.section-head','.about-grid > *','.card','.amen-grid .item',
    '.gallery button','.reserve-copy','.panel','.stat','.listing-grid > *','.feature-list li',
    '.price-block','.map-grid > *','.cta-strip .wrap > *','.foot-grid > *','.spec-row .s','.faq-item'];
  const els=[...document.querySelectorAll(sel.join(','))];
  if(reduce || !('IntersectionObserver' in window) || !els.length) return;
  els.forEach(el=>el.classList.add('reveal'));
  els.forEach(el=>{
    const sibs=[...el.parentElement.children].filter(n=>n.classList.contains('reveal'));
    el.style.transitionDelay=(Math.min(sibs.indexOf(el),6)*0.07)+'s';
  });
  const io=new IntersectionObserver((ents)=>{
    ents.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:0.08, rootMargin:'0px 0px 12% 0px'});
  els.forEach(el=>io.observe(el));
})();

/* ---------- RESIDENCE CLICK TRANSITION (list -> unit page) ---------- */
(function(){
  var cards=document.querySelectorAll('a.card[href^="residence-"]');
  if(!cards.length)return;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)return;
  var LABELS={
    'residence-ruby.html':['The Ruby','Three-Bedroom Home'],
    'residence-onyx.html':['The Onyx','Three-Bedroom Townhouse'],
    'residence-sapphire.html':['The Sapphire','Coastal Apartments'],
    'residence-emerald.html':['The Emerald','Coastal Apartments'],
    'residence-diamond.html':['The Diamond','Signature Residence']
  };
  cards.forEach(function(a){
    a.addEventListener('click',function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button===1)return; // preserve open-in-new-tab
      var href=a.getAttribute('href');
      e.preventDefault();
      var img=a.querySelector('.ph img');
      var src=img?img.getAttribute('src'):'';
      var lab=LABELS[href]||['',''];
      var ov=document.createElement('div');
      ov.className='res-x';
      ov.innerHTML='<div class="rx-card" style="background-image:url(\''+src+'\')"></div>'+
        '<div class="rx-word"><b>'+lab[0]+'</b><i></i><span>'+lab[1]+'</span></div>';
      var hint=document.createElement('span');
      hint.className='rx-skip';hint.textContent='Skip';
      ov.appendChild(hint);
      document.body.appendChild(ov);
      document.documentElement.style.overflow='hidden';
      var navd=false;
      var go=function(){if(navd)return;navd=true;window.location.href=href;};
      ov.addEventListener('click',go);           // tap anywhere to skip straight to the page
      var onKey=function(ev){if(ev.key==='Escape'){removeEventListener('keydown',onKey);go();}};
      addEventListener('keydown',onKey);
      setTimeout(go,780);
    });
  });
})();

/* ---------- UI MOTION: count-up stats + subtle parallax ---------- */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce || !('IntersectionObserver' in window)) return;

  /* Count-up numbers when they scroll into view (skips non-numeric like "Now", "24/7") */
  var numSel = ['.spec-row .s b', '.card-body .meta b', '.stat b', '.stat-num', '[data-count]'];
  var nums = [].slice.call(document.querySelectorAll(numSel.join(',')));
  function countUp(el){
    var raw = el.textContent.trim();
    var m = raw.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/);
    if(!m) return;                       // only pure single-number labels
    var pre = m[1], numStr = m[2], suf = m[3];
    var hasComma = numStr.indexOf(',') > -1;
    var decimals = (numStr.split('.')[1] || '').length;
    var target = parseFloat(numStr.replace(/,/g,''));
    if(!isFinite(target) || target === 0) return;
    var dur = 1300, t0 = performance.now();
    el.style.fontVariantNumeric = 'tabular-nums';
    function fmt(v){
      var s = decimals ? v.toFixed(decimals) : String(Math.round(v));
      if(hasComma) s = Number(s).toLocaleString('en-US', {minimumFractionDigits:decimals, maximumFractionDigits:decimals});
      return pre + s + suf;
    }
    function step(now){
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);     // ease-out cubic
      el.textContent = fmt(target * e);
      if(p < 1) requestAnimationFrame(step); else el.textContent = pre + numStr + suf;
    }
    requestAnimationFrame(step);
  }
  if(nums.length){
    var io = new IntersectionObserver(function(ents){
      ents.forEach(function(en){ if(en.isIntersecting){ countUp(en.target); io.unobserve(en.target); } });
    }, {threshold:0.6});
    nums.forEach(function(el){ io.observe(el); });
  }

  /* Gentle parallax on interior page banners */
  var px = [].slice.call(document.querySelectorAll('.subhero'));
  if(px.length){
    var ticking = false;
    function upd(){
      ticking = false;
      var vh = window.innerHeight;
      px.forEach(function(el){
        var r = el.getBoundingClientRect();
        if(r.bottom < -40 || r.top > vh + 40) return;
        var off = r.top * -0.14;          // image drifts slower than the page
        el.style.backgroundPositionY = 'calc(50% + ' + off.toFixed(1) + 'px)';
      });
    }
    addEventListener('scroll', function(){ if(!ticking){ requestAnimationFrame(upd); ticking = true; } }, {passive:true});
    addEventListener('resize', upd, {passive:true});
    upd();
  }
})();
