const error_messages = require('../enums/error.messages');

class SocketsContainer{
    constructor(){
        this.sockets = [];
    }

    push(socket, cb){
        if(!socket.id) return cb(error_messages.ERROR_MODEL);
        let find = this.sockets.find(s => s.id == socket.id);
        if(find) return cb(error_messages.SOCKET_EXISTS);
        this.sockets.push(socket);
        return cb(null, socket); 
    }

    get(id, cb){
        let find = this.sockets.find(s => s.id == id);
        return cb(null, find);
    }

    remove(id, cb){
        let find = this.sockets.find(s => s.id == id);
        if(!find) return cb(null, null);
        let index = this.sockets.indexOf(find);
        this.sockets.splice(index, 1);
        return cb(null, find, index);
    }

    count(){
        return this.sockets.length;
    }
}

module.exports = SocketsContainer;