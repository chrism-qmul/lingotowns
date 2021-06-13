export class Vec2 extends Array {
  constructor(x, y) {
    if (Array.isArray(x)) {
      [x, y] = x;
    }
    super(x, y);
  }

  isZero() {
    return this.x == 0 && this.y == 0;
  }

  get x() {
    return this[0];
  }

  get y() {
    return this[1];
  }

  set x(nx) {
    return this[0] = nx;
  }

  set y(ny) {
    return this[1] = ny;
  }

  asPlainObject() {
    //this will hash work with javascript Map
    return {x: this.x, y: this.y};
  }

  static fromPlainObject(obj) {
    return new Vec2(obj.x, obj.y);
  }

  static manhattenDistance(a, b) {
    const [ax, ay] = a;
    const [bx, by] = b;
    return Math.abs(ax-bx) + Math.abs(ay-by);
  }

  static chebyshevDistance(a, b) {
    const [ax, ay] = a;
    const [bx, by] = b;
    return Math.max(Math.abs(ax-bx),Math.abs(ay-by));
  }

  static euclideanDistance(a, b) {
    const [ax, ay] = a;
    const [bx, by] = b;
    return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
  }

  toIsometric() {
    let nx = this.x - this.y;
    let ny = (this.x + this.y) / 2;
    this.x = nx;
    this.y = ny;
    return this;
  }
  toCartesian() {
    let nx = (2 * this.y + this.x) / 2;
    let ny = (2 * this.y - this.x) / 2;
    this.x = nx;
    this.y = ny;
    return this;
  }
  mult(val) {
    if (typeof val === "number") {
      this.x *= val;
      this.y *= val;
    } else {
      this.x *= val.x;
      this.y *= val.y;
    }
    return this;
  }
  hash() {
    let hash = 7;
    hash = 71 * hash + this.x;
    hash = 71 * hash + this.y;
    return hash;
  }
  div(val) {
    if (typeof val === "number") {
      this.x /= val;
      this.y /= val;
    } else {
      this.x /= val.x;
      this.y /= val.y;
    }
    return this;
  }
  floor() {
    this.x = Math.floor(this.x); 
    this.y = Math.floor(this.y);
    return this;
  }

  manhatten() {
    return Math.abs(this.x) + Math.abs(this.y);
  }

  dot(vec) {
    return this.x*vec.x + this.y*vec.y;
  }

  toString() {
    return "" + this.x + "," + this.y;
  }

  add(vec) {
    this.x += vec.x;
    this.y += vec.y;
    return this;
  }

  static randUnit() {
    var theta = Math.random() * 2 * Math.PI;
    return new Vec2(Math.cos(theta), Math.sin(theta));
  }

  randGrad() {
    //TODO: unexpected val for [1,1]
    var random = 2920.0 * Math.sin(this.x * 21942.0 + this.y * 171324.0 + 8912.0) * Math.cos(this.x * 23157.0 * this.y * 217832.0 + 9758.0);
    return new Vec2(Math.cos(random), Math.sin(random));
  }

  sub(vec) {
    this.x-=vec.x;
    this.y-=vec.y;
    return this;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  distance(vec, measure) {
    switch(measure) {
      case "manhatten":
        return Vec2.manhattenDistance(this, vec);
      case "chebyshev":
        return Vec2.chebyshevDistance(this, vec);
      default:
        return Vec2.euclideanDistance(this, vec);
    }
  }

  magnitude() {
   return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  normalize() {
    var magnitude = this.magnitude();
    this.x /= magnitude;
    this.y /= magnitude;
    return this;
  }

  //for some target, find its closest edge to this vector
  //given a suitable distance away from the target
  closestEdge(target, distance) {
    return this.sub(target).normalize().mult(distance).add(target);//target.clone().sub(this);
    //return delta.normalize().mult(distance*-1).add(target).floor();
  }

  equals(vec) {
    const [bx,by] = vec;
    return (this.x == bx && this.y == by);
  }
}
