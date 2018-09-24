class FakeSocket{
    constructor(id){
        this.id = id;
        this.listeners = {};
        this.commands_history = [];
        this.emit_history = [];
    }

    on(cmd, cb){
        if(!this.listeners[cmd]) this.listeners[cmd] = [];
        this.listeners[cmd].push(cb);
    }

    makeCmd(cmd, data){
        if(!this.listeners[cmd])
            throw new Error("Listener not found!");
        
        this.commands_history.push({cmd: cmd, data: data});

        for(let i = 0; i < this.listeners[cmd].length; i++)
            this.listeners[cmd][i](data);
    }

    emit(cmd, data, cb){
        let model = {cmd: cmd, data: data};
        this.emit_history.push(model);
        cb(model);
    }

    removeListener(cmd){
        if(this.listeners[cmd]) delete this.listeners[cmd];
    }

    clear(){
        this.emit_history = [];
        this.listeners = {};
        this.commands_history = [];
    }
}

module.exports = FakeSocket;