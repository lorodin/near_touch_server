class FakeRandomPointsGenerator{
    constructor(points){
        this.points = points;
        this.index = 0;
    }
    getNextPoint(){
        if(this.points.length == 0) return {x: -1, y: -1};
        if(this.index >= this.points.length) this.index = 0;
        let result = this.points[this.index++];
        if(this.cb) this.cb(result);
        return result;
    }
    onPointsGetting(cb){
        this.cb = cb;
    }
}

module.exports = FakeRandomPointsGenerator;