const RegisterController = require('../controllers/register.controller');
const assert = require('assert');
const FakeDataBase = require('./fakes/fake.database');
const FakeSocket = require('./fakes/fake.socket');
const FakeLogger = require('./fakes/fake.logger');
const FakeUsersRepository = require('./fakes/fakes.users.repository');
const FakeRoomsRepository = require('./fakes/fake.rooms.repository');
const FakeCodesRepository = require('./fakes/fake.codes.repository');
const error_messages = require('../enums/error.messages');
const emits = require('../enums/emits.enum');
const cmds = require('../enums/cmd.enum');
const IORoomsContainer = require('../models/IORoomsContainer');
const IOClientsContainer = require('../models/IOClientsContainer');
const SocketsContainer = require('../models/SocketsContainer');
const DataBaseService = require('../services/database.service');
const CacheService = require('../services/cache.service');
const FakeSmsService = require('./fakes/fake.sms.service');
const ActionModel = require('../models/action.model');

describe('Test register controller', () => {
    const logger = new FakeLogger();
    
    const db = new FakeDataBase();
    const u_repository = new FakeUsersRepository(db);
    const c_repository = new FakeCodesRepository(db);
    const r_repository = new FakeRoomsRepository(db);
    const database_service = new DataBaseService(u_repository, r_repository, c_repository);

    const r_container = new IORoomsContainer();
    const c_container = new IOClientsContainer();
    const s_container = new SocketsContainer();
    const cache_service = new CacheService(c_container, r_container, s_container);

    const sms_service = new FakeSmsService();

    const configs = {phone_confirm_length: 5};

    const controller = new RegisterController(cache_service, database_service, sms_service, logger, configs);
    
    let user_not_registrate = {
        name: 'Igor',
        phone: '1111'
    };

    let registrate_user = {
        name: 'Vasy',
        phone: '1111',
        phone_confirm: true
    };

    let user_not_confirm = {
        name: 'Alisa',
        phone: '2222'
    };

    let socket_1 = new FakeSocket('1');
    let socket_2 = new FakeSocket('2');
    let socket_3 = new FakeSocket('3');
    
    beforeEach((done) => {
        s_container.push(socket_1, (err, s1) => {
            assert(err == null, 'Error not null: ' + err);
            socket_1 = s1;
            s_container.push(socket_2, (err, s2) => {
                assert(err == null);
                socket_2 = s2;
                s_container.push(socket_3, (err, s3) => {
                    assert(err == null);
                    socket_3 = s3;
                    u_repository.saveUser(registrate_user, (err, user) => {
                        assert(err == null);
                        assert(db.users.length == 1);
                        registrate_user = user;
                        done();
                    })
                });
            });
        });
    });


    describe('Confirm action cmd', () => {
        it('Confirm code and remove old user with this phone', (done) => { 
            u_repository.saveUser(user_not_registrate, (err, user) => {
                assert(err == null);
                c_repository.saveCode({user_id: user.id, code: '1111'}, (err, code) => {
                    let action = new ActionModel(socket_2.id, cmds.VALIDATE_CODE, {
                        user_id: user.id,
                        phone:user.phone,
                        code: '1111'
                    });
                    let codes_length = db.codes.length;
                    let users_length = db.users.length;
                    controller.setAction(action, () => {
                        assert(logger.history.length == 0);
                        let emit = socket_2.emit_history.pop();
                        assert(emit.cmd == emits.NO_ROOM, 'Emit not NO_ROOM: ' + emit.cmd);
                        assert(codes_length == db.codes.length + 1, 'Codes length not correct ' + codes_length + ' ' + db.codes.length);
                        assert(users_length == db.users.length + 1);
                        u_repository.findUserById(user.id, (err, c_user) => {
                            assert(err == null);
                            assert(c_user != null);
                            assert(c_user.name == user_not_registrate.name);
                            assert(c_user.phone == user_not_registrate.phone);
                            done();
                        });
                    });
                });
            }); 
        });
        describe('Controller errors', () => {
            it('Error model', (done) => {
                let action = new ActionModel(socket_1.id, cmds.VALIDATE_CODE, {

                });
                controller.setAction(action, () => {
                    let emit = socket_1.emit_history.pop();
                    assert(emit != null);
                    assert(emit.cmd == emits.ERROR);
                    assert(emit.data.msg == error_messages.ERROR_MODEL);
                    done();
                });
            });
            it('Code not found', (done) => {
                u_repository.saveUser(user_not_registrate, (err, user) => {
                    assert(err == null);
                    assert(user != null);
                    let action = new ActionModel(socket_2.id, cmds.VALIDATE_CODE, {
                        user_id: user.id,
                        phone: user.phone,
                        code: '-1'
                    });
                    controller.setAction(action, () => {
                        let emit = socket_2.emit_history.pop();
                        assert(emit != null);
                        assert(emit.cmd == emits.ERROR);
                        assert(emit.data.msg == error_messages.CODE_NOT_FOUND);
                        done();
                    });
                });
            });
            it('Code not valid', (done) => {
                u_repository.saveUser(user_not_registrate, (err, user) => {
                    assert(err == null);
                    assert(user != null);
                    c_repository.saveCode({
                        user_id: user.id,
                        code: '1111'
                    }, (err, code) => {
                        assert(err == null);
                        assert(code != null);
                        let action = new ActionModel(socket_2.id, cmds.VALIDATE_CODE, {
                            user_id: user.id,
                            phone: user.phone,
                            code: '2222'
                        });
                        controller.setAction(action, () => {
                            let emit = socket_2.emit_history.pop();
                            assert(emit != null);
                            assert(emit.cmd == emits.ERROR);
                            assert(emit.data.msg == error_messages.CODE_NOT_VALID);
                            done();
                        });
                    });
                })
            });
            it('Users not found', (done) => {
                u_repository.saveUser(user_not_registrate, (err, user) => {
                    assert(err == null);
                    assert(user != null);
                    c_repository.saveCode({
                        user_id: user.id,
                        code: '1111'
                    }, (err, code)=>{
                        assert(err == null);
                        assert(code != null);
                        let action = new ActionModel(socket_2.id, cmds.VALIDATE_CODE, {
                            user_id: user.id,
                            phone: '-1',
                            code: code.code
                        });
                        controller.setAction(action, () => {
                            let emit = socket_2.emit_history.pop();
                            assert(emit.cmd == emits.ERROR);
                            assert(emit.data.msg == error_messages.USER_NOT_FOUND);
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('Registrate action cmd', () => {
        it('Register new user', (done) => {
            let action = new ActionModel(socket_1.id, cmds.REGISTER, {
                name: user_not_registrate.name,
                phone: user_not_registrate.phone
            });
            let old_users_length = db.users.length;
            controller.setAction(action, () => {
                s_container.get(socket_1.id, (err, s) => {
                    assert(err == null, 'Err not null: ' + err);
                    let emit = s.emit_history[0];// TODO: Пределать 
                    assert(logger.history.length == 0, 'History not empty: ' + logger.msgToString(0));
                    assert(emit.cmd == emits.PHONE_UNCONFIRMED, 'CMD Not Phone_unconfirmed' + emit.cmd);
                    assert(emit.data.data.name == user_not_registrate.name, 'Names not equals: ' + emit.data.data.name + ' ' + user_not_registrate.name);
                    assert(emit.data.data.phone == user_not_registrate.phone, 'Phones not equals: ' + emit.data.data.phone + ' ' + user_not_registrate.phone);
                    assert(emit.data.data.id);
                    assert(old_users_length + 1 == db.users.length);
                    done();
                });
            });
        });
        it('Register user with exists phone', (done) => {
            let action = new ActionModel(socket_1.id, cmds.REGISTER, {
                name: user_not_registrate.name,
                phone: user_not_registrate.phone
            });
            let old_users_length = db.users.length;
            controller.setAction(action, () => { 
                assert(logger.history.length == 0);
                s_container.get(socket_1.id, (err, s) => {
                    assert(err == null);
                    let emit = s.emit_history[0];// TODO: Пределать 
                    let user = emit.data.data;
                    assert(old_users_length + 1 == db.users.length, 'Old users length not equal new users length');
                    assert(user.phone == user_not_registrate.phone);
                    assert(user.phone == registrate_user.phone);
                    done();
                });
            });
        });
        it('Not registrate incorrect model', (done) => {
            let action = new ActionModel(socket_1.id, cmds.REGISTER, {
                name: ''
            });
            let old_users_length = db.users.length;
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                s_container.get(socket_1.id, (err, s) => {
                    assert(err == null);
                    let emit = s.emit_history[0];// TODO: Пределать 
                    assert(emit.cmd == emits.ERROR, 'CMD NOT ERROR ' + emit.cmd + '');
                    assert(emit.data.msg == error_messages.ERROR_MODEL);
                    assert(old_users_length == db.users.length);
                    done();    
                });
            });
        });
    });

    describe('Send code', () => {
        it('Generate and send code', (done) => {
            let action = new ActionModel(socket_2.id, cmds.REGISTER, user_not_registrate);
            let users_db_length = db.users.length;
            let codes_db_length = db.codes.length;
            controller.setAction(action, () => {
                s_container.get(socket_2.id, (err, s) => {
                    assert(err == null);
                    assert(s != null);
                    assert(logger.history.length == 0);
                    let emit = s.emit_history.pop();
                    assert(emit.cmd == emits.PHONE_UNCONFIRMED);
                    assert(users_db_length == db.users.length - 1);
                    user_not_registrate = db.users.find(u => u.name == user_not_registrate.name && 
                                                             u.phone == user_not_registrate.phone);
                    let action_2 = new ActionModel(socket_2.id, cmds.GET_CODE, {
                        user_id: user_not_registrate.id,
                        phone: user_not_registrate.phone,
                        name: user_not_registrate.name
                    });
                    controller.setAction(action_2, () => {
                        let emit = s.emit_history.pop();
                        assert(logger.history.length == 0, 'Logger not empty');
                        assert(emit.cmd == emits.INPUT_PHONE_CONFIRM_CODE, 'Emit not correct: ' + emit.cmd);
                        assert(db.codes.length == codes_db_length + 1);
                        assert(sms_service.msgs.length == 1);
                        let sms = sms_service.msgs.pop();
                        assert(sms.phone == user_not_registrate.phone);
                        done();
                    });
                });
            });
        });
        it('Error user not registrate', (done) => {
            let action = new ActionModel(socket_2.id, cmds.GET_CODE, {
                user_id: '-1',
                phone: user_not_registrate.phone,
                name: user_not_registrate.phone
            });
            let users_db_length = db.users.length;
            let codes_db_length = db.codes.length;
            controller.setAction(action, () => {
                assert(users_db_length == db.users.length);
                assert(codes_db_length == db.codes.length);
                s_container.get(socket_2.id, (err, s) => {
                    assert(err == null);
                    let emit = s.emit_history.pop();
                    assert(emit.cmd == emits.UNREGISTRATE);
                    assert(emit.data.msg == error_messages.USER_NOT_FOUND);
                    done();
                })
            });
        });
        it('Error model', (done) => {
            let action = new ActionModel(socket_2.id, cmds.GET_CODE, {
                user_id: ''
            });
            let users_db_length = db.users.length;
            let codes_db_length = db.codes.length;
            controller.setAction(action, () => {
                assert(users_db_length == db.users.length);
                assert(codes_db_length == db.codes.length);

                s_container.get(socket_2.id, (err, s) => {
                    let emit = s.emit_history.pop();
                    assert(emit.cmd == emits.ERROR);
                    assert(emit.data.msg == error_messages.ERROR_MODEL);
                    done();
                });
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
        socket_1.emit_history = [];
        socket_2.emit_history = [];
        socket_3.emit_history = [];
        done();
    });
});
