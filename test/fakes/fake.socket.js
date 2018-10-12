class FakeSocket{
    constructor(id){
        this.id = id;
        this.listeners = {};
        this.emit_listeners = {};
        this.commands_history = [];
        this.emit_history = [];
    }

    on(cmd, cb){
        if(!this.listeners[cmd]) this.listeners[cmd] = [];
        this.listeners[cmd].push(cb);
    }

    onClientEmit(cmd, cb){
        if(!this.emit_listeners[cmd]) this.emit_listeners[cmd] = [];
        this.emit_listeners[cmd].push(cb);
    }

    removeEmitListener(cmd){
        if(this.emit_listeners[cmd]) delete this.emit_listeners[cmd];
    }

    makeCmd(cmd, data){
        if(!this.listeners[cmd]){
            console.log(this.listeners);
            throw new Error("Listener not found! [" + cmd + "]");
        }
        this.commands_history.push({cmd: cmd, data: data});

        for(let i = 0; i < this.listeners[cmd].length; i++)
            this.listeners[cmd][i](data);
    }

    emit(cmd, data, cb){
        let model = {cmd: cmd, data: data};
        this.emit_history.push(model);   
        if(this.emit_listeners[cmd])
            for(let i = 0; i < this.emit_listeners[cmd].length; i++)
                this.emit_listeners[cmd][i](data);

        return cb ? cb(model): 0;
    }

    removeListener(cmd){
        if(this.listeners[cmd]) delete this.listeners[cmd];
    }

    clear(){
        this.emit_history = [];
        this.listeners = {};
        this.commands_history = [];
        this.emit_listeners = {};
    }
}

module.exports = FakeSocket;