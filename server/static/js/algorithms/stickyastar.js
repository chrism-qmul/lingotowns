import {BinaryHeap} from '../collections/BinaryHeap.js';
import {Grid} from '../collections/Grid.js';
 
function equal_points(a, b) {
  const [ax, ay] = a;
  const [bx, by] = b;
  return (ax == bx && ay == by);
}

//adds small eps distance from existing path to goal to favour sticking to an existing route
//preload gscore for path lower?
export class StickyAStarGrid {

  constructor(width, height, prevroute) {
    super(width, height);
  }

  search(start, goal) {
    if (!this.available(start)) {
      console.log("start point not accessible");
      return;
    }
    if (!this.available(goal)) {
      console.log("goal point not accessible");
      return;
    }
    var gScore = new Grid(this.width);
    var fScore = new Grid(this.width);
    var cameFrom = new Grid(this.width);
    var openSet = new BinaryHeap();
    gScore.set(start, 0);
    fScore.set(start, this.heuristic(start, goal));
    openSet.add(cameFrom.address(start), fScore.get(start, Infinity));
    var current = start;
    //var i = 0;
    while(!openSet.isEmpty()) {
      current = cameFrom.point(openSet.remove());
      if (equal_points(current, goal)) {
        return this.reconstruct_path(cameFrom, goal)
      }

      const ns = this.neighbours(current);
      var tentative_gScore = gScore.get(current, Infinity) + 1;
      for(var i = 0; i < ns.length; i++) {
        const neighbour = ns[i];
        if (tentative_gScore < gScore.get(neighbour, Infinity)) {
          cameFrom.set(neighbour,current);
          gScore.set(neighbour, tentative_gScore);
          var h = this.heuristic(neighbour, goal);
          fScore.set(neighbour, tentative_gScore + h);
          const neighbourAddress = cameFrom.address(neighbour);
          if (!openSet.contains(neighbourAddress)) {
            openSet.add(neighbourAddress, fScore.get(neighbour));
          }
        }
      }
    }
  }

  reconstruct_path(cameFrom, goal) {
    var node = goal;
    var path = []
    while(node !== undefined) {
      path.push(node);
      node = cameFrom.get(node);
    }
    return path.reverse();
  }

  neighbours(point) {
    const [x, y] = point;
    return [[x-1,y],
      [x+1,y],
      [x,y-1],
      [x,y+1]].filter(this.available.bind(this));
  }

  // can the algorithm travel through this point?
  available(point) {
    return this.onGrid(point);
  }

  onGrid(point) {
    const [x, y] = point;
    return (x >= 0 && x < this.width && y >=0 && y < this.height);
  }

  heuristic(point_a, point_b) {
    var [a_x, a_y] = point_a;
    var [b_x, b_y] = point_b;
    return Math.abs(a_x-b_x) + Math.abs(a_y-b_y);
  }
}
