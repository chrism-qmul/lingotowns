import {WorldSearch} from './algorithms/WorldSearch.js';
import {voronoi} from './algorithms/voronoi.js';
import {Vec2} from './math/Vec2.js';
import {PoissonDiscLayout as PoissonDiscPlacement} from './layout/PoissonDisc.js';
import {RadialPlacement} from './layout/Radial.js';
import {BoundingBox} from './collections/BoundingBox.js';
import {World} from './world.js';

var canvas = document.getElementById('app');
var worldWidth = 20;
var worldHeight = 20;

function drawLine(context, a, b) {
  context.beginPath(); 
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}

var mouseposition = document.getElementById('mouseposition');

document.addEventListener('mousemove', function(ev) {
  mouseposition.innerHTML = "" + ev.clientX + "," + ev.clientY;
});


function randomColour() {
  return "rgb(" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + ","  + Math.floor(Math.random() * 255) + ")";
}

var colors = [];
for (var i = 0; i < 20; i++) {
  colors.push(randomColour());
}

function drawCircleToContext(context, x, y, r) {
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI);
  context.stroke();
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
		//this.poissondiscsampler = 
    this.context.font = "12px Arial";
    //this.levels = [2, 5, 2, 7, 10];
    this.levels = [2];
    this.locations = [];
    this.dirty = true;
    this.worldbox = new BoundingBox();
    this.world = new World();
    this.world.addLevel(2);
    this.world.calculate();
    console.log(this.world.grid);
  }

  addRandomLevel() {
    const cities = Math.floor(Math.random()*10)+1
    this.world.addLevel(cities);
    this.world.calculate();
    //this.levels.push(cities);
    //console.log("levels", this.levels);
    this.dirty = true;
  }

  removeLevel() {
    //this.levels.pop();
    //this.locations.pop();
    this.world.removeLevel();
    //console.log("levels", this.levels);
    this.dirty = true;
  }

  drawCircle(x, y, r) {
    drawCircleToContext(this.context, x, y, r);
  }

  drawCircleForVec(vec, r) {
    drawCircleToContext(this.context, vec.x, vec.y, r);
  }

  drawLevels() {
    const rad = 30;
    var cx = this.canvas.width/2;
    var cy = this.canvas.width/2;
    for(var i = 0; i < this.levels.length; i++) {
      const part = 1/this.levels[i];
      const os = Math.random();
      for(var j = 0; j < this.levels[i]; j++) {
        const theta = j * part * 2 * Math.PI;
        var x = cx + i*rad*Math.cos(theta); 
        var y = cy + i*rad*Math.sin(theta);
        this.drawCircle(x, y, 4);
      }
      this.drawCircle(cx, cy, (i*rad)+(rad/2));
    }
  }

  calculateBuildingLocations() {
    //this.building_locations = [];
    //this.town_locations = [];
    let results = []
    const town_placement = new RadialPlacement(new Vec2(this.canvas.width/2, this.canvas.height/2), 40, 0.2);
    //const town_placement = new PoissonDiscPlacement(new Vec2(this.canvas.width/2, this.canvas.height/2), 40, 250, 250);
    const levels = this.levels;
    //var towns = [];
    for(var i = this.locations.length; i < levels.length; i++) {
      this.locations[i] = {"buildings":[], "towns":[]};
      const town_locations = town_placement.getPlacements(i+1, levels[i]);
      console.log(levels[i], town_locations);
      for (var j = 0; j < town_locations.length; j++) {
        this.locations[i]["towns"].push(town_locations[j].floor());
        //towns.push(town_locations[j]);
        //const building_placement = new RadialPlacement(town_locations[j], 5);
        const building_placement = new PoissonDiscPlacement(town_locations[j], 5);
        const building_locations = building_placement.getPlacements(1, 3); //2 buildings - 1 dist away
        for(var b = 0; b < building_locations.length; b++) {
          const building_location = building_locations[b].floor();
          this.worldbox.add(town_locations[j].floor());
          this.worldbox.add(building_location);
          this.locations[i]["buildings"].push({level: i, doc: j, game: b, townposition: town_locations[j].floor(), position: building_location});
          //results.push();
        }
      }
    }
    //console.log({"buildings":results, "towns": towns});
    //return {"buildings":results, "towns": towns};
    return this.locations;
  }

  drawRegions() {
    var regions = this.world.regions
    for(var y = regions.boundingbox.miny; y < regions.boundingbox.maxy; y++) {
      for(var x = regions.boundingbox.minx; x < regions.boundingbox.maxx; x++) {
        const point = [x, y];
        const idx = regions.get(point, 0);
        this.context.fillStyle = colors[idx%colors.length];
        this.context.fillRect(x+250, y+250, 1, 1);
      }
    }
  }

  drawPath(path) {
    //console.log(path);
    for(var i = 0; i < path.length-1; i++) {
      this.context.moveTo(path[i][0], path[i][1]);
      this.context.lineTo(path[i+1][0],path[i+1][1]);
      this.context.stroke();
    }
  }

  /*
  drawBuildingLocations() {
    //var results = this.calculateBuildingLocations();
    this.calculateBuildingLocations();
    var buildings = [];//results['buildings'];
    var towns = [];//results['towns'];
    for(var i = 0; i < this.locations.length; i++) {
      for(var j = 0; j < this.locations[i]["buildings"].length; j++) {
        buildings.push(this.locations[i]["buildings"][j]);
      }
      for(var j = 0; j < this.locations[i]["towns"].length; j++) {
        towns.push(this.locations[i]["towns"][j]);
      }
    }
    console.log("towns", towns);
    this.drawRegions(towns);
    //BUILDINGS:
    var townradius = 16;
    var search = new WorldSearch(this.worldbox, buildings.map((building) => building.position),0);//, 2);
    for(var i = 0; i < buildings.length; i++) {
      this.drawCircleForVec(buildings[i].position, 2);
      var townposition = buildings[i].townposition;

      var centerpoint = new Vec2(250, 250);
      var distfromhome = townposition.clone().sub(centerpoint);

      var closestpointonedge = distfromhome.normalize().mult(townradius*-1).add(townposition).floor();
      //closestpointonedge = centerpoint.closestEdge(townposition,townradius);
      //console.log(buildings[i]);
      var path = search.search(closestpointonedge, buildings[i].position);
      this.drawPath(path);
    }
    //TOWNS:
    var search = new WorldSearch(this.worldbox,towns,townradius-4);//towns,townradius-2);
      //[],0);//towns,townradius);
    for(var i = 0; i < towns.length; i++) {
      var centerpoint = new Vec2(250, 250);
      var closestpointonedge = centerpoint.closestEdge(towns[i],townradius+1).floor();
      //var distfromhome = towns[i].clone().sub(centerpoint);
      //var closestpointonedge = distfromhome.normalize().mult(townradius*-1).add(towns[i]).floor();
      var path = search.search([250,250], closestpointonedge);
      this.drawPath(path);
      //this.drawCircleForVec(towns[i], townradius);
    }
  }
  */

  drawPoint(point) {
    const [x, y] = point;
    this.context.fillRect(x, y, 1, 1);
  }

  home() {
    return new Vec2(this.canvas.width/2, this.canvas.height/2);
  }

  drawBuildingLocations() {
    this.drawRegions();
    const home = this.home();
    const buildingLocations = this.world.buildingLocations();
    for (var i = 0; i < buildingLocations.length; i++) {
      const buildingLocation = buildingLocations[i];
      this.drawCircleForVec(home.clone().add(buildingLocation), 2);
    }
    const roads = this.world.road();
    this.context.fillStyle = "#000000";
    for(var i = 0; i < roads.length; i++) {
      const road = new Vec2(roads[i]).add(home);
      //console.log(road);
      this.drawPoint(road);
    }
  }

  draw(ts) {
    if (this.dirty) {
      const elapsed = ts - this.lastTS;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawCircle(this.canvas.width/2, this.canvas.height/2, 10);
      this.drawBuildingLocations();
      this.lastTS = ts;
      this.dirty = false;
    }
    window.requestAnimationFrame(this.draw.bind(this));
  }
}

console.log("loading a vec2", new Vec2([1,1]));

let game = new Game(canvas);
console.log(game.calculateBuildingLocations());
game.draw();

addEventListener('keydown', function(ev)  {
  switch(ev.keyCode) {
    case 187:
      game.addRandomLevel();
      break;
    case 189:
      game.removeLevel();
      break;
    default:
      console.log("unbound key: " + ev.keyCode);
  }
});
