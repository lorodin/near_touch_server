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
        
        if(user.id && user.id != ''){
            this.findUserById(user.id, (err, u) => {
                if(err) return cb(err);
                if(u == null){
                    this.saveUser({
                        name: user.name,
                        phone: user.phone,
                        phone_confirm: user.phone_confirm
                    }, cb);
                    return;
                }
                u.name = user.name;
                u.phone = user.phone;
                u.phone_confirm = user.phone_confirm;
                u.save(cb);
            });
        }else{
            this.findUserByPhone(user.phone, (err, u) => {
                if(err) return cb(err);

                if(u) return cb(error_messages.PHONE_REGISTRATE);

                let new_user = new db.User();
                new_user.name = user.name;
                new_user.phone = user.phone;

                new_user.save(cb);
            });    
        }
    }
}

module.exports = UserRepository;