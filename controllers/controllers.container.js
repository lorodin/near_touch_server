class ControllerContainer{
    constructor(startController, registerController, roomController, playController, disconnectController){
        this.StartController = startController;
        this.RegisterController = registerController;
        this.RoomController = roomController;
        this.PlayController = playController;
        this.DisconnectController = disconnectController;
    }
}

module.exports = ControllerContainer;