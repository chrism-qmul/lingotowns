import {Vec2} from './math/Vec2.js';
import {RadialPlacement} from './layout/Radial.js';
import {PoissonDiscLayout} from './layout/PoissonDisc.js';
import {BoxedGrid} from './collections/BoxedGrid.js';
import {BoundingBox} from './collections/BoundingBox.js';
import {WorldSearch} from './algorithms/WorldSearch.js';
import {voronoi2} from './algorithms/voronoi.js';

export const RoadWest = 1;
export const RoadNorth = 1 << 1;
export const RoadEast = 1 << 2;
export const RoadSouth = 1 << 3;

export class World {
  constructor(seed, includeBuildings) {
    //level indexed
    this.seed = seed;
    this.includeBuildings = includeBuildings;
    //this.number_of_towns = [1];
    this.number_of_towns = [];
    this.locations = [];
    this.roads = [];
    this.home = new Vec2(0,0);
    this.worldbox = new BoundingBox();
    this.grid = undefined;
    this.regions = undefined;
  }

  calculate() {
    this.calculateTownLocations();
    this.updateBoundingBox();
    this.calculateRoad();
    this.updateGrid();
    this.updateRegions();
  }

  calculateTownLocations() {
    const town_placement = new RadialPlacement(new Vec2(0,0), 30, .2, this.seed);
    for(var i = this.locations.length; i < this.number_of_towns.length; i++) {
      const town_locations = town_placement.getPlacements(i, this.number_of_towns[i]);
      this.locations[i] = {towns: []};
      for(var t = 0; t < town_locations.length; t++) {
        this.locations[i].towns.push({position: town_locations[t].floor(),
                                      buildings: this.calculateBuildingLocations(town_locations[t])})
      }
    }
  }

  updateRegions() {
    this.regions = voronoi2(this.townLocations());
  }

  calculateBuildingLocations(town_location) {
    var results = [];
    const building_placement = new PoissonDiscLayout(town_location, 5, 20, 20, this.seed); //new RadialPlacement(town_locations[j], 5);
    const building_locations = building_placement.getPlacements(1, 3); //2 buildings - 1 dist away
    for(var b = 0; b < building_locations.length; b++) {
        const building_location = building_locations[b].floor();
        results.push({building: b, position: building_location});
    }
    return results;
  }

  towns() {
    var result = [];
    for(var i = 0; i < this.locations.length; i++) {
      result = result.concat(this.locations[i].towns);
    }
    return result;
  }

  buildings() {
    const towns = this.towns();
    var result = [];
    for(var i = 0; i < towns.length; i++) {
      result = result.concat(towns[i].buildings)
    }
    return result
  }

  buildingLocations() {
    return this.buildings().map((building) => building.position);
  }

  townLocations() {
    return this.towns().map((town) => town.position);
  }

  updateBoundingBox() {
    var locations = this.townLocations();
    this.worldbox = new BoundingBox();
    locations = locations.concat(this.buildingLocations());
    for(var i = 0; i < locations.length; i++) {
      this.worldbox.add(locations[i]);
    }
    this.worldbox.grow(5);
  }

  road() {
    return this.roads.flat();
  }

  updateGrid() {
    const buildings = this.buildings();
    const road = this.road();
    this.grid = new BoxedGrid(this.worldbox);
    for(var r = 0; r < road.length; r++) {
      this.grid.set(road[r], "r");
    }
    for(var r = 0; r < road.length; r++) {
      const [x, y] = road[r];
      const west = this.grid.get([x-1, y],"").startsWith("r");
      const east = this.grid.get([x+1, y],"").startsWith("r");
      const north = this.grid.get([x, y-1],"").startsWith("r");
      const south = this.grid.get([x, y+1],"").startsWith("r");
      let result = 0;
      if (west) result |= RoadWest;
      if (east) result |= RoadEast;
      if (north) result |= RoadNorth;
      if (south) result |= RoadSouth;
      this.grid.set([x, y], "r" + result);
/*
      if (west || east || north || south) {
        this.grid.set([x, y], "rj");
      }
      if (east && west && !north && !south) {
        this.grid.set([x,y], "rh");
      }
      if (!east && !west && north && south) {
        this.grid.set([x,y], "rv");
      }
*/
    }
    if (this.includeBuildings) {
      for(var b = 0; b < buildings.length; b++) {
        this.grid.set(buildings[b].position,"b" + buildings[b].building);
      }
    }
    //take another pass of road to look at neighbours and see which way road
    //is going - or create junction
  }

  get(point) {
    return this.grid.get(point);
  }

  calculateRoad() {
    const towns = this.towns();
    const townLocations = this.townLocations().slice(1);
    //this.roads[0] = [];
    const buildingOffset = new Vec2(-2, 1);
    for(var i = this.roads.length; i < this.number_of_towns.length; i++) {
      this.roads[i] = [];
      for(var t = 0; t < this.locations[i].towns.length; t++) {
        const town_position = this.locations[i].towns[t].position;
        //console.log(this.locations);
        var edgeoftown = new Vec2(0,0);
        if (!town_position.isZero()) {
         edgeoftown = this.home.clone().closestEdge(town_position, 17).floor();
        }
        let townsExCurrent = [];
        for(var x = 0; x < townLocations.length; x++) {
          if(!townLocations[x].equals(town_position)) {
            townsExCurrent.push(townLocations[x]);
          }
        }
        var search = new WorldSearch(this.worldbox, townLocations, 12);
        var result = undefined;
        if (!edgeoftown.isZero()) {
          result = search.search(this.home,edgeoftown);
          if (!Array.isArray(result)) {
            console.log("unable to get path to town", this.home, edgeoftown);
          }
        }
        if (Array.isArray(result)) {
          this.roads[i] = this.roads[i].concat(result);
        }
        const buildings = this.locations[i].towns[t].buildings;
        //const buildingLocations = buildings.map(function(building) {return building.position;});
        //const buildingLocations = buildings.map(function(building) {return (new Vec2(1,0).sub(building.position.clone()));});
        const buildingLocations = buildings.map(function(building) {return building.position.clone().add(new Vec2(-1,-1));});
        search = new WorldSearch(this.worldbox, buildingLocations, 2);
        var result = undefined;
        for(var b = 0; b < buildings.length; b++) {
          const building = buildings[b].position;
          const frontOfBuilding = new Vec2(building).add(buildingOffset)
          /*
          if (search.insideLocationArea(frontOfBuilding)) {
            console.log("inside Location Area", frontOfBuilding);
          } else {
            console.log("not inside Location Area", frontOfBuilding);
          }
          */
          result = search.search(edgeoftown, frontOfBuilding);
          if (Array.isArray(result)) {
            this.roads[i] = this.roads[i].concat(result);
          } else {
            console.log("unable to get path to building", edgeoftown, frontOfBuilding, "building", building);
          }
        }
      }
    }
  }

  addLevel(number){
    this.number_of_towns.push(number);
    this.calculate();
  }

  levels() {
    return this.number_of_towns.length;
  }

  removeLevel() {
    this.number_of_towns.pop();
    this.locations.pop();
    this.roads.pop();
    this.calculate();
  }
}
