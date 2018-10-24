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
     
            client.last_action = cmds.PAUSE;

            io_r.pause();

            other_client.socket.emit(emits.COMPANON_PAUSE);

            if(other_client.last_action != cmds.PAUSE) other_client.last_action = cmds.CLIENT_REDY_TO_PLAY;

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
            
            room.play();

            room.clients[0].last_action = undefined;
            room.clients[1].last_action = undefined;

            this.asyncGetState(room.clients[0].socket, null, cb);
            this.asyncGetState(room.clients[1].socket, null, cb);
 
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

            room.update((err, go) => {
                if(err){
                    this.logError(err);
                    return cb ? cb() : null;
                }

                room.clients[0].last_action = undefined;
                room.clients[1].last_action = undefined;
                
                this.asyncGetState(room.clients[0].socket, go, cb);
                this.asyncGetState(room.clients[1].socket, go, cb);
            });
        });
    }

    asyncGetState(socket, data, cb){
        setTimeout(()=>{
            socket.emit(emits.GET_STATE, data);
            return cb ? cb() : null;
        }, this._configs.get_state_interval);
    }

    logError(err){
        if(this._logger) this._logger.error(err);
    }
}

module.exports = PlayController;