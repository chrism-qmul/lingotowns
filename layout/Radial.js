import {Vec2} from '../math/Vec2.js';

export class RadialPlacement {
  constructor(startposition, zoneradius, random) {
    this.startposition = startposition || new Vec2(0,0);
    this.zoneradius = zoneradius || 20;
    //how much potential for random shift between layers in radians
    this.random = random || 0;
  }

  getPlacements(distance, placements) {
    let results = [];
    const rad = distance*this.zoneradius;
    const part = 1/placements;
    const cx = this.startposition.x;
    const cy = this.startposition.y;
    const init = this.random;
    for(var step = 0; step < placements; step++) {
      const theta = (step+init) * part * 2 * Math.PI;
      var x = cx + rad*Math.cos(theta); 
      var y = cy + rad*Math.sin(theta);
      //console.log(new Vec2(x, y));
      results.push(new Vec2(x, y));
    }
    return results;
  }
}
