function IntroHandler(args){
  var me = this;

  me.container = args.container;

  me.scenes = [
    {lottie: $(me.container).find('.animation-player1')[0], music: new Howl({ src: [ '/intro/scene1.mp3'] }), dialog_delay: 2400, dialog_container: $(me.container).find('.dialog-container-1')},
    {lottie: $(me.container).find('.animation-player2')[0], music: new Howl({ src: [ '/intro/scene2.mp3'] }), dialog_delay: 600, dialog_container: $(me.container).find('.dialog-container-2') },
    {lottie: $(me.container).find('.animation-player3')[0], music: new Howl({ src: [ '/intro/scene3.mp3'] }), seek: 100, dialog_delay: 600, dialog_container: $(me.container).find('.dialog-container-3') },
    {lottie: $(me.container).find('.animation-player4')[0], on_complete: function(){ me.intro_finished(); } }
  ];

  me.story_player_muted = false;
  me.active_scene_index = 0;
  me.active_scene = false;

  $(me.container).find('.mute-button-wrapper').unbind('click').click(function(){ intro_handler.toggle_story_player_sound(); });
  $(me.container).find('.mute-button-wrapper input#un-mute').prop('checked', me.story_player_muted);
}

IntroHandler.prototype.start_intro = function(){
  var me = this;

  history.pushState({}, "", window. location. href);
  $(window).on('popstate', function(e) { //reload the page on browser back button click, even if the URL is still the same
    if (e.originalEvent.state !== null)
      location.reload()
  });

  me.switch_scene(0);
}

IntroHandler.prototype.switch_scene = function(scene_index = false){
  var me = this;

  if(me.active_scene){
    $(me.active_scene.lottie).hide();
    me.active_scene.lottie.stop();
    
    if(me.active_scene.hasOwnProperty('music'))
      me.active_scene.music.stop();
    if(me.active_scene.hasOwnProperty('dialog_container'))
      $(me.active_scene.dialog_container).hide();
  }

  if(scene_index === false)
    me.active_scene_index++;
  else me.active_scene_index = scene_index;

  me.active_scene = me.scenes[me.active_scene_index];

  me.switch_story_player_sound();

  $(me.active_scene.lottie).show();

  var seek = (me.active_scene.hasOwnProperty('seek') ? me.active_scene.dialog_delay : 0)
  var delay = (me.active_scene.hasOwnProperty('dialog_delay') ? me.active_scene.dialog_delay : 0)
  var on_complete = (me.active_scene.hasOwnProperty('on_complete') ? me.active_scene.on_complete : function(){})

  me.active_scene.lottie.play();
  me.active_scene.lottie.seek(seek);
  me.active_scene.lottie.addEventListener('complete', on_complete);

  if(me.active_scene.hasOwnProperty('music')){
    me.active_scene.music.play();
    me.active_scene.music.seek(0);
  }

  setTimeout(function(){
    me.display_scene_dialog();
  }, delay);
}

IntroHandler.prototype.display_scene_dialog = function(){
  var me = this;

  $(me.container).find('.dialog-container').hide();

  if(!me.active_scene)
    return;

  if(!me.active_scene.hasOwnProperty('dialog_container'))
    return;
  
  $(me.active_scene.dialog_container).show().addClass('expanded');
  setTimeout(function(){ $(me.active_scene.dialog_container).find('.skip-intro-button').fadeIn(); }, 2000);

  $(me.active_scene.dialog_container).find('.continue-intro-button').click(function(){ me.switch_scene(); });
  $(me.active_scene.dialog_container).find('.skip-intro-button').click(function(){ me.intro_finished(); });
}

IntroHandler.prototype.intro_finished = function(){ window.location.href = '/play' }

IntroHandler.prototype.toggle_story_player_sound = function(){ this.switch_story_player_sound(!this.story_player_muted); }
IntroHandler.prototype.switch_story_player_sound = function(muted = this.story_player_muted){
  var me = this;

  me.story_player_muted = muted;

  if(me.active_scene.hasOwnProperty('music'))
    me.active_scene.music.mute(me.story_player_muted);

  $(me.container).find('.mute-button-wrapper input#un-mute').prop('checked', me.story_player_muted);
}