const IORoomsContainer = require('../models/IORoomsContainer');
const assert = require('assert');
const error_messages = require('../enums/error.messages');
const IORoom = require('../models/IORoom');
const IOClient = require('../models/IOClient');

describe('Test IORoomContainer', () => {
    let user_1 = {
        id: '1',
        name: 'Vasy',
        phone: '123'
    };
    let user_2 = {
        id: '2',
        name: 'Igor',
        phone: '321'
    };
    
    let socket_1 = {
        id: '11'
    };
    
    let socket_2 = {
        id: '22'
    };

    let room = {
        id: '33',
        from: user_1.id,
        to: user_2.id,
        confirm: true,
        date_created: Date.now(),
        points: 0
    };

    let client_1 = new IOClient(user_1, socket_1);
    let client_2 = new IOClient(user_2, socket_2);

    let io_room = new IORoom([
        client_1,
        client_2
    ], room);

    let container = new IORoomsContainer();

    beforeEach((done) => {
        container.addRoom(io_room, (err, room) => {
            assert(err == null);
            assert(room != null);
            assert(room.clients[0].user.id == user_1.id);
            assert(room.clients[1].user.id == user_2.id);
            assert(room.room.id == io_room.room.id);
            done();
        });
    });

    it('Not add room with alredy exists client', (done) => {
        container.addRoom(new IORoom([client_1, client_2], room), (err, room) => {
            assert(err == error_messages.ROOM_CLIENT_BUSY);
            assert(room == null);
            done();
        });
    });

    it('Find room by id', (done) => {
        container.findRoomById(io_room.room.id, (err, room) => {
            assert(err == null);
            
            assertRoom(room, io_room, 'Find room by id id');

            done();
        });
    });

    it('Find room by user 1 id', (done) => {
        container.findRoomByUserId(user_1.id, (err, room) => {
            assert(err == null);
            
            assertRoom(room, io_room, 'Find room by user 1 id');

            done();
        });
    });

    it('Find room by user 2 id', (done) => {
        container.findRoomByUserId(user_2.id, (err, room) => {
            assert(err == null);
             
            assertRoom(room, io_room, 'Find room by user 2 id');

            done();
         });
    });

    it('Find room by socket 1 id', (done) => {
        container.findRoomBySocketId(socket_1.id, (err, room) => {
            assert(err == null);
             
            assertRoom(room, io_room, 'Find room by socket 1 id');

            done();
        })
    });

    it('Find room by socket 2 id', (done) => {
        container.findRoomBySocketId(socket_2.id, (err, room) => {
            assert(err == null);
            assertRoom(room, io_room, 'Find room by socket 2 id');
            done();
        });
    });

    it('Not find room by incorrect user id', (done) => {
        container.findRoomByUserId('000', (err, room) => {
            assert(err == null);
            assert(room == null);
            done();
        });
    });

    it('Not find room by incorrect socket id', (done) => {
        container.findRoomBySocketId('333', (err, room) => {
            assert(err == null);
            assert(room == null);
            done();
        });
    });

    afterEach((done) => {
        container.removeRoom(io_room, (err, room) => {
            assert(err == null);
            assert(room != null);
            container.findRoomById(io_room.room.id, (err, room) => {
                assert(err == null);
                assert(room == null);
                done();
            });
        })
    })
});

let assertRoom = (room_1, room_2, test_method_name) => {
    
    assert(room_1.room.id == room_2.room.id, test_method_name + ' ROOM ID');
    
    assert(room_1.room.from == room_2.room.from, test_method_name + ' ROOM FROM');
    
    assert(room_1.room.to == room_2.room.to, test_method_name + ' ROOM TO');
    
    assert(room_1.room.confirm == room_2.room.confirm, test_method_name + ' ROOM CONFIRM');

    assert(room_1.room.points == room_2.room.points, test_method_name + ' ROOM POINTS');

    assert(room_1.clients[0].user.id == room_2.clients[0].user.id, test_method_name + ' CLIENTS[0] USER ID');
    assert(room_1.clients[1].user.id == room_2.clients[1].user.id, test_method_name + ' CLIENTS[1] USER ID');
    
    assert(room_1.clients[0].user.name == room_2.clients[0].user.name, test_method_name + ' CLIENTS[0] USER NAME');
    assert(room_1.clients[1].user.name == room_2.clients[1].user.name, test_method_name + ' CLIENTS[1] USER NAME');
    
    assert(room_1.clients[0].user.phone == room_2.clients[0].user.phone, test_method_name + ' CLIENTS[0] USER PHONE');
    assert(room_1.clients[1].user.phone == room_2.clients[1].user.phone, test_method_name + ' CLIENTS[1] USER NAME');
    
    assert(room_1.clients[0].socket.id == room_2.clients[0].socket.id, test_method_name + ' CLEINTS[0] SOCKET ID');
    assert(room_1.clients[1].socket.id == room_2.clients[1].socket.id, test_method_name + ' CLIENTS[1] SOCKET ID');
}