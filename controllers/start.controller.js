const cmds = require('../enums/cmd.enum');
const emits = require('../enums/emits.enum');
const error_messages = require('../enums/error.messages');
const IORoom = new require('../models/IORoom');

class StartController{
    constructor(cache_service, database_service, logger, configs){
        this.CahceService = cache_service;
        this.DataBaseService = database_service;
        this.Logger = logger;
        this.Configs = configs;
        this.TAG = 'StartController';
    }
    
    setAction(action, cb){
        this.Logger.info(this.TAG, action);
        setTimeout(() => {
            if(action.cmd == cmds.START)
                this.start(action.client_id, action.data, cb);
        }, 0);
    }

    // Методы вызывается, когда клиент открывает приложение
    start(client_id, data, cb){
        this.CahceService.SocketsService.get(client_id, (err, s) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }

            let socket = s;

            if(!socket) {
                this.logError(error_messages.SOCKET_NOT_FOUND);
                return cb ? cb() : null;
            }
            
            if(!data.phone){
                socket.emit(emits.USER_UNREGISTRATE);
                return cb ? cb() : null;
            } 
           
            if(data.user_id){ // Пользователь зарегистрирован
                setTimeout(() => 
                    this.findUserAndCreateIOClient(socket, data.user_id, cb), 
                    0);
            }else{ // Пользоавтель не зарегистрирован
                socket.emit(emits.USER_UNREGISTRATE);
                return cb ? cb() : null;
            }
        });
    }

    findUserAndCreateIOClient(socket, user_id, cb){
        this.DataBaseService.UsersRepository.findUserById(user_id, (err, user) => {
            if(err){ 
                this.logError(err);
                return cb ? cb() : null;
            }

            if(user == null){
                this.logError(error_messages.USER_NOT_FOUND);
                socket.emit(emits.USER_UNREGISTRATE);
                return cb ? cb() : null;
            }

            this.CahceService.ClientsContainer.addClient(socket, user, (err, io_client_1) => {
                if(err){
                    this.logError(err);
                    return cb ? cb() : null;
                } 
                if(io_client_1 == null){
                    this.logError(error_messages.CLIETN_NOT_CREATED);
                    return cb ? cb() : null;
                } 
                
                if(!user.phone_confirm || user.phone_confirm == 'false'){
                    this.DataBaseService.CodesRepository.findCodeByUserId(user_id, (err, code) => {
                        if(err){
                            this.logError(err);
                            return cb ? cb() : null;
                        }
                        if(!code){
                            this.logError(error_messages.CODE_NOT_FOUND);
                            return cb ? cb() : null;
                        }

                        let old_date = code.date_created.getTime() + 1000 * this.Configs.code_live;

                        let now = new Date();
                        if(old_date >= now.getTime()){
                            socket.emit(emits.PHONE_UNCONFIRMED);
                            return cb ? cb() : null;
                        }else{
                            this.DataBaseService.UsersRepository.removeUserById(user.id, (err, u) => {
                                if(err) this.logError(err);
                                
                                socket.emit(emits.USER_UNREGISTRATE);

                                return cb ? cb() : null;
                            });
                        };
                    });
                }else{
                    this.DataBaseService.RoomsRepository.findRoomByUserId(user.id, (err, room) => {
                        if(err){
                            this.logError(err);
                            return cb ? cb() : null;
                        }
                        if(!room){
                            socket.emit(emits.NO_ROOM);
                            return cb ? cb() : null;
                        } 
                        if(!room.confirm && room.from == user.id){
                            socket.emit(emits.YOUR_SENTENCE_NOT_CONFIRM);
                            return cb ? cb() : null;
                        } 
                        if(!room.confirm && room.to == user.id){
                            socket.emit(emits.HAS_SENTENCE);
                            return cb ? cb() : null;
                        } 

                        this.CahceService.ClientsContainer.findClientByUserId((room.from == user.id ? room.to : room.from), (err, io_client_2) => {
                            if(err){
                                this.logError(err);  
                                return cb ? cb() : null;
                            }   
                            
                            if(io_client_2 == null){
                                socket.emit(emits.HAS_ROOM_0, {room_id: room.id});
                                return cb ? cb() : null;
                            } 

                            let io_room = new IORoom([io_client_1, io_client_2], room);

                            this.CahceService.RoomsContainer.addRoom(io_room, (err, saved_io_room) => {
                                if(err){
                                    this.logError(err);
                                    return cb ? cb() : null;
                                }

                                if(saved_io_room == null){
                                    this.logError(error_messages.IO_ROOM_NOT_CREATED);
                                    return cb ? cb() : null;
                                }

                                socket.emit(emits.HAS_ROOM_1, {room_id: room.id});
                                io_client_2.socket.emit(emits.HAS_ROOM_1, {room_id: room.id});

                                return cb ? cb() : null;
                            });
                        })
                    });
                }
            });
        });
    }

    logError(msg){
        if(this.Logger) this.Logger.error(msg);
    }
}

module.exports = StartController;