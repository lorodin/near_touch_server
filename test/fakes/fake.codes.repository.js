const error_messages = require('../../enums/error.messages');

class FakeCodesRepository{
    constructor(fake_db){
        this.db = fake_db;
        this.id_increment = 0;
    }
    
    findCodeByPhone(phone, cb){
        let user = this.db.users.find(u => u.phone == phone);
        
        if(!user) return cb(null, null);

        let result = this.db.codes.find(c => c.user_id == user.id);

        return cb(null, result);
    }
    
    findCodeByUserId(id, cb){
        let user = this.db.users.find(u => u.id == id);

        if(!user) return cb(null, null);

        let result = this.db.codes.find(c => c.user_id == id);

        return cb(null, result);
    }

    removeCode(code, cb){
        let find = this.db.codes.find(c => c.id == code.id);
        
        if(!find) return cb(null, null);

        let index = this.db.codes.indexOf(find);

        this.db.codes.splice(index, 1);

        return cb(null, code);
    }

    saveCode(code, cb){
        if(code.user_id == undefined ||
            code.code == undefined) return cb(error_messages.ERROR_MODEL);
        
        let find_user = this.db.users.find(u => u.id == code.user_id);

        if(!find_user) return cb(error_messages.USER_NOT_FOUND);

        let finded_code = this.db.codes.find(c => c.id == code.id);

        if(finded_code){
            finded_code.code = code.code;
            return cb(null, finded_code);
        }

        this.id_increment++;

        code.id = this.id_increment + '';
        
        code.date_created = new Date();

        this.db.codes.push(code);

        return cb(null, code);
    }
}


module.exports = FakeCodesRepository;