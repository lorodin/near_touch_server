const cmds = require('../enums/cmd.enum');
const emits = require('../enums/emits.enum');
const error_messages = require('../enums/error.messages');
const messages = require('../enums/messages.enum');
const IORoom = require('../models/IORoom');

class RoomConfirmController{
    constructor(cache_service, db_service, logger){
        this._cache = cache_service;
        this._db = db_service;
        this._logger = logger;
        this.TAG = 'RoomConfirmController';
    }

    setAction(action, cb){
        this._logger.info(this.TAG, action);
        this._cache.SocketsService.get(action.client_id, (err, socket) => {
            if(err){
                this.setError(err);
                return cb ? cb() : null;
            }
            if(socket == null){
                this.setError(error_messages.CLIENT_NOT_FOUND);
                return cb ? cb() : null;
            }
            switch(action.cmd){
                case cmds.CREATE_ROOM:
                    setTimeout(() => {
                        this.create(socket, action.data, cb);
                    }, 0);
                break;
                case cmds.CONFIRM_ROOM:
                    setTimeout(() => {
                        this.confirm(socket, action.data, cb);
                    }, 0);
                break;
                case cmds.CANCEL_ROOM:
                    setTimeout(()=>{
                        this.cancel(socket, action.data, cb);
                    }, 0);
                break;
                default:
                    return cb ? cb() : null;
            } 
        });
    }

    cancel(socket, data, cb){
        if(!data.user_id || data.user_id == '' ||
           !data.room_id || data.room_id == ''){
               socket.emit(emits.ERROR, {msg: error_messages.ERROR_MODEL});
               return cb ? cb() : null;
           }
        this._db.UsersRepository.findUserById(data.user_id, (err, user) => {
            if(err){
                this.setError(err);
                return cb ? cb() : null;
            }
            if(!user){
                socket.emit(emits.ERROR, {msg: error_messages.USER_NOT_FOUND});
                return cb ? cb() : null;
            }
            this._db.RoomsRepository.removeRoomById(data.room_id, (err, room) => {
                if(err){
                    this.setError(err);
                    return cb ? cb() : null;
                }
                if(!room){
                    socket.emit(emits.ERROR, {msg: error_messages.ROOM_NOT_FOUND});
                    return cb ? cb() : null;
                }
                let findedID = room.from == user.id ? room.to : room.from;
                this._cache.ClientsContainer.findClientByUserId(findedID, (err, client) => {
                    if(err){
                        this.setError(err);
                        return cb ? cb() : null;
                    }
                    if(client) client.socket.emit(emits.NO_ROOM, {msg: messages.ROOM_WAS_CANCELED});
                    socket.emit(emits.NO_ROOM);
                    return cb ? cb() : null;
                });
            })
        })
    }

    confirm(socket, data, cb){
        if(!data.room_id || data.room_id == ''
          || !data.user_id || data.user_id == ''){
              socket.emit(emits.ERROR, {msg: error_messages.ERROR_MODEL});
              return cb ? cb() : null;
          }
        
        this._db.RoomsRepository.findRoomById(data.room_id, (err, room) => {
            if(err){
                this.setError(err);
                return cb ? cb() : null;
            }
            if(room == null){
                socket.emit(emits.ERROR, {msg: error_messages.ROOM_NOT_FOUND});
                return cb ? cb() : null;
            }
            if(room.to != data.user_id){
                socket.emit(emits.ERROR, {msg: error_messages.NOT_ACCESS_FOR_CONFIRM_ROOM});
                return cb ? cb() : null;
            }
            this._db.UsersRepository.findUserById(data.user_id, (err, to_u) => {
                if(err){
                    this.setError(err);
                    return cb ? cb() : null;
                }
                if(!to_u){
                    socket.emit(emits.ERROR, {msg: error_messages.USER_NOT_FOUND});
                    return cb ? cb() : null;
                }
                this._db.UsersRepository.findUserById(room.from, (err, from_u) => {
                    if(err){
                        this.setError(err);
                        return cb ? cb() : null;
                    }
                    if(!from_u){
                        socket.emit(emits.ERROR, {msg: error_messages.USER_NOT_FOUND});
                        return cb ? cb() : null;
                    }
                    this._cache.ClientsContainer.findClientByUserId(from_u.id, (err, client_1) =>  {
                        let emit = emits.HAS_ROOM_1;
                        if(err){
                            this.setError(err);
                            return cb ? cb() : null;
                        }

                        if(!client_1) emit = emits.HAS_ROOM_0;
                        
                        this._cache.ClientsContainer.findClientByUserId(to_u.id, (err, client_2) => {
                            if(err){
                                this.setError(err);
                                return cb ? cb() : null;
                            }

                            if(!client_2) emit = emits.HAS_ROOM_0;
                            
                            if(emit != emits.HAS_ROOM_1){
                                socket.emit(emits.HAS_ROOM_0, {room_id: room.id});
                                return cb ? cb() : null;
                            }    

                            let io_room = new IORoom([client_1, client_2], room);

                            this._cache.RoomsContainer.addRoom(io_room, (err, i_r) => {
                                if(err){
                                    this.setError(err);
                                    return cb ? cb() : null;
                                }
                                if(!i_r){
                                    this.setError(error_messages.IO_ROOM_NOT_CREATED);
                                    return cb ? cb() : null;
                                }
                                client_1.socket.emit(emits.HAS_ROOM_1, {room_id: room.id});
                                client_2.socket.emit(emits.HAS_ROOM_1, {room_id: room.id});
                                return cb ? cb() : null;
                            });
                        });
                    });
                });
            });
        });
    }

    create(socket, data, cb){
        if(!data.from || data.from == '' ||
           !data.to_phone || data.to_phone == ''){
               socket.emit(emits.ERROR, {msg: error_messages.ERROR_MODEL});
               return cb ? cb() : null;
           }
        
           this._db.UsersRepository.findUserById(data.from, (err, user) => {
            if(err){
                this.setError(err);
                return cb ? cb() : null;
            }
            if(user == null){
                socket.emit(emits.ERROR, {msg: error_messages.USER_NOT_FOUND});
                return cb ? cb() : null;
            }

            this._db.UsersRepository.findManyByPhone(data.to_phone, (err, users) => {
                if(err){
                    this.setError(err);
                    return cb ? cb() : null;
                }
                if(users == null || users.length == 0){
                    socket.emit(emits.INFO, {msg: error_messages.COMPANON_NOT_REGISTER});
                    return cb ? cb() : null;
                }
                
                let confirm_user = users.find(u => u.phone_confirm);
    
                if(!confirm_user){
                    socket.emit(emits.INFO, {msg: error_messages.USER_NOT_CONFIRM});
                    this.setInfo(error_messages.USER_NOT_CONFIRM);
                    return cb ? cb() : null;
                }
                
                this._db.RoomsRepository.findRoomByUserId(data.from, (err, r) => {
                    if(err){
                        this.setError(err);
                        return cb ? cb() : null;
                    }
                    if(r){
                        socket.emit(emits.ERROR, {msg: error_messages.CAN_NOT_CREATE_ROOM});
                        return cb ? cb() : null;
                    }



                    this._db.RoomsRepository.findRoomByUserId(confirm_user.id, (err, r) => {
                        if(err){
                            this.setError(err);
                            return cb ? cb() : null;
                        }
                        if(r){
                            socket.emit(emits.USER_BUSY);
                            return cb ? cb() : null;
                        }
    
                        let n_room = {
                            from: user.id,
                            to: confirm_user.id
                        };
                        this._db.RoomsRepository.saveRoom(n_room, (err, room) => {
                            if(err){
                                this.setError(err);
                                return cb ? cb() : null;
                            }
                            if(!room){
                                this.setError(error_messages.UNKNOW_ERROR);
                                socket_1.emit(emits.ERROR, error_messages.UNKNOW_ERROR);
                                return cb ? cb() : null;
                            }
                            this._cache.ClientsContainer.findClientByUserId(room.to, (err, client) => {
                                if(err){
                                    this.setError(err);
                                    return cb ? cb() : null;
                                }
                                socket.emit(emits.YOUR_SENTENCE_NOT_CONFIRM, {to_phone: confirm_user.phone, room_id: room.id});
                                
                                if(client) client.socket.emit(emits.HAS_SENTENCE, {from_phone: user.phone, room_id: room.id});
                                
                                return cb ? cb() : null;
                            })
                        });
                    });

                });
            });
        });
    }

    setInfo(msg){
        if(this._logger) this._logger.info(msg);
    }

    setError(msg){
        if(this._logger) this._logger.error(msg);
    }
}

module.exports = RoomConfirmController;