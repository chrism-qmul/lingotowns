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
  scene1: new Howl({
     src: [
        '/story/scene1.mp3'
     ]
  }),
  scene2: new Howl({
    src: [
       '/story/scene2.mp3'
    ]
 }),
  scene3: new Howl({
    src: [
      '/story/scene3.wav'
    ]
  })


}
newGameButton.onclick = function() {
  startStory();
  music.scene1.play();
  swiper.update();
  player1.seek(0);

};

function playAnimation() {
  if (swiper.activeIndex === 0){
    player1.seek(0);
    player1.play();
    music.scene1.play();
    music.scene2.stop();
    music.scene3.stop();
  } else if (swiper.activeIndex === 1) {
    player2.seek(0);
    player2.play();
    music.scene2.play();
    music.scene3.stop();
    music.scene1.stop();
  } else if (swiper.activeIndex === 2) {
    player3.seek(100);
    player3.play();
    music.scene3.play();
    music.scene2.stop();
    music.scene1.stop();

   } 
  }

// function playSFX() {
//   if (swiper.activeIndex === 1) {



//   } else if (swiper.activeIndex === 2) {

//    } else {

//   }
// }


swiper.on('slideChange', function() {
  // runtypewriters();
  // playSFX();
  // music.scene1.stop();
  // music.scene2.seek(0);
  // music.scene2.play();
  // player2.play();
  // player3.play();
  // player3.seek(100);
  playAnimation();
});

function displayReload(){
  replayButton.classList.add('active-animation');
}

function hideReplay(){
  replayButton.classList.remove('active-animation');
}

function noReplay(){
  replayButton.style.animation = "none";
}

// runtypewriters();

player1.addEventListener('complete', displayReload);
player1.addEventListener('frame', hideReplay);
player2.addEventListener('complete', displayReload);
player2.addEventListener('frame', hideReplay);


// player3.addEventListener('complete', loopPlayer3);
player3.addEventListener('complete', noReplay);
player3.addEventListener('frame', noReplay);



function loopScene (){
  player1.seek(0);
  player1.play();
  player2.seek(0);
  player2.play();
}

//if player3 is complete, play from frame 100

function reverseAnimation (){
  player3.setDirection(-1);
}


// document.getElementById('yesButton').onclick = function() {reverseAnimation()};

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



//make player grey 

function greyOut1 (){
  document.getElementById('image-wrapper1').style.animation = "grey-out 1.5s forwards";
}
function greyOut2 (){
  document.getElementById('image-wrapper2').style.animation = "grey-out2 1.5s forwards";
}
function removeGreyOut1 (){
  document.getElementById('image-wrapper1').style.animation = "none";
}
function removeGreyOut2 (){
  document.getElementById('image-wrapper2').style.animation = "none";
}
function blurOut (){
  document.getElementById('image-wrapper3').style.animation = "blur-out 1.5s forwards";
}
function removeBlurOut (){
  document.getElementById('image-wrapper3').style.animation = "none";
}

// document.getElementById('swiper-button-next').onclick = function() {addPrev()};

player1.addEventListener('complete', greyOut1);
player1.addEventListener('complete', animateButton);
player1.addEventListener('frame', removeGreyOut1);
player2.addEventListener('complete', greyOut2);
player2.addEventListener('complete', animateButton);
// player2.addEventListener('play', addPrev);


player2.addEventListener('play', stopAnimateButton);
player2.addEventListener('frame', removeGreyOut2);

player3.addEventListener('complete', removeAnimateButton);
player3.addEventListener('complete', blurOut);
player3.addEventListener('frame', removeBlurOut);
// player3.addEventListener('frame', removePrev);



var un_mute = document.getElementById('un-mute');

var mute = document.getElementById('mute');

function musicPlays (){
  music.scene1.volume(1);
  music.scene2.volume(1);
  music.scene3.volume(1);
}

function musicStops (){
  music.scene1.volume(0);
  music.scene2.volume(0);
  music.scene3.volume(0);
}



// un_mute.onclick = function(mute) {
//   music.scene1.volume(0);
//   music.scene2.volume(0);
//   music.scene3.volume(0);
// };



mute.onclick = function() {musicPlays()};

unmute.onclick = function() {musicStops()};
