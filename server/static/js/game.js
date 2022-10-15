import {Vec2} from './math/Vec2.js';
import {BoundingBox} from './collections/BoundingBox.js';
import {World,RoadEast,RoadNorth,RoadSouth,RoadWest} from './world.js';
import {PRNG} from './algorithms/prng.js';

var canvas = document.getElementById('app');
var minimapcanvas = document.getElementById('minimap');
let smallestdim = Math.min(window.innerWidth/5,window.innerHeight/5);
minimapcanvas.width = Math.min(smallestdim, 200);
minimapcanvas.height = Math.min(smallestdim, 200);
var worldWidth = 20;
var worldHeight = 20;
var prng = new PRNG("test1ab");
const debugString = "🐞 debug mode";

function easeInEaseOut(t) {
  return (t*t)/(2.0 * (t*t - t) + 1.0);
}

function animate(animationlength, updatefn, donefn) {
  let start;

  function step(timestamp) {
    if (start == undefined) start = timestamp;
    const elapsed = timestamp - start;
    const completion = Math.min(elapsed/animationlength,1.0);
    updatefn(completion); 
    if (completion < 1.0) {
      window.requestAnimationFrame(step);
    } else {
      if (donefn) donefn();
    }
  }
  window.requestAnimationFrame(step);
}


function drawLine(context, a, b) {
  context.beginPath(); 
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}

function lerp(v0, v1, t) {
  return (1 - t) * v0 + t * v1;
}

class Fog {
  constructor() {
  }
}

function hexColorToRGB(hex) {
  return hex.replace(/^#/,"").match(/.{1,2}/g).map((s) => parseInt(s,16));
}

class WoodlandRegion {
  constructor(game) {
    this.game = game;
  }

  name() {
    return "Woods";
  }

  color() {
    return "#228B22";
  }

  drawTile(position, noise) {
    this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.grass);
    if (noise > 0.4 && noise < 0.6) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.tree1);
    }
    if (noise > 0.6) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.tree2);
    }
  }
}

class LakesRegion {
  constructor(game) {
    this.game = game;
  }

  name() {
    return "Lakes";
  }

  color() {
    return "#337fb2";
  }

  drawTile(position, noise) {
    if (noise < 0.4) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.water);
    } else {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.grass);
    }
    if (noise > 0.4 && noise < 0.45) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.tree1);
    }
  }
}


class DesertRegion {
  constructor(game) {
    this.game = game;
  }

  name() {
    return "Desert";
  }

  color() {
    return "#E6CCB3";
  }

  drawTile(position, noise) {
    if (noise < 0.3) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.desert2);
    } else {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.desert1);
    }
    /*
    if (noise < 0.3) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.tree1);
    }
    */
  }
}

class FarmRegionA {
  constructor(game) {
    this.game = game;
  }

  name() {
    return "Farms";
  }

  color() {
    return "#fbec5d";
  }


  drawTile(position, noise) {

    if (noise < 0.4) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.corn);
    }
    if (noise > 0.4) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.grass);
    } 
    if (noise > 0.6) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.tree1);
    }
  }
}

class FarmRegionB {
  constructor(game) {
    this.game = game;
  }

  name() {
    return "Farms";
  }

  color() {
    return "#9b7653";
  }

  drawTile(position, noise) {
    if (noise > 0.4) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.grass);
    }
    if (noise > 0.6) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.tree1);
    }
    if (noise < 0.4) {
      this.game.drawImageToTiles(position, new Vec2(1, 1), this.game.resources.field);
    } 
  }
}


class MouseDrag {
  constructor(element, update) {
    this.element = element;
    this.update = update;
    this.dragging = false;
    this.lastX = null;
    this.lastY = null;
    element.addEventListener('mousedown', this.startdrag.bind(this));
    element.addEventListener('touchstart', this.startdrag.bind(this));

    document.addEventListener('mouseup', this.enddrag.bind(this));
    document.addEventListener('touchend', this.enddrag.bind(this));

    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('touchmove', this.drag.bind(this));

  }
  
  getXYFromEv(ev) {
    var pos = ev;
    if (ev.touches && ev.touches.length && ev.touches.length > 0) {
      pos = ev.touches[ev.touches.length-1];
    }
    if (pos.pageX || pos.pageY) {
      var result = new Vec2(pos.pageX, pos.pageY);
      result.floor();
      return result;
    }
  }

  startdrag(ev) {
    this.dragging = true;
    var pos = this.getXYFromEv(ev);
    if (pos) {
      this.sendupdate(pos.x, pos.y);
    }
    document.body.classList.add("dragging");
  }

  drag(ev) {
    if (this.dragging) {
      var pos = this.getXYFromEv(ev);
      if (pos) {
        this.sendupdate(pos.x, pos.y);
      }
    }
  }

  enddrag(ev) {
    this.dragging = false;
    var pos = this.getXYFromEv(ev);
    if (pos) {
      this.sendupdate(pos.x, pos.y);
    }
    this.lastX = null;
    this.lastY = null;
    document.body.classList.remove("dragging");
  }

  sendupdate(x, y) {
    //console.log(this.lastX + "x" + this.lastY + " -> " + x + "x" + y);
    if (this.lastX !== null || this.lastY !== null) {
      this.update(this.lastX, this.lastY, x, y);
    }
    this.lastX = x;
    this.lastY = y;
  }
}

let isoMovement = {
  north: new Vec2(0, -1),
  east: new Vec2(-1, 0),
  south: new Vec2(0, 1),
  west: new Vec2(1, 0)
};

let litMovement = {
  north: new Vec2(-1, -1),
  east: new Vec2(1, -1),
  south: new Vec2(1, 1),
  west: new Vec2(-1, 1),
};

function cubic(a0, a1, w) {
  return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
}
function interpolate(a0, a1, w) {
  return (a1 - a0) * w + a0;
}

function perlin(vec) {
  function dotGridGrad(a, b) {
    var diff = a.clone().sub(b);
    //console.log("dotGridGrad: a:", a, "b:", b, "d:", diff);
    var grad = b.randGrad();
    //console.log("grad", grad);
    var res = grad.dot(diff);
    //console.log("result", res);
    return res;
  }
  var a = vec.clone().floor();
  var b = a.clone().add(new Vec2(1,0));
  var c = a.clone().add(new Vec2(0,1));
  var d = a.clone().add(new Vec2(1,1));

  var s = vec.clone().sub(a);
  //console.log("s", s);
  //console.log("n0", dotGridGrad(vec, a), "n1", dotGridGrad(vec, b));
  var x0 = interpolate(dotGridGrad(vec, a), dotGridGrad(vec, b), s.x);
  var x1 = interpolate(dotGridGrad(vec, c), dotGridGrad(vec, d), s.x);
  //console.log("x0", x0, "x1", x1);
  const result = interpolate(x0, x1, s.y)
  //console.log(result);
  return result;
}

const memoized_perlin = memoize(perlin, function(vec) {return vec.hash();}, 500);
//const memoized_perlin = perlin;

class Loader {
  constructor() {
    this.promises = [];
  }
  load(assetpath) {
    const p = new Promise(function(resolve, reject) {
      const img = new Image();
      img.onload = function() {
        resolve(img);
      }
      img.src = assetpath;
    });
    this.promises.push(p);
    return p;
  }
  done() {
    return Promise.all(this.promises);
  }
}

class AtlasLoader {
  constructor(image) {
    this.promise = new Promise(function(resolve, reject) {
      const img = new Image();
      img.onload = function() {
        resolve(img);
      }
      img.src = image;
    });
  }

  load() {
    return this.promise;
  }
}

class Notification {
  constructor(context) {
    this.context = context;
  }

  draw() {
    this.context.save();
    this.context.restore();
  }
}

function memoize(fn, keyfn, len) {
  var cache = {};
  var ringbuffer = []
  var ringindex = -1;
  function memoized() {
    const k = keyfn.apply(this, arguments);
    //console.log(k);
    if (k in cache) {
      //console.log("cache hit", k);
      return cache[k];
    } else{
      ringindex = (ringindex + 1) % len;
      const replacing = ringbuffer[ringindex];
      if (replacing !== undefined) {
        delete cache[replacing];
      }
      const result = fn.apply(this, arguments);
      ringbuffer[ringindex] = k;
      cache[k] = result;
      //console.log("cache miss: ", k, result);
      //console.log(cache);
      return result;
    }
  }
  return memoized;
}

class Game {
  constructor(canvas) {
    //this.minimapworker = new Worker("minimap.js");
    this.debug = false;
    this.dirty = true;
    this.isLoaded = false;
    this.lastregion = null;
    this.atlas = {"bakery": {"xy": [204, 374], "size": [200, 126]}, "cloud": {"xy": [810, 429], "size": [137, 71]}, "compass": {"xy": [608, 237], "size": [148, 148]}, "corn.small": {"xy": [204, 68], "size": [100, 64]}, "desert1.small": {"xy": [810, 371], "size": [100, 56]}, "desert2.small": {"xy": [612, 46], "size": [100, 56]}, "farm": {"xy": [2, 210], "size": [200, 136]}, "field.small": {"xy": [174, 8], "size": [100, 58]}, "grass.small": {"xy": [612, 104], "size": [100, 59]}, "library": {"xy": [2, 348], "size": [200, 152]}, "road": {"xy": [608, 165], "size": [111, 70]}, "road-east-west-north": {"xy": [2, 90], "size": [200, 118]}, "road-junction": {"xy": [2, 2], "size": [170, 86]}, "road-lights": {"xy": [204, 254], "size": [200, 118]}, "road-lights-east": {"xy": [406, 382], "size": [200, 118]}, "road-south-west-north": {"xy": [204, 134], "size": [200, 118]}, "road-west-north": {"xy": [406, 153], "size": [200, 108]}, "road-x": {"xy": [406, 263], "size": [200, 117]}, "stone": {"xy": [608, 387], "size": [200, 113]}, "tree1.small": {"xy": [306, 51], "size": [100, 81]}, "tree2.small": {"xy": [408, 70], "size": [100, 81]}, "volcano.small": {"xy": [510, 82], "size": [100, 69]}, "water.small": {"xy": [510, 22], "size": [100, 58]}};

    this.minimapscale = 10;
    this.mouseGridPosition = null;
    this.lastTS = null;
    this.tracking_elements = [];
    this.on_update_data = [];
    this.canvas = canvas;
    this.wasNearBuilding = false;
    this.wasNearCompass = false;
    this.context = canvas.getContext("2d");
    this.minimapcontext = minimapcanvas.getContext("2d");
    this.context.font = "12px Verdana";
    this.regions = [new WoodlandRegion(this), new LakesRegion(this), new DesertRegion(this), new FarmRegionA(this), new FarmRegionB(this)];
    this.region_by_name = {"Desert": new DesertRegion(this), "Lakes": new LakesRegion(this), "Farms": new FarmRegionA(this), "Woods":new WoodlandRegion(this)};
    this.regions_colors = this.regions.map(function(r) {return hexColorToRGB(r.color())});
    this.dragging = false;          
    this.worldbox = new BoundingBox();
    //this.screenScale = new Vec2(this.canvas.width/worldWidth, this.canvas.height/worldHeight); //basic orthographic
    this.screenScale = this.zoomLevel(1);//new Vec2(this.canvas.width/worldWidth, this.canvas.height/worldHeight); //basic orthographic
    console.log("screen scale on startup", this.screenScale, this.zoomLevel(1), [this.canvas.width, this.canvas.height]);
    this.worldTranslate = new Vec2(0,0);
    this.screenTranslate = new Vec2(0,0);
    //replace above with transformation matrix?
    this.moveStyle = litMovement;
    this.resources = {
      bakery: "bakery",
      library: "library",
      grass: "grass.small",
      field: "field.small",
      corn: "corn.small",
      water: "water.small",
      desert1: "desert1.small",
      desert2: "desert2.small",
      tree1: "tree1.small",
      tree2: "tree2.small",
      volcano: "volcano.small",
      road: "road",
      stone: "stone",
      cloud: "cloud",
      roadeastwestnorth:"road-east-west-north",
      roadsouthwestnorth:"road-south-west-north",
      //roadsoutheastnorth:"road-south-east-north",
      roadwestnorth:"road-west-north",
      roadx:"road-x",
      roadnorth: "road-lights",
      roadeast: "road-lights-east",
      roadjunction: "road-junction",
      compass: "compass",
      farm: "farm",
    };
    this.target_fog_radius = 10;
    this.fog_progress = 0;
    this.fog_radius = 10;
    this.near_edge_of_playarea = false;
    //this.visibleWorld =  
    this.loader = new Loader();
    this.atlasloader = new AtlasLoader("images/pack.png");
    var klass = this;
    this.atlasloader.load().then(function(img) {
      klass.atlasimg = img;
    });
    this.locations = [];
    this.world = new World("uuid?");
    //this.world.addLevel(1);
    //highlight buildings for tutorial
    this.highlighted_buildings = [];
    //this.building_placement = 
    this.mousedrag = new MouseDrag(this.canvas, function(lastX, lastY, x, y) {
      const movement = new Vec2(x-lastX, y-lastY).toCartesian();
      //klass.screenTranslate.add(movement);
      klass.screenMove(movement);
      klass.requireDraw();
    });
    window.addEventListener('resize', this.resize.bind(this));
    document.addEventListener('click', this.selectobject.bind(this));
    //window.addEventListener("closeframe", this.
    this.toclose = [];
    window.addEventListener("message", this.messagedispatch.bind(this));
  }
  
  loginNag() {
    const game = this;
    var loginReminder = document.getElementById("loginreminder");
    loginReminder.classList.remove("close");
    if (loginReminder) {
      var closeBtn = document.getElementById("loginreminderclose");
      closeBtn.addEventListener("click", function() {
        loginReminder.classList.add("close");
        setTimeout(game.loginNag.bind(game), 1000*60*25); //try again in 25 mins
      }, {once: true});
    }
  }

  addLevel(docs) {
    this.world.addLevel(docs);
    //this.increaseFog();
  }

  updateNearEdgeOfPlayArea(worldPointAtScreenCenter) {
    const midpoint = worldPointAtScreenCenter || this.worldPointAtScreenCenter();
    const isNearEdge = (midpoint.magnitude() > this.fog_radius);
    this.near_edge_of_playarea = isNearEdge;
    if (this.edgewarningel) {
      if (isNearEdge) {
         this.edgewarningel.style.display = "block";
      } else {
         this.edgewarningel.style.display = "none";
      }
    }
  }

  screenMove(vec) {
    //move screen with constraint checking - e.g. won't move into fog
    this.screenTranslate.add(vec);
    const midpoint = this.worldPointAtScreenCenter();
    this.updateNearEdgeOfPlayArea(midpoint);
    if (midpoint.magnitude() > this.fog_radius+15) {
      this.screenTranslate.sub(vec);
    }
    this.requireDraw();
  }

  messagedispatch(ev) {
    switch(ev.data.type) {
      case "closeframes":
        this.closeframes();
        break;
      case "showgame":
        this.showgame(ev.data.game);
        break;
    }
    console.log(ev);
  }

  login() {
    return DALIAuth.login();
  }

  showframe(url, data) {
    /*
    const iframe = document.createElement("IFRAME");
    iframe.className = "gamewindow"; 
    iframe.src = url;
    document.body.appendChild(iframe);
    this.toclose.push(iframe);

    let closefn = function() {
        document.body.removeChild(iframe);
        document.body.removeChild(closebutton);
    }
    if (data) {
      console.log("sending town data", data);
      iframe.contentWindow.postMessage(data, "*");
    }
    return iframe;
    */
    window.location.href = url;
  }

  closeframes() {
    for(var i = 0; i < this.toclose.length; i++) {
      document.body.removeChild(this.toclose[i]);
    }
    this.toclose = [];
  }

  showgame(game) {
    this.closeframes();
    let randomtask = Math.floor(Math.random() * (5000 - 1000 + 1)) + 500;
    switch(game) {
      case "library":
        this.showframe("https://wormingo.com/");
	break;
      case "food":
        this.showframe("https://cafeclicker.com/");
	break;
      case "farm":
        this.showframe("https://phrasefarm.org/#/game/" + randomtask);
	break;
      case "detectives":
        this.showframe("https://phrasefarm.org/#/game/" + randomtask);
        break;
    }
  }

  isNearBuilding(worldPosition) {
      for(var x = 0; x < 5; x++) {
        for(var y = 0; y < 5; y++) {
          let search = worldPosition.clone().add(new Vec2(x, y));
          const tile = this.world.get(search);
          if (tile && tile.startsWith("b")) {
            return {"tile": tile,
              "position": search};
          }
        }
      }
  }

  selectobject() {
    const debugSelectObjectString = "👆 select object";
    if (this.mouseGridPosition) {
      const mousepos = this.mouseGridPosition.floor();
      const tile = this.world.get(mousepos);
      //console.log("no action clicking on", this.mouseGridPosition, tile);
    }
    const townPosition = this.nearCompass(this.mouseScreenPosition);
    if (townPosition) {
      this.updateFocus(townPosition, 1.5);
      return;
    }
    if (this.mouseGridPosition) {
      const building = this.isNearBuilding(this.mouseGridPosition);
      if(building) {
        console.groupCollapsed(debugSelectObjectString);
        const town = this.findTownForBuildingPosition(building.position);
        let game = null;
        var complete = false;
        switch(building.tile) {
          case "b0":
            complete = (town.games.food.completion == 100);
            game = "food"
            dataLayer.push({'event': 'clicked_bakery'});
            break;
          case "b1":
            complete = (town.games.farm.completion == 100);
            game = "farm"
            dataLayer.push({'event': 'clicked_farm'});
            break;
          case "b2":
            complete = (town.games.library.completion == 100);
            game = "library"
            dataLayer.push({'event': 'clicked_library'});
            break;
        }
        if (town.document_id == "tutorial") {
          if (this.debug) {
            console.info("would redirect to tutorial ", game);
          } else {
            window.location.assign("/play-tutorial?game=" + game)
          }
        } else {
          if (!complete) {
            if (this.debug) {
              console.info("would redirect to game ", game);
              console.dir(town);
            } else {
              window.location.assign("/play-game?game=" + game + "&document_id=" + town.document_id)
            }
          } else {
            if (this.debug) {
              console.info("asked to play, but already complete ", game);
              console.dir(town)
            }
          }
        }
        console.groupEnd(debugSelectObjectString);
      }
    }
  }

  townsummary(townInformation) {
    var currentTown = this.getCurrentTownInformation();
     this.showframe("/town-summary/" + currentTown.town_id, townInformation);
  }

  resize() {
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;//Math.ceil(window.innerHeight * 0.618);
      this.minimapcenter = new Vec2(minimapcanvas.width/2,minimapcanvas.height/2);
      this.canvascenter = new Vec2(canvas.width/2,canvas.height/2).toCartesian();
      let smallestdim = Math.min(window.innerWidth/5,window.innerHeight/5);
      minimapcanvas.width = smallestdim;//Math.min(smallestdim, 200);
      minimapcanvas.height = smallestdim;//Math.min(smallestdim, 200);
      this.requireDraw();
  }

  toggleDebug() {
    this.debug = !this.debug;
    this.requireDraw();
    console.info(debugString + ": " + (this.debug ? "on" : "off"));
  }

  async preload() {
    await this.atlasloader.load();
  }

  drawDecoration(noise, position) {
    var ref = Math.floor(7*noise);
    switch(ref) {
      case 3:
          const decoration = Math.floor(4*((noise-.4)*5));
          switch(decoration) {
            case 2:
              this.drawImageToTiles(position, new Vec2(1, 1), this.resources.tree1);
              break;
            case 3:
              this.drawImageToTiles(position, new Vec2(1, 1), this.resources.tree2);
              break;
          }
      break;
    }
  }

  drawFogTile(position, fog_alpha) {
    this.drawImageToTiles(position, new Vec2(1, 1), this.resources.cloud, fog_alpha);
  }

  requireDraw() {
    this.dirty = true;
  }

  worldDimensions() {
    const worldTopLeft = this.toWorld(new Vec2(0,0));//this.worldTranslate.clone().mult(-1);
    const worldTopRight = this.toWorld(new Vec2(this.canvas.width, 0));
    const worldBottomLeft = this.toWorld(new Vec2(0, this.canvas.height));
    const visibleWorldHeight = worldBottomLeft.y-worldTopLeft.y+1;
    const visibleWorldWidth = worldTopRight.x-worldTopLeft.x+1;
    return {topLeft: worldTopLeft,
      topRight: worldTopRight,
      bottomLeft: worldBottomLeft,
      visibleHeight: visibleWorldHeight,
      visibleWidth: visibleWorldWidth};
  }

  screenWorldLocations() {
    const worldDimensions = this.worldDimensions();
    let positions = []
    for(var row = 0; row <= worldDimensions.visibleHeight; row++) {
      let south = litMovement.south.clone().mult(row);
      for(var column = 0; column <= worldDimensions.visibleWidth; column++) {
        let east = litMovement.east.clone().mult(column);
        let position = worldDimensions.topLeft.clone().add(south).add(east);
        positions.push(position);
      }
      for(var column = 0; column <= worldDimensions.visibleWidth; column++) {
        let east = litMovement.east.clone().mult(column);
        let position = worldDimensions.topLeft.clone().add(south).add(east).add(new Vec2(1, 0));
        positions.push(position);
      }
    }
    return positions;
  }

  elementTracksWorld(el, worldvec) {
    this.tracking_elements.push({element: el, worldposition: worldvec});
  }

  stopElementTracksWorld(el) {
    for(var i = 0; i < this.tracking_elements.length; i++) {
      if (el == this.tracking_elements[i].element) {
        this.tracking_elements.splice(i, 1);
        break;
      }
    }
  }

  updateTrackingElements(el) {
    for(var i = 0; i < this.tracking_elements.length; i++) {
      const el = this.tracking_elements[i].element;
      const screenposition = this.toScreen(this.tracking_elements[i].worldposition);
      el.style.left = screenposition.x + "px";
      el.style.top = screenposition.y + "px";
    }
  }

  getTownInformation(regionIdx) {
    //if (regionIdx == 0) return this.tutorialTownInfo();
    //console.log("data", this.data);
    let idx = 0;//regionIdx-1;
    for(var level_idx = 0; level_idx < this.data.levels.length; level_idx++) {
      const towns = this.data.levels[level_idx].towns;
      for(var town_idx = 0; town_idx < towns.length; town_idx++) {
        //if (idx == 0) {
        if (idx == regionIdx) {
          towns[town_idx].level = level_idx;
          return towns[town_idx];
        }
        idx++;
        //idx--;
      }
    }
  }

  getCurrentTownInformation() {
    return this.getTownInformation(this.lastregion);
  }

  drawBuildingLabel(label, buildingPosition) {
    this.context.save();
    this.context.font = "600 20px Verdana";
    this.context.textAlign = "center";
    const labelpos = this.toScreen(buildingPosition.clone().sub(new Vec2(4,4)));
    this.context.shadowColor = 'black';
    this.context.shadowBlur = 5;
    this.context.fillStyle = "white";
    this.context.fillText(label, labelpos.x, labelpos.y);
    this.context.restore();
}

  drawMap() {
    const worldDimensions = this.worldDimensions();
    let locations = this.screenWorldLocations();
    for(var i = 0; i < locations.length; i++) {
      let position = locations[i];
      let position_floored = position.clone().floor();
      const mag = position_floored.magnitude();
      var fog_alpha = Math.min((mag - this.fog_radius)/8, 1.0);
      if (Math.abs(fog_alpha-1) < 0.01) continue;
      let tile = this.world.get(position_floored)
      let highlight = false;
      const regionIdx = this.world.regions.get(position_floored,0);
      //const region = this.regions[regionIdx%this.regions.length];
      const town = this.getTownInformation(regionIdx);
      if (tile && tile.startsWith("b") && this.mouseGridPosition) {
        highlight = this.mouseGridPosition.distance(position) < 4;
      }
      var complete = false;
      switch(tile) {
        case "b0":
          if (town.games.food) {
          complete = (town.games.food.completion == 100);
          this.drawImageToTiles(position, new Vec2(3, 3), this.resources.bakery, 1.0, (!complete && highlight) || this.isBuildingHighlighted(town.town_id, "b0"));
            if (highlight) this.drawBuildingLabel("CafeClicker", position)
          }
          break;
        case "b1":
          if (town.games.farm) {
          complete = (town.games.farm.completion == 100);
          this.drawImageToTiles(position, new Vec2(3, 3), this.resources.farm, 1.0, (!complete && highlight) || this.isBuildingHighlighted(town.town_id, "b1"));
            if (highlight) this.drawBuildingLabel("PhraseFarm", position)
          }
          break;
        case "b2":
          if (town.games.library) {
          complete = (town.games.library.completion == 100);
          this.drawImageToTiles(position, new Vec2(3, 3), this.resources.library, 1.0, (!complete && highlight) || this.isBuildingHighlighted(town.town_id, "b2"));
            if (highlight) this.drawBuildingLabel("LingoTorium", position)
          }
          break;
        case ("r" + RoadWest):
        case ("r" + RoadEast):
        case ("r" + (RoadEast | RoadWest)):
          this.drawImageToTiles(position, new Vec2(1, 1), this.resources.roadeast);
          break;
        case ("r" + (RoadSouth | RoadNorth)):
          this.drawImageToTiles(position, new Vec2(1, 1), this.resources.roadnorth);
          break;
/*
        case ("r" + (RoadEast | RoadNorth)):
          this.drawImageToTiles(position, new Vec2(1, 1), this.resources.roadeastnorth);
          break;
*/
        case ("r" + (RoadEast | RoadWest | RoadNorth)):
          this.drawImageToTiles(position, new Vec2(1, 1), this.resources.roadeastwestnorth);
          break;
        case ("r" + (RoadSouth | RoadWest | RoadNorth)):
          this.drawImageToTiles(position, new Vec2(1, 1), this.resources.roadsouthwestnorth);
          break;
        case ("r" + (RoadWest | RoadNorth)):
          this.drawImageToTiles(position, new Vec2(1, 1), this.resources.roadwestnorth);
          break;
        case ("r" + (RoadEast | RoadSouth | RoadWest | RoadNorth)):
          this.drawImageToTiles(position, new Vec2(1, 1), this.resources.roadx);
          break;
        case "rj":
          this.drawImageToTiles(position, new Vec2(1, 1), this.resources.roadjunction);
          break;
        case undefined:
          break;
        default:
          //console.log("no tile defined for", tile);
          break;
      }
      //var region = this.regions[(regionIdx-1)%this.regions.length];
      var region = this.regions[regionIdx%this.regions.length];
      if (town && town.region) {
        region = this.region_by_name[town.region];
      }
      if (tile === undefined) {
        var position_scaled = position_floored.clone().div(10.0);
        var noise = (memoized_perlin(position_scaled)+1)/2;
        //var ref = regions[position_floored.y][position_floored.x];
        var ref = Math.floor(7*noise);
        //console.log(6*noise);
        region.drawTile(position, noise);
      }
    }
    //const midpoint = this.toWorld(new Vec2(this.canvas.width/2, this.canvas.height/2)).floor();
    const midpoint = this.worldPointAtScreenCenter();
    const currentregion = this.world.regions.get(midpoint);
    if (this.lastregion != currentregion) {
      const changing = "🚀 changing region";
      const changinglbl = changing + ": " + this.lastregion + " → " + currentregion;
      console.groupCollapsed(changinglbl);
      if (this.lastregion !== null) {
        this.logTownInformation(this.lastregion);
      }
      this.logTownInformation(currentregion);
      console.groupEnd(changinglbl);
      this.lastregion = currentregion;
      document.dispatchEvent(new CustomEvent('regionchange', {detail: {region: currentregion}}));
    }
    region = this.regions[currentregion%this.regions.length];
    this.updateTrackingElements();
    this.drawFog(locations);
    this.drawCompletion(locations);
  }

  worldPointAtScreenCenter() {
    return this.toWorld(new Vec2(this.canvas.width/2, this.canvas.height/2)).floor();
  }

  drawSign() {
    /*
    const midpoint = this.worldPointAtScreenCenter();
    //const midpoint = this.toWorld(new Vec2(this.canvas.width/2, this.canvas.height/2)).floor();
    const currentregion = this.world.regions.get(midpoint);
    const region = this.regions[currentregion%this.regions.length];
    this.context.save();
    const img = this.resources.scroll;
    const imgScale = (this.canvas.width/5)/img.width;
    this.context.drawImage(img, ((this.canvas.width-(img.width*imgScale))/2), 5, img.width*imgScale, img.height*imgScale);
    this.context.font = "30px Arial";
    this.context.textAlign = "center";
    this.context.fillText("The " + region.name(), this.canvas.width/2, 62, this.canvas.width/5);
    this.context.restore();
    */
  }

  //pointOnEdge(rect, deg) {
  pointOnEdge(rect, theta) {
    var twoPI = Math.PI*2;
    //var theta = deg * Math.PI / 180;

    while (theta < -Math.PI) {
      theta += twoPI;
    }

    while (theta > Math.PI) {
      theta -= twoPI;
    }

    var rectAtan = Math.atan2(rect.height, rect.width);
    var tanTheta = Math.tan(theta);
    var region;

    if ((theta > -rectAtan) && (theta <= rectAtan)) {
      region = 1;
    } else if ((theta > rectAtan) && (theta <= (Math.PI - rectAtan))) {
      region = 2;
    } else if ((theta > (Math.PI - rectAtan)) || (theta <= -(Math.PI - rectAtan))) {
      region = 3;
    } else {
      region = 4;
    }

    var edgePoint = {x: rect.width/2, y: rect.height/2};
    var xFactor = 1;
    var yFactor = 1;

    switch (region) {
      case 1: yFactor = -1; break;
      case 2: yFactor = -1; break;
      case 3: xFactor = -1; break;
      case 4: xFactor = -1; break;
    }

    if ((region === 1) || (region === 3)) {
      edgePoint.x += xFactor * (rect.width / 2.); // "Z0"
      edgePoint.y += yFactor * (rect.width / 2.) * tanTheta;
    } else {
      edgePoint.x += xFactor * (rect.height / (2. * tanTheta)); // "Z1"
      edgePoint.y += yFactor * (rect.height /  2.);
    }

    return edgePoint;
  }

  //onScreen(worldpoint) {
  onScreen(point) {
    //check if a worldpoint is currently on the screen
    //const point = this.toScreen(worldpoint);
    return ((point.x > 0 && point.x < this.canvas.width) && (point.y > 0 && point.y < this.canvas.height));
  }

  nearCompass(mousePosition) {
    const midscreen = new Vec2(this.canvas.width/2, this.canvas.height/2);
    const towns = this.world.towns();
    const atlas_compass = this.atlas["compass"];
    const [width, height] = atlas_compass["size"];
    const [x, y] = atlas_compass["xy"];
    for(var i = 0; i < towns.length; i++) {
      var townInformation = this.getTownInformation(i);
      if (townInformation) {
        const position = towns[i].position;
        const screenTarget = this.toScreen(position);
        if (!this.onScreen(screenTarget)) {
          //drawLine(this.context, midscreen, screenTarget);
          const diff = screenTarget.sub(midscreen);
          var edgepoint = this.pointOnEdge({width:this.canvas.width, height:this.canvas.height}, Math.atan2(diff.y, diff.x));
          edgepoint.y = this.canvas.height-edgepoint.y;
          edgepoint = new Vec2(edgepoint);
          edgepoint.sub(diff.clone().normalize().mult(height*.5));
          if (edgepoint.distance(mousePosition) < 30) {
            return towns[i].position;
          }
        }
      }
    }
  }

  drawCompass() {
    const midscreen = new Vec2(this.canvas.width/2, this.canvas.height/2);
    const atlas_compass = this.atlas["compass"];
    const [width, height] = atlas_compass["size"];
    const [x, y] = atlas_compass["xy"];

    const towns = this.world.towns();
    for(var i = 0; i < towns.length; i++) {
      var townInformation = this.getTownInformation(i);
      if (townInformation) {
        const position = towns[i].position;
        const info = this.getTownInformation(i);
        const screenTarget = this.toScreen(position);
        if (!this.onScreen(screenTarget)) {
          //drawLine(this.context, midscreen, screenTarget);
          const diff = screenTarget.sub(midscreen);
          const rotation = Math.atan2(diff.y, diff.x) + Math.PI*.5;
          var edgepoint = this.pointOnEdge({width:this.canvas.width, height:this.canvas.height}, Math.atan2(diff.y, diff.x));
          edgepoint.y = this.canvas.height-edgepoint.y;
          edgepoint = new Vec2(edgepoint);
          //this.drawCircle(edgepoint);
          edgepoint.sub(diff.clone().normalize().mult(height*.5));
          //this.drawCircle(edgepoint);
          this.context.save();
          const mouseOver = this.mouseScreenPosition && (edgepoint.distance(this.mouseScreenPosition) < 30)
          if (mouseOver) {
            this.context.shadowColor = 'rgba(255, 0, 0, .8)';
            this.context.shadowBlur = 20;
            this.context.shadowOffsetX = 0;
            this.context.shadowOffsetY = 0;
          }
          this.context.translate(edgepoint.x, edgepoint.y);
          this.context.rotate(rotation);
          this.context.drawImage(this.atlasimg, x, y, width, height, -width/2, -height/2, width, height);
          //this.context.drawImage(this.resources.compass, -this.resources.compass.width/2, -this.resources.compass.height/2, this.resources.compass.width, this.resources.compass.height);
          this.context.restore();
          this.context.save();
          this.context.translate(edgepoint.x, edgepoint.y);
          this.context.textAlign="center";
          this.context.fillStyle = "rgba(255,255,255,0.8)";
          this.context.font = "12px sans-serif";
          //this.context.fillText("Level: " + info['level'], 0, -10, this.resources.compass.height);
          this.context.fillText("Level: ", 0, -10, this.resources.compass.height);
          this.context.font = "20px sans-serif";
          this.context.fillText(info['level'], 0, 20, this.resources.compass.height);
          //this.context.fillText("" + info['total_completion'].toFixed(0) + "%", 0, 20, this.resources.compass.height);
          this.context.restore();
        }
      }
    }

    //this.drawCircle(midscreen);
    //this.drawCircle(this.next_target);
  }

  updateFogLevel(target_fog_level) {
    const game = this;
    const previous_fog_level = this.fog_radius;
    animate(1500, function(pc) {
      game.fog_radius = lerp(previous_fog_level, target_fog_level, pc);
      game.requireDraw();
    }, function() {});
  }

  updateFocus(worldTarget, targetZoom) {
    const game = this
    const previous_scale = this.screenScale;

    let previous_world_position = this.worldPointAtScreenCenter();
    const currentWorldPosition = new Vec2(game.worldTranslate);

    const compassMoveLbl = "🧭 compass move: " + previous_world_position + " → "  + worldTarget;
 //   this.dragging = true;
    console.groupCollapsed(compassMoveLbl);
    document.body.classList.add('dragging');
    animate(1000, function(pc) {
      game.screenScale = previous_scale.lerp(game.zoomLevel(0.75), pc);
    }, function() {
      animate(1000, function(pc) {
        game.screenScale =  game.zoomLevel(0.75).lerp(game.zoomLevel(targetZoom), pc);
      });
    });
    animate(2000, function(pc) {
      let pcEased = easeInEaseOut(pc);
      game.centerWorldPointOnScreen(previous_world_position.lerp(new Vec2(worldTarget), pcEased));
      game.requireDraw();
    }, function() {
//    this.dragging = false;
    document.body.classList.remove('dragging');
      game.updateNearEdgeOfPlayArea();
    game.requireDraw();
    console.groupEnd(compassMoveLbl);
}); //show buildings when zoomed in
  }

  onUpdateData(fn) {
    this.on_update_data.push(fn);
  }

  updateData(d) {
    this.world = new World("testa", true);
    this.data = d;
    try {
       if (this.data.levels[0].towns[0].document_id != "tutorial") {
         throw 'Missing tutorial';
       }
    } catch(err) {
      this.data.levels.unshift({"towns": [this.tutorialTownInfo()]});
    }
    const updateLabel = "⬇ update received";
    const townDataLabel = "🏘 town data";
    console.groupCollapsed(updateLabel);
    console.groupCollapsed(townDataLabel);
    game.logTownInformation();
    console.groupEnd(townDataLabel);
    // gtag("event", "level_start", {
    //   level_name: "The journey begins..."
    // });
    // gtag("event", "some_event", {
    //   test_data_point: Math.floor(math.random()*10)
    // });
    //for(var level_idx = this.world.levels()-1; level_idx < this.data.levels.length; level_idx++) {
    for(var level_idx = 0; level_idx < this.data.levels.length; level_idx++) {
      const towns = this.data.levels[level_idx].towns;
      this.world.addLevel(towns.length);
    }
    this.world.calculate();
    this.updateTownOverlays();
    this.updateFogLevel(10 + (22*(this.data.levels.length)));
    for(var i = 0; i < this.on_update_data.length; i++) {
      this.on_update_data[i](this.data);
    }
    console.groupEnd(updateLabel);
    this.requireDraw();
  }

  recordAnalytics(data) {
    //GOOGLE ANALYTICS CODE HERE
    gtag("event", "level_up", {
        level: data});
    console.log("analytics from server", data);
  }

  // recordAnalyticsTutorial(data) {
  //   gtag("event", "tutorial_complete", {
  //     success: true});
  //   console.log("tutorial analytics from server", data);
  // }

  connectToServer() {
    //const socket = io("wss://lingotowns.com/");
    this.socket = io();
    var on_data_loaded;
    const data_loaded = new Promise(function(resolve, reject) { 
      on_data_loaded = resolve;
    });
    const game = this;
    this.socket.on("connect", () => {
      this.socket.on("game-update", data => {
          game.updateData(data);
          on_data_loaded(); 
//          this.addLevel(2);
          });
      this.socket.on("game-analytics", data => {
          game.recordAnalytics(data);
          });
      // this.socket.on("game-analytics-tutorial", data => {
      //     game.recordAnalyticsTutorial(data);
      //     });
    });

    // handle the event sent with socket.emit()
    this.socket.on("greetings", (elem1, elem2, elem3) => {
        console.log(elem1, elem2, elem3);
        });
    return data_loaded;
  }

  setEdgeWarningElement(edgewarningel) {
    this.edgewarningel = edgewarningel;
    let game = this;
    this.edgewarningel.addEventListener("click", function(ev) {
      //game.centerWorldPointOnScreen(new Vec2(0,0));
      game.updateFocus(new Vec2(0,0), 1.2);
      //game.updateNearEdgeOfPlayArea();
      game.requireDraw();
    });
  }

  drawMiniMap() {
    //this.minimapworker.postMessage(minimapcanvas, this);
//    this.minimapcontext.clearRect(0, 0, minimapcanvas.width, minimapcanvas.height);
    var imagedata = this.minimapcontext.createImageData(minimapcanvas.width, minimapcanvas.height);
    var data = imagedata.data;
    const minimapcanvaswidth = minimapcanvas.width;
    const minimapcanvasheight = minimapcanvas.height;
    for(var x = 0; x < minimapcanvaswidth; x++) {
      for(var y = 0; y < minimapcanvasheight; y++) {
        const idx = (y*(minimapcanvasheight*4))+(x*4);
        let worldpos = this.fromMiniMapToWorld(new Vec2(x, y)).floor();
        let mag = worldpos.magnitude();
        let tile = this.world.get(worldpos);
        var fog_alpha = 0;
        if (mag > this.fog_radius) {
          fog_alpha = Math.min((mag - this.fog_radius)/8, 1.0);
        }
        if (Math.abs(1.0-fog_alpha) > 0.01) {
          data[idx+3] = 255-parseInt(fog_alpha*255);
          if (tile) {
            if (tile.startsWith("r")) {
              data[idx+0] = 100;
              data[idx+1] = 100;
              data[idx+2] = 100;
            }
            if (tile == "b0") {
              data[idx] = 255;
              data[idx+1] = 255;
            }
            if (tile == "b1") {
              data[idx] = 0;
              data[idx+1] = 255;
              data[idx+2] = 255;
            }
          } else {
            const regionIdx = this.world.regions.get(worldpos,0);
            const region_color = this.regions_colors[regionIdx%this.regions.length];
            for(var i = 0; i < region_color.length; i++) {
              data[idx+i] = region_color[i];
            }
          }
        }
      }
    }
    this.minimapcontext.putImageData(imagedata, 0, 0);
    const worldTopLeft = this.screenToMiniMap(new Vec2(0,0));
    const worldTopRight = this.screenToMiniMap(new Vec2(this.canvas.width, 0));
    const worldBottomRight = this.screenToMiniMap(new Vec2(this.canvas.width, this.canvas.height));
    const worldBottomLeft = this.screenToMiniMap(new Vec2(0, this.canvas.height));
/*
    this.minimapcontext.save();
    this.minimapcontext.strokeStyle = "#FF0000";
    this.minimapcontext.beginPath();
    this.minimapcontext.moveTo(worldTopLeft.x, worldTopLeft.y);
    this.minimapcontext.lineTo(worldTopRight.x, worldTopRight.y);
    this.minimapcontext.lineTo(worldBottomRight.x, worldBottomRight.y);
    this.minimapcontext.lineTo(worldBottomLeft.x, worldBottomLeft.y);
    this.minimapcontext.lineTo(worldTopLeft.x, worldTopLeft.y);
    this.minimapcontext.stroke();
    this.minimapcontext.restore();
*/
  }


  centerWorldPointOnScreen(worldPoint) {
    let midpoint = this.toWorld(new Vec2(this.canvas.width/2, this.canvas.height/2));//.floor();
    midpoint.sub(worldPoint);
    this.worldTranslate.add(midpoint);
  }

  drawFog(screenWorldLocations) {
    let locations = screenWorldLocations;//this.screenWorldLocations();
    for(var i = 0; i < locations.length; i++) {
      let position = locations[i];
      let position_floored = position.clone().floor();
      const mag = position_floored.magnitude()
      var fog = mag > this.fog_radius;
      //let fog_alpha = Math.min(0.5+(((mag - this.fog_radius)/8)/2), 1);
      let fog_alpha = Math.min(((mag - this.fog_radius)/8), 1);
      if (fog) {
        this.drawFogTile(position, fog_alpha);
      }
    }
  }

  drawCompletion(screenWorldLocations) {
    let locations = screenWorldLocations;
    for(var i = 0; i < locations.length; i++) {
      const position = locations[i].clone().floor();
      const tile = this.world.get(position);
      if (tile && tile.startsWith("b")) {
        let completion = 0;
        const town = this.findTownForBuildingPosition(position);
        if (town) {
          switch(tile) {
            case "b0":
              if (!town.games.food) continue;
              completion = town.games.food.completion;
              break;
            case "b1":
              if (!town.games.farm) continue;
              completion = town.games.farm.completion;
              break;
            case "b2":
              if (!town.games.library) continue;
              completion = town.games.library.completion;
              break;
          }
          const textLocation = this.toScreen(locations[i]);
          if (town.subject_type != "tutorial") {
            this.context.save();
            this.context.fillStyle = "white";
            this.context.font = "30px sans-serif";
            this.context.shadowColor = "rgba(0,0,0,1)";
            this.context.shadowBlur = 10;
            this.context.shadowOffsetX = 0;
            this.context.shadowOffsetY = 0;
            this.context.fillText("" + completion + "%", textLocation.x, textLocation.y);
            this.context.restore();
          }
        }
      }
    }
  }

  onMouseMove(ev) {
    var a = new Vec2(ev.pageX - this.canvas.offsetLeft, ev.pageY - this.canvas.offsetTop);
    this.mouseScreenPosition = a;
    this.mouseGridPosition = this.toWorld(a).floor();
    if(this.isNearBuilding(this.mouseGridPosition)) {
      this.wasNearBuilding = true;
      this.requireDraw();
    } else {
      if (this.wasNearBuilding) {
        this.wasNearBuilding = false;
        this.requireDraw();
      }
    }
    if(this.nearCompass(this.mouseScreenPosition)) {
      this.wasNearCompass = true;
      this.requireDraw();
    } else {
      if (this.wasNearCompass) {
        this.wasNearCompass = false;
        this.requireDraw();
      }
    }
    /*
    console.log(this.mouseGridPosition);
    this.drawCircle(this.toScreen(this.mouseGridPosition));
    */
  }

  zoomIn() {
    this.screenScale.mult(2);
    this.requireDraw();
  }

  setZoom(n) {
    const screenMiddle = new Vec2(this.canvas.width/2, this.canvas.height/2);
    let oldWorldCenter = this.toWorld(screenMiddle);
    this.screenScale = this.zoomLevel(n);
    //this.screenTranslate = new Vec2(0,0);
    let newWorldCenter = this.toWorld(screenMiddle);
    newWorldCenter.sub(oldWorldCenter);
    this.worldTranslate.add(newWorldCenter);
    this.requireDraw();
  }

  zoomOut() {
    this.screenScale.div(2);
    this.requireDraw();
  }

  toWorld(vec) {
    return vec.clone().toCartesian().sub(this.screenTranslate).div(this.screenScale).sub(this.worldTranslate);
  }

  toScreen(vec) {
    return vec.clone().add(this.worldTranslate).mult(this.screenScale).add(this.screenTranslate).toIsometric();
  }

  screenToMiniMap(vec) {
    return this.toWorld(vec).clone().add(this.worldTranslate).mult(this.screenScale).add(this.screenTranslate).sub(this.canvascenter).div(this.minimapscale).add(this.minimapcenter);
  }

  fromMiniMapToWorld(vec) {
    return vec.sub(this.minimapcenter).mult(this.minimapscale).add(this.canvascenter).sub(this.screenTranslate).div(this.screenScale).sub(this.worldTranslate);
  }

  moveUp() {
    this.worldTranslate.sub(this.moveStyle.north);
    this.requireDraw();
  }

  moveDown() {
    this.worldTranslate.sub(this.moveStyle.south);
    this.requireDraw();
  }

  moveLeft() {
    this.worldTranslate.sub(this.moveStyle.west);
    this.requireDraw();
  }

  moveRight() {
    this.worldTranslate.sub(this.moveStyle.east);
    this.requireDraw();
  }
    
  zoomLevel(z) {
    return new Vec2(25, 25).mult(z);
  }

  resetView() {
    this.screenScale = this.zoomLevel(1); //basic orthographic
    this.worldTranslate = new Vec2(0,0);
  }

  attachEventListeners() {
    var klass = this;
    addEventListener('mousemove', function(ev){
      klass.onMouseMove(ev);
    });
    addEventListener('mousedown', function(ev){
      //klass.onMouseMove(ev);
      klass.dragging = true;
      document.body.classList.add('dragging');
    });
    addEventListener('click', function(ev){
      //klass.onMouseMove(ev);
      //klass.onMouseClick(ev.clientX, ev.clientY);
    });
    addEventListener('mouseup', function(ev){
      //klass.onMouseMove(ev);
      klass.dragging = false;
      document.body.classList.remove('dragging');
    });
    addEventListener('wheel', function(ev) {
      const movement = new Vec2(ev.deltaX, ev.deltaY).toCartesian().mult(-1);
      game.screenMove(movement);
      try {
        ev.preventDefault();
      } catch {}
    });
    addEventListener('keydown', function(ev)  {
      switch(ev.keyCode) {
        case 38:
          game.moveUp();
          break;
        case 39:
          game.moveRight();
          break;
        case 40:
          game.moveDown();
          break;
        case 37:
          game.moveLeft();
          break;
        case 187:
          game.zoomIn();
          break;
        case 189:
          game.zoomOut();
          break;
        case 48:
          game.resetView();
          break;
        case 65: //a
          game.addLevel(2);
          break;
        case 68: //d
          game.toggleDebug();
          break;
        case 85: //u
          game.forceLevelUp();
          break;
        case 219: //[
          game.increaseFog();
          break;
        case 221: //]
          game.liftFog();
          break;
        default:
          if (game.debug) {
            console.warn("unbound key: " + ev.keyCode);
          }
      }
    });
  }

  increaseFog() {
    this.target_fog_radius += 25;
    this.fog_progress = 0;
    this.requireDraw();
  }

  liftFog() {
    this.target_fog_radius -= 25;
    this.fog_progress = 0;
    this.requireDraw();
  }

  drawDebugGrid() {
    this.context.clearRect(0, 0, canvas.width, canvas.height);
    for(var i = 0; i <= worldHeight; i++) {
      var a = this.toScreen(new Vec2(0, i));
      var b = this.toScreen(new Vec2(worldWidth, i));
      drawLine(this.context, a, b);
    }
    for(var i = 0; i <= worldWidth; i++) {
      var a = this.toScreen(new Vec2(i, 0));
      var b = this.toScreen(new Vec2(i, worldHeight));
      drawLine(this.context, a, b);
    }
  }

  drawCircle(vec) {
    let fs = this.context.fillStyle;
    this.context.fillStyle = "#FF0000";
    this.context.beginPath();
    this.context.arc(vec.x, vec.y, 5, 0, 2 * Math.PI);
    this.context.fill();
    this.context.fillStyle = fs;
  }

  drawInfo() {
    this.context.save()
    this.context.textAlign = "right";
    this.context.shadowColor = "rgba(0,0,0,1)";
    this.context.shadowBlur = 10;
    this.context.shadowOffsetX = 0;
    this.context.shadowOffsetY = 0;
    this.context.font = "30px sans-serif";
    this.context.fillStyle = "#FFFFFF";
    this.context.fillText("Level: " + this.data.levels.length, this.canvas.width-20, 50);
    this.context.restore();
  }

  forceLevelUp() {
    if (this.debug) {
      this.socket.emit('forcelevelup');
    } else {
      console.warn("attempted debug function outside debug mode")
    }
  }

  drawDebugInfo(elapsed) {
    var lines = [];
    const panelWidth = 200;
    this.context.save()
    this.context.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.context.fillRect(this.canvas.width-panelWidth, 0, panelWidth, this.canvas.height);
    this.context.restore();
    lines.push(debugString + " (d to close)");
      lines.push("");
    lines.push("FPS: " + Math.round(1/(elapsed / 1000.0)));
    if (this.mouseGridPosition) {
      this.context.textAlign = "right";
      let coords = this.mouseGridPosition.floor();
      lines.push("");
      lines.push("MOUSE COORDINATES")
      lines.push("Mouse World Position: " + coords.x + "x" + coords.y);
      lines.push("Mouse World Mag: " + coords.magnitude().toFixed(2));
      var scr = this.toScreen(coords);
      this.drawCircle(scr);
      lines.push("Mouse Screen Position: " + scr.x.toFixed(2) + "x" + scr.y.toFixed(2));
      var s = this.toScreen(coords);
      lines.push("");
      lines.push("TRANSLATIONS")
      lines.push("World Translate: " + this.worldTranslate.x.toFixed(2) + "x" + this.worldTranslate.y.toFixed(2));
      var screenTranslate = this.toScreen(this.worldTranslate);
      lines.push("Screen Translate: " + screenTranslate.x.toFixed(2) + "x" + screenTranslate.y.toFixed(2));
      lines.push("");
      lines.push("WORLD COORDINATES")
      var worldTopLeft = this.worldTranslate.clone().mult(-1);
      lines.push("TL World: " + worldTopLeft.x.toFixed(2) + "x" + worldTopLeft.y.toFixed(2));
      var worldBottomRight = this.toWorld(new Vec2(this.canvas.width, this.canvas.height));
      //var worldRight = this.toWorld(screenTranslate.clone().add(new Vec2(this.canvas.width, 0)))
      lines.push("BR World: " + worldBottomRight.x.toFixed(2) + "x" + worldBottomRight.y.toFixed(2));
      var worldTopRight = this.toWorld(new Vec2(this.canvas.width, 0));
      lines.push("TR World: " + worldTopRight.x.toFixed(2) + "x" + worldTopRight.y.toFixed(2));
      //this.context.strokeRect(s.x-25, s.y, 50, 25);
    }
    this.context.save();
    this.context.fillStyle = "#FFFFFF";
    for(var i = 0; i < lines.length; i++) {
      this.context.fillText(lines[i], this.canvas.width-5, (i+1)*15, panelWidth-20);
    }
    this.context.restore();
  }

  drawImageToTilesFill(from, to, image) {
    let onebyone = new Vec2(1,1);
    for(var x = from.x; x <= to.x; x++) {
      for(var y = from.y; y <= to.y; y++) {
        let thisloc = new Vec2(x, y);
        this.drawImageToTiles(thisloc, onebyone, image);
      }
    }
  }

  drawImageToTiles(bottomlocation, footprint, img, alpha, highlight/*, flipped*/) {
    //image.width 
    /*
              this.context.save();
              if (flipped) {
                this.context.scale(-1,1);
              }
              */
    alpha = alpha || 1.0;
    highlight = highlight || false;
    var bl = this.toScreen(bottomlocation);
    //this.drawCircle(bl);
    //
    //var left = this.toScreen(bottomlocation.clone().sub(new Vec2(footprint.x, 0)));
    var left = this.toScreen(new Vec2(-footprint.x, 0).add(bottomlocation));
    //this.drawCircle(left);
    //
    //var right = this.toScreen(bottomlocation.clone().sub(new Vec2(0, footprint.y)));
    var right = this.toScreen(new Vec2(0, -footprint.y).add(bottomlocation));
    //
    //this.drawCircle(right);
    const imageprops = this.atlas[img];
    const [img_width, img_height] = imageprops["size"];
    const [x, y] = imageprops["xy"];
    var desiredImageWidth = right.x - left.x;
    let imgScale = desiredImageWidth/img_width;
    if (alpha != 1.0) {
      this.context.save();
      this.context.globalAlpha = alpha;
    }
    if (highlight) {
      this.context.save();
      this.context.shadowColor = "rgba(10, 255, 128, 1)";
      this.context.shadowBlur = 50;
      this.context.shadowOffsetX = 1;
      this.context.shadowOffsetY = 1;
    }
    this.context.drawImage(this.atlasimg, x, y, img_width, img_height, left.x-1, bl.y-(img_height*imgScale)-1, ((img_width+2)*imgScale), ((img_height+2)*imgScale));
    //this.context.drawImage(img, left.x, bl.y-(img.height*imgScale), img.width*imgScale, img.height*imgScale);
    if (alpha != 1.0) {
      this.context.restore();
    }
    if (highlight) {
      this.context.restore();
    }
    //this.context.strokeRect(this.toScreen(leftGrid).x, this.toScreen(leftGrid).y, 50, 50);
  }

  addTownSummary(townInformation, townposition) {
    const game = this;
    const gameoverlay = document.createElement("div");
    //this.region_by_name[townInformation.region]
    const regionIdx = this.world.regions.get(townposition,0);
    const regionname = townInformation.region;
    /*
    const region = this.regions[regionIdx%this.regions.length];
    const regionname = region.name()
    */
    gameoverlay.className = "gameoverlay towninformation";
    gameoverlay.innerHTML = `
      <div class='townicon'>
         <img src='images/towns/${regionname}.png' />
      </div>
      <button class='townsummary'>PLAY NOW</button>
      <div class='content'>
        <h2>${townInformation.town_name}</h2>
        ${townInformation.document_name ? `<p><b>Document: </b>${townInformation.document_name}</p>` : ''}
      </div>`;
    /*
        <table class='detail'>
          <tr>
            <th>Subject</th><td>${townInformation.subject_type}</td>
          </tr>
          <tr>
          </tr>
          <tr>
            <th>Level</th><td>${townInformation.level}</td>
          </tr>
          <tr>
            <th>Completion</th><td>${townInformation.total_completion.toFixed(2)}%</td>
          </tr>
        </table>
        */
    const townsummarybutton = gameoverlay.getElementsByClassName('townsummary');
    const games = ['food', 'farm', 'library'];
    for (var i = 0; i < townsummarybutton.length; i++) {
      townsummarybutton[i].addEventListener('click', function() {
        //game.updateFocus(townposition, 2.0);
        //TODO: PLAY FIRST INCOMPLETE GAME
        console.log(townInformation); 
        for(var j = 0; j < games.length; j++) {
          const game = games[j]
          if (townInformation.games[game].completion < 100) {
            if (townInformation.document_id == "tutorial") {
              window.location.assign("/play-tutorial?game=" + game)
            } else {
              window.location.assign("/play-game?game=" + game + "&document_id=" + townInformation.document_id)
            }
            break;
          }
        }
        //
        // this.style.cursor = "pointer";
        //game.townsummary(townInformation);
      });
      townsummarybutton[i].addEventListener('mouseover', function() {
        this.style.cursor = "pointer";
        //game.townsummary(townInformation);
      });
    }
    document.body.appendChild(gameoverlay);
    //document.getElementById("overlays").appendChild(gameoverlay);
    return gameoverlay;
  }

  removeTownOverlays() {
    let overlays = document.getElementsByClassName("gameoverlay");
    let len = overlays.length;
    for (var i = 0; i < len; i++) {
      let j = len - 1 - i;
      this.stopElementTracksWorld(overlays[j]);
      document.body.removeChild(overlays[j]);
    }
    //document.getElementById("overlays")
  }

  tutorialTownInfo() {
    return {author: "LingoTowns Citizens",
      available:true,
      document_id:"tutorial",
      games: {farm:{completion: 0}, food:{completion:0}, library:{completion:0}},
      level: 0,
      region: "Lakes",
      subject_type: "tutorial",
      total_completed: 0,
      town_id: 0,
      town_name: "Tutorial Town"};
  }


  findTownForBuildingPosition(position) {
    for(var level = 0; level < this.world.locations.length; level++) {
      if (this.world.locations[level].towns) {
        for(var town = 0; town < this.world.locations[level].towns.length; town++) {
          if(this.world.locations[level].towns[town].buildings) {
            for(var building = 0; building < this.world.locations[level].towns[town].buildings.length; building++) {
              if (level > 0 && position.equals(this.world.locations[level].towns[town].buildings[building].position)) {
                //console.log("the data", this.world, this.data, level, town);
                return this.data.levels[level].towns[town];
              }
            }
          }
        }
      }
    }
    return this.tutorialTownInfo();
  }

  updateTownOverlays() {
    this.removeTownOverlays();
    const towns = this.world.towns();
    for(var i = 0; i < towns.length; i++) {
      var townInformation = this.getTownInformation(i);
      if (townInformation) {
        const townSummaryElement = this.addTownSummary(townInformation, towns[i].position);
        game.elementTracksWorld(townSummaryElement, towns[i].position);
      }
      //game.elementTracksWorld(gameoverlays[i], towns[i].position);
    }
  }

  loaded() {
    if (!this.isLoaded) {
      document.body.classList.add("loaded");
      this.isLoaded = true;
    }
  }

  logTownInformation(regionFilter) {
    const columns = ["level", "document_id", "author", "document_name", "total_completion", "food_completion", "farm_completion", "library_completion", "region", "regionIdx"];
    var tableData = this.data.levels.reduce(function(acc, cur, idx) {
        return acc.concat(cur.towns.map(function(town) {
              try {
              town.farm_completion = town.games.farm.completion;
              } catch  {}
              try {
              town.food_completion = town.games.food.completion;
              } catch  {}
              try {
              town.library_completion = town.games.library.completion;
              } catch  {}
              town.level = idx; 
              return town}));}, []);
    tableData = tableData.map(function(town, idx) {town.regionIdx = idx;return town;});
    if (regionFilter === null || regionFilter === undefined) {
      console.table(tableData, columns);
    } else {
      console.table(tableData.filter(function(region) {return (region.regionIdx == regionFilter);}), columns);
    }
  }

  draw(ts) {
    const elapsed = ts - this.lastTS;
/*
    const eps = 0.2;
    if (Math.abs(this.fog_radius - this.target_fog_radius) > eps) {
      this.fog_progress += (elapsed/1000)/4;
      this.fog_radius = lerp(this.fog_radius, this.target_fog_radius, this.fog_progress);
      this.requireDraw();
    } else {
      this.fog_radius = this.target_fog_radius;
      this.fog_progress = 0;
    }
*/
    if (this.dirty) {
      this.dirty = false;
	    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	    //this.drawDebugGrid(); 
	    this.drawMap();
	    this.drawInfo();
	    this.drawMiniMap();
	    this.drawCompass();

      //debugging
      /*
      this.drawCircle(this.toScreen(new Vec2(-5, 11)));
      this.drawCircle(this.toScreen(new Vec2(-21, 30)));
      this.drawCircle(this.toScreen(new Vec2(-19, 29)));

      this.drawCircle(this.toScreen(new Vec2(-6, -6)));
      this.drawCircle(this.toScreen(new Vec2(-9, -1)));
      this.drawCircle(this.toScreen(new Vec2(-16, 22)));
      */
    }
    if (this.debug) {
      this.drawDebugInfo(elapsed); 
    }
    this.lastTS = ts;
    window.requestAnimationFrame(this.draw.bind(this));
  }

  highlightBuilding(town_id, building_id) {
    this.highlighted_buildings.push("" + town_id + "_" + building_id);
    this.requireDraw();
  }

  isBuildingHighlighted(town_id, building_id) {
    return this.highlighted_buildings.indexOf("" + town_id + "_" + building_id) > -1;
  }

  removeHighlightFromBuilding(town_id, building_id) {
    const index = this.highlighted_buildings.indexOf("" + town_id + "_" + building_id);
    if (index > -1) {
        this.highlighted_buildings.splice(index, 1);
        this.requireDraw();
        return true;
    }
    return false;
  }
}

let game = new Game(canvas);
const connect_to_server = game.connectToServer();
game.preload().then(function(resources) {
  connect_to_server.then(function() {
    game.attachEventListeners();
    game.resize();
    game.centerWorldPointOnScreen(new Vec2(0,0));
    game.draw();
    game.loaded();
    game.loginNag();
  });
});

function update_progression() {
  connect_to_server.then(function() {
    /*
    const town_info = game.getCurrentTownInformation();
    if (town_info) {
      const games = ['farm', 'food', 'library'];
      let docs_completed = document.getElementById('documents-completed');
      docs_completed.innerHTML = game.data.documents_completed;
      let docs_points = document.getElementById('document-points');
      docs_points.innerHTML = game.data.document_points;
      let docs_level = document.getElementById('documents-level');
      docs_level.innerHTML = game.data.levels.length;
      for(var i = 0; i < games.length; i++) {
        const el1 = document.getElementById("" + games[i] + "-progress");
        const el2 = document.getElementById("" + games[i] + "-progress-width");
        if (games[i] in town_info.games) {
          const completion = town_info.games[games[i]].completion;
          el1.innerHTML = "" + completion + "%";
          el2.style.width = "" + completion + "%";
        } else {
          el1.innerHTML="Not available";
          el2.style.width = "0%";
        }
      }
    }*/
  });
}

document.addEventListener('DOMContentLoaded', function() {
  let edge_of_playarea = document.getElementById("edge_of_playarea");
  game.setEdgeWarningElement(edge_of_playarea);
  const townsummarybuttons = document.getElementsByClassName('townsummary');
  for(var i = 0; i < townsummarybuttons.length; i++) {
    console.log(townsummarybuttons);
    townsummarybuttons[i].addEventListener('click', function() {
      console.log('town summary');
      game.townsummary();
    });
  }
  game.onUpdateData(update_progression);
  var last_level_count = null;
  game.onUpdateData(function(data) {
    if (last_level_count != data.levels.length) {
      console.log("🏆 level change", last_level_count, data.levels.length);
      last_level_count = data.levels.length
    }
    dataLayer.push({
      'event': 'player_level',
      'current_level': data.levels.length,
    });
   });
  
//   if (last_level_count != null) {
//     console.log("🏆 level up");
//  } else 


  window.game = game;
  document.addEventListener('regionchange', function(ev) {
    update_progression();
  });
});



// swiper settings for game tutorial


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

//swiper.mousewheel.disable();

function highlight_town() {
  if (this.activeIndex === 3) {
    game.removeHighlightFromBuilding(0, "b1")
    game.removeHighlightFromBuilding(0, "b2")
    game.highlightBuilding(0, "b0")
  } else if (this.activeIndex === 2) {
    game.removeHighlightFromBuilding(0, "b0")
    game.removeHighlightFromBuilding(0, "b2")
    game.highlightBuilding(0, "b1") 
  } else if (this.activeIndex === 4) {
    game.removeHighlightFromBuilding(0, "b0")
    game.removeHighlightFromBuilding(0, "b1")
    game.highlightBuilding(0, "b2") 
   } else {
    game.removeHighlightFromBuilding(0, "b0")
    game.removeHighlightFromBuilding(0, "b1")
    game.removeHighlightFromBuilding(0, "b2") 
  }
}

swiper.on('slideChange', highlight_town);

function showPlay (){
  document.getElementById('playbutton').style.display = "block" ;
  document.getElementById('swiper-button-prev').style.left = "-74.9%" ;

}

function hidePlay (){
  document.getElementById('playbutton').style.display = "none" ;
  document.getElementById('swiper-button-prev').style.left = "0%" ;
}


//document.getElementById('swiper-button-prev').onclick = function() {hidePlay()};

// swiper.on('slideChange', hidePlay); 
swiper.on('reachEnd', showPlay); 


// function checkHighlight() {
//   if (highlight_town() === true) {
//     console.log('building is highlighted');
//   }

//   if (highlight_town() === false) {
//     console.log('building is not highlighted');
//   }
// }

// document.getElementById("app").addEventListener("load", checkHighlight);

