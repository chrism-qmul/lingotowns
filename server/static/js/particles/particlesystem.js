import {Vec2} from '../math/Vec2.js';

export class ParticleSystem {
  constructor() {
    this.particles = []; 
  }

  update(elapsed) {
    for(var i = this.particles.length-1; i >= 0; i--) {
      this.particles[i].update(elapsed);
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  active() {
    return this.particles.length > 0;
  }

  draw(context) {
    for(var i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(context);
    }
  }
}
export class Particle {

  constructor(location) {
    this.location = location.clone();
    this.slowdown = 0.99;
    this.velocity = Vec2.zero();
    this.gravity = new Vec2(0, 0.9);
    this.lifetime = 10;
    this.delay = 0;
    this.on_death = [];
    this.original_lifetime = this.lifetime;
  }

  onDeath(callback) {
    this.on_death.push(callback);
  }

  completion() {
    return 1-(this.lifetime/this._lifetime);
  }

  update(elapsed) {
    if (this._lifetime === undefined) {
      this._lifetime ||= this.lifetime;
    }
    if (this.delay > 0) {
      this.delay -= elapsed;
    } else {
      this.lifetime -= elapsed;
      if (this.lifetime <= 0) {
        for(var i = 0; i < this.on_death.length; i++) {
          this.on_death[i](this);
        }
      } 
      this.velocity.mult(this.slowdown).add(this.gravity);
      this.location.add(this.velocity.clone().mult(elapsed));
    }
  }

  draw(context) {
    if (this.delay <= 0) {
      context.fillStyle = "red";
      context.fillRect(this.location.x, this.location.y, 1, 1);
    }
  }

  isDead() {
    return this.lifetime < 0;
  }
}
