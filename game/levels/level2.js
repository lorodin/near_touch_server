const cmds = require('../../enums/cmd.enum');
const MathHelper = require('../../helpers/math.helper');
const BonusModel = require('../bonus.model');

class Level2{
    constructor(max_points, player_names, bonus, fine, inf, generator){
        this.max_points = max_points;
        this.inf = inf;
        this.bonus = bonus;
        this.fine = fine;
        this.generator = generator;
        this.old_state = [
            {
                name: player_names[0],
                action: cmds.TOUCH_UP,
                point: {x: -9999, y: -9999}
            },
            {
                name: player_names[1],
                action: cmds.TOUCH_UP,
                point: {x: -9999, y: -9999}
            }
        ];
        this.bonus_model = new BonusModel();
        this.total_points = 0;
    }
    update(dt, p1, p2, cb){
        let o_s = {};
        
        o_s[p1.name] = this.old_state.find(s => s.name == p1.name);
        o_s[p2.name] = this.old_state.find(s => s.name == p2.name);
        
        let pp1 = p1.action == cmds.TOUCH_DOWN ? p1.point : null;
        let pp2 = p2.action == cmds.TOUCH_DOWN ? p2.point : null;

        let near = [];
        let other = [];
        let shows = [];
        let hides = [];

        if(pp1 && pp2 && MathHelper.equelsPoints(pp1, pp2, this.inf)){
            near.push(p1);
            near.push(p2);
            if(!MathHelper.equelsPoints(pp1, o_s[p1.name].point) &&
                !MathHelper.equelsPoints(pp2, o_s[p2.name].point)){
                this.total_points += this.bonus;
            }
        }else if(pp1 && pp2){
            other.push(p1);
            other.push(p2);
            this.total_points -= this.fine;
        }else if(pp1){
            other.push(pp1);
            this.total_points -= this.fine;
        }else if(pp2){
            other.push(pp2);
            this.total_points -= this.fine;
        }

        if(!pp1 && o_s[p1.name].action == cmds.TOUCH_DOWN){
            hides.push(p1.name);
        }

        if(!pp2 && o_s[p2.name].action == cmds.TOUCH_DOWN){
            hides.push(p2.name);
        }

        if(pp1 && o_s[p1.name].action == cmds.TOUCH_UP){
            shows.push(p1.name);
        }

        if(pp2 && o_s[p2.name].action == cmds.TOUCH_UP){
            shows.push(p2.name);
        }

        if(this.total_points < 0) this.total_points = 0;
        if(this.total_points > this.max_points) this.total_points = this.max_points;

        let level_up = false;

        if(this.total_points == this.max_points){
            if(!this.bonus_model.enabled){
                this.bonus_model.enabled = true;
                this.bonus_model.point = this.generator.getNextPoint();
                shows.push('bonus');
            }

            if(MathHelper.equelsPoints(this.bonus_model.point, pp1) && 
               MathHelper.equelsPoints(this.bonus_model.point, pp2)) {
                level_up = true;
                near.push({name: 'bonus', action: cmds.TOUCH_DOWN, point: this.bonus_model.point});
            }else{
                other.push({name: 'bonus', action: cmds.TOUCH_DOWN, point: this.bonus_model.point})
            }
            
        }else{
            if(this.bonus_model.enabled) hides.push('bonus');
            this.bonus_model.enabled = false;
        }
        
        
        if(p1.action == cmds.TOUCH_DOWN && pp1){
            o_s[p1.name].point = {x:pp1.x, y: pp1.y};
            o_s[p1.name].action = cmds.TOUCH_DOWN;
        }else{
            o_s[p1.name].point = null;
            o_s[p1.name].action = cmds.TOUCH_UP;
        }
        if(p2.action == cmds.TOUCH_DOWN && pp2){
            o_s[p2.name].point = {x:pp2.x, y: pp2.y};
            o_s[p2.name].action = cmds.TOUCH_DOWN;
        }else{
            o_s[p2.name].point = null;
            o_s[p2.name].action = cmds.TOUCH_UP;
        }
        
        return cb(null, {
                'near': near,
                'other': other,
                'hides': hides,
                'shows': shows,
                'total_points': this.total_points,
                'level_up': level_up
            }, this.bonus_model.point);
    }
}

module.exports = Level2;