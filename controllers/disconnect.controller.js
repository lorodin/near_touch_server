const cmds = require('../enums/cmd.enum');
const emits = require('../enums/emits.enum');
const error_messages = require('../enums/error.messages');

class DisconnectController{
    constructor(cacheService, dataBaseService, logger){
        this.TAG = 'DisconnectController';
        this._cache = cacheService;
        this._db = dataBaseService;
        this._logger = logger;
    }

    setAction(action, cb){
        this._logger.info(this.TAG, action);
        this._cache.ClientsContainer.findClientBySocketId(action.client_id, (err, client)=>{
            if(err) {
                this.logError(err);
                return cb ? cb() : null;
            }
            
            if(!client) {
                this._cache.SocketsService.remove(action.client_id, 
                    () => {
                        return cb ? cb() : null;
                    });
            }else{
                setTimeout(()=>{
                    this.disconnect(client, cb);
                }, 0);
            }
        });
    }

    disconnect(client, cb){
        this._cache.RoomsContainer.findRoomBySocketId(client.socket.id, (err, io_room) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }

            if(!io_room){
                this._cache.ClientsContainer.removeClient(client, (err, c) => {
                    if(err){
                        this.logError(err);
                        return cb ? cb() : null;
                    }
                    this._cache.SocketsService.remove(client.socket.id, (err, f, i) => {
                        if(err){
                            this.logError(err);
                            return cb ? cb() : null;
                        }
                        return cb ? cb() : null;
                    });
                });
            }else{
                io_room.room.points += io_room.getTotalPoints();
                this._db.RoomsRepository.saveRoom(io_room.room, (err, room) => {
                    if(err){
                        this.logError(err);
                        return cb ? cb() : null;
                    }
                    this._cache.RoomsContainer.removeRoom(io_room, (err, r) => {
                        if(err){
                            this.logError(err);
                            return cb ? cb() : null;
                        }

                        this._cache.ClientsContainer.removeClient(client, (err, c) => {
                            if(err){
                                this.logError(err);
                                return cb ? cb() : null;
                            }
                            this._cache.SocketsService.remove(client.socket.id, (err, s) => {
                                if(err){
                                    this.logError(err);
                                    return cb ? cb() : null;
                                }
                
                                let a_socket = io_room.clients[0].socket.id == client.socket.id ? 
                                                        io_room.clients[1].socket : 
                                                        io_room.clients[0].socket;
        
                                a_socket.emit(emits.HAS_ROOM_0, {room_id: io_room.room.id});
        
                                return cb ? cb() : null;
                            });
                        });
                    });
                });

            }
        });
    };

    logError(err){
        if(this._logger) this._logger.error(err);
    }
}

module.exports = DisconnectController;