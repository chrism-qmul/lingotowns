//Mulberry32 PRNG

function xmur3(str) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
      h = h << 13 | h >>> 19;
  }
  h = Math.imul(h ^ h >>> 16, 2246822507);
  h = Math.imul(h ^ h >>> 13, 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export class PRNG {
  constructor(seed) {
    switch(typeof seed) {
      case "string":
        this.seed = xmur3(seed);
        break;
      case "number":
        this.seed = seed;
        break;
      default:
        console.trace("wrong seed type", seed);
        throw "Can't use this type for seed";
        break;
    }
  }

  random() {
    var t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
};
