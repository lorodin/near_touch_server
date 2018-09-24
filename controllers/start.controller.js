const cmds = require('../enums/cmd.enum');
const emits = require('../enums/emits.enum');

class StartController{
    constructor(cache_service, database_service){
        this.CahceService = cache_service;
        this.DataBaseService = database_service;
    }
    
    setAction(action){
        if(action.cmd == cmds.START)
            this.start(action.client_id, action.data);
    }

    start(client_id, data){
        
    }
}

module.exports = StartController;