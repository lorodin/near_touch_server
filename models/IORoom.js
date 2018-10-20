const room_states = require('../enums/room.states.enum');
const TimeWatcher = require('../helpers/time.watcher');
const ServerPlayer = require('../helpers/server.player');
const PointsGenerator = require('../helpers/random.points.generator');
const MathHelper = require('../helpers/math.helper');
const cmds = require('../enums/cmd.enum');

class IORoom{
    
    constructor(clients, room, configs, generator) {
        this.clients = clients;
        this.room = room;
        this.state = room_states.PAUSE;
        this.total_points = 0;
        this.level = 0;
        this.points_for_helper = 100;
        this.timeWatcher = new TimeWatcher();
        this.lvl_points = [
            120, 140, 180, 230, 290
        ];
        this.inf = 3;
        this.s_player = new ServerPlayer(100, 100, {x: 50, y: 30}, 4, !generator ? new PointsGenerator(100, 100, 5, 5) : generator);
    }

    play(){
        this.state = room_states.PLAY;

        if(this.level == 0 && this.total_points < this.points_for_helper) 
            this.s_player.enabled = true;
        
        this.timeWatcher.start();
    }

    pause(){
        this.state = room_states.PAUSE;
        this.timeWatcher._start = 0;
    }

    update(cb){
        if(this.tate == room_states.PAUSE) return cb(null, null);
        
        let dt = this.timeWatcher.fix();

        let near = false;

        let responce = {};

        let p1 = {x: -99999, y: -99999};
        let p2 = {x: -99999, y: -99999};

        if(this.s_player.enabled) this.s_player.update(dt);

        if(this.clients[0].last_action.cmd == cmds.TOUCH_DOWN) 
            p1 = {x: this.clients[0].last_action.data.x, y: this.clients[0].last_action.data.y};

        if(this.clients[1].last_action.cmd == cmds.TOUCH_DOWN)
            p2 = {x: this.clients[1].last_action.data.x, y: this.clients[1].last_action.data.y};

        
    }
}

module.exports = IORoom;