class Logger{
    constructor(){
        this.history = [];
        this.history_info = [];
        this.history_debug = [];
    }
    error(msg){
        this.history.push({
            'type': 'error',
            'msg': msg
        });
    }
    debug(msg){
        this.history_debug.push({
            'type': 'debug',
            'msg': msg
        });
    }
    info(msg){
        this.history_info.push({
            'type': 'info',
            'msg': msg
        });
    }
    msgToString(i){
        if(i > 0 && i < this.history.length)
            return '[' + this.history[i].type + '] : ' + this.history[i].msg;
        return '';
    }
}

module.exports = Logger;