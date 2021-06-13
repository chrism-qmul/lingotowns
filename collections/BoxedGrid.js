import {Grid} from './Grid.js';

export class BoxedGrid extends Grid {
  constructor(boundingbox) {
    super(boundingbox.width());
    this.boundingbox = boundingbox;
  }

  address(point) {
    return super.address(this.boundingbox.zerobased(point.slice()));
  }

  point(address) {
    return this.boundingbox.unzerobased(super.point(address));
  }
}
