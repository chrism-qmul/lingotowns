import {Vec2} from './math/Vec2.js';
import {AStarGrid} from './algorithms/astar.js';
import {Grid} from './collections/Grid.js';
import {BinaryHeap} from './collections/BinaryHeap.js';

var canvas = document.getElementById('app');
var worldWidth = 20;
var worldHeight = 20;

function drawLine(context, a, b) {
  context.beginPath(); 
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}

class WorldSearch extends AStarGrid {
  constructor(width, height, locations, radius) {
    super(width, height);
    this.locations = locations;
    this.radius = radius;
  }

  insideLocationArea(point) {
    for(var i = 0; i < this.locations.length; i++) {
      var [x, y] = point;
      var [locationx, locationy] = this.locations[i];
      var a = new Vec2(x, y) 
      var b = new Vec2(locationx, locationy);
      if (a.distance(b) < this.radius) {
        return true
      }
    }
    return false;
  }

  available(point) {
    return super.available(point) && !this.insideLocationArea(point);
  }
}

var mouseposition = document.getElementById('mouseposition');

document.addEventListener('mousemove', function(ev) {
  mouseposition.innerHTML = "" + ev.clientX + "," + ev.clientY;
});

function drawCircleToContext(context, x, y, r) {
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI);
  context.stroke();
}


class Game {
  constructor(canvas, start, goal, worldwidth, worldheight) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.worldWidth = worldwidth;
    this.worldHeight = worldheight;
    this.start = start;
    this.goal = goal;
    this.grid = new Grid(worldwidth);
    this.dirty = true;
    this.obstacles = [[0,5],[7,6],[11,5],[3,11],[7,12],[6,16],[8,16]];
    this.obstacle_radius = 2;
    this.search = new WorldSearch(this.worldWidth, this.worldHeight, this.obstacles, this.obstacle_radius);
    console.log("start", start);
    const t1 = performance.now();
    this.path = this.search.search(start, goal);
    const t2 = performance.now();
    console.log("A* took", (t2-t1), "milliseconds");
    console.log(this.path);
  }

  drawCircle(x, y, r) {
    drawCircleToContext(this.context, x, y, r);
  }

  drawCircleForVec(vec, r) {
    drawCircleToContext(this.context, vec.x, vec.y, r);
  }

  drawLine(a, b) {
      this.context.moveTo(a[0], a[1]);
      this.context.lineTo(b[0], b[1]);
      this.context.stroke();
  }

  drawPath(path) {
    for(var i = 0; i < path.length-1; i++) {
      this.drawLine(path[i], path[i+1]);
    }
  }

  get tileHeight() {
      return this.canvas.height/this.worldHeight;
  }

  get tileWidth() {
      return this.canvas.width/this.worldWidth;
  }

  fillTile(point, color) {
    var [x, y] = point;
    this.context.save();
    this.context.fillStyle = color;
    this.context.fillRect(this.tileWidth*x, this.tileHeight*y, this.tileWidth, this.tileHeight); 
    this.context.restore();
  }

  draw(ts) {
    if (this.dirty) {
      const elapsed = ts - this.lastTS;
      const tileHeight = this.canvas.height/this.worldHeight;
      const tileWidth = this.canvas.width/this.worldWidth;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for(var x = 0; x < this.worldWidth; x++) {
        this.drawLine([this.tileWidth*x, 0], [this.tileWidth*x, this.canvas.height]);
      }

      for(var y = 0; y < this.worldHeight; y++) {
        this.drawLine([0, this.tileHeight*y], [this.canvas.width, this.tileHeight*y]);
      }

      for(var x = 0; x < this.worldWidth; x++) {
        for(var y = 0; y < this.worldHeight; y++) {
          if (!this.search.available([x,y])) {
            this.fillTile([x,y], "#555555");
          }
        }
      }
      for(var i = 0; i < this.obstacles.length; i++) {
        this.fillTile(this.obstacles[i], "#000000");
      }
      for(var i = 0; i < this.path.length; i++) {
        this.fillTile(this.path[i], "#999999");
      }
      this.fillTile(this.start, "#0000FF");
      this.fillTile(this.goal, "#00FF00");


      this.lastTS = ts;
      this.dirty = false;
    }
    window.requestAnimationFrame(this.draw.bind(this));
  }
}

let game = new Game(canvas, [1,1], [19,18], 20, 20);
game.draw();
