import {Vec2} from '../math/Vec2.js';
import {ParticleSystem,Particle} from './particlesystem.js';

export class FireworkRadial extends Particle {
  constructor(location) {
    super(location);
    this.speed = 120;
    this.slowdown = 0.9;
    this.velocity = Vec2.randUnit().mult(this.speed);
    this.gravity = new Vec2(0, 0.8);
    this.lifetime = 1.2;
    this.delay = Math.random()*0.5;
  }

  draw(context) {
    if (this.delay <= 0) {
      const l = 50+Math.floor(this.completion()*50);
      context.fillStyle = `hsl(26,100%,${l}%)`;
      context.fillRect(this.location.x-2, this.location.y-2, 4, 4);
    }
  }
}

export class FireworkLeap extends Particle {
  constructor(location) {
    super(location)
    this.slowdown = 0.99;
    this.velocity = new Vec2(((Math.random()*2)-1)*30, -60 - (Math.random()*50));
    this.gravity = new Vec2(0, 0.2);
    this.lifetime = 3;
  }

  draw(context) {
    if (this.delay <= 0) {
      context.fillStyle = "red";
      context.fillRect(this.location.x-2, this.location.y-2, 4, 4);
    }
  }
}

export class FireworkEmitter extends ParticleSystem {
  constructor(location) {
    super();
    this.location = location || Vec2.zero();
    const leap = new FireworkLeap(this.location.clone())
    this.particles.push(leap);
    var fe = this;
    leap.onDeath(function(l) {
      for(var i = 0; i < 20; i++) {
        fe.particles.push(new FireworkRadial(l.location));
      }
    });
  } 

  allParticlesDead() {
    for(var i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].isDead()) {
        return false;
      }
    }
    return true;
  }

  isDead() {
    return this.allParticlesDead();
  }
}
