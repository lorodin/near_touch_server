const emits = require('../enums/emits.enum');
const cmds  = require('../enums/cmd.enum');
const error_messages = require('../enums/error.messages');
const room_states = require('../enums/room.states.enum');

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
                case cmds.PAUSE:
                    setTimeout(()=>{
                        this.pause(client, action.data, cb);
                    }, 0)
                break;
                case cmds.CLOSE_ROOM:
                    setTimeout(() => {
                        this.closeRoom(client, action.data, cb);
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

    pause(client, data, cb){
        client.last_action = cmds.PAUSE;

        this._cache.RoomsContainer.findRoomById(data.room_id, (err, io_r) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }
            if(!io_r){
                this.logError(error_messages.ROOM_NOT_FOUND);
                return cb ? cb() : null;
            }

            let other_client = io_r.clients[0].socket.id == client.socket.id ? 
                                    io_r.clients[1] : io_r.clients[0];
            other_client.socket.emit(emits.COMPANON_PAUSE);

            client.last_action = undefined;

            io_r.state = room_states.PAUSE;

            return cb ? cb() : null;
        });
    }

    closeRoom(client, data, cb){
        this._cache.RoomsContainer.findRoomById(data.room_id, (err, io_r) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }
            this._db.RoomsRepository.removeRoomById(data.room_id, (err, room) => {
                if(err){
                    this.logError(err);
                    return cb ? cb() : null;
                }
                this._cache.RoomsContainer.removeRoom(io_r, (err, r) => {
                    if(err){
                        this.logError(err);
                        return cb ? cb() : null;
                    }
                    let other_client = io_r.clients[0].socket.id == client.socket.id ?
                                            io_r.clients[1] : io_r.clients[0];
                    client.socket.emit(emits.NO_ROOM);
                    other_client.socket.emit(emits.COMPANON_CLOSE_ROOM);
                    return cb ? cb() : null;
                });
            });
        });
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
            room.state = room_states.PLAY;

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

            if(room.state == room_states.PAUSE){
                client.socket.emit(emits.COMPANON_PAUSE);
                return cb ? cb() : null;
            }

            if(!other_client.last_action) return cb ? cb() : null;

            if(client.last_action.cmd == cmds.TOUCH_DOWN && other_client.last_action.cmd == cmds.TOUCH_DOWN){
                let x1 = client.last_action.data.x;
                let y1 = client.last_action.data.y;
                let x2 = other_client.last_action.data.x;
                let y2 = other_client.last_action.data.y;

                let d = Math.pow((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2), 0.5);

                let near_touch = false;

                for(let i = 0; i < this._configs.intervals.length; i++)
                    if(d <= this._configs.intervals[i].length){
                        let total_points = this._configs.intervals[i].points;
                        room.room.points += total_points;
                        room.total_points += total_points;
                        near_touch = true;
                        break;        
                    }
                
                
                if(!near_touch) 
                {
                    if(room.total_points >= this._configs.intervals[this._configs.intervals.length - 1].points)
                        room.total_points -= this._configs.intervals[this._configs.intervals.length - 1].points;
                    else
                       room.total_points = 0;

                    console.log('Total room points: ' + room.total_points);
                } 
                let data1 = {'room_id': room.room.id, 
                             'x': x2, 
                             'y': y2, 
                             'points': room.room.points,
                             'total_room_points': room.total_points};
                let data2 = {'room_id': room.room.id, 
                             'x': x1, 
                             'y': y1, 
                             'points': room.room.points,
                             'total_room_points': room.total_points};
                
                client.socket.emit(emits.COMPANON_TOUCH_DOWN, data1);
                other_client.socket.emit(emits.COMPANON_TOUCH_DOWN, data2);
            }else if(client.last_action.cmd == cmds.TOUCH_DOWN){
                let x = client.last_action.data.x;
                let y = client.last_action.data.y;
                console.log('Client ' + client.socket.id + ' TOUCH DOWN');
                console.log(x + ' ' + y);
                if(room.total_points >= this._configs.intervals[this._configs.intervals.length - 1].points)
                    room.total_points -= this._configs.intervals[this._configs.intervals.length - 1].points;
                else
                    room.total_points = 0;

                console.log('Total room points: ' + room.total_points);

                let data_1 = {'room_id': room.room.id, 
                              'x': x, 
                              'y': y, 
                              'points': room.room.points,
                              'total_room_poitns': room.total_points};

                let data_2 = {'room_id': room.room.id, 
                              'points': room.room.points,
                              'total_room_points': room.total_points};
                
                client.socket.emit(emits.COMPANON_TOUCH_UP, data_2);
                other_client.socket.emit(emits.COMPANON_TOUCH_DOWN, data_1);

            }else if(other_client.last_action.cmd == cmds.TOUCH_DOWN){
                let x = other_client.last_action.data.x;
                let y = other_client.last_action.data.y;
                console.log('Client ' + other_client.socket.id + ' TOUCH DOWN');
                console.log(x + ' ' + y);
                if(room.total_points >= this._configs.intervals[this._configs.intervals.length - 1].points)
                    room.total_points -= this._configs.intervals[this._configs.intervals.length - 1].points;
                else
                    room.total_points = 0;

                let data_1 = {'room_id': room.room.id, 
                              'x': x, 
                              'y': y, 
                              'points': room.room.points,
                              'total_room_points': room.total_points};

                let data_2 = {'room_id': room.room.id, 
                              'points': room.room.points,
                              'total_room_points': room.total_points};
                    
                client.socket.emit(emits.COMPANON_TOUCH_DOWN, data_1);
                other_client.socket.emit(emits.COMPANON_TOUCH_UP, data_2);
            }else{
                if(room.total_points >= this._configs.intervals[this._configs.intervals.length - 1].points)
                    room.total_points -= this._configs.intervals[this._configs.intervals.length - 1].points;
                else
                    room.total_points = 0;

                room.clients[0].socket.emit(emits.COMPANON_TOUCH_UP, 
                    {'room_id': room.room.id, 
                     'points': room.room.points,
                     'total_room_points': room.total_points});
                room.clients[1].socket.emit(emits.COMPANON_TOUCH_UP, 
                    {'room_id': room.room.id, 
                     'points': room.room.points,
                     'total_room_points': room.total_points});
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