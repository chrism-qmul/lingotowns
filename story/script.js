var $carousel = $('.carousel').flickity({
	// selectedAttraction: 0.3,
	// friction: 0.6
})

function typewritereffect($el) {
  const characters = $el.text().split('');
  $el.text('');
  characters.forEach(function(character) { 
    const $span = $("<span>");
    $span.text(character);
    $span.css({opacity:0}).appendTo($el);
    });
  const $spans = $("span", $el);
  $spans.each((i, el) => $(el).delay(100*i).animate({opacity: 1}), 100);
}

function runtypewriters() {
  $("p.typewriter").each((i,el) => typewritereffect($(el)));
}

$carousel.on('change.flickity', function() {
  runtypewriters();
});
runtypewriters();
