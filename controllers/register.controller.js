const error_messages = require('../enums/error.messages');
const cmds = require('../enums/cmd.enum');
const emits = require('../enums/emits.enum');
const randomCode = require('../helpers/code.generator');

class RegisterController{
    constructor(cache_service, database_service, sms_service, logger, configs){
        this._cache = cache_service;
        this._db = database_service;
        this._logger = logger;
        this._configs = configs;
        this._sms = sms_service;
    }

    setAction(action, cb){
        this._cache.SocketsService.get(action.client_id, (err, socket) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }
            if(!socket){
                this.logError(error_messages.CLIENT_NOT_FOUND);
                return cb ? cb() : null;
            }
            switch(action.cmd){
                case cmds.REGISTER:
                    setTimeout(()=>{
                        this.register(socket, action.data, cb);
                    }, 0);
                break;
                case cmds.VALIDATE_CODE:
                    setTimeout(() => {
                        this.confirm(socket, action.data, cb)
                    }, 0);
                break;
                case cmds.GET_CODE:
                    setTimeout(() => {
                        this.makeCode(socket, action.data, cb);
                    }, 0);
                break;
            }
        })
    }

    makeCode(socket, data, cb){
        if(!data.user_id || data.user_id.trim() == ''){
            socket.emit(emits.ERROR, {msg: error_messages.ERROR_MODEL});
            return cb ? cb() : null;
        }

        this._db.UsersRepository.findUserById(data.user_id, (err, user) => {
            if(err){
                this._logger.error(err);
                return cb ? cb() : null;
            }
            if(!user){
                socket.emit(emits.UNREGISTRATE, {msg: error_messages.USER_NOT_FOUND});
                return cb ? cb() : null;
            }
            this._db.CodesRepository.findCodeByUserId(user.id, (err, code) => {
                if(err){
                    this._logger.error(err);
                    return cb ? cb() : null;
                }
                
                let new_code = randomCode(this._configs.phone_confirm_length);

                if(code){
                    code.code = new_code;
                    this._db.CodesRepository.saveCode(code, (err, c) => {
                        if(err){
                            this._logger.error(err);
                            return cb ? cb() : null;
                        }
                        this._sms.sendSms(user.phone, new_code, (err, m, d) => {
                            if(err){
                                this._logger.error(err);
                                return cb ? cb() : null;
                            }
                            return cb ? cb() : null;
                        });
                    });
                }else{
                    code = {
                        user_id: user.id,
                        code: new_code
                    };
                    this._db.CodesRepository.saveCode(code, (err, c) => {
                        if(err){
                            this._logger.error(err);
                            return cb ? cb() : null;
                        }
                        this._sms.sendSms(user.phone, new_code, (err, m, d) => {
                            if(err){
                                this._logger.error(err);
                                return cb ? cb() : null;
                            }
                            socket.emit(emits.INPUT_PHONE_CONFIRM_CODE);
                            return cb ? cb() : null;
                        })
                    });
                }
            });
        });
    }

    register(socket, data, cb){
        if(!data.phone || !data.name || data.phone.trim() == '' || data.name.trim == ''){
            socket.emit(emits.ERROR, {msg: error_messages.ERROR_MODEL});
            return cb ? cb() : null;
        }

        this._db.UsersRepository.saveUser({name: data.name, phone: data.phone}, (err, user) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }
            this._cache.ClientsContainer.addClient(socket, user, (err, io_client) => {
                if(err){
                    this._logger.error(err);
                    return cb ? cb() : null;
                }
                socket.emit(emits.PHONE_UNCONFIRMED, {data: user});
                return cb ? cb() : null;
            });
        });
    }

    confirm(socket, data, cb){
        if(!data.user_id || 
           !data.code || 
           data.user_id.trim() == '' || 
           data.code.trim() == '' || 
           !data.phone ||
           data.phone.trim() == ''){
            socket.emit(emits.ERROR, {msg: error_messages.ERROR_MODEL});
            return cb ? cb() : null;
        }

        this._db.CodesRepository.findCodeByUserId(data.user_id, (err, code) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }
            
            if(!code){
                this.logError(error_messages.CODE_NOT_FOUND);
                socket.emit(emits.ERROR, {msg: error_messages.CODE_NOT_FOUND});
                return cb ? cb() : null;
            }

            if(code != data.code){
                socket.emit(emits.ERROR, {msg: error_messages.CODE_NOT_VALID});
                return cb ? cb() : null;
            }

            this._db.CodesRepository.removeCode(code, (err, code) => {
                if(err){
                    this.logError(err);
                    return cb ? cb() : null;
                }
                this._db.UsersRepository.findManyByPhone(data.phone, (err, users) => {
                    if(err){
                        this.logError(err);
                        return cb ? cb() : null;
                    }
                    if(!users || users.length == 0){
                        socket.emit(emits.ERROR, {msg: error_messages.USER_NOT_FOUND});
                        return cb ? cb() : null;
                    }
                    
                    let current_user = users.find(u => u.id == data.user_id);
                    if(!current_user){
                        socket.emit(emits.ERROR, {msg: error_messages.USER_NOT_FOUND});
                        return cb ? cb() : null;
                    }

                    let r_users = users.filter(u => u.id != data.user_id);

                    if(r_users && r_users.length != 0){
                        let index = 0;
                        let error = undefined;
                        r_users.forEach((v) => {
                            this._db.UsersRepository.removeUserById(v.id, (err, user) => {
                                if(err) error = err;
                                
                                if(!error && index++ >= r_users.length){
                                    socket.emit(emits.NO_ROOM);
                                    return cb ? cb() : null;
                                }else if(error){
                                    return;
                                }
                            });
                            if(error) return cb ? cb() : null; 
                        });
                    }else{
                       socket.emit(emits.NO_ROOM);
                       return cb ? cb() : null;
                    }
                });
            });
        });
    }

    logError(msg){
        if(this._logger) this._logger.error(msg);
    }
}

module.exports = RegisterController;