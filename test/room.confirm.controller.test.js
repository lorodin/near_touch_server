const RoomConfirmController = require('../controllers/room.confirm.controller');
const assert = require('assert');
const Logger = require('./fakes/fake.logger');
const ActionModel = require('../models/action.model');
const FakeSocket = require('./fakes/fake.socket');
const FakeDataBase = require('./fakes/fake.database');
const FakeUsersRepository = require('./fakes/fakes.users.repository');
const FakeRoomsRepository = require('./fakes/fake.rooms.repository');
const FakeCodesRepository = require('./fakes/fake.codes.repository');
const CacheService = require('../services/cache.service');
const DBService = require('../services/database.service');
const SocketsContainer = require('../models/SocketsContainer');
const IORoomsContainer = require('../models/IORoomsContainer');
const IOClientsContainer = require('../models/IOClientsContainer');
const IOClient = require('../models/IOClient');
const IORoom = require('../models/IORoom');
const emits = require('../enums/emits.enum');
const cmds = require('../enums/cmd.enum');
const error_messages = require('../enums/error.messages');
const messages = require('../enums/messages.enum');

describe('Room Confirm Controller', () => {
    let logger = new Logger();
    let db = new FakeDataBase();
    let u_repository = new FakeUsersRepository(db);
    let r_repository = new FakeRoomsRepository(db);
    let c_repository = new FakeCodesRepository(db);
    let s_container = new SocketsContainer();
    let r_container = new IORoomsContainer();
    let c_container = new IOClientsContainer();
    let c_service = new CacheService(c_container, r_container, s_container);
    let db_service = new DBService(u_repository, r_repository, c_repository);

    let user_1 = {
        name: 'Vasy',
        phone: '123',
        phone_confirm: true
    };

    let user_2 = {
        name: 'Igor',
        phone: '321',
        phone_confirm: true
    };

    let user_3 = {
        name: 'Larisa',
        phone: '333'
    };

    let socket_1 = new FakeSocket('1');
    let socket_2 = new FakeSocket('2');
    let socket_3 = new FakeSocket('3');

    let client_1 = {};
    let client_2 = {};
    let client_3 = {};

    let controller = new RoomConfirmController(c_service, db_service, logger);

    beforeEach((done) => {
        u_repository.saveUser(user_1, (err, u1) => {
            assert(err == null);
            assert(u1.id);
            user_1 = u1;
            u_repository.saveUser(user_2, (err, u2) => {
                assert(err == null);
                assert(u2.id);
                user_2 = u2;
                u_repository.saveUser(user_3, (err, u3) => {
                    assert(err == null);
                    assert(u3.id);
                    user_3 = u3;
                    s_container.push(socket_1, (err, s1) => {
                        assert(err == null);
                        assert(s1 != null);
                        socket_1 = s1;
                        s_container.push(socket_2, (err, s2) => {
                            assert(err == null);
                            assert(s2 != null);
                            socket_2 = s2;
                            s_container.push(socket_3, (err, s3) => {
                                assert(err == null);
                                assert(s3 != null);
                                socket_3 = s3;
                                c_container.addClient(socket_1, user_1, (err, c1) => {
                                    assert(err == null);
                                    assert(c1 != null);
                                    client_1 = c1;
                                    c_container.addClient(socket_2, user_2, (err, c2) => {
                                        assert(err == null);
                                        assert(c2 != null);
                                        client_2 = c2;
                                        c_container.addClient(socket_3, user_3, (err, c3) => {
                                            assert(err == null);
                                            assert(c2 != null);
                                            client_3 = c3;
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    describe('Cancel', () => {
        it('Cancel from first user (from)', (done) => {
            let n_room = {
                from: user_1.id,
                to: user_2.id,
                confirm: false,
                date_created: Date.now(),
                id: 3333
            };
            db.rooms.push(n_room);
            c_container.removeClient(client_2, (err, client) => {
                assert(err == null);
                assert(client != null);
                let action = new ActionModel(socket_1.id, cmds.CANCEL_ROOM, {
                    user_id: user_1.id,
                    room_id: n_room.id
                });
                controller.setAction(action, () => {
                    assert(logger.history.length == 0);
                    let emit = socket_1.emit_history.pop();
                    assert(emit.cmd == emits.NO_ROOM);
                    let emit_2 = socket_2.emit_history.pop();
                    assert(!emit_2);
                    assert(db.rooms.length == 0);
                    done();
                });
            });
        });

        it('Cancel from second user (to)', (done) => {
            let n_room = {
                from: user_1.id,
                to: user_2.id,
                confirm: false,
                date_created: Date.now(),
                id: 3333
            };
            db.rooms.push(n_room);
            c_container.removeClient(client_1, (err, client) => {
                assert(err == null);
                assert(client != null);
                let action = new ActionModel(socket_2.id, cmds.CANCEL_ROOM, {
                    user_id: user_2.id,
                    room_id: n_room.id
                });
                controller.setAction(action, () => {
                    assert(logger.history.length == 0);
                    let emit = socket_2.emit_history.pop();
                    assert(emit);
                    assert(emit.cmd == emits.NO_ROOM);
                    let emit_2 = socket_1.emit_history.pop();
                    assert(!emit_2);
                    assert(db.rooms.length == 0);
                    done();
                });
            });
        });

        it('Cancel and notification online users', (done) => {
            let n_room = {
                from: user_1.id,
                to: user_2.id,
                confirm: false,
                date_created: Date.now(),
                id: 3333
            };
            db.rooms.push(n_room);
            let action = new ActionModel(socket_1.id, cmds.CANCEL_ROOM, {
                user_id: user_1.id,
                room_id: n_room.id
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit_1 = socket_1.emit_history.pop();
                let emit_2 = socket_2.emit_history.pop();
                assert(emit_1);
                assert(emit_1.cmd == emits.NO_ROOM);
                assert(emit_2);
                assert(emit_2.cmd == emits.NO_ROOM);
                assert(emit_2.data.msg == messages.ROOM_WAS_CANCELED);
                assert(db.rooms.length == 0);
                done();
            });
        })

        it('User not found', (done) => {
            let n_room = {
                from: user_1.id,
                to: user_2.id,
                confirm: false,
                date_created: Date.now(),
                id: 44444
            };
            db.rooms.push(n_room);
            let action = new ActionModel(socket_1.id, cmds.CANCEL_ROOM, {
                user_id: '-1',
                room_id: n_room.id
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit);
                assert(emit.cmd == emits.ERROR);
                assert(emit.data.msg == error_messages.USER_NOT_FOUND);
                assert(db.rooms.length == 1);
                let emit_2 = socket_2.emit_history.pop();
                assert(!emit_2);
                done();
            });
        });

        it('Error room not found', (done) => {
            let n_room = {
                from: user_1.id,
                to: user_2.id,
                confirm: false,
                date_created: Date.now(),
                id: 3333
            };
            db.rooms.push(n_room);
            let action = new ActionModel(socket_1.id, cmds.CANCEL_ROOM, {
                user_id: user_1.id,
                room_id: '-1'
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit.cmd == emits.ERROR);
                assert(emit.data.msg == error_messages.ROOM_NOT_FOUND);
                let emit_2 = socket_2.emit_history.pop();
                assert(!emit_2);
                assert(db.rooms.length == 1);
                done();
            });
        });

        it('Error model', (done) => {
            let n_room = {
                from: user_1.id,
                to: user_2.id,
                confirm: false,
                date_created: Date.now(),
                id: 3333
            };
            db.rooms.push(n_room);
            let action = new ActionModel(socket_1.id, cmds.CANCEL_ROOM, {
                user_id: ''
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit.cmd == emits.ERROR);
                assert(emit.data.msg == error_messages.ERROR_MODEL);
                let emit_2 = socket_2.emit_history.pop();
                assert(!emit_2);
                assert(db.rooms.length == 1);
                done();
            });
        });
    });

    describe('Room confirm', () => {
        it('Confirm ok HAS_ROOM_1', (done) => {
            let n_room = {
                from: user_1.id,
                to: user_2.id,
                confirm: false,
                date_created: Date.now(),
                id: 3333
            };

            db.rooms.push(n_room);
            
            let action = new ActionModel(socket_2.id, cmds.CONFIRM_ROOM, {
                room_id: n_room.id,
                user_id: user_2.id
            });

            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit_from = socket_1.emit_history.pop();
                let emit_to = socket_2.emit_history.pop();
                assert(emit_from.cmd == emits.HAS_ROOM_1);
                assert(emit_to.cmd == emits.HAS_ROOM_1);
                assert(emit_from.data.room_id == n_room.id);
                assert(emit_to.data.room_id == n_room.id);
                let find = db.rooms.find(r => r.id == n_room.id);
                assert(find);
                r_container.findRoomById(find.id, (err, room) => {
                    assert(err == null);
                    assert(room != null);
                    assert(room.room.id == n_room.id);
                    done();
                });
            });
        });
        it('Not confirm from first user', (done) => {
            let n_room = {
                from: user_1.id,
                to: user_2.id,
                confirm: false,
                data_created: Date.now(),
                id: 3333
            };
            db.rooms.push(n_room);
            let action = new ActionModel(socket_1.id, cmds.CONFIRM_ROOM, {
                room_id: n_room.id,
                user_id: user_1.id
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit.cmd == emits.ERROR);
                assert(emit.data.msg == error_messages.NOT_ACCESS_FOR_CONFIRM_ROOM);
                r_container.findRoomById(n_room.id, (err, room) => {
                    assert(err == null);
                    assert(room == null);
                    done();
                });
            });
        });
        it('Confirm room result HAS_ROOM_0', (done) => {
            c_container.removeClient(client_1, (err, client) => {
                assert(err == null);
                assert(client != null);
                s_container.remove(socket_1.id, (err, s) => {
                    assert(err == null);
                    assert(s != null);
                    let n_room = {
                        from: user_1.id,
                        to: user_2.id,
                        confirm: false,
                        date_created: Date.now(),
                        id: 3333
                    };
                    db.rooms.push(n_room);
                    
                    let action = new ActionModel(socket_2.id, cmds.CONFIRM_ROOM, {
                        room_id: n_room.id,
                        user_id: user_2.id
                    });

                    controller.setAction(action, () => {
                        assert(logger.history.length == 0);
                        let emit = socket_2.emit_history.pop();
                        assert(emit);
                        assert(emit.cmd == emits.HAS_ROOM_0, 'Emit not HAS_ROOM_0: ' + emit.cmd);
                        assert(emit.data.room_id == n_room.id);
                        let find = db.rooms.find(r => r.id == n_room.id);
                        assert(find);
                        assert(socket_1.emit_history.length == 0);
                        done();
                    });
                });
            });
        });
        it('Room not found', (done) => {
            let action = new ActionModel(socket_2.id, cmds.CONFIRM_ROOM, {
                room_id: '-1',
                user_id: user_2.id
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_2.emit_history.pop();
                assert(emit.cmd == emits.ERROR);
                assert(emit.data.msg == error_messages.ROOM_NOT_FOUND);
                assert(Object.keys(r_container.rooms).length == 0);
                done();
            });
        });
        it('Error model', (done) => {
            let action = new ActionModel(socket_1.id, cmds.CONFIRM_ROOM, {
                room_id: 33333
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit.cmd == emits.ERROR);
                assert(emit.data.msg == error_messages.ERROR_MODEL);
                done();
            });
        });
    });

    describe('Create room', () => {
        it('Create OK', (done) => {
            let action = new ActionModel(socket_1.id, cmds.CREATE_ROOM, {
                from: user_1.id,
                to_phone: user_2.phone
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit_from = socket_1.emit_history.pop();
                let emit_to = socket_2.emit_history.pop();
                assert(emit_from.cmd == emits.YOUR_SENTENCE_NOT_CONFIRM);
                assert(emit_to.cmd == emits.HAS_SENTENCE);
                assert(emit_from.data.to_phone == user_2.phone);
                assert(emit_to.data.from_phone == user_1.phone);
                assert(emit_from.data.room_id);
                assert(emit_to.data.room_id);
                assert(db.rooms.length == 1);
                assert(db.rooms[0].id == emit_from.data.room_id);
                assert(db.rooms[0].id == emit_to.data.room_id);
                done();
            });
        });

        it('Current user alredy busy', (done) => {
            user_3.phone_confirm = true;
            
            let n_room = {
                from: user_1.id,
                to: user_2.id,
                confirm: false,
                date_created: Date.now(),
                id: 33333
            };
            
            db.rooms.push(n_room);

            let action = new ActionModel(socket_1.id, cmds.CREATE_ROOM, {
                from: user_1.id,
                to_phone: user_3.phone
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit);
                assert(emit.cmd == emits.ERROR,'Emit cmd not ERROR: ' + emit.cmd);
                assert(emit.data.msg == error_messages.CAN_NOT_CREATE_ROOM);
                assert(db.rooms.length == 1);
                done();
            });
        });

        it('Comapnon alredy busy', (done) => {
            user_3.phone_confirm = true;
            
            let n_room = {
                id: 3333,
                from: user_1.id,
                to: user_2.id,
                confirm: true
            };

            db.rooms.push(n_room);

            let action = new ActionModel(socket_3.id, cmds.CREATE_ROOM, {
                from: user_3.id,
                to_phone: user_2.phone
            });

            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                
                let emit = socket_3.emit_history.pop();
                assert(emit.cmd == emits.USER_BUSY,'Emit not USER_BUSY: ' + emit.cmd);
                
                assert(db.rooms.length == 1);
                
                done();
            });
        });
        
        it('Create error user not found', (done) => {
            let action = new ActionModel(socket_1.id, cmds.CREATE_ROOM, {
                from: '-1',
                to_phone: user_2.phone        
            });
            controller.setAction(action, () => {
                let emit = socket_1.emit_history.pop();
                assert(emit.cmd == emits.ERROR);
                assert(emit.data.msg == error_messages.USER_NOT_FOUND);
                assert(db.rooms.length == 0);
                done();
            })
        });

        it('Create error client not found', (done) => {
            let action = new ActionModel('-1', cmds.CREATE_ROOM, {
                from: user_1.id,
                to_phone: user_2.phone
            });
            controller.setAction(action, () => {
                let log = logger.history.pop();
                assert(log.type == 'error');
                assert(log.msg == error_messages.CLIENT_NOT_FOUND);
                assert(db.rooms.length == 0);
                done();
            });
        });

        it('Create error user not confirm phone', (done) => {
            user_3.phone_confirm = false;
            let action = new ActionModel(socket_1.id, cmds.CREATE_ROOM, {
                from: user_1.id,
                to_phone: user_3.phone
            });
            controller.setAction(action, () => {
                let log = logger.history_info.pop();
                let emit = socket_1.emit_history.pop();
                
                assert(log != null);
                assert(log.type == 'info');
                assert(log.msg == error_messages.USER_NOT_CONFIRM);
                
                assert(emit != null);
                assert(emit.cmd == emits.INFO);
                assert(emit.data.msg == error_messages.USER_NOT_CONFIRM);
                
                assert(db.rooms.length == 0);

                done();
            });
        });

        it('Not created. Companon not register', (done) => {
            let action = new ActionModel(socket_1.id, cmds.CREATE_ROOM, {
                from:user_1.id,
                to_phone: '-1'
            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit != null);
                assert(emit.cmd == emits.INFO);
                assert(emit.data.msg == error_messages.COMPANON_NOT_REGISTER);
                assert(db.rooms.length == 0);
                done();
            });
        });

        it('Error model', (done) => {
            let action = new ActionModel(socket_1.id, cmds.CREATE_ROOM, {

            });
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit != null);
                assert(emit.cmd == emits.ERROR);
                assert(emit.data.msg == error_messages.ERROR_MODEL);
                assert(db.rooms.length == 0);
                done();
            })
        });
    });

    afterEach(() =>  {
        db.users = [];
        db.rooms = [];
        db.codes = [];
        r_container.rooms = {};
        c_container.clients = {};
        s_container.sockets = [];
    })
});