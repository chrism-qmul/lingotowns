export class BinaryHeap {
  constructor() {
    this.items = [];
    this.value_set = new Set();
  }

  add(x, score) {
    const item = {value: x, score: score}
    this.items.push(item);
    this.value_set.add(x); 
    if (this.items.length > 1) {
      this.upheap(this.items.length-1);
    }
  }

  upheap(idx) {
    //console.log("upheap",idx);
    while(this.validIdx(idx)) {
      const parentIdx = this.parentOf(idx);
      if (this.items[parentIdx].score < this.items[idx].score) return;
      this.swap(idx, parentIdx);
      idx = parentIdx;
    }
  }

  remove() {
    if (this.items.length > 1) {
      const firstEntry = this.items[0];
      this.value_set.delete(firstEntry.value);
      this.items[0] = this.items.pop();
      this.downheap(0);
      return firstEntry.value;
    } else {
      this.value_set = new Set();
      return this.items.pop().value;
    }
  }

  scores() {
    var result = [];
    for(var i = 0; i < this.items.length; i++) {
      result.push(this.items[i].score);
    }
    return result;
  }

  contains(x) {
    return this.value_set.has(x);
  }

  isEmpty() {
    return (this.items.length == 0)
  }

  validIdx(idx) {
    return (idx > 0 && idx < this.items.length);
  }
  
  downheap(idx) {
    var swap = null;
    //var step = 0;
    while(idx < this.items.length) {
      //step++;
      //console.log("step", step, "idx", idx, "scores", this.scores());
      /*
      if (step > 1000) {
        console.log("broken binary heap", this.items);
        return;
      }
      */
      const leftChildIdx = this.leftChild(idx);
      const rightChildIdx = this.rightChild(idx);
      var smallestChildIdx;
      if (leftChildIdx < this.items.length && rightChildIdx < this.items.length) {
        smallestChildIdx = this.items[leftChildIdx].score < this.items[rightChildIdx].score ? leftChildIdx : rightChildIdx;
      } else if (leftChildIdx < this.items.length){
        smallestChildIdx = leftChildIdx;
      } else {
        return
      }
      if (this.items[smallestChildIdx].score < this.items[idx].score) {
        this.swap(idx, smallestChildIdx);
        idx = smallestChildIdx;
      } else {
        return;
      }
      /*
      const childrenOfIdx = this.childrenOf(idx);
      //console.log("chidlren of ", idx, childrenOfIdx);
      for(var i = 0; i < childrenOfIdx.length; i++) {
        const childIdx = childrenOfIdx[i];
        //console.log("childIdx", childIdx);
        if (!this.validIdx(childIdx) || childIdx == idx) {
          //console.log("bh done");
          return;
        } else if (this.items[childIdx].score < this.items[idx].score) {
          //console.log("swapping",idx, childIdx)
          this.swap(idx, childIdx);
          idx = childIdx;
//          break;
        } else {
          return;
        }
      }
      */
    }
  }

  swap(a, b) {
    const tmpa = this.items[a];
    const tmpb = this.items[b];
    this.items[b] = tmpa;
    this.items[a] = tmpb;
  }

  leftChild(i) {
    return 2*i+1;
  }

  rightChild(i) {
    return this.leftChild(i)+1;
  }

  childrenOf(i) {
    const left = 2*i+1;
    return [left, left+1];
  }

  parentOf(idx) {
    return Math.floor((idx-1)/2);
  }
};
