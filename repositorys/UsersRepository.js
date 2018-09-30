const db = require('../models/db.models');
const error_messages = require('../enums/error.messages');

class UserRepository{
    findUserById(id, cb){
        db.User.findById(id, cb);
    }

    findUserByPhone(phone, cb){
        db.User.findOne({'phone': phone}, cb);
    }

    findManyByPhone(phone, cb){
        db.User.find({phone: phone}, cb);
    }

    findManyAndRemove(ids, cb){
        if(ids == null || ids.length == 0) return cb(null, []);
        // for(let i = 0;i < ids.length; i++){
        //     ids[i] = "ObjectId('" + ids[i] + "')";
        // }
        db.User.deleteMany({_id: {$in: ids}}, cb);
    }

    removeUserById(id, cb){
        db.User.findByIdAndDelete(id, cb);
    }

    count(cb){
        db.User.countDocuments(cb);
    }

    saveUser(user, cb){
        if(!user.name || 
            user.name == '' ||
            !user.phone ||
            user.phone == '') return cb(error_messages.ERROR_MODEL)
        
        db.User.findById(user.id, (err, u) => {
            if(err) return cb(err);

            if(u){
                u.name = user.name;
                u.phone = user.phone;
                u.phone_confirm = user.phone_confirm;
                u.save(cb);
                return;
            }

            // db.User.findOneAndDelete({phone: user.phone}, (err, u) => {
            //     if(err) return cb(err);

            let new_user = new db.User();
        
            new_user.name = user.name;
            new_user.phone = user.phone;
            new_user.phone_confirm = user.phone_confirm != undefined ? user.phone_confirm : false;

            new_user.save(cb);
        //     });
        });
    }
}

module.exports = UserRepository;