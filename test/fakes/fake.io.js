class FakeIO{
    constructor(server){
        this._server = server;
        this._listeners = {};
        this.sockets = [];
    }
    
    on(cmd, cb){
        if(!this._listeners[cmd]) this._listeners[cmd] = [];
        this._listeners[cmd].push(cb);
    }
    
    connection(socket){
        let find = this.sockets.find(s => s.id == socket.id);
        
        if(!find) this.sockets.push(socket);
        
        if(!this._listeners['connection']) return;

        for(let i = 0; i < this._listeners['connection'].length; i++)
            this._listeners['connection'][i](socket);
            
        socket.emit('connection');
    }

    clear(){
        this._listeners = {};
        this.sockets = [];
    }
}

module.exports = FakeIO;