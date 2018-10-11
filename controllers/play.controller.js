const emits = require('../enums/emits.enum');
const cmds  = require('../enums/cmd.enum');
const error_messages = require('../enums/error.messages');

class PlayController{
    constructor(dbService, cacheService, logger, configs){
        this._db = dbService;
        this._cache = cacheService;
        this._logger = logger;
        this._configs = configs;
    }

    setAction(action, cb){
        this._cache.ClientsContainer.findClientBySocketId(action.client_id, (err, client) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }
            if(!client){
                this.logError(error_messages.CLIENT_NOT_FOUND);
                return cb ? cb() : null;
            }
            switch(action.cmd){
                case cmds.CLIENT_REDY_TO_PLAY:
                    setTimeout(()=>{
                        this.redyToPlay(client, action.data, cb);
                    }, 0);
                break;
                default:
                    setTimeout(() => {
                        this.clientAction(client, action, cb);
                    }, 0);
                break;
            }
        })
    }

    redyToPlay(client, data, cb){
        client.last_action = cmds.CLIENT_REDY_TO_PLAY;
        this._cache.RoomsContainer.findRoomById(data.room_id, (err, room) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }
            if(!room){
                this.logError(error_messages.ROOM_NOT_FOUND);
                return cb ? cb() : null;
            }

            let other_client = room.clients[0].socket.id == client.socket.id ? room.clients[1] : room.clients[0];
            
            if(!other_client.last_action) return cb ? cb() : null;

            room.clients[0].last_action = undefined;
            room.clients[1].last_action = undefined;

            this.asyncGetState(room.clients[0].socket, cb);
            this.asyncGetState(room.clients[1].socket, cb);
        });
    }

    clientAction(client, action, cb){
        client.last_action = action;
        this._cache.RoomsContainer.findRoomById(action.data.room_id, (err, room) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }

            let other_client = room.clients[0].socket.id == client.socket.id ? room.clients[1] : room.clients[0];

            
            if(!other_client.last_action) return cb ? cb() : null;

            
            if(client.last_action.cmd == cmds.TOUCH_DOWN && other_client.last_action.cmd == cmds.TOUCH_DOWN){

                
                let x1 = client.last_action.data.x;
                let y1 = client.last_action.data.y;
                let x2 = other_client.last_action.data.x;
                let y2 = other_client.last_action.data.y;

                let d = Math.pow((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2), 0.5);

                for(let i = 0; i < this._configs.intervals.length; i++)
                    if(d <= this._configs.intervals[i].length){
                        let total_points = this._configs.intervals[i].points;
                        room.room.points += total_points;
                        break;        
                    }
                    
                let data1 = {'room_id': room.room.id, 'x': x2, 'y': y2, 'points': room.room.points};
                let data2 = {'room_id': room.room.id, 'x': x1, 'y': y1, 'points': room.room.points};
                
                client.socket.emit(emits.COMPANON_TOUCH_DOWN, data1);
                other_client.socket.emit(emits.COMPANON_TOUCH_DOWN, data2);
            }else if(client.last_action == cmds.TOUCH_DOWN){
                let x = client.last_action.x;
                let y = client.last_action.y;

                let data_1 = {room_id: room.room.id, x: x, y: y, points: room.room.points};
                let data_2 = {room_id: room.room.id};
                
                client.socket.emit(emits.COMPANON_TOUCH_UP, data_2);
                other_client.socket.emit(emits.COMPANON_TOUCH_DOWN, data_1);
            }else if(other_client.last_action == cmds.TOUCH_DOWN){
                let x = other_client.last_action.x;
                let y = other_client.last_action.y;

                let data_1 = {room_id: room.room.id, x: x, y: y, points: room.room.points};
                let data_2 = {room_id: room.room.id};
                
                client.socket.emit(emits.COMPANON_TOUCH_DOWN, data_1);
                other_client.socket.emit(emits.COMPANON_TOUCH_UP, data_2);
            }else{
                room.clients[0].socket.emit(emits.COMPANON_TOUCH_UP, {room_id: room.room.id});
                room.clients[1].socket.emit(emits.COMPANON_TOUCH_UP, {room_id: room.room.id});
            }

            room.clients[0].last_action = undefined;
            room.clients[1].last_action = undefined;

            this.asyncGetState(room.clients[0].socket, cb);
            this.asyncGetState(room.clients[1].socket, cb);
        });
    }

    asyncGetState(socket, cb){
        setTimeout(()=>{
            socket.emit(emits.GET_STATE);
            return cb ? cb() : null;
        }, this._configs.get_state_interval);
    }

    logError(err){
        if(this._logger) this._logger.error(err);
    }
}

module.exports = PlayController;