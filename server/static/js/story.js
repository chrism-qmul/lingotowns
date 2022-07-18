let player1 = document.querySelector("#player1");
let player2 = document.querySelector("#player2");
let player3 = document.querySelector("#player3");

let replayButton = document.querySelector('#replay-icon');
let newGameButton = document.querySelector('#new-game-button');
let swiperContainer = document.querySelector('#swiper-container');


var swiper = new Swiper('.swiper-container', {
  slidesPerView: 1,
  spaceBetween: 20,
  effect: 'fade',
  loop: false,
  preventClicks: false,
  preventClicksPropagation: false,
  speed: 300,
  simulateTouch: false,

  pagination: {
    el: '.swiper-pagination',
    clickable: false,
    dynamicBullets: false,
  },
  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
    Play: '.swiper-button-play',
  }

});


// function typewritereffect($el) {
//   const characters = $el.text().split('');
//   $el.text('');
//   characters.forEach(function(character) { 
//     const $span = $("<span>");
//     $span.text(character);
//     $span.css({opacity:0}).appendTo($el);
//     });
//   const $spans = $("span", $el);
//   $spans.each((i, el) => $(el).delay(40*i).animate({opacity: 1}), 100);
// }

// function runtypewriters() {
//   $("p.typewriter").each((i,el) => typewritereffect($(el)));
// }

function startStory(){
  // alert("I am an alert box!");
  document.getElementById('game-container').style.display='none';
  swiperContainer.style.display='block';
}



var music = {
  overworld: new Howl({
     src: [
        '/story/background.wav'
     ]
  })
}
newGameButton.onclick = function() {
  startStory();
  music.overworld.play();
  swiper.update();

};

swiper.on('slideChange', function() {
  // runtypewriters();
  player2.play();
  player3.play();
  player3.seek(100);
});

function displayReload(){
  replayButton.classList.add('active-animation');
}

function hideReplay(){
  replayButton.classList.remove('active-animation');
}

// runtypewriters();

player1.addEventListener('complete', displayReload);
player2.addEventListener('complete', displayReload);
// player3.addEventListener('complete', displayReload);

player2.addEventListener('play', hideReplay);
player3.addEventListener('frame', hideReplay);


function loopScene (){
  player1.seek(0);
  player1.play();
  player2.seek(0);
  player2.play();
}



replayButton.onclick = function() {hideReplay()};




function animateButton (){
  document.getElementById('swiper-button-next').classList.add('active-animation');
}

function stopAnimateButton (){
  document.getElementById('swiper-button-next').classList.remove('active-animation');
}

function removeAnimateButton (){
  replayButton.style.opacity = 0;
}

function removePrev (){
  document.getElementById('swiper-button-prev').style.opacity = 0;
}

function addPrev (){
  document.getElementById('swiper-button-prev').style.opacity = 1;
}

// document.getElementById('swiper-button-next').onclick = function() {addPrev()};




player1.addEventListener('complete', animateButton);
player2.addEventListener('complete', animateButton);
// player2.addEventListener('play', addPrev);


player2.addEventListener('play', stopAnimateButton);

player3.addEventListener('complete', removeAnimateButton);
// player3.addEventListener('frame', removePrev);


