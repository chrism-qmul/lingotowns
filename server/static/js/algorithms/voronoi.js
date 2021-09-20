import {Vec2} from '../math/Vec2.js';
import {BoundingBox} from '../collections/BoundingBox.js';
import {BoxedGrid} from '../collections/BoxedGrid.js';

export function voronoi(width, height, points, distance) {
  const distanceMeasure = distance || Vec2.manhattenDistance;
  var result = [];
  for(var y = 0; y < height; y++) {
    result[y] = [];
    for(var x = 0; x < width; x++) {
      result[y][x] = 0;
      var dist = Infinity;
      for(var p = 0; p < points.length; p++) {
        var tdist = distanceMeasure([x, y], points[p]);
//        var tdist = Math.abs(x-points[p].x) + Math.abs(y-points[p].y)
        if (tdist < dist) {
          dist = tdist;
          result[y][x] = p;
        }      
      }
    }
  }
  return result;
}

export function voronoi2(points, distance) {
  const boundingbox = new BoundingBox();
  for(var i = 0; i < points.length; i++) {
    boundingbox.add(points[i]);
  }
  boundingbox.grow(50);
  var grid = new BoxedGrid(boundingbox);

  const distanceMeasure = distance || Vec2.manhattenDistance;
  for(var y = boundingbox.miny; y < boundingbox.maxy; y++) {
    for(var x = boundingbox.minx; x < boundingbox.maxx; x++) {
      var dist = Infinity;
      for(var p = 0; p < points.length; p++) {
        const coord = [x, y];
        var tdist = distanceMeasure(coord, points[p]);
        if (tdist < dist) {
          dist = tdist;
          grid.set(coord, p);
        }
      }
    }
  }
  return grid;
}
