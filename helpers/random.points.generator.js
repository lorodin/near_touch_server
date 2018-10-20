const MathHelper = require('./math.helper');

class RandomPointsGenerator{
    constructor(w, h, ow, oh){
        this.w = w;
        this.h = h;
        this.ow = ow;
        this.oh = oh;
    }
    getNextPoint(){
        return MathHelper.randomPoints(this.w, this.h, this.ow, this.oh);
    }
}

module.exports = RandomPointsGenerator;