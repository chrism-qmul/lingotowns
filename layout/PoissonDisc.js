import {Vec2} from '../math/Vec2.js';
import {PRNG} from '../algorithms/prng.js';

// Based on https://www.jasondavies.com/poisson-disc/
function poissonDiscSampler(width, height, radius, seed) { //Bridson's
  var k = 30, // maximum number of samples before rejection
      radius2 = radius * radius,
      R = 3 * radius2,
      cellSize = radius * Math.SQRT1_2,
      gridWidth = Math.ceil(width / cellSize),
      gridHeight = Math.ceil(height / cellSize),
      grid = new Array(gridWidth * gridHeight),
      queue = [],
      queueSize = 0,
      prng = new PRNG(seed),
      sampleSize = 0;

  return function() {
    if (!sampleSize) return sample(prng.random() * width, prng.random() * height);

    // Pick a random existing sample and remove it from the queue.
    while (queueSize) {
      var i = prng.random() * queueSize | 0,
          s = queue[i];

      // Make a new candidate between [radius, 2 * radius] from the existing sample.
      for (var j = 0; j < k; ++j) {
        var a = 2 * Math.PI * prng.random(),
            r = Math.sqrt(prng.random() * R + radius2),
            x = s[0] + r * Math.cos(a),
            y = s[1] + r * Math.sin(a);

        // Reject candidates that are outside the allowed extent,
        // or closer than 2 * radius to any existing sample.
        if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) return sample(x, y);
      }

      queue[i] = queue[--queueSize];
      queue.length = queueSize;
    }
  };

  function far(x, y) {
    var i = x / cellSize | 0,
        j = y / cellSize | 0,
        i0 = Math.max(i - 2, 0),
        j0 = Math.max(j - 2, 0),
        i1 = Math.min(i + 3, gridWidth),
        j1 = Math.min(j + 3, gridHeight);

    for (j = j0; j < j1; ++j) {
      var o = j * gridWidth;
      for (i = i0; i < i1; ++i) {
        if (s = grid[o + i]) {
          var s,
              dx = s[0] - x,
              dy = s[1] - y;
          if (dx * dx + dy * dy < radius2) return false;
        }
      }
    }

    return true;
  }

  function sample(x, y) {
    var s = [x, y];
    queue.push(s);
    grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
    ++sampleSize;
    ++queueSize;
    return s;
  }
}

export class PoissonDiscLayout {
	constructor(startposition, zoneradius, spacex, spacey, seed) {
    this.startposition = startposition || new Vec2(0,0);
    this.spacex = spacex || 20;
    this.spacey = spacey || 20;
		this.sampler = poissonDiscSampler(this.spacex, this.spacey, zoneradius, seed);
	}

	getPlacements(distance, placements) {
		let results = [];
		for(var step = 0; step < placements; step++) {
			const result = this.sampler();
			let v = new Vec2(result[0], result[1]);
			v.sub(new Vec2(this.spacex/2,this.spacey/2)).add(this.startposition);
			results.push(v);
		}
		return results;
	}
}
