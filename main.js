/* =========================================================
   Fondo animado en Canvas: “Oro en suspensión”
   - Partículas doradas flotando
   - Conexiones suaves cerca del cursor
   - Rendimiento adaptativo
   ========================================================= */

const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d', { alpha: true });
let w, h, dpr, particles = [], mouse = { x: null, y: null, active: false };

// Dimensiones y DPR
function resize(){
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = canvas.width = Math.floor(innerWidth * dpr);
  h = canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
}
addEventListener('resize', resize);
resize();

// Utilidad random
const rnd = (min, max) => Math.random() * (max - min) + min;

// Partícula dorada
class Particle{
  constructor(){
    this.reset(true);
  }
  reset(spawnAnywhere = false){
    this.x = spawnAnywhere ? rnd(0, w) : (mouse.x ?? w/2);
    this.y = spawnAnywhere ? rnd(0, h) : (mouse.y ?? h/2);
    const speed = rnd(.05, .35) * dpr;
    const ang = rnd(0, Math.PI * 2);
    this.vx = Math.cos(ang) * speed;
    this.vy = Math.sin(ang) * speed;
    this.r = rnd(0.8, 2.2) * dpr;
    this.alpha = rnd(0.25, 0.9);
    // paleta dorada (ligero jitter)
    const golds = ['#ffd700', '#f7e27d', '#d4af37', '#b8860b'];
    this.color = golds[(Math.random() * golds.length) | 0];
  }
  update(){
    // ligera atracción al mouse si está activo
    if(mouse.active && mouse.x != null){
      const dx = (mouse.x - this.x);
      const dy = (mouse.y - this.y);
      const dist2 = dx*dx + dy*dy;
      const influence = Math.min(120 * dpr, Math.max(50 * dpr, 160 * dpr));
      if(dist2 < (influence*influence)){
        const f = 0.0008 * dpr;
        this.vx += dx * f;
        this.vy += dy * f;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    // rebote suave en bordes
    if(this.x < 0 || this.x > w) this.vx *= -1, this.x = Math.max(0, Math.min(w, this.x));
    if(this.y < 0 || this.y > h) this.vy *= -1, this.y = Math.max(0, Math.min(h, this.y));
  }
  draw(){
    const r = this.r;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 3);
    g.addColorStop(0, this.hexToRgba(this.color, Math.min(1, this.alpha)));
    g.addColorStop(1, this.hexToRgba(this.color, 0));

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  hexToRgba(hex, a=1){
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }
}

// Crear partículas según área (cupo máximo)
function initParticles(){
  const target = Math.min(160, Math.max(60, Math.floor((innerWidth * innerHeight) / 15000)));
  particles = [];
  for(let i=0; i<target; i++) particles.push(new Particle());
}
initParticles();

addEventListener('resize', initParticles);

// Interacción de mouse
addEventListener('mousemove', (e)=>{
  mouse.x = e.clientX * dpr;
  mouse.y = e.clientY * dpr;

  // efecto de halo en las tarjetas (CSS var)
  const cards = document.querySelectorAll('.link-card');
  cards.forEach(card=>{
    const rect = card.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * 100;
    const my = (e.clientY - rect.top) / rect.height * 100;
    card.style.setProperty('--mx', `${mx}%`);
    card.style.setProperty('--my', `${my}%`);
  });
  mouse.active = true;
});
addEventListener('mouseleave', ()=>{ mouse.active = false; });

addEventListener('click', ()=>{
  // “chispa” rápida: reinicia algunas partículas cerca del cursor
  for(let i=0;i<6;i++){
    const p = particles[(Math.random()*particles.length)|0];
    p.x = mouse.x ?? w/2;
    p.y = mouse.y ?? h/2;
    const ang = rnd(0, Math.PI*2);
    const speed = rnd(0.6, 1.6) * dpr;
    p.vx = Math.cos(ang) * speed;
    p.vy = Math.sin(ang) * speed;
    p.alpha = 0.95;
  }
});

// Dibujar líneas suaves entre partículas cercanas
function drawConnections(){
  const maxDist = 120 * dpr;
  ctx.lineWidth = 0.6 * dpr;
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d2 = dx*dx + dy*dy;
      if(d2 < maxDist*maxDist){
        const alpha = 0.25 * (1 - (Math.sqrt(d2)/maxDist));
        ctx.strokeStyle = `rgba(255,215,0,${alpha})`; // dorado translúcido
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
}

// Loop
function loop(){
  // limpiar
  ctx.clearRect(0, 0, w, h);

  // actualizar + dibujar partículas
  for(const p of particles){ p.update(); p.draw(); }

  // conexiones sutiles
  drawConnections();

  requestAnimationFrame(loop);
}
loop();

// Año en footer
document.getElementById('y').textContent = new Date().getFullYear();
