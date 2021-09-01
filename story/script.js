console.clear()
var $carousel = $('.carousel').flickity({
	// selectedAttraction: 0.3,
	// friction: 0.6
})
var content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.';

var ele = '<span>' + content.split('').join('</span><span>') + '</span>';


$(ele).hide().appendTo('p').each(function (i) {
    $(this).delay(100 * i).css({
        display: 'inline',
        opacity: 0
    }).animate({
        opacity: 1
    }, 100);
});