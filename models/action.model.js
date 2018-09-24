class Action{
    constructor(client_id, cmd, data) {
        this.client_id = client_id;
        this.cmd = cmd;
        this.data = data;
    }
}

module.exports = Action;