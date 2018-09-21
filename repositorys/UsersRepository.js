const db = require('../models/db.models');
const error_messages = require('../enums/error.messages');

class UserRepository{
    findUserById(id, cb){
        db.User.findById(id, cb);
    }

    findUserByPhone(phone, cb){
        db.User.findOne({'phone': phone}, cb);
    }

    removeUserById(id, cb){
        db.User.findByIdAndDelete(id, cb);
    }

    removeUserByPhone(phone, cb){
        db.User.findOneAndDelete({'phone': phone}, cb);
    }

    saveUser(user, cb){
        if(!user.name || 
            user.name == '' ||
            !user.phone ||
            user.phone == '') return cb(error_messages.ERROR_MODEL)
        
        this.findUserByPhone(user.phone, (err, u) => {
            if(err) return cb(err);

            if(u) return cb(error_messages.PHONE_REGISTRATE);

            let new_user = new db.User();
            new_user.name = user.name;
            new_user.phone = user.phone;

            new_user.save(cb);
        })    
    }
}

module.exports = UserRepository;