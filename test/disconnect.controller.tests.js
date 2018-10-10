const DisconnectController = require('../controllers/disconnect.controller');

const ActionModel = require('../models/action.model');

const FakeDataBase = require('./fakes/fake.database');
const FakeCodesRepository = require('./fakes/fake.codes.repository');
const FakeUsersRepository = require('./fakes/fakes.users.repository');
const FakeRoomsRepository = require('./fakes/fake.rooms.repository');
const FakeSocket = require('./fakes/fake.socket');
const FakeLogger = require('./fakes/fake.logger');

const IORoomsContainer = require('../models/IORoomsContainer');
const IOClientsContainer = require('../models/IOClientsContainer');
const SocketsContainer = require('../models/SocketsContainer');

const DataBaseService = require('../services/database.service');
const CacheService = require('../services/cache.service');

const IORoom = require('../models/IORoom');
const IOClients = require('../models/IOClient');

const emits = require('../enums/emits.enum');
const cmds = require('../enums/cmd.enum');
const error_messages = require('../enums/error.messages');

const assert = require('assert');

describe('Disconnect controller', () => {
    let db = new FakeDataBase();
    let u_repository = new FakeUsersRepository(db);
    let r_repository = new FakeRoomsRepository(db);
    let c_repository = new FakeCodesRepository(db);
    let db_service = new DataBaseService(u_repository, r_repository, c_repository);

    let logger = new FakeLogger();

    let io_r_container = new IORoomsContainer();
    let io_c_container = new IOClientsContainer();
    let io_s_container = new SocketsContainer();
    let cache = new CacheService(io_c_container, io_r_container, io_s_container);

    let controller = new DisconnectController(cache, db_service, logger);

    let user_1 = {name: 'Ivan', phone: '1111', phone_confirm: true};
    let user_2 = {name: 'Igor', phone: '2222', phone_confirm: true};
    let user_3 = {name: 'Oleg', phone: '3333', phone_confirm: true};
    let user_4 = {name: 'Sveta', phone: '4444', phone_confirm: true};
    let user_5 = {name: 'Olesa', phone: '5555', phone_confirm: true};

    let socket_1 = new FakeSocket('1');
    let socket_2 = new FakeSocket('2');
    let socket_3 = new FakeSocket('3');
    let socket_4 = new FakeSocket('4');
    
    let room_1 = undefined;
    let room_2 = undefined;

    let io_client_1 = undefined;
    let io_client_2 = undefined;
    let io_client_3 = undefined;
    let io_client_4 = undefined;

    let io_room = undefined;

    beforeEach((done) => {
        u_repository.saveUser(user_1, (err, user1) => {
            assert(!err);
            user_1 = user1;
            u_repository.saveUser(user_2, (err, user2) => {
                assert(!err);
                user_2 = user2;
                u_repository.saveUser(user_3, (err, user3) => {
                    assert(!err);
                    user_3 = user3;
                    u_repository.saveUser(user_4, (err, user4) => {
                        assert(!err);
                        user_4 = user4;
                        u_repository.saveUser(user_5, (err, user5) => {
                            assert(!err);
                            user_5 = user5;
                            io_s_container.push(socket_1, (err, socket1) => {
                                assert(!err, 'Error not null: ' + err);
                                socket_1 = socket1;
                                io_s_container.push(socket_2, (err, socket2) => {
                                    assert(!err);
                                    socket_2 = socket2;
                                    io_s_container.push(socket_3, (err, socket3) => {
                                        assert(!err);
                                        socket_3 = socket3;
                                        io_s_container.push(socket_4, (err, socket4) => {
                                            assert(!err);
                                            socket_4 = socket4;
                                            io_c_container.addClient(socket_1, user_1, (err, client1) => {
                                                assert(!err);
                                                io_client_1 = client1;
                                                io_c_container.addClient(socket_2, user_2, (err, client2) => {
                                                    assert(!err);
                                                    io_client_2 = client2;
                                                    io_c_container.addClient(socket_3, user_3, (err, client3) => {
                                                        assert(!err);
                                                        io_client_3 = client3;
                                                        io_c_container.addClient(socket_4, user_4, (err, client4) => {
                                                            assert(!err);
                                                            io_client_4 = client4;
                                                            room_1 = {
                                                                from: user_1.id,
                                                                to: user_2.id,
                                                                confirm: true
                                                            };
                                                            room_2 = {
                                                                from: user_3.id,
                                                                to: user_5.id,
                                                                confirm: true
                                                            };
                                                            r_repository.saveRoom(room_1, (err, room1) => {
                                                                assert(!err);
                                                                room_1 = room1;
                                                                r_repository.saveRoom(room_2, (err, room2) => {
                                                                    assert(!err);
                                                                    room_2 = room2;
                                                                    io_room = new IORoom([io_client_1, io_client_2], room_1);
                                                                    io_r_container.addRoom(io_room, (err, room) => {
                                                                        assert(!err);
                                                                        io_room = room;
                                                                        done();
                                                                    });               
                                                                });
                                                            });
                                                        });                                   
                                                    });
                                                });
                                            });
                                        })
                                    })
                                })
                            });
                        });
                    });
                });
            });
        });
    });

    it('Disconnect client from active room and update room to db', (done) => {
        let action = new ActionModel(socket_1.id, cmds.DISCONNECT, null);
        io_room.room.points = 100;
        let length_clients = io_c_container.count();
        let length_rooms = io_r_container.count();
        let length_sockets = io_s_container.count();
        controller.setAction(action, () => {
            assert(logger.history.length == 0);
            assert(socket_1.emit_history.length == 0);
            assert(socket_2.emit_history.length == 1);
            assert(socket_2.emit_history[0].cmd == emits.HAS_ROOM_0);
            assert(length_clients - 1 == io_c_container.count());
            assert(length_rooms - 1 == io_r_container.count());
            assert(length_sockets - 1 == io_s_container.count());
            assert(db.rooms.length == 2, 'DB ROOM NOT 1: ' + db.rooms.length);
            assert(db.rooms.find(r => r.id == room_1.id).points == 100);
            let find_c = io_c_container.clients[socket_1.id];
            let find_s = io_s_container.sockets.find(s => s.id == socket_1.id);
            assert(!find_c);
            assert(!find_s);
            io_r_container.findRoomBySocketId(socket_1.id, (err, room) => {
                assert(!err);
                assert(!room);
                done();
            });
        });
    });

    it('Disconnect client from not active room', (done) => {
        let action = new ActionModel(socket_3.id, cmds.DISCONNECT, null);
        let length_clients = io_c_container.count();
        let length_rooms = io_r_container.count();
        let length_sockets = io_s_container.count();
        controller.setAction(action, () => {
            assert(logger.history.length == 0);
            assert(length_clients - 1 == io_c_container.count());
            assert(length_rooms == io_r_container.count());
            assert(length_sockets - 1 == io_s_container.count());
            assert(!(socket_3.id in io_c_container.clients));
            assert(!(io_s_container.sockets.find(s => s.id == socket_3.id)));
            done();
        });
    });

    it('Disconnect client without room', (done) => {
        let action = new ActionModel(socket_4.id, cmds.DISCONNECT, null);
        let length_clients = io_c_container.count();
        let length_rooms = io_r_container.count();
        let length_sockets = io_s_container.count();
        controller.setAction(action, () => {
            assert(logger.history.length == 0);
            assert(length_clients - 1 == io_c_container.count());
            assert(length_rooms == io_r_container.count());
            assert(length_sockets - 1 == io_s_container.count(), 'Socket not removed: ' + length_sockets + ' ' + io_s_container.count());
            for(let key in io_c_container.clients) assert(key != socket_4.id);
            assert(!(io_s_container.sockets.find(s => s.id == socket_4.id)));
            done();
        });
    });

    it('Error, client not found', (done) => {
        let action = new ActionModel(3333, cmds.DISCONNECT, null);
        controller.setAction(action, () => {
            let log = logger.history.pop();
            assert(log.type == 'error');
            assert(log.msg == error_messages.CLIENT_NOT_FOUND);
            done();
        });
    });

    afterEach(() => {
        logger.history = [];
        io_r_container.rooms = {};
        io_c_container.clients = {};
        io_s_container.sockets = [];
        db.rooms = [];
        db.users = [];
    })
});