/* ============================================================
   PARADISIAC BEACH CLUB — shared site script
   Loaded on every page. All blocks are guarded so a page only
   runs the logic for the components it actually contains.
   ============================================================ */

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
    if(n===3){
      const e=val('email'),f=val('fname');
      if(!f||!/.+@.+\..+/.test(e)){alert('Please add your name and a valid email so we can confirm your tour.');return;}
    }
    document.querySelectorAll('.form-step').forEach(s=>s.classList.toggle('active',+s.dataset.step===n));
    document.querySelectorAll('.steps .dot').forEach(d=>d.classList.toggle('active',+d.dataset.d<=n));
  };

  window.submitLead=function(){
    if(!chosenSlot){alert('Please choose a preferred time.');return;}
    const lead={interest:val('interest'),timeframe:val('timeframe'),budget:val('budget'),
      name:val('fname')+' '+val('lname'),email:val('email'),phone:val('phone'),
      date:val('tdate'),time:chosenSlot,notes:val('notes'),
      source:location.pathname.split('/').pop()||'index.html',submitted:new Date().toISOString()};
    const leads=JSON.parse(localStorage.getItem('pbc_leads')||'[]');
    leads.push(lead);localStorage.setItem('pbc_leads',JSON.stringify(leads));
    console.log('LEAD CAPTURED →',lead);
    /* PRODUCTION: fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)}); */
    form.style.display='none';
    document.querySelector('.steps').style.display='none';
    document.getElementById('successMsg').textContent=
      'Thank you, '+val('fname')+'. Your tour for '+lead.date+' at '+lead.time+
      ' has been requested — we\'ll confirm by email and phone shortly.';
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
      let r="Thank you — a member of our estate team will reply here shortly. Would you like to book a private tour in the meantime?";
      if(/price|cost|how much|budget/i.test(t)) r="Residences begin at $4.85M. I'd be glad to arrange a private consultation with exact pricing — shall I book you a tour?";
      if(/tour|visit|view|appointment|book/i.test(t)) r="Wonderful. You can reserve a private tour on our Contact page, or tell me a day that suits you. ✨";
      if(/hello|hi|hey/i.test(t)) r="Hello, and welcome to Paradisiac. How may I assist you today?";
      pushMsg(r,'bot');
    },900);
  };
  input.addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();});
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
  const sel=['.hero-inner > *','.section-head','.about-grid > *','.card','.amen-grid .item',
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
  },{threshold:0.12, rootMargin:'0px 0px -7% 0px'});
  els.forEach(el=>io.observe(el));
})();
