/* Portada del Gabinete (M0) y portadas 7–8 · controlador del héroe: entrada en dos fases, cursor vivo y transición continua a 01.
   La firma se dibuja en un lienzo fijo a pantalla completa que sigue las cajas del DOM en cada fotograma. */
(function(){const S=window.Sig;if(!S)return;const {E,cl,seg,mix,sm}=S;
window.SigHero=function(o){
 const d=document.documentElement,pt=document.querySelector(o.root);
 if(!pt||!d.classList.contains('js')||d.classList.contains('still'))return;
 const cv=document.querySelector('canvas.sg');if(!cv||!cv.getContext)return;
 const C=S.canvas(cv),ctx=C.ctx,svgs=[...pt.querySelectorAll('svg.wd[data-l]')];
 const s01=document.getElementById('que-es'),sh=s01&&s01.querySelector('.sh'),hd=s01&&s01.querySelector('h2 .dot');
 const ent=[...pt.querySelectorAll('[data-e]')],big=[...pt.querySelectorAll('[data-ln]')],mks=[...pt.querySelectorAll('[data-mk]')];
 pt.classList.add('live');d.classList.add('sg-on');
 const v=(el,n)=>getComputedStyle(el).getPropertyValue(n).trim();
 const COL={bg:v(pt,'--bg'),lane:v(pt,o.laneVar||'--fg-2'),one:v(pt,o.oneVar||'--fg'),red:v(pt,'--red'),hair:s01?v(s01,'--hair-2'):'#ccc',ink:s01?v(s01,'--fg-2'):'#555'};
 const P=S.pointer();let gk='',G=null,done=false,k1=false;
 const geo=()=>{const svg=svgs.find(s=>s.getBoundingClientRect().width>0);if(!svg)return null;const c=svg.getScreenCTM();const key=svg.className.baseVal+[c.a,c.e,c.f].map(n=>n.toFixed(2)).join();if(key!==gk){gk=key;G=S.svgGeo(svg)}return G};
 const lines=(arr,col,w,a,head)=>{if(a<=0)return;ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;arr.forEach(p=>S.stroke(ctx,p,head))};
 function draw(t,inp,dt){
  inp=inp||{};const W=innerWidth,H=innerHeight;C.size(W,H);C.begin();
  const g=geo();if(!g)return;const L=g.L,s=g.s,sy=inp.sy!=null?inp.sy:scrollY;
  if(sy>8&&t<3.2)t=3.2+t*0; // si el lector ya baja, la entrada termina
  // fase 1 · tipografía (0–0.9 s): sube desde su línea base, sin rebote
  if(!done){big.forEach(el=>{const t0=o.tT0+(+el.dataset.ln)*(o.stag||.1),e1=E.o4(seg(t,t0,t0+.85));el.style.transform=`translate3d(0,${((1-e1)*o.rise).toFixed(2)}%,0)`;el.style.opacity=Math.min(1,e1*1.7).toFixed(3)});
   ent.forEach(el=>{const a=E.o4(seg(t,+el.dataset.e,+el.dataset.e+.7));el.style.opacity=a.toFixed(3);el.style.transform=`translate3d(0,${((1-a)*10).toFixed(1)}px,0)`});
   if(t>3.2){done=true;[...big,...ent].forEach(el=>{el.style.transform='';el.style.opacity=''})}}
  // geometría de la señal en px de pantalla
  const [xc,y]=g.P(L.xc,L.y),[xd]=g.P(L.xd,L.y),dot=g.P(L.dot[0],L.dot[1]),[px]=g.P(L.pulse.x,L.y);
  const pr=P.step(dt,inp);
  // scroll: 0 → 1 hasta que la línea es el filete de 01
  let u=0,shR=null;if(sh){shR=sh.getBoundingClientRect();const end=shR.bottom+sy-o.ruleAt*H;u=seg(sy,.03*H,Math.max(.2*H,end))}
  const k=E.io3(seg(u,o.k0||0,1)),flat=sm(seg(u,0,.45)),la=1-seg(u,.03,.32);
  const tr=S.trace({x0:-8,xc,xd,y,dot,gap:L.gap*s,spread:L.spread*s*(o.spreadK||1),amp:L.amp*s,t:t*.55,order:o.order,seed:o.seed||0,flat,
   pulse:{x:px,w:L.pulse.w*s,up:L.pulse.up*s,dn:L.pulse.dn*s,k:1},cur:{x:pr.x,y:pr.y,s:pr.s*(1-u),r:Math.max(70,L.pulse.up*s*1.15)},step:2});
  const hL=mix(-8,xc+1,E.draw(seg(t,o.tL0,o.tL1))),hO=t>=o.tO1?Infinity:mix(xc,dot[0]+2,E.draw(seg(t,o.tO0,o.tO1)));
  const target=o.target?o.target(shR,s01,W,H):[[shR.left,shR.bottom-.5],[shR.right,shR.bottom-.5]];
  const one=k>0?S.morph(tr.one,target,k,520):tr.one,wl=o.wLane||1,wo=mix(o.wOne||1.35,1,k);
  const pass=(knock)=>{const cl=knock?COL.bg:null;
   lines(tr.lanes,cl||COL.lane,knock?wl+.7:wl,la*(o.laneA||1),k>0?Infinity:hL);
   if(k<1){lines([one],cl||COL.one,knock?wo+.7:wo,1-k,k>0?Infinity:hO)}};
  ctx.save();
  // durante el paso a 01 la línea pasa «por debajo» de los bloques de texto (no los tacha)
  if(k>0&&o.avoid){const R=new Path2D();R.rect(-10,-10,W+20,H+20);pt.querySelectorAll(o.avoid).forEach(el=>{const b=el.getBoundingClientRect();if(b.width)R.rect(b.left-12,b.top-10,b.width+24,b.height+20)});ctx.clip(R,'evenodd')}
  pass(false);
  // las letras «se comen» la señal: segunda pasada con el color del fondo recortada a los contornos
  ctx.save();ctx.clip(g.glyph,'nonzero');pass(true);ctx.restore();
  if(k>0&&k<1){ctx.globalAlpha=k;ctx.strokeStyle=COL.hair;ctx.lineWidth=1;S.stroke(ctx,one);ctx.globalAlpha=1}
  ctx.restore();
  // el filete ya en su sitio: el lienzo se encarga mientras dura la transición; al llegar, vuelve el borde real
  if(o.after)o.after({ctx,k,u,t,one,target,shR,s01,W,H,COL,tr,dot,s,L,g,S});
  const isK1=k>=.999;if(isK1!==k1){k1=isK1;d.classList.toggle('sg-k1',k1)}
  // el punto rojo: aparece con un muelle corto (2,3 s) y viaja al punto de «Ni uno más.»
  const r0=(L.dotR||15)*s,sc=E.pop(seg(t,o.tD,o.tD+.8));
  if(!k1||o.dotTo==='thread'){let q=dot,r=r0;
   if(o.dotTo==='thread'&&o.dotAt){const z=o.dotAt({k,one,target,s01,H,shR});q=[mix(dot[0],z[0],k),mix(dot[1],z[1],k)];r=mix(r0,z[2],k)}
   else if(hd&&k>0){const z=S.dotOf(hd);q=[mix(dot[0],z.x,k),mix(dot[1],z.y,k)];r=mix(r0,z.r,k)}
   ctx.globalAlpha=1;ctx.fillStyle=COL.red;ctx.beginPath();ctx.arc(q[0],q[1],Math.max(0,r*sc),0,7);ctx.fill()}
  // marcas: siguen a la geometría (sin JS quedan en el SVG estático)
  if(mks.length&&L.mk){mks.forEach(el=>{if(!el.offsetParent)return;const w=el.dataset.mk,key=w==='lanes'?'l':w==='xc'?'c':'d';const p=g.P(L.mk[key][0],L.mk[key][1]);const r=el.offsetParent.getBoundingClientRect();
   const t0=w==='lanes'?o.tL0:w==='xc'?o.tO0:o.tD;const a=(w==='dot'?Math.min(1,sc):E.o4(seg(t,t0,t0+.5)))*la;el.style.opacity=a.toFixed(3);el.style.transform=`translate3d(${(p[0]-r.left).toFixed(1)}px,${(p[1]-r.top).toFixed(1)}px,0) translate(var(--ox,0),var(--oy,0))`})}
 }
 S.loop(draw,[pt,s01]);
 addEventListener('resize',()=>{gk=''},{passive:true});
};})();
