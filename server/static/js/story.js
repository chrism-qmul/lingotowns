let player1 = document.querySelector("#player1");
let player2 = document.querySelector("#player2");
let player3 = document.querySelector("#player3");
let replayButton = document.querySelector('#replay-icon');
let newGameButton = document.querySelector('#new-game-button');
let swiperContainer = document.querySelector('#swiper-container');

//swiper.js controls and settings

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

  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
    Play: '.swiper-button-play',
  }
});

//displays Swiper and starts story after player clicks 'new game'
function startStory(){
  document.getElementById('game-container').style.display='none';
  swiperContainer.style.display='block';
}

//music added using Howler.js for scenes
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

//adds startStory function to button
newGameButton.onclick = function() {
  startStory();
  music.scene1.play();
  swiper.update();
  player1.seek(0);
};

//this functions links animation to appropriate sound based on slide #
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

//listens to slideChange and starts function
swiper.on('slideChange', function() {
  playAnimation();
});

//Reload button functions

function displayReload(){
  replayButton.classList.add('active-animation');
}

function hideReplay(){
  replayButton.classList.remove('active-animation');
}

function noReplay(){
  replayButton.style.animation = "none";
}

//reload settings

//for player 1
player1.addEventListener('complete', displayReload);
player1.addEventListener('frame', hideReplay);

//for player 2
player2.addEventListener('complete', displayReload);
player2.addEventListener('frame', hideReplay);

//for player 3
player3.addEventListener('complete', noReplay);
player3.addEventListener('frame', noReplay);


//loops scenes for reload button
function loopScene (){
  player1.seek(0);
  player1.play();
  player2.seek(0);
  player2.play();
}

// function reverseAnimation (){
//   player3.setDirection(-1);
// }

//replay button disappears when clicked
replayButton.onclick = function() {hideReplay()};

//animation on next button
function animateButton (){
  document.getElementById('swiper-button-next').classList.add('active-animation');
}

//stops animation on next button
function stopAnimateButton (){
  document.getElementById('swiper-button-next').classList.remove('active-animation');
}

//removes animation on next button
function removeAnimateButton (){
  replayButton.style.opacity = 0;
}

//removes previous button to Swiper.js
function removePrev (){
  document.getElementById('swiper-button-prev').style.opacity = 0;
}

//adds previous button to Swiper.js
function addPrev (){
  document.getElementById('swiper-button-prev').style.opacity = 1;
}


//adds grey out effect when scene ends

//for scene 2
function greyOut1 (){
  document.getElementById('image-wrapper1').style.animation = "grey-out 1.5s forwards";
}

//for scene 3
function greyOut2 (){
  document.getElementById('image-wrapper2').style.animation = "grey-out2 1.5s forwards";
}

//removes grey out effect when scene starts

//for scene 2
function removeGreyOut1 (){
  document.getElementById('image-wrapper1').style.animation = "none";
}

//for scene 3
function removeGreyOut2 (){
  document.getElementById('image-wrapper2').style.animation = "none";
}

//adds blur effect when scene ends
function blurOut (){
  document.getElementById('image-wrapper3').style.animation = "blur-out 1.5s forwards";
}

//removes blur effect when scene starts
function removeBlurOut (){
  document.getElementById('image-wrapper3').style.animation = "none";
}

//event listeners for scene 1 effects 
player1.addEventListener('complete', greyOut1);
player1.addEventListener('complete', animateButton);
player1.addEventListener('frame', removeGreyOut1);

//event listeners for scene 2 effects 
player2.addEventListener('complete', greyOut2);
player2.addEventListener('complete', animateButton);
player2.addEventListener('play', stopAnimateButton);
player2.addEventListener('frame', removeGreyOut2);

//event listeners for scene 3 effects 
player3.addEventListener('complete', removeAnimateButton);
player3.addEventListener('complete', blurOut);
player3.addEventListener('frame', removeBlurOut);

//mute and unmute buttons
var un_mute = document.getElementById('un-mute');
var mute = document.getElementById('mute');


//play music
function musicPlays (){
  music.scene1.volume(1);
  music.scene2.volume(1);
  music.scene3.volume(1);
}

//stop music
function musicStops (){
  music.scene1.volume(0);
  music.scene2.volume(0);
  music.scene3.volume(0);
}

//when mute button clicked the music plays 
mute.onclick = function() {musicPlays()};

//when unmute button clicked the music plays 
unmute.onclick = function() {musicStops()};
