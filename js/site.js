(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Slow fireflies add a little evening magic without competing with the content.
  var field = document.getElementById('ambientParticles');
  if(field && !reduceMotion){
    for(var i = 0; i < 18; i++){
      var light = document.createElement('span');
      light.className = 'firefly';
      light.style.left = (5 + Math.random() * 90) + '%';
      light.style.top = (10 + Math.random() * 78) + '%';
      light.style.setProperty('--duration', (10 + Math.random() * 11) + 's');
      light.style.setProperty('--delay', (-Math.random() * 16) + 's');
      light.style.setProperty('--drift', (Math.random() * 32 - 16) + 'px');
      field.appendChild(light);
    }
  }

  // Reveal story sections as they enter the viewport; keep content visible for reduced motion.
  var revealItems = document.querySelectorAll('.reveal');
  if(reduceMotion || !('IntersectionObserver' in window)){
    revealItems.forEach(function(item){ item.classList.add('is-visible'); });
  } else {
    document.documentElement.classList.add('motion-ready');
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -24px 0px' });
    revealItems.forEach(function(item){ observer.observe(item); });
  }

  // Chapter cards and keepsake thumbnails share one accessible photo viewer.
  var chapterCards = document.querySelectorAll('.chapter-card[data-chapter]');
  var memoryThumbs = document.querySelectorAll('.memory-thumb[data-memory]');
  var featuredMemory = document.getElementById('featuredMemory');
  var memoryChapter = document.getElementById('memoryChapter');
  var memoryCaption = document.getElementById('memoryCaption');
  var chapterMemories = [
    { file:'memory-1.jpg', chapter:'Chapter One', title:'The Beginning', alt:'Savian in a blue cap and red top' },
    { file:'memory-2.jpg', chapter:'Chapter Two', title:'First Smiles', alt:'Savian in a green cap and orange top' },
    { file:'memory-3.jpg', chapter:'Chapter Three', title:'Growing Strong', alt:'Savian wearing a colorful winter hat and blue outfit' },
    { file:'memory-4.jpg', chapter:'Chapter Four', title:'The First Adventure', alt:'Savian in an orange hood beside his half-birthday sign' }
  ];
  function showMemory(index, scrollToGallery){
    var memory = chapterMemories[index];
    if(!memory || !featuredMemory) return;
    featuredMemory.src = 'assets/img/' + memory.file;
    featuredMemory.alt = memory.alt + ', ' + memory.chapter + ': ' + memory.title;
    memoryChapter.textContent = memory.chapter;
    memoryCaption.textContent = memory.title;
    chapterCards.forEach(function(card){
      var selected = Number(card.dataset.chapter) === index;
      card.setAttribute('aria-pressed', String(selected));
      card.classList.toggle('is-selected', selected);
    });
    memoryThumbs.forEach(function(thumb){
      var selected = Number(thumb.dataset.memory) === index;
      thumb.setAttribute('aria-pressed', String(selected));
      thumb.classList.toggle('is-active', selected);
    });
    if(scrollToGallery){
      var gallery = document.getElementById('memoryGallery');
      if(gallery) gallery.scrollIntoView({behavior:reduceMotion ? 'auto' : 'smooth', block:'center'});
    }
  }
  chapterCards.forEach(function(card){
    card.addEventListener('click', function(){ showMemory(Number(card.dataset.chapter), true); });
    card.addEventListener('keydown', function(event){
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        showMemory(Number(card.dataset.chapter), true);
      }
    });
  });
  memoryThumbs.forEach(function(thumb){
    thumb.addEventListener('click', function(){ showMemory(Number(thumb.dataset.memory), false); });
  });
  if(chapterCards.length) showMemory(0, false);

  var grid = document.getElementById('godparentGrid');
  if(grid && window.SAVIAN_PEOPLE){
    window.SAVIAN_PEOPLE.forEach(function(person){
      var card = document.createElement('article');
      card.className = 'god-card ' + person.role;
      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = person.role === 'ninong' ? 'Godfather' : 'Godmother';
      var avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = person.label.charAt(0) + person.n;
      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = person.name;
      var role = document.createElement('div');
      role.className = 'role';
      role.textContent = 'A guide for Savian’s journey';
      card.append(tag, avatar, name, role);
      grid.appendChild(card);
    });
  }
})();
