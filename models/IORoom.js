const room_states = require('../enums/room.states.enum');

class IORoom{
    constructor(clients, room) {
        this.clients = clients;
        this.room = room;
        this.state = room_states.PAUSE;
        this.total_points = 0;
    }
}

module.exports = IORoom;