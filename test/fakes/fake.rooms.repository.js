const error_messages = require('../../enums/error.messages');

class FakeRoomsRepository{
    constructor(fake_db) {
        this.db = fake_db;
        this.id_increment = 0;
    }

    findRoomById(id, cb){
        let find = this.db.rooms.find(r => r.id == id);

        return cb(null, find);
    }

    findRoomByUserId(id, cb){
        let find = this.db.rooms.find(r => r.from == id || r.to == id);

        return cb(null, find);
    }

    removeRoomByUserId(id, cb){
        let find = this.db.rooms.find(r => r.from == id || r.to == id);
        
        if(!find) return cb(null, null);

        let index = this.db.rooms.indexOf(find);

        this.db.rooms.splice(index, 1);

        return cb(null, find);
    }

    removeRoomById(id, cb){
        let find = this.db.rooms.find(r => r.id == id);

        if(!find) return cb(null, null);

        let index = this.db.rooms.indexOf(find);

        this.db.rooms.splice(index, 1);

        return cb(null, find);
    }

    saveRoom(room, cb){
        if(!room.from || 
            room.from == '' ||
            !room.to ||
            room.to == '')
                return cb(error_messages.ERROR_MODEL);
        
        let finded = 0;
        
        if(room.from == room.to) return cb(error_messages.ERROR_MODEL);
        
        for(let i = 0; i < this.db.users.length; i++){
            if(this.db.users[i].id == room.from) finded++;
            if(this.db.users[i].id == room.to) finded++;
            if(finded == 2) break;
        }

        if(finded != 2) return cb(error_messages.USER_NOT_FOUND);

        let find = this.db.rooms.find(r => r.id == room.id);

        if(find){
            find.confirm = room.confirm ? room.confirm : find.confirm;
            find.points = room.points ? room.points : find.points;
            return cb(null, find);
        }

        let users_busy_find = this.db.rooms.find(r => r.from == room.from ||
            r.to == room.from ||
            r.from == room.to ||
            r.to == room.to);

        if(users_busy_find) return cb(error_messages.ROOM_CLIENT_BUSY);

        if(!room.confirm) room.confirm = false;
        if(!room.points) room.points = 0;
        
        room.date_created = new Date();

        this.id_increment ++;

        room.id = this.id_increment + '';

        this.db.rooms.push(room);
        
        cb(null, room);
    }
}

module.exports = FakeRoomsRepository;