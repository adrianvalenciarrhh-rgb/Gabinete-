/* Portadas 7–9 · motor de señal (Canvas 2D, sin dependencias).
   Siete trazos que convergen en uno, un solo pulso y el final en el punto rojo.
   Curvas propias; fotograma determinista con window.__CAP para capturas y vídeo. */
(function(root){
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),seg=(t,a,b)=>cl((t-a)/(b-a)),mix=(a,b,k)=>a+(b-a)*k;
// curvas propias: salida firme y llegada larga (sin rebote), y un muelle crítico corto para el punto
const E={
 o4:t=>1-Math.pow(1-t,4),
 io3:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
 // «trazo»: arranca rápido y frena en el último 30 % (Bézier 0.22,1 / 0.36,1 aproximada)
 draw:t=>{t=cl(t);return 1-Math.pow(1-t,3.2)*(1-.18*t)},
 // «cierre»: aceleración suave, sin asentamiento brusco
 shut:t=>{t=cl(t);return t*t*(3-2*t)*(1+.12*Math.sin(Math.PI*t))/(1+.12*Math.sin(Math.PI))},
 pop:t=>{if(t<=0)return 0;if(t>=1)return 1;const w=11,z=.62,wd=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*t)*(Math.cos(wd*t)+z*w/wd*Math.sin(wd*t))}};
const sm=t=>{t=cl(t);return t*t*(3-2*t)};
// ruido suave y ordenado: tres senos por trazo, frecuencias bajas
const nz=(k,x,t)=>Math.sin(x*.0105+t*1.25+k*1.31)*.58+Math.sin(x*.0231-t*1.7+k*2.17)*.29+Math.sin(x*.047+t*2.3+k*.71)*.13;
/* o: {x0,xc,xd,y,dot:[x,y],spread,amp,t,pulse:{x,w,up,dn},flat,cur:{x,y,s,r},n,order}
   devuelve {lanes:[[x,y]...],one:[[x,y]...]} en píxeles de pantalla */
function trace(o){
 const n=o.n||7,step=o.step||2,fl=o.flat||0,cur=o.cur||{s:0};const lanes=[];
 const curDy=(x,y)=>{if(!cur.s)return 0;const dx=(x-cur.x)/cur.r,dy=y-cur.y;const g=Math.exp(-dx*dx*2.2);const s=Math.sign(dy)||1;return s*cur.s*g*Math.exp(-Math.abs(dy)/(cur.r*.55))*cur.r*.32};
 for(let k=0;k<n;k++){const off=k-(n-1)/2,pts=[];
  for(let x=o.x0;x<=o.xc+.01;x+=step){const u=seg(x,o.x0,o.xc),f=1-E.io3(u);const base=o.y+off*o.spread*f;
   const y=base+nz(k+(o.seed||0),x,o.t)*o.amp*f*(o.order?.55:1)*(1-fl);pts.push([x,y+curDy(x,base)*f])}
  lanes.push(pts)}
 const P=o.pulse,one=[];const sp=x=>{const u=(x-P.x)/P.w;if(Math.abs(u)>1.2)return 0;const g=(c,w,a)=>a*Math.exp(-((u-c)*(u-c))/(2*w*w));return -g(-.05,.07,P.up)+g(.16,.07,P.dn)+g(-.42,.12,P.dn*.18)};
 const xe=o.xd-(o.gap||0);
 for(let x=o.xc;x<=xe;x+=step*.5){const w=cur.s?Math.exp(-Math.pow((x-cur.x)/(cur.r*.9),2))*Math.exp(-Math.abs(o.y-cur.y)/(cur.r*.8))*Math.sin((x-cur.x)*.09+o.t*7)*cur.s*5:0;one.push([x,o.y+sp(x)*(P.k==null?1:P.k)*(1-fl)+w])}
 if(o.dot){const l=one[one.length-1];for(let i=1;i<=28;i++){const u=i/28;one.push([mix(l[0],o.dot[0],u),mix(l[1],o.dot[1],sm(u))])}}
 return {lanes,one}}
// trazo con cabeza: dibuja hasta x<=head (interpolando el último segmento)
function stroke(ctx,pts,head=Infinity,from=0){if(pts.length<2)return;ctx.beginPath();let started=false;
 for(let i=from;i<pts.length;i++){const p=pts[i];if(p[0]>head&&i>0){const q=pts[i-1];if(q[0]<head){const u=(head-q[0])/(p[0]-q[0]);ctx.lineTo(mix(q[0],p[0],u),mix(q[1],p[1],u))}break}
  started?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);started=true}ctx.stroke()}
// remuestreo por longitud de arco (para transformar una línea en otra)
function resample(pts,N){const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));const T=L[L.length-1]||1,out=[];let j=1;
 for(let i=0;i<N;i++){const s=T*i/(N-1);while(j<L.length-1&&L[j]<s)j++;const a=L[j-1],b=L[j],u=b>a?(s-a)/(b-a):0;out.push([mix(pts[j-1][0],pts[j][0],u),mix(pts[j-1][1],pts[j][1],u)])}return out}
function morph(a,b,k,N=480){if(k<=0)return a;const A=resample(a,N),B=resample(b,N);if(k>=1)return B;return A.map((p,i)=>[mix(p[0],B[i][0],k),mix(p[1],B[i][1],k)])}
// lienzo a DPR 2 (líneas con antialiasing nítido)
function canvas(cv){const ctx=cv.getContext('2d');const st={w:0,h:0,dpr:1};
 st.size=(w,h)=>{const d=Math.min(2,Math.max(1,devicePixelRatio||1));if(w===st.w&&h===st.h&&d===st.dpr)return;st.w=w;st.h=h;st.dpr=d;cv.width=Math.round(w*d);cv.height=Math.round(h*d);cv.style.width=w+'px';cv.style.height=h+'px'};
 st.begin=()=>{ctx.setTransform(st.dpr,0,0,st.dpr,0,0);ctx.clearRect(0,0,st.w,st.h);ctx.lineJoin='round';ctx.lineCap='round'};return Object.assign(st,{ctx})}
// bucle: rAF con pausa fuera de pantalla; con window.__CAP, fotogramas deterministas
function loop(draw,el){const t0=performance.now();let last=t0,raf=0,vis=true;
 if(window.__CAP){window.__CAP.frame=(t,inp)=>draw(t,inp||{},1/60);return}
 const f=n=>{const dt=Math.min(.05,(n-last)/1000);last=n;draw((n-t0)/1000,null,dt);raf=vis?requestAnimationFrame(f):0};
 if(el&&'IntersectionObserver' in window){const els=[].concat(el).filter(Boolean),on=new Map();const io=new IntersectionObserver(e=>{e.forEach(x=>on.set(x.target,x.isIntersecting));vis=[...on.values()].some(Boolean);if(vis&&!raf){last=performance.now();raf=requestAnimationFrame(f)}});els.forEach(x=>io.observe(x))}
 raf=requestAnimationFrame(f)}
// cursor con amortiguación crítica (no lineal): devuelve {x,y,s} suavizados
function pointer(el){const P={x:-1e4,y:-1e4,tx:-1e4,ty:-1e4,s:0,ts:0};
 addEventListener('pointermove',e=>{P.tx=e.clientX;P.ty=e.clientY;P.ts=1;if(P.x<-1e3){P.x=P.tx;P.y=P.ty}},{passive:true});
 document.addEventListener('pointerleave',()=>{P.ts=0});
 P.step=(dt,inp)=>{if(inp&&inp.mx!=null){P.x=inp.mx;P.y=inp.my;P.s=inp.ms==null?1:inp.ms;return P}const a=1-Math.exp(-dt*9),b=1-Math.exp(-dt*4);P.x+=(P.tx-P.x)*a;P.y+=(P.ty-P.y)*a;P.s+=(P.ts-P.s)*b;return P};return P}
// geometría de un <svg> de contornos: matriz a pantalla, Path2D de las letras y cajas por glifo
function svgGeo(svg){const c=svg.getScreenCTM();if(!c)return null;const m=new DOMMatrix([c.a,c.b,c.c,c.d,c.e,c.f]);
 const glyph=new Path2D();svg.querySelectorAll('.gl path:not(.dt)').forEach(p=>glyph.addPath(new Path2D(p.getAttribute('d')),m));
 const L=JSON.parse(svg.dataset.l);const P=(x,y)=>{const q=m.transformPoint(new DOMPoint(x,y));return [q.x,q.y]};return {m,glyph,L,P,s:Math.hypot(m.a,m.b)}}
// centro y radio del punto de un <span class="dot">: medido con el propio texto
const _mc=typeof document!=='undefined'?document.createElement('canvas').getContext('2d'):null;
function dotOf(span){const r=span.getBoundingClientRect();const cs=getComputedStyle(span);_mc.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
 const mt=_mc.measureText('.');const base=r.top+(r.height-(mt.fontBoundingBoxAscent+mt.fontBoundingBoxDescent))/2+mt.fontBoundingBoxAscent;
 const x0=r.left+mt.actualBoundingBoxLeft*-1,x1=r.left+mt.actualBoundingBoxRight;const rr=(x1-x0)/2;return {x:(x0+x1)/2,y:base-mt.actualBoundingBoxAscent/2,r:rr}}
const Sig={E,cl,seg,mix,sm,nz,trace,stroke,resample,morph,canvas,loop,pointer,svgGeo,dotOf};root.Sig=Sig;if(typeof module!=='undefined')module.exports=Sig;
})(typeof window!=='undefined'?window:globalThis);
