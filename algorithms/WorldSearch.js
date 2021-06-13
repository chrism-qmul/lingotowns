import {Vec2} from '../math/Vec2.js';
import {AStarBox} from './astarbox.js';

//Decorates AStarBox to provide world search that avoids a set 
//of given coordinates with a certain radius
export class WorldSearch {
  constructor(boundingbox, locations, radius) {
    this.astar = new AStarBox(boundingbox, this.available.bind(this));
    this.locations = locations;
    this.radius = radius;
  }

  search(start, goal) {
    return this.astar.search(start, goal);
  }

  available(point) {
    return !this.insideLocationArea(point);
  }

  insideLocationArea(point) {
    for(var i = 0; i < this.locations.length; i++) {
      if (Vec2.chebyshevDistance(point,this.locations[i]) < this.radius) {
        return true
      }
    }
    return false;
  }
}
