const IORoom = require('./IORoom');
const error_messages = require('../enums/error.messages');

class IORoomsContainer{
    constructor(){
        this.rooms = {};
    }

    count(){
        return Object.keys(this.rooms).length;
    }

    _validateRoom(io_room){
        let valid = io_room.room ? true : false;
            valid &= io_room.clients ? true : false;
            valid &= io_room.clients.length == 2;
            valid &= io_room.clients[0].id ? true : false;
            valid &= io_room.clients[1].id ? true : false;
            valid &= io_room.clients[0].name ? true : false;
            valid &= io_room.clients[1].name ? true : false;
            valid &= io_room.clients[0].phone ? true : false;
            valid &= io_room.clients[1].phone ? true : false;
            valid &= io_room.room.id ? true : false;
            valid &= io_room.room.from ? true : false;
            valid &= io_room.room.to ? true : false;
            valid &= io_room.room.points ? true : false;
            valid &= io_room.room.confirm != undefined ? true : false;
            valid &= io_room.room.points != undefined ? true : false;    
        return valid;
    }

    addRoom(io_room, cb){
        if(this._validateRoom(io_room)) return cb(error_messages.ERROR_MODEL, null);
        let user_ids = [io_room.clients[0].user.id, io_room.clients[1].user.id];
        for(let key in this.rooms){
            let room = this.rooms[key];
            let u_ids = [room.clients[0].user.id, room.clients[1].user.id];
            if(user_ids[0] == u_ids[0] || 
               user_ids[1] == u_ids[0] || 
               user_ids[0] == u_ids[1] || 
               user_ids[1] == u_ids[1])
                   return cb(error_messages.ROOM_CLIENT_BUSY, null);
        }
        
        this.rooms[io_room.room.id] = io_room;

        cb(null, io_room);
    }

    findRoomById(id, cb){
        if(this.rooms[id]) return cb(null, this.rooms[id]);
        return cb(null, null);
    }

    findRoomByUserId(id, cb){
        for(let key in this.rooms){
            if(this.rooms[key].clients[0].user.id == id || 
                this.rooms[key].clients[1].user.id == id) 
                return cb(null, this.rooms[key]);
            }
        cb(null, null);
    }

    findRoomBySocketId(id, cb){
        for(let key in this.rooms)
            if(this.rooms[key].clients[0].socket.id == id ||
                this.rooms[key].clients[1].socket.id == id) 
                return cb(null, this.rooms[key]);
        cb(null, null);
    }

    removeRoom(io_room, cb){
        let room_id = io_room.room.id;
        if(!this.rooms[room_id]) return cb(error_messages.ROOM_NOT_FOUND, null);
        delete this.rooms[room_id];
        return cb(null, io_room);
    }
}

module.exports = IORoomsContainer;