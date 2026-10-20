/* TELEMETRÍA · runtime de módulos. Sin dependencias.
   Regla: el HTML trae el estado final; aquí solo se anima. ?static o reduced-motion → nada se mueve. */
(()=>{
const R=document.documentElement,still=R.classList.contains('still')||R.classList.contains('is-static');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),seg=(p,a,b)=>clamp((p-a)/(b-a));
const css=(el,v)=>getComputedStyle(el).getPropertyValue(v).trim();
const io=(el,cb,o)=>new IntersectionObserver(e=>e.forEach(x=>cb(x.isIntersecting,x)),o).observe(el);
// progreso de scroll de un contenedor alto (0 → 1 mientras su escenario está fijo)
const scrollProg=(el,cb)=>{let vis=false,q=false;
 const p=()=>{const r=el.getBoundingClientRect(),span=r.height-innerHeight;return span>0?clamp((-r.top+innerHeight*.04)/(span*.94)):1};
 const tick=()=>{q=false;cb(p())},req=()=>{if(!q&&vis){q=true;requestAnimationFrame(tick)}};
 io(el,v=>{vis=v;req()});addEventListener('scroll',req,{passive:true});addEventListener('resize',req);cb(p())};

// ---------- M1 · señales que convergen
document.querySelectorAll('[data-m="senal"]').forEach(el=>{
 if(still)return;
 const cv=el.querySelector('canvas'),ctx=cv.getContext('2d'),n=el.querySelectorAll('.ch span').length||7;
 let w,h,dpr,raf,vis=false,t0=performance.now(),fg,red;
 const size=()=>{const r=el.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(2,devicePixelRatio||1);cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);fg=css(el,'--fg')||'#ECEAE4';red=css(el,'--red')||'#FF3B30'};
 const nz=(i,x,t)=>Math.sin(x*.045+t*1.7+i*1.3)*.55+Math.sin(x*.11-t*2.3+i*2.1)*.3+Math.sin(x*.27+t*3.1+i*.7)*.15;
 const draw=t=>{ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const x0=w<700?92:w*.11,xc=w*(w<700?.7:.66),xp=w*(w<700?.86:.84),mid=h/2,A=h/n*.32,sw=((t%4)/4)*w*1.1;
  for(const live of [0,1]){ctx.save();ctx.beginPath();live?ctx.rect(0,0,sw,h):ctx.rect(sw,0,w,h);ctx.clip();
   ctx.strokeStyle=fg;ctx.lineWidth=1;
   for(let i=0;i<n;i++){const lane=h*(i+.5)/n;ctx.globalAlpha=live?.62:.2;ctx.beginPath();
    for(let x=x0;x<=xc;x+=2){const u=(x-x0)/(xc-x0),e=u*u*(3-2*u),y=lane+(mid-lane)*e+nz(i,x,t)*A*(1-e)*(1-e);x===x0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
   ctx.globalAlpha=live?1:.3;ctx.lineWidth=1.3;ctx.beginPath();
   for(let x=xc;x<=w;x+=1){const d=x-xp;let y=mid;if(Math.abs(d)<24){y-=Math.exp(-(d*d)/34)*h*.36;y+=Math.exp(-((d-9)**2)/15)*h*.12}x===xc?ctx.moveTo(x,y):ctx.lineTo(x,y)}
   ctx.stroke();ctx.restore()}
  ctx.globalAlpha=1;const on=sw>xp;ctx.fillStyle=red;ctx.globalAlpha=on?1:.35;ctx.beginPath();ctx.arc(xp,mid-h*.36+1,3.5,0,7);ctx.fill();
  ctx.globalAlpha=.6;ctx.strokeStyle=red;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(xp,h);ctx.lineTo(xp,mid-h*.36+8);ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=.55;ctx.fillStyle=fg;if(sw<w)ctx.fillRect(sw,0,1,h);ctx.globalAlpha=1};
 const loop=now=>{draw((now-t0)/1000);if(vis)raf=requestAnimationFrame(loop)};
 size();el.classList.add('live');draw(0);
 io(el,v=>{vis=v;cancelAnimationFrame(raf);if(v)raf=requestAnimationFrame(loop)});
 addEventListener('resize',()=>{size();draw((performance.now()-t0)/1000)});
});

// ---------- M2 · punto de control
document.querySelectorAll('[data-m="dial"]').forEach(el=>{
 const run=el.querySelector('.run'),svgs=[...el.querySelectorAll('svg.dd,svg.dm')];
 const items=[...el.querySelectorAll('.steps li')],chk=[...el.querySelectorAll('[data-chk] .chip')],ex=[...el.querySelectorAll('[data-ex] .chip:not([data-canal])')],canal=el.querySelector('[data-canal]'),ckN=el.querySelector('[data-ck]');
 const DER=ex.findIndex(e=>e.textContent==='Derivar');
 const G=svgs.map(s=>{const q=c=>[...s.querySelectorAll(c)];return {s,ck:q('.ck'),ckl:q('.ckl'),ports:q('.dl-port'),pl:q('.pl'),ln:q('.ln'),nd:q('.nd'),lt:q('.lt'),rin:s.querySelector('.r-in'),rout:s.querySelector('.r-out'),rbk:s.querySelector('.r-back'),orq:s.querySelector('.dl-orq'),core:s.querySelector('.dl-core'),ct:s.querySelector('.dl-ct'),dot:s.querySelector('.dl-dot')}});
 const sel=G[0]?G[0].ln.findIndex(l=>l.classList.contains('dec')):-1;
 let cur=-1;
 const render=p=>{
  const s1=seg(p,0,.1),s3=seg(p,.5,.66),s4=seg(p,.68,.82),s5=seg(p,.84,.94),sc=seg(p,.43,.5),scan=Math.min(3,Math.floor(sc*4));let closed=0;
  G.forEach(g=>{closed=0;
   g.rin.style.strokeDashoffset=1-s1;
   g.ck.forEach((c,i)=>{const u=seg(p,.1+i*.055,.1+(i+1)*.055);c.style.strokeDashoffset=1-u;if(u>=1)closed++;g.ckl[i]&&g.ckl[i].classList.toggle('on',u>0)});
   g.ports.forEach((r,i)=>{r.classList.toggle('dec',i===DER&&p>=.5);r.classList.toggle('on',!(i===DER&&p>=.5)&&sc>0&&sc<1&&i===scan)});
   g.pl.forEach((t,i)=>{t.classList.toggle('dec',i===DER&&p>=.5);t.classList.toggle('on',sc>0&&sc<1&&i===scan)});
   g.rout.style.strokeDashoffset=1-s3;
   const lit=p>=.62;g.ln.forEach((l,i)=>l.classList.toggle('dec',lit&&i===sel));g.nd.forEach((l,i)=>l.classList.toggle('dec',lit&&i===sel));g.lt.forEach((l,i)=>l.classList.toggle('dec',lit&&i===sel));
   g.rbk.style.strokeDashoffset=1-s4;g.orq.classList.toggle('on',p>=.8);
   g.core.style.fillOpacity=s5;g.ct.style.fill=s5>.5?'#0E0F10':css(el,'--mute');
   const tr=p<.1?[g.rin,s1]:p>=.5&&p<.66?[g.rout,s3]:p>=.68&&p<.82?[g.rbk,s4]:null;
   if(tr&&!still&&tr[1]>0&&tr[1]<1){const L=tr[0].getTotalLength(),pt=tr[0].getPointAtLength(L*tr[1]);g.dot.setAttribute('cx',pt.x);g.dot.setAttribute('cy',pt.y);g.dot.setAttribute('opacity',1)}else g.dot.setAttribute('opacity',0)});
  chk.forEach((c,i)=>c.classList.toggle('on',i<closed));
  ex.forEach((e,i)=>{e.classList.toggle('dec',i===DER&&p>=.5);e.classList.toggle('on',sc>0&&sc<1&&i===scan)});
  if(canal)canal.style.visibility=p>=.62?'visible':'hidden';
  if(ckN)ckN.textContent=`Controles ${closed}/${chk.length}`;
  const act=p<.1?0:p<.5?1:p<.68?2:p<.84?3:4;
  if(act!==cur){cur=act;items.forEach((li,i)=>{li.classList.toggle('on',i===act);li.toggleAttribute('aria-current',i===act)})}
 };
 if(still){items.forEach(li=>li.classList.add('on'));return}
 scrollProg(run,render);
});

// ---------- M3 · lámina de plóter + tabla enlazada
document.querySelectorAll('[data-m="lamina"]').forEach(el=>{
 const plate=el.querySelector('.plate'),rows=[...el.querySelectorAll('tr[data-k]')],pans=[...el.querySelectorAll('.pn[data-p]')];
 const hl=k=>{pans.forEach(p=>p.classList.toggle('hl',p.dataset.p===k));rows.forEach(r=>r.classList.toggle('hl',r.dataset.k===k))};
 rows.forEach(r=>{r.addEventListener('mouseenter',()=>hl(r.dataset.k));r.addEventListener('focus',()=>hl(r.dataset.k));r.addEventListener('mouseleave',()=>hl(null));r.addEventListener('blur',()=>hl(null))});
 pans.forEach(p=>{p.addEventListener('mouseenter',()=>hl(p.dataset.p));p.addEventListener('mouseleave',()=>hl(null))});
 if(still)return;
 const xh=plate.querySelector('.xh'),ro=plate.querySelector('[data-ro]'),btn=el.querySelector('.again');
 const steps=[];let last=null;
 plate.querySelectorAll('.p6 .pen,.p6 .fil').forEach(e=>{if(e.classList.contains('pen')){last={e,L:e.getTotalLength(),fills:[],da:e.getAttribute('stroke-dasharray')||''};steps.push(last)}else if(last)last.fills.push(e)});
 const reset=()=>{steps.forEach(s=>{s.e.style.strokeDasharray=s.L+' '+s.L;s.e.style.strokeDashoffset=s.L;s.fills.forEach(x=>x.classList.remove('on'))});plate.classList.add('armed')};
 const done=s=>{s.e.style.strokeDashoffset='';s.e.style.strokeDasharray='';s.fills.forEach(x=>x.classList.add('on'))};
 const pad=n=>String(Math.max(0,Math.round(n))).padStart(4,'0');
 const SPEED=680,UP=.03;let raf,i=0,t=0,prev=0;
 const frame=now=>{t+=Math.min(.05,(now-prev)/1000);prev=now;let s=steps[i];
  while(s){const dur=s.L/SPEED;if(t<UP)break;const u=Math.min(1,(t-UP)/dur);s.e.style.strokeDashoffset=s.L*(1-u);
   const pt=s.e.getPointAtLength(s.L*u),q=new DOMPoint(pt.x,pt.y).matrixTransform(s.e.getScreenCTM()),r=plate.getBoundingClientRect(),x=q.x-r.left,y=q.y-r.top;
   xh.style.transform=`translate(${x}px,${y}px)`;ro.textContent=`X ${pad(x)} · Y ${pad(y)} · pluma abajo`;
   if(u<1)break;done(s);t-=UP+dur;i++;s=steps[i]}
  if(i>=steps.length){plate.classList.remove('plot');ro.textContent=ro.textContent.replace('abajo','arriba');return}
  raf=requestAnimationFrame(frame)};
 const start=()=>{cancelAnimationFrame(raf);reset();i=0;t=0;plate.classList.add('plot');prev=performance.now();raf=requestAnimationFrame(frame)};
 reset();let go=false;io(plate,v=>{if(v&&!go){go=true;start()}},{threshold:.3});
 btn&&btn.addEventListener('click',start);
});

// ---------- M4 · radar semanal
document.querySelectorAll('[data-m="radar"]').forEach(el=>{
 if(still||el.hasAttribute('data-still'))return;   // en el Gabinete, 04 es calma: el radar queda quieto
 const arm=el.querySelector('.rd-arm'),wedge=el.querySelector('.rd-wedge'),marks=[...el.querySelectorAll('.rd-m')],n=7,C=200,R=168;
 let raf,vis=false,t0=performance.now();el.classList.add('live');
 const PER=8.4;
 const draw=now=>{const t=((now-t0)/1000)%PER,a=t/PER*2*Math.PI,ang=-Math.PI/2+a,x=C+Math.cos(ang)*R,y=C+Math.sin(ang)*R;
  arm.setAttribute('x2',x.toFixed(1));arm.setAttribute('y2',y.toFixed(1));
  const a0=ang-.5,x0=C+Math.cos(a0)*R,y0=C+Math.sin(a0)*R;wedge.setAttribute('d',`M${C} ${C}L${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}Z`);
  const step=2*Math.PI/n;marks.forEach(m=>{const c=(+m.dataset.d+.5)*step,dl=(a-c+4*Math.PI)%(2*Math.PI);m.classList.toggle('on',dl<step*1.6)});
  if(vis)raf=requestAnimationFrame(draw)};
 io(el,v=>{vis=v;cancelAnimationFrame(raf);if(v)raf=requestAnimationFrame(draw)});
});

// ---------- hilo: los filetes de sección se trazan de izquierda a derecha al entrar (una vez). El de 01 lo dibuja la portada.
if(!still&&'IntersectionObserver' in window){const ob=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');ob.unobserve(x.target)}}),{rootMargin:'0px 0px -12% 0px'});
 document.querySelectorAll('.sec:not(#que-es) .sh').forEach(el=>{el.classList.add('draw');ob.observe(el)})}
})();
