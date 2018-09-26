class Logger{
    constructor(){
        this.history = [];
    }
    error(msg){
        this.history.push({
            'type': 'error',
            'msg': msg
        });
    }
    debug(msg){
        this.history.push({
            'type': 'debug',
            'msg': msg
        });
    }
    info(msg){
        this.history.push({
            'type': 'info',
            'msg': msg
        });
    }
}

module.exports = Logger;