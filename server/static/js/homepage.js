
let menuButton = document.querySelector('#menu-button');
let closeButton = document.querySelector('#close-button');
let menuAboutLink = document.querySelector('#menu-about-link');
let menuUpdatesLink = document.querySelector('#menu-updates-link');
let menuDALILink = document.querySelector('#menu-DALI-link');


function showMenu() {
    document.getElementById('nav-bar-expanded-wrapper').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    // document.getElementById('nav-bar-expanded-wrapper').style.animationFillMode = "inherit";
    document.getElementById('nav-bar-expanded-wrapper').style.animation = "menu-show 0.3s";
}

function hideMenu() {
    // document.getElementById('nav-bar-expanded-wrapper').style.animationDirection = 'reverse';
    // document.getElementById('nav-bar-expanded-wrapper').classList.remove('show-menu');
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('nav-bar-expanded-wrapper').style.animation = "menu-hide 0.3s";
    document.getElementById('nav-bar-expanded-wrapper').style.animationFillMode = "forwards";
}


menuButton.onclick = function () {
    showMenu()
};

closeButton.onclick = function () {
    hideMenu()
};


menuAboutLink.onclick = function () {
    hideMenu()
};

menuUpdatesLink.onclick = function () {
    hideMenu()
};

menuDALILink.onclick = function () {
    hideMenu()
};

// Wrap every letter in a span
// var textWrapper = document.querySelector('.ml6 .letters');
// textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

// anime.timeline({ loop: true })
//     .add({
//         targets: '.ml6 .letter',
//         translateY: ["1.1em", 0],
//         translateZ: 0,
//         duration: 950,
//         delay: (el, i) => 50 * i
//     }).add({
//         targets: '.ml6',
//         opacity: 0,
//         duration: 2000,
//         easing: "easeOutExpo",
//         delay: 1000
//     });

// function typewritereffect($el) {
//     const characters = $el.text().split('');
//     $el.text('');
//     characters.forEach(function(character) { 
//       const $span = $("<span>");
//       $span.text(character);
//       $span.css({opacity:0}).appendTo($el);
//       });
//     const $spans = $("span", $el);
//     $spans.each((i, el) => $(el).delay(40*i).animate({opacity: 1}), 100);
//   }
(function () {

    'use strict';

    // Feature Test
    if ('querySelector' in document && 'addEventListener' in window && Array.prototype.forEach) {

        // Function to animate the scroll
        var smoothScroll = function (anchor, duration) {

            // Calculate how far and how fast to scroll
            var startLocation = window.pageYOffset;
            var endLocation = anchor.offsetTop;
            var distance = endLocation - startLocation;
            var increments = distance / (duration / 16);
            var stopAnimation;

            // Scroll the page by an increment, and check if it's time to stop
            var animateScroll = function () {
                window.scrollBy(0, increments);
                stopAnimation();
            };

            // If scrolling down
            if (increments >= 0) {
                // Stop animation when you reach the anchor OR the bottom of the page
                stopAnimation = function () {
                    var travelled = window.pageYOffset;
                    if ((travelled >= (endLocation - increments)) || ((window.innerHeight + travelled) >= document.body.offsetHeight)) {
                        clearInterval(runAnimation);
                    }
                };
            }
            // If scrolling up
            else {
                // Stop animation when you reach the anchor OR the top of the page
                stopAnimation = function () {
                    var travelled = window.pageYOffset;
                    if (travelled <= (endLocation || 0)) {
                        clearInterval(runAnimation);
                    }
                };
            }

            // Loop the animation function
            var runAnimation = setInterval(animateScroll, 16);

        };

        // Define smooth scroll links
        var scrollToggle = document.querySelectorAll('.scroll');

        // For each smooth scroll link
        [].forEach.call(scrollToggle, function (toggle) {

            // When the smooth scroll link is clicked
            toggle.addEventListener('click', function (e) {

                // Prevent the default link behavior
                e.preventDefault();

                // Get anchor link and calculate distance from the top
                var dataID = toggle.getAttribute('href');
                var dataTarget = document.querySelector(dataID);
                var dataSpeed = toggle.getAttribute('data-speed');

                // If the anchor exists
                if (dataTarget) {
                    // Scroll to the anchor
                    smoothScroll(dataTarget, dataSpeed || 500);
                }

            }, false);

        });

    }

})();

window.addEventListener("scroll", appear);

function appear(){
  if (document.documentElement.scrollTop > 20)
    {document.getElementById("back-top-button").style = "display: block;"}
  else
    {document.getElementById("back-top-button").style = "display: none;"}
};

function goToTop(){
  document.documentElement.scrollTop = 0
};

document.getElementById("back-top-button").addEventListener("click", goToTop);

