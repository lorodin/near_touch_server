const IOClient = require('./IOClient');
const error_messages = require('../enums/error.messages');

class IOClientsContainer{
    constructor(){
        this.clients = {};
    }

    count(){
        return Object.keys(this.clients).length;
    }

    addClient(socket, user, cb){
        if(this.clients[socket.id]) return cb(error_messages.CLIENT_EXISTS);

        
        this.findClientByUserId(user.id, (err, c) => {
            if(err) return cb(err);
            if(c) return cb(error_messages.CLIENT_USER_EXISTS);

            let new_client = new IOClient(user, socket);
            this.clients[socket.id] = new_client;
    
            return cb(null, new_client);
        });
    }
    
    findClientByUserId(id, cb){
        for(let key in this.clients)
            if(this.clients[key].user.id == id) 
                return cb(null, this.clients[key]);
        
        cb(null, null);
    }

    findClientBySocketId(id, cb){
        return cb(null, this.clients[id]);
    }

    removeClient(client, cb){
        if(!this.clients[client.socket.id]) return cb(error_messages.CLIENT_NOT_FOUND, null);
        delete this.clients[client.socket.id];
        return cb(null, client);
    }
}

module.exports = IOClientsContainer;