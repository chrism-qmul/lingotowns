var swiper = new Swiper('.swiper-container', {
  slidesPerView: 1,
  spaceBetween: 20,
  effect: 'fade',
  loop: false,
  speed: 300,
  preventClicks: false,
  preventClicksPropagation: false,
  simulateTouch: false,

pagination: {
  el: '.swiper-pagination',
    clickable: false,
      dynamicBullets: true
},




// Navigation arrows
navigation: {
  nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
    }
  });

  // if(swiper.activeIndex === 3) {
  //   $('.swiper-button-prev').hide()
  //   $('.swiper-button-next').hide()
  // }

swiper.mousewheel.disable()


  // } else if (swiper.activeIndex === 1) {
  //   $('.swiper-button-prev').hide()
  //   $('.swiper-button-next').hide()
  // }


  swiper.on('slideChange', function () {
    if(this.activeIndex === 1) {
        console.log("IM ON SECOND SLIDE!");
        alert("IM ON SECOND SLIDE!");
    }
});