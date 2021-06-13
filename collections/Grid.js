export class Grid extends Array {
  constructor(width) {
    super();
    this.width = width;
  }

  address(point) {
    const [x,y] = point;
    if (x < 0 || x > this.width || y < 0 || y > this.height) {
      return undefined;
    }
    return x + this.width * y;
  }

  point(address) {
    const y = Math.floor(address / this.width);
    const x = address % this.width;
    return [x, y];
  }

  get(point, defaultValue) {
    const idx = this.address(point);
    if (idx === undefined || this[idx] === undefined) {
      return defaultValue;
    } else {
      return this[idx];
    }
  }

  set(point, value) {
    const idx = this.address(point);
    this[idx] = value;
    return value;
  }
}
