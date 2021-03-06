const error_messages = require('../../enums/error.messages');

class FakeUsersRepository{
    constructor(fake_db){
        this.db = fake_db;
        this.id_increment = 0;
    }

    findUserById(id, cb){
        let find = this.db.users.find(u => u.id == id);
        cb(null, find);
    }

    findManyByPhone(phone, cb){
        let result = this.db.users.filter(u => u.phone == phone);
        return cb(null, result);
    }

    findManyAndRemove(ids, cb){
        if(ids.length == 0)
            return cb(null, []);
        
        let result_array = [];

        for(let i = 0; i < ids.length; i++){
            let find = this.db.users.find(u => u.id == ids[i]);
            if(!find) continue;
            let index = this.db.users.indexOf(find);
            result_array.push(find);
            this.db.users.splice(index, 1);
        }

        return cb(null, {n: result_array.length, k: 1});
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

        this.id_increment ++;

        user.id = this.id_increment + '';

        if(!user.phone_confirm) user.phone_confirm = false;

        this.db.users.push(user);

        cb(null, user);
    }

    length(){
        return this.db.users.length;
    }
}

module.exports = FakeUsersRepository;