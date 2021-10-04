import {AStarGrid} from './astar.js';

//decorates AStarGrid toallow neg coords
export class AStarBox {

  constructor(boundingbox, checkAvailability) {
    this.boundingbox = boundingbox;
    this.checkAvailability = checkAvailability;
    this.astar = new AStarGrid(this.boundingbox.width()+1, this.boundingbox.height()+1, this.available.bind(this));
  }

  box(point) {
    return this.boundingbox.zerobased(point.slice());
  }

  unbox(point) {
    return this.boundingbox.unzerobased(point.slice());
  }

  search(start, goal) {
    var result = this.astar.search(this.box(start), this.box(goal));
    if (Array.isArray(result)) {
      return result.map(this.unbox.bind(this));
    } else {
      //console.warn("no route to goal", this.box(start), this.box(goal));
      console.warn("no route to goal", start, goal);
    }
  }

  available(point, moreinfo) {
    if (this.checkAvailability instanceof Function) {
      const isAvailable = this.checkAvailability(this.unbox(point), moreinfo);
      return isAvailable;
    } else {
      return true;
    }
  }
}
