const db = require('../models/db.models');
const error_messages = require('../enums/error.messages');

class RoomsRepository{
    findRoomById(id, cb){
        db.Room.findById(id, cb);
    }

    findRoomByUserId(id, cb){
        db.Room.findOne({$or:[{"from":id},{"to":id}]}, cb);
    }

    removeRoomById(id, cb){
        db.Room.findByIdAndDelete(id, cb);
    }

    removeRoomByUserId(id, cb){
        db.Room.findOneAndDelete({ $or: [{ 'from': id}, { 'to': id}]}, cb);
    }
    
    saveRoom(room, cb){
        if(!room.from || 
            room.from == '' ||
            !room.to ||
            room.to == '')
                return cb(error_messages.ERROR_MODEL);
            
        if(room.id && room.id != ''){
            this.findRoomById(room.id, (err, r) => {
                if(err) return cb(err);
                if(!r){
                    this.saveRoom({from: room.from, to: room.to}, cb);
                    return;
                }
                r.from = room.from;
                r.to = room.to;
                r.confirm = room.confirm;
                r.points = room.points;
                r.save(cb);
            })
        }else{
            db.Room.findOne({$or: [{from: room.from}, 
                                   {to: room.to}, 
                                   {from: room.to}, 
                                   {to: room.from}]}, (err, r)=>{
                if(err) return cb(err);
                if(r) return cb(error_messages.USER_HAS_ROOM);

                let new_room = new db.Room();
                new_room.from = room.from;
                new_room.to = room.to;
                
                if(room.points) new_room.points = room.points;
                if(room.date_created) new_room.date_created = room.date_created;
                if(room.confirm) new_room.confirm = room.confirm;
    
                new_room.save(cb);
            });
        }
    }
}

module.exports = RoomsRepository;