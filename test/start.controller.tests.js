const StartController = require('../controllers/start.controller');

const error_messages = require('../enums/error.messages');
const cmds = require('../enums/cmd.enum');
const emits = require('../enums/emits.enum');

const FakeDatabase = require('./fakes/fake.database');
const FakeCodeRepository = require('./fakes/fake.codes.repository');
const FakeUsersRepository = require('./fakes/fakes.users.repository');
const FakeRoomsRepository = require('./fakes/fake.rooms.repository');

const CacheService = require('../services/cache.service');
const DataBaseService = require('../services/database.service');

const IORoomsContainer = require('../models/IORoomsContainer');
const IOClientsContainer = require('../models/IOClientsContainer');
const SocketsContainer = require('../models/SocketsContainer');
const FakeSocket = require('./fakes/fake.socket');

const FakeLogger = require('./fakes/fake.logger');

const assert = require('assert');

const ActionModel = require('../models/action.model');

describe('Start controller', () => {
    let db = new FakeDatabase();
    let c_repository = new FakeCodeRepository(db);
    let r_repository = new FakeRoomsRepository(db);
    let u_repository = new FakeUsersRepository(db);
    let db_service = new DataBaseService(u_repository, r_repository, c_repository);

    let r_container = new IORoomsContainer();
    let c_container = new IOClientsContainer();
    let s_container = new SocketsContainer();
    let cach_service = new CacheService(c_container, r_container, s_container);

    let configs = {code_live: 0};

    let logger = new FakeLogger();

    let controller = new StartController(cach_service, db_service,logger, configs);

    let user_1 = {
        'name': 'Ivan',
        'phone': '911230',
        'phone_confirm': true
    };
    let socket_1 = new FakeSocket('1');

    let user_2 = {
        'name': 'Sveta',
        'phone': '123123',
        'phone_confirm': true
    };
    let socket_2 = new FakeSocket('2');

    let user_3 = {
        'name': 'Oleg',
        'phone': '11222',
        'phone_confirm': false
    }
    let socket_3 = new FakeSocket('3');

    let user_4 = {
        'name': 'Olesa',
        'phone': '333222',
        'phone_confirm': true
    }
    let socket_4 = new FakeSocket('4');

    let room_1 = {
        from: undefined,
        to: undefined,
        confirm: false
    };

    let code_1 = {
        code: '1111'
    };

    let code_2 = {
        code: '2222'
    };

    beforeEach((done) => {
        controller.Configs = configs;
        u_repository.saveUser(user_1, (err, u1) => {
            assert(err == null);
            assert(db.users.length == 1);
            user_1 = u1;
            u_repository.saveUser(user_2, (err, u2) => {
                assert(err == null);
                assert(db.users.length == 2);
                user_2 = u2;
                u_repository.saveUser(user_3, (err, u3) => {
                    assert(err == null);
                    assert(db.users.length == 3);
                    user_3 = u3;
                    u_repository.saveUser(user_4, (err, u4) => {
                        assert(err == null);
                        assert(db.users.length == 4);
                        user_4 = u4;
                        code_1.user_id = user_3.id;
                        code_2.user_id = user_4.id;
                        c_repository.saveCode(code_1, (err, c1) => {
                            assert(err == null);
                            assert(db.codes.length == 1);
                            code_1 = c1;
                            c_repository.saveCode(code_2, (err, c2) => {
                                assert(err == null);
                                assert(db.codes.length == 2);
                                code_2 = c2;
                                room_1.from = user_1.id;
                                room_1.to = user_2.id;
                                r_repository.saveRoom(room_1, (err, room) => {
                                    assert(err == null, 'Error != null: ' + err);
                                    assert(room != null);
                                    assert(db.rooms.length == 1);
                                    room_1 = room;
                                    s_container.push(socket_1, (err, s1) => {
                                        assert(err == null);
                                        assert(s_container.sockets.length == 1);
                                        s_container.push(socket_2, (err, s2) => {
                                            assert(err == null);
                                            assert(s_container.sockets.length == 2);
                                            s_container.push(socket_3, (err, s3) => {
                                                assert(err == null);
                                                assert(s_container.sockets.length == 3);
                                                s_container.push(socket_4, (err, s4) => {
                                                    assert(err == null);
                                                    assert(s_container.sockets.length == 4);
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
        });
    });

    it('Return no room to user', (done) => {
        let action = new ActionModel(socket_4.id, 
                                     cmds.START, 
                                     { user_id: user_4.id,
                                       phone: user_4.phone});

        controller.setAction(action, () => {
            let emit = socket_4.emit_history.pop();
            let client = c_container.clients[socket_4.id];
            assert(logger.history.length == 0);
            assert(emit.cmd == emits.NO_ROOM);
            assert(emit.data == null);
            assert(c_container.clients[socket_4.id] != null);
            assert(client.user.id == user_4.id, client);
            assert(client.user.name == user_4.name);
            done();
        });
    });

    it('Not confirm phone', (done) => {
        let action = new ActionModel(socket_3.id,
                                     cmds.START,
                                     {user_id: user_3.id,
                                      phone: user_3.phone});
        
        controller.setAction(action, () => {
            let emit = socket_3.emit_history.pop();
            assert(logger.history.length == 0);
            assert(emit.cmd == emits.PHONE_UNCONFIRMED, 'EMIT ERROR ' + emit.cmd);
            done();
        });
    });

    it('Old code, user unregistrate', (done) => {
        let action = new ActionModel(socket_3.id,
                                     cmds.START,
                                     {user_id: user_3.id,
                                      phone: user_3.phone});
        
        controller.Configs = {code_live: 15};
        
        controller.setAction(action, () => {
            let emit = socket_3.emit_history.pop();
            assert(logger.history.length == 0);
            assert(emit.cmd == emits.USER_UNREGISTRATE);
            assert(db.users.length == 3);
            done();
        });
    });


    it('Current user sent sentence', (done) => {
        let action = new ActionModel(socket_1.id, cmds.START, {user_id: user_1.id, phone: user_1.phone});
        controller.setAction(action, () => {
            let emit = socket_1.emit_history.pop();
            assert(logger.history.length == 0);
            assert(emit.cmd == emits.YOUR_SENTENCE_NOT_CONFIRM);
            done();
        });
    });

    it('Current user has sentence', (done) => {
        let action = new ActionModel(socket_2.id, cmds.START, {user_id: user_2.id, phone: user_2.phone});
        controller.setAction(action, () => {
            let emit = socket_2.emit_history.pop();
            assert(logger.history.length == 0);
            assert(emit.cmd == emits.HASE_SENTENCE);
            done();
        });
    });

    it('Room created by second client not connected', (done) => {
        let action = new ActionModel(socket_1.id, cmds.START, {user_id: user_1.id, phone: user_1.phone});
        db.rooms[0].confirm = true;
        controller.setAction(action, () => {
            let emit = socket_1.emit_history.pop();
            assert(logger.history.length == 0);
            assert(emit.cmd == emits.HAS_ROOM_0);
            done();
        });
    });

    it('Room created and second client connected', (done) => {
        let action = new ActionModel(socket_1.id, cmds.START, {user_id: user_1.id, phone: user_1.phone});
        db.rooms[0].confirm = true;
        controller.setAction(action, () => {
            let emit = socket_1.emit_history.pop();
            assert(logger.history.length == 0);
            assert(emit.cmd == emits.HAS_ROOM_0);
            let action_2 = new ActionModel(socket_2.id, cmds.START, {user_id: user_2.id, phone: user_2.phone});
            controller.setAction(action_2, () => {
                let emit_2 = socket_2.emit_history.pop();
                assert(logger.history.length == 0);
                assert(emit_2.cmd == emits.HAS_ROOM_1);
                done();
            });
        })
    });

    describe('Error logs', () => {
        it('Socket not found', (done) => {
            let action = new ActionModel('-1', cmds.START, {user_id: user_1.id, phone: user_1.phone});
            controller.setAction(action, () => {
                assert(logger.history.length != 0);
                done();
            });
        });
        it('User not found', (done) => {
            let action = new ActionModel(socket_1.id, cmds.START, {user_id: '-1', phone: user_1.phone});
            controller.setAction(action, () => {
                assert(logger.history.length != 0);
                assert(logger.history[0].msg == error_messages.USER_NOT_FOUND, logger.history[0]);
                done();
            });
        });
        it('Not set exists client', (done) => {
            let action = new ActionModel(socket_1.id, cmds.START, {user_id: user_1.id, phone: user_1.phone});
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let action_2 = new ActionModel(socket_1.id, cmds.START, {user_id: user_2.id, phone: user_2.phone});
                controller.setAction(action_2, () => {
                    assert(logger.history.length != 0);
                    let user = c_container.clients[socket_1.id].user;
                    assert(user.id == user_1.id);
                    done();
                });
            });
        });
        it('Code not found', (done) => {
            db.codes = [];
            let action = new ActionModel(socket_3.id, cmds.START, {user_id: user_3.id, phone: user_3.phone});
            controller.setAction(action, () => {
                assert(logger.history.length != 0);
                assert(logger.history[0].msg == error_messages.CODE_NOT_FOUND);
                done();
            });
        });
    });

    afterEach((done) => {
        db.rooms = [];
        db.codes = [];
        db.users = [];
        logger.history = [];
        s_container.sockets = [];
        c_container.clients = {};
        r_container.rooms = {};
        done();
    })
})