const RandomPointsGenerator = require('../helpers/random.points.generator');
const HelpLevel = require('./levels/help.level');
const Level2 = require('./levels/level2');

class Game{
    constructor(configs, player_names, points_generator, logger){
        this.level = 0;
        
        this.logger = !logger ? console : logger;

        this.lvl_points = this.getConfig(configs, 'lvl_points', [ 120, 140, 180, 230, 290 ]);
        this.bonus = this.getConfig(configs, 'bonus', 1);
        this.fine = this.getConfig(configs, 'fine', 3);
        this.inf = this.getConfig(configs, 'inv', 1);
        this.w = this.getConfig(configs, 'width', 100);
        this.h = this.getConfig(configs, 'height', 100);

        this.player_names = player_names;

        let ow = this.getConfig(configs, 'ow', 5);
        let oh = this.getConfig(configs, 'oh', 5);

        this.sSpeed = this.getConfig(configs, 'sSpeed', 2);
        this.sPoint = this.getConfig(configs, 'sPoint', {x: 1, y: 1});

        this.generator = points_generator ? points_generator : 
                        new RandomPointsGenerator(this.w, this.h, ow, oh);
        
        this.c_level = this.nextLevel();
    }

    getConfig(configs, name, d){
        return configs && name in configs ? configs[name] : d;
    }

    update(dt, p1, p2, cb){
        this.c_level.update(dt, p1, p2, (err, go, point) => {
            if(err) return cb(err);
            
            if(go.level_up) this.c_level = this.nextLevel();

            return cb(err, go, point);
        });
    }

    nextLevel(){
        this.level++;
        if(this.level > this.lvl_points.length) this.level = this.lvl_points.length;

        switch(this.level){
            case 1:
                return new HelpLevel(this.lvl_points[this.level - 1], 
                                     this.player_names, 
                                     this.bonus, 
                                     this.fine, 
                                     this.inf, 
                                     this.w, 
                                     this.h, 
                                     this.sSpeed, 
                                     this.sPoint, 
                                     this.generator);
            default:
                return new Level2(this.lvl_points[this.level - 1], 
                                  this.player_names,
                                  this.bonus, 
                                  this.fine, 
                                  this.inf, 
                                  this.generator);
        }
    }
}

module.exports = Game;