export class BoundingBox {
  constructor() {
    this.minx = Infinity;
    this.maxx = -Infinity;
    this.miny = Infinity;
    this.maxy = -Infinity;
    this.addressed = false;
  }

  grow(p) {
    this.minx -= p;
    this.miny -= p;
    this.maxx += p;
    this.maxy += p;
  }

  width() {
    return this.maxx-this.minx;
  }

  height() {
    return this.maxy-this.miny;
  }

  add(point) {
    if (this.addressed) {
      //if something has referenced this, adding new points will break the referencing
      console.trace('Bounding Box already used for addressing');
      throw 'Bounding Box already used for addressing';
    }
    const [x, y] = point;
    if (x > this.maxx) {
      this.maxx = x;  
    }
    if (x < this.minx) {
      this.minx = x;
    }
    if (y > this.maxy) {
      this.maxy = y;
    }
    if (y < this.miny) {
      this.miny = y;
    }
  }

  //remap everything into the positive 0 based quadrant
  //to appeal to certain algorithms that work best this way
  //i.e. no negative values
  zerobased(point) {
    this.addressed = true;
    point[0] -= this.minx;
    point[1] -= this.miny;
    return point;
  }

  //return to original coordinate system from zero based
  unzerobased(point) {
    this.addressed = true;
    point[0] += this.minx;
    point[1] += this.miny;
    return point;
  }
}
