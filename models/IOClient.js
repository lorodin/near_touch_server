class IOClient{
    constructor(user, socket){
        this.user = user;
        this.socket = socket;
        this.last_action = "";
    }
}

module.exports = IOClient;