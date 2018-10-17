const routings = require('../enums/routings.enum');
const ActionModel = require('../models/action.model');
const cmds = require('../enums/cmd.enum');

class IOServer{
    constructor(io, controllers, cache, logger, configs){
        this.io = io;
        this.controllers = controllers;
        this.logger = logger;
        this.configs = configs;
        this.cache = cache;
        this.TAG = 'IOServer';
    }
    logError(err){
        if(this.logger) this.logger(err);
    }
    start(){
        this.logger.debug(this.TAG, 'Server started');
        this.io.on('connection', (s) => {
            this.logger.log('IOServer', 'client connection: ' + s.id);
            this.cache.SocketsService.push(s, (err, socket) => {
                if(err) return this.logError(err);
                socket.on(routings.START, (data) => {
                    let action = new ActionModel(socket.id, cmds.START, data);
                    this.controllers.StartController.setAction(action);
                });
                socket.on(routings.REGISTER, (data) => {
                    let action = new ActionModel(socket.id, data.cmd, data.data);
                    this.controllers.RegisterController.setAction(action);
                });
                socket.on(routings.ROOM, (data) => {
                    let action = new ActionModel(socket.id, data.cmd, data.data);
                    this.controllers.RoomController.setAction(action);
                });
                socket.on(routings.PLAY, (data) => {
                    let action = new ActionModel(socket.id, data.cmd, data.data);
                    this.controllers.PlayController.setAction(action);
                });
                socket.on(routings.DISCONNECT, (data) => {
                    let action = new ActionModel(socket.id, cmds.DISCONNECT, null);
                    this.controllers.DisconnectController.setAction(action);
                });
            });
        });
    }
}

module.exports = IOServer;