const error_messages = require('../../enums/error.messages');

class FakeUsersRepository{
    constructor(fake_db){
        this.db = fake_db;
    }

    findUserById(id, cb){
        let find = this.db.users.find(u => u.id == id);
        cb(null, find);
    }

    findUserByPhone(phone, cb){
        let find = this.db.users.find(u => u.phone == phone);
        
        cb(null, find);
    }

    removeUserById(id, cb){
        let find = this.db.users.find(u => u.id == id);
        if(!find) return cb(null, null);
        let index = this.db.users.indexOf(find);
        this.db.users.splice(index, 1);
        cb(null, find);
    }

    saveUser(user, cb){
        if(!user.name || 
            user.name == '' ||
            !user.phone ||
            user.phone == '') return cb(error_messages.ERROR_MODEL)
        
        let find = this.db.users.find(u => u.id == user.id);

        if(find){
            find.name = user.name;
            find.phone = user.phone;
            if(user.phone_confirm) find.phone_confirm = user.phone_confirm;
            return cb(null, find);
        }

        if(!user.phone_confirm) user.phone_confirm = false;
        this.db.users.push(user);

        cb(null, user);
    }

    length(){
        return this.db.users.length;
    }
}

module.exports = FakeUsersRepository;