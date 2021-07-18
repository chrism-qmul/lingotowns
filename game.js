import {Vec2} from './math/Vec2.js';
import {BoundingBox} from './collections/BoundingBox.js';
import {World,RoadEast,RoadNorth,RoadSouth,RoadWest} from './world.js';
import {PRNG} from './algorithms/prng.js';

var canvas = document.getElementById('app');
var minimapcanvas = document.getElementById('minimap');
let smallestdim = Math.min(minimapcanvas.parentNode.offsetWidth,minimapcanvas.parentNode.offsetHeight)
minimapcanvas.width = Math.min(smallestdim, 200);
minimapcanvas.height = Math.min(smallestdim, 200);
var worldWidth = 20;
var worldHeight = 20;

var prng = new PRNG("test1a");
console.log("random", prng.random(), prng.random());

function animate(animationlength, updatefn, donefn) {
  let start;

  function step(timestamp) {
    if (start == undefined) start = timestamp;
    const elapsed = timestamp - start;
    const completion = elapsed/animationlength;
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

  startdrag(ev) {
    this.dragging = true;
    this.sendupdate(ev.pageX, ev.pageY);
  }

  drag(ev) {
    if (this.dragging) {
      this.sendupdate(ev.pageX, ev.pageY);
    }
  }

  enddrag(ev) {
    this.dragging = false;
    this.sendupdate(ev.pageX, ev.pageY);
    this.lastX = null;
    this.lastY = null;
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

const memoized_perlin = memoize(perlin, function(vec) {return vec.hash();}, 2000);
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
    this.lastregion = null;
    this.minimapscale = 10;
    this.mouseGridPosition = null;
    this.lastTS = null;
    this.tracking_elements = [];
    this.on_update_data = [];
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.minimapcontext = minimapcanvas.getContext("2d");
    this.context.font = "12px Arial";
    this.regions = [new WoodlandRegion(this), new LakesRegion(this), new DesertRegion(this), new FarmRegionA(this), new FarmRegionB(this)];
    this.regions_colors = this.regions.map(function(r) {return r.color()});
    this.dragging = false;          
    this.worldbox = new BoundingBox();
    this.screenScale = new Vec2(this.canvas.width/worldWidth, this.canvas.height/worldHeight); //basic orthographic
    this.worldTranslate = new Vec2(0,0);
    this.screenTranslate = new Vec2(0,0);
    //replace above with transformation matrix?
    this.moveStyle = litMovement;
    this.resources = {
      scroll: "images/scroll.png",
      bakery: "images/new/bakery.png",
      library: "images/new/library.png",
      //library: "images/library.small.png",
      grass: "images/grass.small.png",
      field: "images/field.small.png",
      corn: "images/corn.small.png",
      water: "images/water.small.png",
      desert1: "images/desert1.small.png",
      desert2: "images/desert2.small.png",
      tree1: "images/tree1.small.png",
      tree2: "images/tree2.small.png",
      volcano: "images/volcano.small.png",
      road: "images/road.png",
      stone: "images/stone.png",
      cloud: "images/cloud.png",
      //roadnorth: "images/road-north.png",
      //roadeastnorth: "images/new/road-east-north.png",
      roadeastwestnorth:"images/new/road-east-west-north.png",
      roadsouthwestnorth:"images/new/road-south-west-north.png",
      roadwestnorth:"images/new/road-west-north.png",
      roadx:"images/new/road-x.png",
      roadnorth: "images/new/road-lights.png",
      //roadeast: "images/road-east.png",
      roadeast: "images/new/road-lights-east.png",
      roadjunction: "images/road-junction.png",
      compass: "compass.png",
    };
    this.target_fog_radius = 10;
    this.fog_progress = 0;
    this.fog_radius = 10;
    this.near_edge_of_playarea = false;
    //this.visibleWorld =  
    this.loader = new Loader();
    var klass = this;
    this.locations = [];
    this.world = new World("testa");
    //this.world.addLevel(1);
    console.log(this.world.regions);
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

  addLevel(docs) {
    this.world.addLevel(docs);
    //this.increaseFog();
  }

  updateNearEdgeOfPlayArea(isNearEdge) {
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
    if (midpoint.magnitude() > this.fog_radius) {
      this.updateNearEdgeOfPlayArea(true);
    } else {
      this.updateNearEdgeOfPlayArea(false);
    }
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
    const iframe = document.createElement("IFRAME");
    iframe.className = "gamewindow"; 
    iframe.src = url;
    document.body.appendChild(iframe);
    this.toclose.push(iframe);
    /*
    const closebutton = document.createElement("button");
    closebutton.innerHTML = "Return to the town";
    closebutton.className = "gameclosebutton";
    document.body.appendChild(closebutton);
    */

    let closefn = function() {
        document.body.removeChild(iframe);
        document.body.removeChild(closebutton);
    }
    if (data) {
      console.log("sending town data", data);
      iframe.contentWindow.postMessage(data, "*");
    }
    return iframe;
    //closebutton.addEventListener('click', closefn, {once: true});
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

  selectobject() {
    if (this.mouseGridPosition) {
      const mousepos = this.mouseGridPosition.floor();
      const tile = this.world.get(mousepos);
      console.log("no action clicking on", this.mouseGridPosition, tile);
    }
    /*
      if (this.mouseGridPosition) {
        const mousepos = this.mouseGridPosition.floor();
        for(var x = 0; x < 5; x++) {
          for(var y = 0; y < 5; y++) {
            let search = mousepos.clone().floor().add(new Vec2(x, y));
            const tile = this.world.get(search);
            if (tile && tile.startsWith("b")) {
               switch(tile) {
                case "b0":
                  let randomtask = Math.floor(Math.random() * (5000 - 1000 + 1)) + 500;
                   this.showgame("https://phrasefarm.org/#/game/" + randomtask);
                break;
                case "b1":
                   this.showgame("https://wormingo.com/");
                break;
               }
               return;
            }
          }
        }
      }
      */
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
      let smallestdim = Math.min(minimapcanvas.parentNode.offsetWidth,minimapcanvas.parentNode.offsetHeight)
      minimapcanvas.width = smallestdim;//Math.min(smallestdim, 200);
      minimapcanvas.height = smallestdim;//Math.min(smallestdim, 200);
      this.requireDraw();
  }

  toggleDebug() {
    this.debug = !this.debug;
  }

  async preload() {
    const loaded_resources = {
      scroll: await this.loader.load(this.resources.scroll),
      bakery: await this.loader.load(this.resources.bakery),
      library: await this.loader.load(this.resources.library),
      tree1: await this.loader.load(this.resources.tree1),
      tree2: await this.loader.load(this.resources.tree2),
      grass: await this.loader.load(this.resources.grass),
      corn: await this.loader.load(this.resources.corn),
      field: await this.loader.load(this.resources.field),
      water: await this.loader.load(this.resources.water),
      desert1: await this.loader.load(this.resources.desert1),
      desert2: await this.loader.load(this.resources.desert2),
      volcano: await this.loader.load(this.resources.volcano),
      road: await this.loader.load(this.resources.road),
      roadeastwestnorth: await this.loader.load(this.resources.roadeastwestnorth),
      roadsouthwestnorth: await this.loader.load(this.resources.roadsouthwestnorth),
      roadwestnorth: await this.loader.load(this.resources.roadwestnorth),
      roadx: await this.loader.load(this.resources.roadx),
      stone: await this.loader.load(this.resources.stone),
      cloud: await this.loader.load(this.resources.cloud),
      roadnorth: await this.loader.load(this.resources.roadnorth),
      roadeast: await this.loader.load(this.resources.roadeast),
      roadjunction: await this.loader.load(this.resources.roadjunction),
      compass: await this.loader.load(this.resources.compass),
    }
    this.resources = loaded_resources;
    return this.resources;
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
    let idx = regionIdx;
    for(var level_idx = 0; level_idx < this.data.levels.length; level_idx++) {
      const towns = this.data.levels[level_idx].towns;
      for(var town_idx = 0; town_idx < towns.length; town_idx++) {
        if (idx == 0) {
          towns[town_idx].level = level_idx;
          return towns[town_idx];
        }
        idx--;
      }
    }
  }

  getCurrentTownInformation() {
    return this.getTownInformation(this.lastregion);
  }

  drawMap() {
    const worldDimensions = this.worldDimensions();
    let locations = this.screenWorldLocations();
    for(var i = 0; i < locations.length; i++) {
      let position = locations[i];
      let position_floored = position.clone().floor();
      let tile = this.world.get(position_floored)
      switch(tile) {
        case "b0":
        this.drawImageToTiles(position, new Vec2(3, 3), this.resources.bakery);
          break;
        case "b1":
        this.drawImageToTiles(position, new Vec2(3, 3), this.resources.library);
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
/*
        case ("r" + (RoadEast | RoadWest | RoadNorth)):
          this.drawImageToTiles(position, new Vec2(1, 1), this.resources.roadeastwestnorth);
          break;
*/
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
      const regionIdx = this.world.regions.get(position_floored,0);
      const region = this.regions[regionIdx%this.regions.length];
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
      this.lastregion = currentregion;
      console.log(this.lastregion);
      document.dispatchEvent(new CustomEvent('regionchange', {detail: {region: currentregion}}));
    }
    const region = this.regions[currentregion%this.regions.length];
    this.updateTrackingElements();
    /*
    const towns = this.world.towns();
    for(var i = 0; i < locations.length; i++) {
      const position = locations[i];
      const position_floored = position.clone().floor();
      for(var j = 0; j < towns.length; j++) {
        if (position_floored.equals(towns[j].position)) {
          //town on screen
          console.log("town location", this.toScreen(position_floored));
          const div = document.createElement("div");
          //div. 
        }
      }
    }
    */
    //this.context.drawImage(this.resources.compass, this.canvas.width-this.resources.compass.width, this.canvas.height, this.resources.compass.width, this.resources.compass.height);
  }

  worldPointAtScreenCenter() {
    return this.toWorld(new Vec2(this.canvas.width/2, this.canvas.height/2)).floor();
  }

  drawSign() {
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
  }

  onScreen(worldpoint) {
    //check if a worldpoint is currently on the screen
    const point = this.toScreen(worldpoint);
    return ((point.x > 0 && point.x < this.canvas.width) && (point.y > 0 && point.y < this.canvas.height));
  }

  drawCompass() {
    const midscreen = new Vec2(this.canvas.width/2, this.canvas.height/2);
    this.context.drawImage(this.resources.compass, this.resources.compass.width, this.resources.compass.height, 5, 5);
    this.next_target = new Vec2(0,0);
    if (!this.onScreen(this.next_target)) {
      const next_target_on_screen = this.toScreen(this.next_target);
      const diff = next_target_on_screen.sub(midscreen);
      const rotation = Math.atan2(diff.y, diff.x) + Math.PI*.5;
      //console.log("mid screen", midscreen, "next target on screen", this.next_target, "difference", diff, "angle", rotation);
      this.context.save();
      this.context.translate(this.canvas.width-this.resources.compass.width/2, this.resources.compass.height/2);
      this.context.rotate(rotation);
      this.context.drawImage(this.resources.compass, -this.resources.compass.width/2, -this.resources.compass.height/2, this.resources.compass.width, this.resources.compass.height);
      this.context.restore();
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

  onUpdateData(fn) {
    this.on_update_data.push(fn);
  }

  updateData(data) {
    this.world = new World("testa");
    this.data = data;
    console.log(data);
    //for(var level_idx = this.world.levels()-1; level_idx < this.data.levels.length; level_idx++) {
    for(var level_idx = 0; level_idx < this.data.levels.length; level_idx++) {
      const towns = this.data.levels[level_idx].towns;
      this.world.addLevel(towns.length);
    }
    this.updateTownOverlays();
    this.updateFogLevel(10 + (22*(this.data.levels.length)));
    for(var i = 0; i < this.on_update_data.length; i++) {
      this.on_update_data[i](this.data);
    }
    this.requireDraw();
  }

  connectToServer() {
    //const socket = io("wss://lingotowns.com/", {path: "/admin/socket.io"});
    //const socket = io("wss://lingotowns.com/");
    const socket = io();
    var on_data_loaded;
    const data_loaded = new Promise(function(resolve, reject) { 
      on_data_loaded = resolve;
    });
    const game = this;
    socket.on("connect", () => {
      game.login().then(function(userdata) {
        game.userdata = userdata;
        socket.emit("auth", userdata.token);
      });
      //  socket.send("Hello!");

        // or with emit() and custom event names
//        socket.emit("salutations", "Hello!", { "mr": "john" }, Uint8Array.from([1, 2, 3, 4]));
      // handle the event sent with socket.send()
      socket.on("message", data => {
        console.log("loaded data", data);
        //console.log(data);
          game.updateData(data);
          on_data_loaded(); 
//          this.addLevel(2);
          });
    });

    // handle the event sent with socket.emit()
    socket.on("greetings", (elem1, elem2, elem3) => {
        console.log(elem1, elem2, elem3);
        });
    return data_loaded;
  }

  setEdgeWarningElement(edgewarningel) {
    this.edgewarningel = edgewarningel;
    let game = this;
    this.edgewarningel.addEventListener("click", function(ev) {
      game.centerWorldPointOnScreen(new Vec2(0,0));
      game.updateNearEdgeOfPlayArea(false);
      game.requireDraw();
    });
  }

  drawMiniMap() {
    //this.minimapworker.postMessage(minimapcanvas, this);
    this.minimapcontext.clearRect(0, 0, minimapcanvas.width, minimapcanvas.height);
    let last_fill = undefined;
    for(var x = 0; x < minimapcanvas.width; x++) {
      for(var y = 0; y < minimapcanvas.height; y++) {
        let worldpos = this.fromMiniMapToWorld(new Vec2(x, y)).floor();
	let tile = this.world.get(worldpos);
	if (tile) {
	  if (tile.startsWith("r")) {
	    if (last_fill != "#000000") {
	      this.minimapcontext.fillStyle = "#000000";
	      last_fill = "#000000" ;
	    }
	    this.minimapcontext.fillRect(x, y, 1, 1);
	  }
	  if (tile == "b0") {
	    if (last_fill != "#FFFF00") {
	      this.minimapcontext.fillStyle = "#FFFF00";
	      last_fill = "#FFFF00" ;
	    }
	    this.minimapcontext.fillRect(x, y, 1, 1);
	  }
	  if (tile == "b1") {
	    if (last_fill != "#00FFFF") {
	      this.minimapcontext.fillStyle = "#00FFFF";
	      last_fill = "#00FFFF";
	    }
	    this.minimapcontext.fillRect(x, y, 1, 1);
	  }
	} else {
	  const regionIdx = this.world.regions.get(worldpos,0);
	  const region_color = this.regions_colors[regionIdx%this.regions.length];
	  if (last_fill != region_color) {
	    this.minimapcontext.fillStyle = region_color;
	    last_fill = region_color;
	  }
	  this.minimapcontext.fillRect(x, y, 1, 1);
	}

      }
    }
    for(var x = 0; x < minimapcanvas.width; x++) {
      for(var y = 0; y < minimapcanvas.height; y++) {
        let worldpos = this.fromMiniMapToWorld(new Vec2(x, y));
        let mag = worldpos.magnitude();
	if (mag > this.fog_radius) {
		let fog_alpha = Math.min((mag - this.fog_radius)/8, 1.0);
		this.minimapcontext.globalAlpha = fog_alpha;
		this.minimapcontext.fillStyle = "#FFFFFF";
		this.minimapcontext.fillRect(x, y, 1, 1);
	}
      }
    }
    this.minimapcontext.globalAlpha = 1.0;
    const worldTopLeft = this.screenToMiniMap(new Vec2(0,0));
    const worldTopRight = this.screenToMiniMap(new Vec2(this.canvas.width, 0));
    const worldBottomRight = this.screenToMiniMap(new Vec2(this.canvas.width, this.canvas.height));
    const worldBottomLeft = this.screenToMiniMap(new Vec2(0, this.canvas.height));

    this.minimapcontext.strokeStyle = "#FF0000";
    this.minimapcontext.beginPath();
    this.minimapcontext.moveTo(worldTopLeft.x, worldTopLeft.y);
    this.minimapcontext.lineTo(worldTopRight.x, worldTopRight.y);
    this.minimapcontext.lineTo(worldBottomRight.x, worldBottomRight.y);
    this.minimapcontext.lineTo(worldBottomLeft.x, worldBottomLeft.y);
    this.minimapcontext.lineTo(worldTopLeft.x, worldTopLeft.y);
    this.minimapcontext.stroke();
    this.minimapcontext.strokeStyle = "#000000";
  }

  centerWorldPointOnScreen(worldPoint) {
    this.screenTranslate = new Vec2(0,0);
    let midpoint = this.toWorld(new Vec2(this.canvas.width/2, this.canvas.height/2)).floor();
    midpoint.sub(worldPoint);
    this.worldTranslate.add(midpoint);
  }

  drawFog() {
    let locations = this.screenWorldLocations();
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

  onMouseMove(ev) {
    var a = new Vec2(ev.pageX - this.canvas.offsetLeft, ev.pageY - this.canvas.offsetTop);
    this.mouseGridPosition = this.toWorld(a);
    this.requireDraw();
  }

  zoomIn() {
    this.screenScale.mult(2);
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
    //const minimapcenter = new Vec2(minimapcanvas.width/2,minimapcanvas.height/2);
    //const canvascenter = new Vec2(canvas.width/2,canvas.height/2).toCartesian();
    //return this.toWorld(vec).clone().add(this.worldTranslate).mult(this.screenScale).add(this.screenTranslate).div(this.minimapscale).add(minimapcenter);
    return this.toWorld(vec).clone().add(this.worldTranslate).mult(this.screenScale).add(this.screenTranslate).sub(this.canvascenter).div(this.minimapscale).add(this.minimapcenter);
  }

  /*
  toMiniMap(vec) {
    return vec.clone().add(this.worldTranslate).mult(this.screenScale).add(this.screenTranslate);
  }
  */

  fromMiniMapToWorld(vec) {
    return vec.clone().sub(this.minimapcenter).mult(this.minimapscale).add(this.canvascenter).sub(this.screenTranslate).div(this.screenScale).sub(this.worldTranslate);
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

  resetView() {
    this.screenScale = new Vec2(this.canvas.width/worldWidth, this.canvas.height/worldHeight); //basic orthographic
    this.worldTranslate = new Vec2(0,0);
  }

  attachEventListeners() {
    var klass = this;
    addEventListener('mousemove', function(ev){
      klass.onMouseMove(ev);
    });
    addEventListener('mousedown', function(ev){
      //klass.onMouseMove(ev);
      this.dragging = true;
    });
    addEventListener('mouseup', function(ev){
      //klass.onMouseMove(ev);
      this.dragging = false;
    });
    addEventListener('wheel', function(ev) {
      game.worldTranslate.sub(new Vec2(Math.ceil(ev.deltaX/3), Math.ceil(ev.deltaY/3)));
      game.requireDraw();
      ev.preventDefault();
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
        case 219: //[
          game.increaseFog();
          break;
        case 221: //]
          game.liftFog();
          break;
        default:
          console.log("unbound key: " + ev.keyCode);
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

  drawDebugInfo(elapsed) {
    var lines = [];
    this.context.save()
    this.context.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.context.fillRect(this.canvas.width-150, 0, 150, this.canvas.height);
    this.context.restore();
    lines.push("DEBUG (d to close)");
    if (this.mouseGridPosition) {
      this.context.textAlign = "right";
      let coords = this.mouseGridPosition.floor();
      lines.push("Mouse World Position: " + coords.x + "x" + coords.y);
      lines.push("Mouse World Mag: " + coords.magnitude());
      var scr = this.toScreen(coords);
      this.drawCircle(scr);
      lines.push("Mouse Screen Position: " + scr.x + "x" + scr.y);
      var s = this.toScreen(coords);
      lines.push("World Translate: " + this.worldTranslate.x + "x" + this.worldTranslate.y);
      var screenTranslate = this.toScreen(this.worldTranslate);
      lines.push("Screen Translate: " + screenTranslate.x + "x" + screenTranslate.y);
      var worldTopLeft = this.worldTranslate.clone().mult(-1);
      lines.push("TL World: " + worldTopLeft.x + "x" + worldTopLeft.y);
      var worldBottomRight = this.toWorld(new Vec2(this.canvas.width, this.canvas.height));
      //var worldRight = this.toWorld(screenTranslate.clone().add(new Vec2(this.canvas.width, 0)))
      lines.push("BR World: " + worldBottomRight.x + "x" + worldBottomRight.y);
      var worldTopRight = this.toWorld(new Vec2(this.canvas.width, 0));
      lines.push("TR World: " + worldTopRight.x + "x" + worldTopRight.y);
      //this.context.strokeRect(s.x-25, s.y, 50, 25);
    }
    lines.push("FPS: " + Math.round(1/(elapsed / 1000.0)));
    this.context.save();
    this.context.fillStyle = "#FFFFFF";
    for(var i = 0; i < lines.length; i++) {
      this.context.fillText(lines[i], this.canvas.width-5, (i+1)*15, 130);
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

  drawImageToTiles(bottomlocation, footprint, img, alpha/*, flipped*/) {
    //image.width 
    /*
              this.context.save();
              if (flipped) {
                this.context.scale(-1,1);
              }
              */
    alpha = alpha || 1.0;
    var bl = this.toScreen(bottomlocation);
    //this.drawCircle(bl);
    var left = this.toScreen(bottomlocation.clone().sub(new Vec2(footprint.x, 0)));
    //this.drawCircle(left);
    var right = this.toScreen(bottomlocation.clone().sub(new Vec2(0, footprint.y)));
    //this.drawCircle(right);
    var desiredImageWidth = right.x - left.x;
    let imgScale = desiredImageWidth/img.width;
    this.context.save();
    this.context.globalAlpha = alpha;
    //this.context.drawImage(img, left.x, bl.y-(img.height*imgScale), img.width*imgScale, img.height*imgScale);
    this.context.drawImage(img, left.x-1, bl.y-(img.height*imgScale)-1, ((img.width+2)*imgScale), ((img.height+2)*imgScale));
    this.context.restore();
    //this.context.strokeRect(this.toScreen(leftGrid).x, this.toScreen(leftGrid).y, 50, 50);
  }

  addTownSummary(townInformation) {
    const game = this;
    const gameoverlay = document.createElement("div");
    gameoverlay.className = "gameoverlay";
    gameoverlay.innerHTML = `
      <button class='townsummary'>PLAY NOW</button>
      <div class='content'>
        <h2>${townInformation.town_name}</h2>
        <table class='detail'>
          <tr>
            <th>Subject</th><td>${townInformation.subject_type}</td>
          </tr>
          <tr>
            <th>Doc</th><td>${townInformation.document_name}</td>
          </tr>
          <tr>
            <th>Level</th><td>${townInformation.level}</td>
          </tr>
          <tr>
            <th>Completion</th><td>${townInformation.total_completion}%</td>
          </tr>
        </table>
      </div>`;
    const townsummarybutton = gameoverlay.getElementsByClassName('townsummary');
    for (var i = 0; i < townsummarybutton.length; i++) {
      townsummarybutton[i].addEventListener('click', function() {
        game.townsummary(townInformation);
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

  updateTownOverlays() {
    this.removeTownOverlays();
    const towns = this.world.towns();
    for(var i = 0; i < towns.length; i++) {
      var townInformation = this.getTownInformation(i);
      if (townInformation) {
        console.log("town information: ", townInformation);
        const townSummaryElement = this.addTownSummary(townInformation);
        game.elementTracksWorld(townSummaryElement, towns[i].position);
      }
      //game.elementTracksWorld(gameoverlays[i], towns[i].position);
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
	    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	    //this.drawDebugGrid(); 
	    this.drawMap();
	    this.drawMiniMap();
	    this.drawFog();// RENABLE FOG HERE
	    this.drawCompass();
	    this.drawSign();
    }
    if (this.debug) {
      this.drawDebugInfo(elapsed); 
    }
    this.lastTS = ts;
    this.dirty = false;
    window.requestAnimationFrame(this.draw.bind(this));
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
  });
});

function update_progression() {
  connect_to_server.then(function() {
    const town_info = game.getCurrentTownInformation();
    if (town_info) {
      const games = ['farms', 'food', 'library'];
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
    }
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
  document.addEventListener('regionchange', function(ev) {
    update_progression();
  });
});
