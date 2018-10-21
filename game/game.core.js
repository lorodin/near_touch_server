const RandomPointsGenerator = require('../helpers/random.points.generator');

class Game{
    constructor(configs, points_generator){
        this.level = 0;
        
        this.points_for_helper = this.getConfig(configs, 'points_for_helper', 100);
        this.lvl_points = this.getConfig(configs, 'lvl_points', [ 120, 140, 180, 230, 290 ]);
        this.points_for_near = this.getConfig(configs, 'points_for_near', 1);
        this.inf = this.getConfig(configs, 'inv', 1);
        this.w = this.getConfig(configs, 'width', 100);
        this.h = this.getConfig(configs, 'height', 100);

        let ow = this.getConfig(configs, 'ow', 5);
        let oh = this.getConfig(configs, 'oh', 5);

        let sSpeed = this.getConfig(configs, 'sSpeed', 2);
        let sPoint = this.getConfig(configs, 'sPoint', {x: 1, y: 1});

        this.generator = points_generator ? points_generator : 
                        new RandomPointsGenerator(this.w, this.h, ow, oh);
    }

    getConfig(configs, name, d){
        return configs && confgis[name] ? configs.name : d;
    }

    update(dt, p1, p2, cb){
        cb(null, null);
    }

    nextLevel(){
        this.level++;
        switch(this.level){
            case 1:

            break;
        }
    }
}

module.exports = Game;