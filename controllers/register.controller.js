const error_messages = require('../enums/error.messages');
const cmds = require('../enums/cmd.enum');
const emits = require('../enums/emits.enum');

class RegisterController{
    constructor(cache_service, database_service, logger){
        this._cache = cache_service;
        this._db = database_service;
        this._logger = logger;
    }

    setAction(client_id, data){
        this._cache.ClientsContainer.findClientBySocketId(client_id, (err, client) => {
            if(err){
                this.logError(err);
                return cb ? cb() : null;
            }
            if(!client){
                this.logError(error_messages.CLIENT_NOT_FOUND);
                return cb ? cb() : null;
            }
            switch(data.cmd){
                case cmds.REGISTER:
                    setTimeout(()=>{
                        this.register(socket, data, cb);
                    }, 0);
                break;
                case cmds.VALIDATE_CODE:
                    setTimeout(() => {
                        this.confirm(socket, data, cb)
                    }, 0);
                break;
            }
        })
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
            socket.emit(emits.PHONE_UNCONFIRMED, {data: { user_id: user.id, phone: user.phone}});
            return cb ? cb() : null;
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