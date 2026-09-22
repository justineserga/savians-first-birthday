(function(){
  var canvas = document.getElementById('gameCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;

  var GROUND_Y = 180;
  var GRAVITY = 1.0;
  var JUMP_VELOCITY = -13;
  var PLAYER_H = 80;
  var START_SPEED = 4.5;
  var MAX_SPEED = 11;
  var SPEED_RAMP = 0.0016;

  var COLORS = {
    skyTop: '#8FD3F4',
    skyBottom: '#C9ECFB',
    mtn: '#9F8FD6',
    ground: '#FFFFFF',
    groundLine: '#2B2118',
    outline: '#2B2118',
    red: '#E8462B',
    yellow: '#F6B93B',
    blue: '#4FA8D8',
    pine: '#2F7A4F',
    pineDark: '#1F5236',
    peach: '#FFD9B3'
  };

  var runImg = new Image();
  var jumpImg = new Image();
  var imagesReady = 0;
  function onImgLoad(){
    imagesReady++;
  }
  runImg.onload = onImgLoad;
  jumpImg.onload = onImgLoad;
  runImg.src = 'assets/img/sprite-run.png';
  jumpImg.src = 'assets/img/sprite-jump.png';

  var HIGH_SCORE_KEY = 'savianRunHighScore';
  function getHighScore(){
    try { return parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10) || 0; }
    catch(e){ return 0; }
  }
  function setHighScore(v){
    try { localStorage.setItem(HIGH_SCORE_KEY, String(v)); }
    catch(e){ /* ignore */ }
  }

  var state = 'ready'; // ready | playing | gameover
  var player, obstacles, speed, score, spawnTimer, groundOffset, mtnOffset, highScore;

  function resetGame(){
    player = {
      x: 70,
      y: GROUND_Y - PLAYER_H,
      vy: 0,
      grounded: true,
      bob: 0
    };
    obstacles = [];
    speed = START_SPEED;
    score = 0;
    spawnTimer = 60;
    groundOffset = 0;
    mtnOffset = 0;
  }

  function spawnObstacle(){
    var types = ['gift', 'gifttall', 'balloon', 'snowman'];
    var type = types[Math.floor(Math.random() * types.length)];
    var w, h;
    if(type === 'gift'){ w = 34; h = 34; }
    else if(type === 'gifttall'){ w = 30; h = 50; }
    else if(type === 'balloon'){ w = 24; h = 56; }
    else { w = 40; h = 48; }
    obstacles.push({ x: W + 20, w: w, h: h, type: type });

    var gap = 230 + Math.random() * 170;
    spawnTimer = gap / speed;
  }

  function rectsOverlap(a, b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function doAction(){
    if(state === 'ready' || state === 'gameover'){
      resetGame();
      state = 'playing';
      return;
    }
    if(state === 'playing' && player.grounded){
      player.vy = JUMP_VELOCITY;
      player.grounded = false;
    }
  }

  function update(){
    if(state !== 'playing') return;

    speed = Math.min(MAX_SPEED, speed + SPEED_RAMP);
    score += speed * 0.08;

    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y >= GROUND_Y - PLAYER_H){
      player.y = GROUND_Y - PLAYER_H;
      player.vy = 0;
      player.grounded = true;
    }
    player.bob = player.grounded ? Math.sin(Date.now() / 60) * 2.5 : 0;

    groundOffset = (groundOffset + speed) % 40;
    mtnOffset = (mtnOffset + speed * 0.25) % W;

    spawnTimer -= 1;
    if(spawnTimer <= 0) spawnObstacle();

    var playerBox = {
      x: player.x + 10, y: player.y + player.bob + 8,
      w: 30, h: PLAYER_H - 14
    };

    for(var i = obstacles.length - 1; i >= 0; i--){
      var o = obstacles[i];
      o.x -= speed;
      if(o.x + o.w < 0){ obstacles.splice(i, 1); continue; }

      var oBox = { x: o.x + 3, y: GROUND_Y - o.h + 3, w: o.w - 6, h: o.h - 3 };
      if(rectsOverlap(playerBox, oBox)){
        state = 'gameover';
        highScore = getHighScore();
        var finalScore = Math.floor(score);
        if(finalScore > highScore){ setHighScore(finalScore); highScore = finalScore; }
      }
    }
  }

  function drawBackground(){
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, COLORS.skyTop);
    grad.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = COLORS.mtn;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 3;
    for(var pass = 0; pass < 2; pass++){
      var ox = -mtnOffset + pass * W;
      ctx.beginPath();
      ctx.moveTo(ox, GROUND_Y);
      ctx.lineTo(ox + 40, GROUND_Y - 70);
      ctx.lineTo(ox + 100, GROUND_Y - 25);
      ctx.lineTo(ox + 160, GROUND_Y - 90);
      ctx.lineTo(ox + 230, GROUND_Y - 20);
      ctx.lineTo(ox + 300, GROUND_Y - 65);
      ctx.lineTo(ox + 380, GROUND_Y - 15);
      ctx.lineTo(ox + 460, GROUND_Y - 55);
      ctx.lineTo(ox + 540, GROUND_Y - 10);
      ctx.lineTo(ox + 600, GROUND_Y - 45);
      ctx.lineTo(ox + 640, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.strokeStyle = COLORS.groundLine;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(43,33,24,.25)';
    ctx.lineWidth = 3;
    for(var x = -groundOffset; x < W; x += 40){
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 10);
      ctx.lineTo(x + 18, GROUND_Y + 10);
      ctx.stroke();
    }
  }

  function drawObstacle(o){
    var x = o.x, h = o.h, w = o.w, y = GROUND_Y - h;
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.outline;

    if(o.type === 'gift' || o.type === 'gifttall'){
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(x + w / 2 - 3, y, 6, h);
      ctx.fillRect(x, y + h / 2 - 3, w, 6);
      ctx.strokeStyle = COLORS.outline;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 8, y - 8);
      ctx.lineTo(x + w / 2, y);
      ctx.lineTo(x + w / 2 + 8, y - 8);
      ctx.stroke();
    } else if(o.type === 'balloon'){
      var r = w / 2;
      ctx.fillStyle = COLORS.blue;
      ctx.beginPath();
      ctx.ellipse(x + r, y + r + 4, r, r + 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(43,33,24,.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y + h - 8);
      ctx.lineTo(x + r, GROUND_Y);
      ctx.stroke();
    } else { // snowman
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h - 14, 14, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 10, 10, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = COLORS.outline;
      ctx.beginPath();
      ctx.arc(x + w / 2 - 3, y + 9, 1.5, 0, Math.PI * 2);
      ctx.arc(x + w / 2 + 3, y + 9, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.yellow;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + 11);
      ctx.lineTo(x + w / 2 + 8, y + 13);
      ctx.lineTo(x + w / 2, y + 15);
      ctx.fill();
    }
  }

  function drawPlayer(){
    var img = player.grounded ? runImg : jumpImg;
    if(!img.complete || !img.naturalWidth) return;
    var aspect = img.naturalWidth / img.naturalHeight;
    var h = PLAYER_H;
    var w = h * aspect;
    var y = player.y + player.bob;
    ctx.drawImage(img, player.x, y, w, h);
  }

  function drawHUD(){
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.outline;
    ctx.font = "bold 16px 'Baloo 2', sans-serif";
    ctx.fillText('Score ' + Math.floor(score), W - 14, 26);
    ctx.font = "bold 12px 'Baloo 2', sans-serif";
    ctx.fillStyle = '#5B4B3A';
    ctx.fillText('Best ' + Math.max(getHighScore(), Math.floor(score)), W - 14, 44);
    ctx.textAlign = 'left';
  }

  function drawOverlay(lines){
    ctx.fillStyle = 'rgba(255,247,228,.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.outline;
    ctx.font = "bold 22px 'Luckiest Guy', 'Baloo 2', sans-serif";
    ctx.fillText(lines[0], W / 2, H / 2 - 14);
    ctx.font = "bold 14px 'Baloo 2', sans-serif";
    ctx.fillStyle = '#5B4B3A';
    for(var i = 1; i < lines.length; i++){
      ctx.fillText(lines[i], W / 2, H / 2 + 10 + (i - 1) * 20);
    }
    ctx.textAlign = 'left';
  }

  function draw(){
    drawBackground();
    obstacles.forEach(drawObstacle);
    drawPlayer();
    drawHUD();

    if(state === 'ready'){
      drawOverlay(["SAVIAN'S BIG RUN", 'Press Space or Tap to Start']);
    } else if(state === 'gameover'){
      drawOverlay(['GAME OVER', 'Score ' + Math.floor(score) + '  ·  Best ' + getHighScore(), 'Press Space or Tap to Restart']);
    }
  }

  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }

  resetGame();
  requestAnimationFrame(loop);

  window.addEventListener('keydown', function(e){
    if(e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'ArrowUp'){
      e.preventDefault();
      doAction();
    }
  });
  canvas.addEventListener('pointerdown', function(e){ e.preventDefault(); doAction(); });
  var jumpBtn = document.getElementById('jumpBtn');
  if(jumpBtn){
    jumpBtn.addEventListener('click', function(){ doAction(); });
  }
})();
