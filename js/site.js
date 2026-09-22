(function(){
  // ---- rainbow hero letters ----
  var colors = ['#E8462B', '#F6B93B', '#4FA8D8', '#2F7A4F', '#FF7FA8'];
  document.querySelectorAll('.rainbow-text').forEach(function(el){
    var text = el.textContent, i = 0;
    el.textContent = '';
    Array.prototype.forEach.call(text, function(ch){
      var span = document.createElement('span');
      span.textContent = ch;
      if(ch !== ' '){ span.style.color = colors[i++ % colors.length]; }
      el.appendChild(span);
    });
  });

  // ---- godparent placeholder cards (ninongs.html only) ----
  var grid = document.getElementById('godparentGrid');
  if(grid && window.SAVIAN_PEOPLE){
    window.SAVIAN_PEOPLE.forEach(function(p){
      var card = document.createElement('div');
      card.className = 'god-card ' + p.role;
      card.innerHTML =
        '<span class="tag">' + (p.role === 'ninong' ? 'Godfather' : 'Godmother') + '</span>' +
        '<div class="avatar">' + p.label.charAt(0) + p.n + '</div>' +
        '<div class="name">' + p.name + '</div>' +
        '<div class="role">Add relation / message</div>';
      grid.appendChild(card);
    });
  }

  // ---- snowfall ----
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var field = document.getElementById('snowfall');
  if(field && !reduceMotion){
    for(var i = 0; i < 22; i++){
      var f = document.createElement('span');
      f.className = 'flake';
      f.textContent = '❄';
      f.style.left = (Math.random() * 100) + 'vw';
      f.style.fontSize = (10 + Math.random() * 16) + 'px';
      f.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
      f.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
      f.style.animationDuration = (9 + Math.random() * 10) + 's';
      f.style.animationDelay = (Math.random() * 10) + 's';
      field.appendChild(f);
    }
  }
})();
