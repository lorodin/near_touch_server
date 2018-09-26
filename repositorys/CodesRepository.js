const db = require('../models/db.models');
const error_messages = require('../enums/error.messages');

class CodesRepository{
    findCodeByPhone(phone, cb){
        db.User.findOne({phone: phone}, (err, u) => {
            if(err) return cb(err);
            if(!u) return cb(error_messages.USER_NOT_FOUND);

            db.Code.findOne({user_id: u.id}, cb);
        });
    }

    findCodeByUserId(id, cb){
        db.Code.findOne({user_id: id}, cb);
    }

    removeCode(code, cb){
        db.Code.findByIdAndDelete(code.id, cb);
    }

    saveCode(code, cb){
        if(!code.user_id || 
           !code.code    ||
            code.code == '') return cb(error_messages.ERROR_MODEL);
        
        db.Code.findOne({user_id: code.user_id}, (err, c) => {
            if(err) return cb(err);

            if(c){
                c.code = code.code;
                c.date_created = Date.now();
                c.save(cb);
            }else{
                let new_code = new db.Code();
                new_code.user_id = code.user_id;
                new_code.code = code.code;
                new_code.save(cb);
            }
        });
    }
}

module.exports = CodesRepository;