onmessage = function(minimapcanvas, game) {
  game.minimapcontext.clearRect(0, 0, minimapcanvas.width, minimapcanvas.height);
  for(var x = 0; x < minimapcanvas.width; x++) {
    for(var y = 0; y < minimapcanvas.height; y++) {
      let worldpos = game.fromMiniMapToWorld(new Vec2(x, y)).floor();
      let tile = game.world.get(worldpos);
      if (tile) {
        if (tile.startsWith("r")) {
          game.minimapcontext.fillStyle = "#000000";
          game.minimapcontext.fillRect(x, y, 1, 1);
        }
        if (tile == "b0") {
          game.minimapcontext.fillStyle = "#FFFF00";
          game.minimapcontext.fillRect(x, y, 1, 1);
        }
        if (tile == "b1") {
          game.minimapcontext.fillStyle = "#00FFFF";
          game.minimapcontext.fillRect(x, y, 1, 1);
        }
      } else {
        const regionIdx = game.world.regions.get(worldpos,0);
        const region = game.regions[regionIdx%game.regions.length];
        game.minimapcontext.fillStyle = region.color();
        game.minimapcontext.fillRect(x, y, 1, 1);
      }
    }
  }
  const worldTopLeft = game.screenToMiniMap(new Vec2(0,0));
  const worldTopRight = game.screenToMiniMap(new Vec2(game.canvas.width, 0));
  const worldBottomRight = game.screenToMiniMap(new Vec2(game.canvas.width, game.canvas.height));
  const worldBottomLeft = game.screenToMiniMap(new Vec2(0, game.canvas.height));

  game.minimapcontext.strokeStyle = "#FF0000";
  game.minimapcontext.beginPath();
  game.minimapcontext.moveTo(worldTopLeft.x, worldTopLeft.y);
  game.minimapcontext.lineTo(worldTopRight.x, worldTopRight.y);
  game.minimapcontext.lineTo(worldBottomRight.x, worldBottomRight.y);
  game.minimapcontext.lineTo(worldBottomLeft.x, worldBottomLeft.y);
  game.minimapcontext.lineTo(worldTopLeft.x, worldTopLeft.y);
  game.minimapcontext.stroke();
  game.minimapcontext.strokeStyle = "#000000";
}
