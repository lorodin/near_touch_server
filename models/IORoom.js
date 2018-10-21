const room_states = require('../enums/room.states.enum');
const TimeWatcher = require('../helpers/time.watcher');
const ServerPlayer = require('../game/server.player');
const PointsGenerator = require('../helpers/random.points.generator');
const MathHelper = require('../helpers/math.helper');
const cmds = require('../enums/cmd.enum');
const Game = require('../game/game.core');

class IORoom{
    
    constructor(clients, room, configs, generator) {
        this.clients = clients;
        this.room = room;
        this.state = room_states.PAUSE;
        this.total_points = 0;
        this.timeWatcher = new TimeWatcher();
        this.game = new Game(generator, configs);
    }


    play(){
        this.state = room_states.PLAY;
        
        this.timeWatcher.start();
    }

    pause(){
        this.state = room_states.PAUSE;
        this.timeWatcher._start = 0;
    }

    update(cb){
        if(this.tate == room_states.PAUSE) return cb(null, null);

        let p1 = {
            name: this.clients[0].socket.id,
            action: this.clients[0].last_action.cmd,
            point: this.clients[0].last_action.data
        };

        let p2 = {
            name: this.clients[1].socket.id,
            action: this.clients[1].last_action.cmd,
            point: this.clients[1].last_action.data
        };

        this.game.update(this.timeWatcher.fix(), p1, p2, (err, gameObject) => {
            return cb(err, gameObject);
        });
    }

}

module.exports = IORoom;