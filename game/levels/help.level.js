const MathHelper = require('../../helpers/math.helper');
const cmds = require('../../enums/cmd.enum');
const ServerPlayer = require('../server.player');

class HelpLevel{
    constructor(max_points, player_names, bonus, fine, inf, w, h, sSpeed, sStart, points_generator){
        this.max_points = max_points;
        this.total_points = 0;
        this.bonus = bonus;
        this.fine = fine;
        this.inf = inf;
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
        this.s_player = new ServerPlayer(w, h, sStart, sSpeed, points_generator);
    }
    
    update(dt, p1, p2, cb){
        let o_s = {};
        
        o_s[p1.name] = this.old_state.find(s => s.name == p1.name);
        o_s[p2.name] = this.old_state.find(s => s.name == p2.name);
        
        let h_p = this.s_player.s_p;
        let pp1 = p1.action == cmds.TOUCH_DOWN ? p1.point : null;
        let pp2 = p2.action == cmds.TOUCH_DOWN ? p2.point : null;

        let near = [{
            'name': 'server',
            'action': cmds.TOUCH_DOWN,
            'point': h_p
        }];

        let other = [];
        let hides = [];
        let shows = [];
        let players_near = 0;
        
        if(MathHelper.equelsPoints(h_p, pp1, this.inf)){
            near.push(p1);
            players_near++;
        }
        else if(p1.action == cmds.TOUCH_DOWN) {
            other.push(p1);
        }

        if(MathHelper.equelsPoints(h_p, pp2, this.inf)) {
            near.push(p2);
            players_near++;
        }
        else if(p2.action == cmds.TOUCH_DOWN) {
            other.push(p2);
        }

        if(!pp1 && o_s[p1.name].action == cmds.TOUCH_DOWN) hides.push(p1.name);
        if(!pp2 && o_s[p2.name].action == cmds.TOUCH_DOWN) hides.push(p2.name);

        if(pp1 && o_s[p1.name].action == cmds.TOUCH_UP) shows.push(p1.name);
        if(pp2 && o_s[p2.name].action == cmds.TOUCH_UP) shows.push(p2.name);

        if(players_near == 2){
            if(!MathHelper.equelsPoints(pp1, o_s[p1.name].point) && !MathHelper.equelsPoints(pp2, o_s[p2.name].point)){
                this.total_points += this.bonus;
            }
        }
        else{
            this.total_points -= this.fine;
        }
        
        if(this.total_points < 0) this.total_points = 0;

        if(this.total_points >= this.max_points) this.total_points = this.max_points;
        
        o_s[p1.name].point = p1.action == cmds.TOUCH_DOWN ? {x: pp1.x, y:pp1.y} : {x: -9999, y: -9999};
        o_s[p1.name].action = p1.action;
        o_s[p2.name].point = p2.action == cmds.TOUCH_DOWN ? {x: pp2.x, y: pp2.y} : {x: -9999, y: -9999};
        o_s[p2.name].action = p2.action;
        
        this.s_player.update(dt, (err, point) => {
           return cb(null, {
                'near': near,
                'other': other,
                'hides': hides,
                'shows': shows,
                'total_points': this.total_points
            }, point);
        });
    }
}

module.exports = HelpLevel;