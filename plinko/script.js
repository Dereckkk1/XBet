const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

const pegs = [];
const balls = [];
const particles = [];

const slots = [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];
const slotWidth = width / slots.length;

let currentAudio = null;

const sounds = {
  0.2: 'sounds/Track1_Instrumento.m4a',
  2: 'sounds/Track2_Instrumento.m4a',
  4: 'sounds/Track3_Instrumento.m4a',
  9: 'sounds/Track4_Instrumento.m4a',
  26: 'sounds/Track5_Instrumento.m4a',
  130: 'sounds/Track6_Instrumento.m4a',
  1000: 'sounds/Track7_Instrumento.m4a'
};

function playSound(multiplier) {
  const soundFile = sounds[multiplier];
  if (soundFile) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(soundFile);
    currentAudio.play();
  }
}

let balance = 0;
let score = 0;
let totalDrops = 0;

document.getElementById('balance').textContent = balance.toFixed(2);

function deposit() {
  const value = parseFloat(document.getElementById('depositInput').value);
  if (value > 0) {
    balance += value;
    document.getElementById('balance').textContent = balance.toFixed(2);
  }
}

class Peg {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 4;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    // ctx.fillStyle = '#f39c12';
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
  }
}

class Ball {
  constructor(x, y, bet) {
    this.x = x;
    this.y = y;
    this.radius = 6;
    this.dy = 0;
    this.dx = 0;
    this.stopped = false;
    this.bet = bet;
  }

  update() {
    if (this.stopped) return;

    this.dy += 0.2;
    this.y += this.dy;
    this.x += this.dx;

    if (this.x < this.radius || this.x > width - this.radius) {
      this.dx *= -0.6;
      this.x = Math.max(this.radius, Math.min(this.x, width - this.radius));
    }

    for (let peg of pegs) {
      const dx = this.x - peg.x;
      const dy = this.y - peg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = this.radius + peg.radius;

      if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        const repel = 2;
        this.dx += Math.cos(angle) * repel;
        this.dy += Math.sin(angle) * repel;

        const center = width / 2;
        const bias = (this.x - center) / center;

        let biasMultiplier = 14;
        if (totalDrops % 100 === 0 && totalDrops !== 0) {
          biasMultiplier = 2;
        } else if (totalDrops % 50 === 0 && totalDrops !== 0) {
          biasMultiplier = 5;
        } else if (totalDrops % 10 === 0 && totalDrops !== 0) {
          biasMultiplier = 10;
        }

        if (Math.abs(bias) < 0.05) {
          this.dx += (Math.random() - 0.5);
        } else {
          this.dx -= bias * Math.abs(bias) * biasMultiplier;
        }

        this.dx *= 0.7;
        this.dy *= 0.7;
      }
    }

    if (this.y > height - 30 && !this.stopped) {
      const index = Math.floor(this.x / slotWidth);
      const multiplier = slots[index] || 0;
      const gain = this.bet * multiplier;

      balance += gain;
      document.getElementById('balance').textContent = balance.toFixed(2);

      this.stopped = true;
      showScoreText(this.x, this.y, `x${multiplier}`);
      generateParticles(this.x, this.y);
      playSound(multiplier); // Som é tocado somente ao parar
    }
  }

  draw() {
    if (this.stopped) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f39c12';
    ctx.fill();
    ctx.closePath();
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 3 + 2;
    this.dx = (Math.random() - 0.5) * 6;
    this.dy = (Math.random() - 0.5) * 6;
    this.alpha = 1;
    this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.alpha -= 0.02;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${this.alpha})`);
    ctx.fill();
  }
}

function generateParticles(x, y) {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x, y));
  }
}

function createPyramidPegs() {
  const spacingX = 43;
  const spacingY = 43;
  const rows = 17;
  const centerX = width / 2;
  const startY = 60;

  for (let row = 0; row < rows; row++) {
    const y = startY + row * spacingY;
    const pegsInRow = row + 1;
    const rowWidth = spacingX * (pegsInRow - 1);
    const offsetX = centerX - rowWidth / 2;

    for (let i = 0; i < pegsInRow; i++) {
      if (row === 0 && i === 0) continue;
      const x = offsetX + i * spacingX;
      pegs.push(new Peg(x, y));
    }
  }
}

function playAll() {
  if (balance <= 0) {
    alert("Saldo insuficiente para jogar tudo.");
    return;
  }

  document.getElementById("betAmount").value = balance.toFixed(2); // define aposta igual ao saldo
  dropBall(); // executa a jogada com o saldo total
}
function confirmPlayAll() {
    if (balance <= 0) {
      alert("Saldo insuficiente para jogar tudo.");
      return;
    }
    document.getElementById("confirmationModal").style.display = "flex";
  }
  
  function closeModal() {
    document.getElementById("confirmationModal").style.display = "none";
  }
  
  function playAll() {
    document.getElementById("confirmationModal").style.display = "none";
    document.getElementById("betAmount").value = balance.toFixed(2);
    dropBall();
  }
  

  function drawSlots() {
    const spacing = 5;
    const adjustedSlotWidth = slotWidth - spacing;
    const center = (slots.length - 1) / 2;
  
    for (let i = 0; i < slots.length; i++) {
      const x = i * slotWidth + spacing / 2;
  
      // Distância relativa ao centro
      const distanceFromCenter = Math.abs(i - center) / center;
  
      // Gradiente de verde
      const green = Math.floor(10 + distanceFromCenter * (255 - 50));
  
      // Slot com cantos arredondados
      const y = height - 30;
      const radius = 10;
  
      ctx.beginPath();
      ctx.fillStyle = `rgb(192, ${green}, 43)`;
      ctx.roundRect?.(x, y, adjustedSlotWidth, 30, radius); // para navegadores com suporte
      if (!ctx.roundRect) {
        // Fallback se roundRect não existir
        roundedRect(ctx, x, y, adjustedSlotWidth, 30, radius);
      }
      ctx.fill();
  
        // Texto do multiplicador
        ctx.fillStyle = '#000'; // cor preta
        ctx.font = 'bold 12px Arial'; // fonte um pouco menor
        ctx.textAlign = 'center';
        ctx.fillText(`x${slots[i]}`, x + adjustedSlotWidth / 2, height - 10);

    }
  }
  
  // Fallback para browsers sem ctx.roundRect
  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
function dropBall() {
  const bet = parseFloat(document.getElementById('betAmount').value);
  if (isNaN(bet) || bet <= 0) return alert('Valor inválido');
  if (balance < bet) return alert('Saldo insuficiente');

  balance -= bet;
  document.getElementById('balance').textContent = balance.toFixed(2);

  totalDrops++;
  balls.push(new Ball(width / 2, 30, bet));
}

const floatingScores = [];

function showScoreText(x, y, value) {
  floatingScores.push({ x, y, value, alpha: 1 });
}

function drawFloatingScores() {
  for (let i = 0; i < floatingScores.length; i++) {
    const fs = floatingScores[i];
    ctx.font = '18px Arial';
    ctx.fillStyle = `rgba(255, 255, 0, ${fs.alpha})`;
    ctx.fillText(fs.value, fs.x, fs.y);
    fs.y -= 1;
    fs.alpha -= 0.02;
    if (fs.alpha <= 0) floatingScores.splice(i--, 1);
  }
}

function updateAndDrawParticles() {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.alpha <= 0) particles.splice(i--, 1);
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  for (let peg of pegs) peg.draw();
  drawSlots();
  for (let ball of balls) {
    ball.update();
    ball.draw();
  }
  drawFloatingScores();
  updateAndDrawParticles();
  requestAnimationFrame(animate);
}

createPyramidPegs();
animate();


// Função para abrir e fechar o menu
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    sideMenu.classList.toggle('open');
  }
  
  // Fechar o menu ao clicar fora dele
  document.addEventListener('click', function(event) {
    const sideMenu = document.getElementById('sideMenu');
    const menuIcon = document.getElementById('menuIcon');
  
    // Verifica se o clique foi fora do menu e do ícone
    if (!sideMenu.contains(event.target) && !menuIcon.contains(event.target)) {
      sideMenu.classList.remove('open');
    }
  });
  