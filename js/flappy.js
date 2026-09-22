(function(){
  // ===== Optional Firebase leaderboard (loaded dynamically so a missing =====
  // ===== config or no internet at the venue never breaks the game itself =====
  var FIREBASE_APP_URL = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
  var FIREBASE_FS_URL = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
  var cfg = window.SAVIAN_FIREBASE_CONFIG || {};
  var firebaseReady = false;
  var db = null, fs = null;

  function isConfigured(){
    return !!(cfg.apiKey && cfg.apiKey !== 'YOUR_API_KEY' && cfg.projectId && cfg.projectId !== 'YOUR_PROJECT_ID');
  }

  async function initFirebase(){
    if(!isConfigured()) return;
    try {
      var appMod = await import(FIREBASE_APP_URL);
      fs = await import(FIREBASE_FS_URL);
      var app = appMod.initializeApp(cfg);
      db = fs.getFirestore(app);
      firebaseReady = true;
    } catch(e){
      console.error('Birthday Flappy: leaderboard unavailable —', e);
      firebaseReady = false;
    }
  }
  initFirebase();

  async function submitScore(name, score){
    if(!firebaseReady) return false;
    try {
      await fs.addDoc(fs.collection(db, 'scores'), {
        name: name, score: Math.floor(score), createdAt: fs.serverTimestamp()
      });
      return true;
    } catch(e){
      console.error('submitScore failed:', e);
      return false;
    }
  }

  async function fetchLeaderboard(){
    if(!firebaseReady) return null;
    try {
      // Pull more than we need, then keep only each player's best score —
      // the query is already sorted desc, so the first row seen per name is their best.
      var q = fs.query(fs.collection(db, 'scores'), fs.orderBy('score', 'desc'), fs.limit(50));
      var snap = await fs.getDocs(q);
      var bestByName = {};
      var order = [];
      snap.forEach(function(doc){
        var d = doc.data();
        var key = String(d.name || '').trim().toLowerCase();
        if(!(key in bestByName)){
          bestByName[key] = d;
          order.push(key);
        }
      });
      return order.map(function(key){ return bestByName[key]; }).slice(0, 10);
    } catch(e){
      console.error('fetchLeaderboard failed:', e);
      return null;
    }
  }

  // ===== DOM refs =====
  var playerSelect = document.getElementById('playerSelect');
  var gamePanel = document.getElementById('gamePanel');
  var leaderboardPanel = document.getElementById('leaderboardPanel');
  var playerGrid = document.getElementById('playerGrid');
  var playingAsName = document.getElementById('playingAsName');
  var changePlayerBtn = document.getElementById('changePlayerBtn');
  var flapBtn = document.getElementById('flapBtn');
  var viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
  var playAgainBtn = document.getElementById('playAgainBtn');
  var refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn');
  var leaderboardList = document.getElementById('leaderboardList');
  var leaderboardStatus = document.getElementById('leaderboardStatus');
  var canvas = document.getElementById('gameCanvas');
  if(!canvas || !playerSelect) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;

  var currentPlayer = null;

  function showPanel(panel){
    [playerSelect, gamePanel, leaderboardPanel].forEach(function(p){ p.hidden = (p !== panel); });
  }

  // ===== Player select =====
  (window.SAVIAN_PEOPLE || []).forEach(function(p){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'player-btn ' + p.role;
    btn.innerHTML =
      '<span class="player-avatar">' + p.label.charAt(0) + p.n + '</span>' +
      '<span class="player-name">' + p.name + '</span>';
    btn.addEventListener('click', function(){
      currentPlayer = p.name;
      playingAsName.textContent = currentPlayer;
      resetGame();
      state = 'ready';
      showPanel(gamePanel);
    });
    playerGrid.appendChild(btn);
  });

  changePlayerBtn.addEventListener('click', function(){ showPanel(playerSelect); });

  // ===== Game constants (tuned slow + forgiving for a casual party crowd) =====
  var GROUND_H = 44;
  var GROUND_Y = H - GROUND_H;
  var GRAVITY = 0.32;
  var MAX_FALL = 9;
  var FLAP_VELOCITY = -6.2;
  var BIRD_SIZE = 38;
  var BIRD_X = 90;
  var PIPE_W = 56;
  var GAP_H = 172;
  var PIPE_SPEED_BASE = 2.0;
  var PIPE_SPEED_MAX = 4.5;
  var PIPE_SPEED_RAMP = 0.05; // speed added per point scored
  var SPAWN_INTERVAL = 150;

  var COLORS = {
    skyTop: '#8FD3F4', skyBottom: '#C9ECFB',
    ground: '#FFFFFF', groundLine: '#2B2118', outline: '#2B2118',
    red: '#E8462B', yellow: '#F6B93B', blue: '#4FA8D8'
  };

  var birdImg = new Image();
  birdImg.src = 'assets/img/bird.png';

  var HIGH_SCORE_KEY = 'savianFlappyHighScore';
  function getHighScore(){
    try { return parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10) || 0; }
    catch(e){ return 0; }
  }
  function setHighScore(v){
    try { localStorage.setItem(HIGH_SCORE_KEY, String(v)); } catch(e){ /* ignore */ }
  }

  var state = 'ready'; // ready | playing | gameover
  var bird, pipes, score, spawnTimer, scoreSubmitted;

  function resetGame(){
    bird = { y: H / 2 - BIRD_SIZE / 2, vy: 0, rot: 0 };
    pipes = [];
    score = 0;
    spawnTimer = SPAWN_INTERVAL;
    scoreSubmitted = false;
  }
  resetGame();

  function spawnPipe(){
    var margin = 60;
    var minTop = margin;
    var maxTop = GROUND_Y - margin - GAP_H;
    var top = minTop + Math.random() * Math.max(10, maxTop - minTop);
    pipes.push({ x: W + 10, top: top, passed: false });
    spawnTimer = SPAWN_INTERVAL;
  }

  function rectsOverlap(a, b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function doFlap(){
    if(state === 'ready'){ state = 'playing'; }
    else if(state === 'gameover'){ resetGame(); state = 'playing'; }
    bird.vy = FLAP_VELOCITY;
  }

  function endGame(){
    state = 'gameover';
    var hs = getHighScore();
    var final = Math.floor(score);
    if(final > hs) setHighScore(final);
    if(!scoreSubmitted && currentPlayer){
      scoreSubmitted = true;
      submitScore(currentPlayer, final);
    }
  }

  function update(){
    if(state !== 'playing') return;

    bird.vy += GRAVITY;
    if(bird.vy > MAX_FALL) bird.vy = MAX_FALL;
    bird.y += bird.vy;
    bird.rot = Math.max(-25, Math.min(75, bird.vy * 4.5));

    if(bird.y < 0){ bird.y = 0; bird.vy = 0; }
    if(bird.y + BIRD_SIZE >= GROUND_Y){
      bird.y = GROUND_Y - BIRD_SIZE;
      endGame();
      return;
    }

    spawnTimer -= 1;
    if(spawnTimer <= 0) spawnPipe();

    var birdBox = { x: BIRD_X + 6, y: bird.y + 6, w: BIRD_SIZE - 12, h: BIRD_SIZE - 12 };
    var pipeSpeed = Math.min(PIPE_SPEED_MAX, PIPE_SPEED_BASE + score * PIPE_SPEED_RAMP);

    for(var i = pipes.length - 1; i >= 0; i--){
      var p = pipes[i];
      p.x -= pipeSpeed;
      if(p.x + PIPE_W < 0){ pipes.splice(i, 1); continue; }

      if(!p.passed && p.x + PIPE_W < BIRD_X){
        p.passed = true;
        score += 1;
      }

      var topBox = { x: p.x, y: 0, w: PIPE_W, h: p.top };
      var botBox = { x: p.x, y: p.top + GAP_H, w: PIPE_W, h: GROUND_Y - (p.top + GAP_H) };
      if(rectsOverlap(birdBox, topBox) || rectsOverlap(birdBox, botBox)){
        endGame();
        return;
      }
    }
  }

  function drawStack(x, y, w, h, fromBottom){
    if(h <= 0) return;
    var boxH = 30;
    var count = Math.ceil(h / boxH);
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.outline;
    for(var i = 0; i < count; i++){
      var by = fromBottom ? (y + h - (i + 1) * boxH) : (y + i * boxH);
      var bh = Math.min(boxH, h - i * boxH);
      if(by < y){ bh += (by - y); by = y; }
      if(bh <= 0) continue;
      ctx.fillStyle = (i % 2 === 0) ? COLORS.red : COLORS.blue;
      ctx.fillRect(x, by, w, bh);
      ctx.strokeRect(x, by, w, bh);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(x + w / 2 - 3, by, 6, bh);
    }
  }

  function drawPipe(p){
    drawStack(p.x, 0, PIPE_W, p.top, true);
    drawStack(p.x, p.top + GAP_H, PIPE_W, GROUND_Y - (p.top + GAP_H), false);
  }

  function drawBackground(){
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, COLORS.skyTop);
    grad.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GROUND_Y, W, GROUND_H);
    ctx.strokeStyle = COLORS.groundLine;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();
  }

  function drawBird(){
    ctx.save();
    ctx.translate(BIRD_X + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2);
    ctx.rotate(bird.rot * Math.PI / 180);
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    if(birdImg.complete && birdImg.naturalWidth){
      ctx.drawImage(birdImg, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
    } else {
      ctx.fillStyle = '#FFD9B3';
      ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
    }
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.outline;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawHUD(){
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.outline;
    ctx.font = "bold 30px 'Luckiest Guy', 'Baloo 2', sans-serif";
    ctx.fillText(String(Math.floor(score)), W / 2, 56);
    ctx.textAlign = 'left';
  }

  function drawOverlay(lines){
    ctx.fillStyle = 'rgba(255,247,228,.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.outline;
    ctx.font = "bold 26px 'Luckiest Guy', 'Baloo 2', sans-serif";
    ctx.fillText(lines[0], W / 2, H / 2 - 30);
    ctx.font = "bold 16px 'Baloo 2', sans-serif";
    ctx.fillStyle = '#5B4B3A';
    for(var i = 1; i < lines.length; i++){
      ctx.fillText(lines[i], W / 2, H / 2 - 2 + (i - 1) * 24);
    }
    ctx.textAlign = 'left';
  }

  function draw(){
    drawBackground();
    pipes.forEach(drawPipe);
    drawBird();
    drawHUD();

    if(state === 'ready'){
      drawOverlay(["BIRTHDAY FLAPPY", 'Press Space or Tap to Start']);
    } else if(state === 'gameover'){
      drawOverlay(['GAME OVER', 'Score ' + Math.floor(score) + '  ·  Best ' + getHighScore(), 'Tap / Space to Retry']);
    }
  }

  function loop(){
    if(!gamePanel.hidden){
      update();
      draw();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('keydown', function(e){
    if(gamePanel.hidden) return;
    if(e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'ArrowUp'){
      e.preventDefault();
      doFlap();
    }
  });
  canvas.addEventListener('pointerdown', function(e){ e.preventDefault(); doFlap(); });
  flapBtn.addEventListener('click', function(){ doFlap(); });

  // ===== Leaderboard =====
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderLeaderboard(rows){
    leaderboardList.innerHTML = '';
    if(rows === null){
      leaderboardStatus.textContent = '🔌 Leaderboard isn’t connected yet — finish the Firebase step in the README to turn it on.';
      return;
    }
    if(rows.length === 0){
      leaderboardStatus.textContent = 'No scores yet — be the first!';
      return;
    }
    leaderboardStatus.textContent = '';
    rows.forEach(function(row, i){
      var li = document.createElement('li');
      li.className = 'leaderboard-row';
      li.innerHTML =
        '<span class="lb-rank">' + (i + 1) + '</span>' +
        '<span class="lb-name">' + escapeHtml(row.name || '?') + '</span>' +
        '<span class="lb-score">' + Math.floor(row.score || 0) + '</span>';
      leaderboardList.appendChild(li);
    });
  }

  async function openLeaderboard(){
    showPanel(leaderboardPanel);
    leaderboardStatus.textContent = 'Loading…';
    leaderboardList.innerHTML = '';
    var rows = await fetchLeaderboard();
    renderLeaderboard(rows);
  }

  viewLeaderboardBtn.addEventListener('click', openLeaderboard);
  refreshLeaderboardBtn.addEventListener('click', openLeaderboard);
  playAgainBtn.addEventListener('click', function(){
    resetGame();
    state = 'ready';
    showPanel(gamePanel);
  });
})();
