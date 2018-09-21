const error_messages  = require('../enums/error.messages');
const RoomsRepository = require('../repositorys/RoomsRepository');
const UsersRepository = require('../repositorys/UsersRepository');
const assert = require('assert');

describe('Test rooms repository', () => {
    let r_repository = new RoomsRepository();
    let u_repository = new UsersRepository();

    let room = {
        from: undefined,
        to: undefined
    };

    let room_for_delete_test = {
        from: undefined,
        to: undefined
    };

    let user_1 = {
        name: 'Vasy',
        phone: '123'
    };

    let user_2 = {
        name: 'Victor',
        phone: '333'
    };

    let incorrect_room = {
        'any_prop': 'any_val'
    };

    let user_3 = {
        name: 'Liza',
        phone: '888'
    };

    let user_4 = {
        name: 'Larisa',
        phone: '999'
    };

    // Заполняем базу начальными значениями
    beforeEach((done) => {
        u_repository.saveUser(user_1, (err, user1) => {
            assert(err == null);
            assert(user1 != null);
            user_1 = user1;
            u_repository.saveUser(user_2, (err, user2) => {
                assert(err == null);
                assert(user2 != null);
                user_2 = user2;
                room.from = user_1.id;
                room.to = user_2.id;
                r_repository.saveRoom(room, (err, r) => {
                    assert(err == null);
                    assert(r != null);
                    room = r;
                    
                    u_repository.saveUser(user_3, (err, user3) => {
                        assert(err == null);
                        assert(user3 != null);
                        user_3 = user3;
                        u_repository.saveUser(user_4, (err, user4) => {
                            assert(err == null);
                            assert(user4 != null);
                            user_4 = user4;
                            room_for_delete_test.from = user_3.id;
                            room_for_delete_test.to = user_4.id;
                            r_repository.saveRoom(room_for_delete_test, (err, r2) => {
                                assert(err == null);
                                assert(r2 != null);
                                room_for_delete_test = r2;
                                done();
                            })
                        })
                    });
                })
            })
        })
    });

    // Ищим комнату по Id
    it('Find room by id', (done) => {
        r_repository.findRoomById(room.id, (err, r) => {
            assert(err == null);
            
            let room_date = new Date(room.date_created);
            let r_date = new Date(r.date_created);

            assert(r_date.getDate() == room_date.getDate(), 'Error "DATE CREATED"');
            assert(room.from == r.from, 'Error "FROM"');
            assert(room.to == r.to, 'Error "TO"');
            assert(r.confirm == room.confirm, 'Error "CONFIRM"');
            assert(r.points == room.points, 'Error "POINTS" ' + room.points + " " + r.points);

            done();
        })
    });

    // Ищим по id первого пользователя
    it('Find room by id from', (done) => {
        r_repository.findRoomByUserId(user_1.id, (err, r) => {
            assert(err == null);

            let room_date = new Date(room.date_created);
            let r_date = new Date(r.date_created);

            assert(room.id == r.id, 'Error "ID"');
            assert(room.from == r.from, 'Error "FROM"');
            assert(room.to == r.to, 'Error "TO"');
            assert(room.points == r.points, 'Error "POINTS" ' + room.points + " " + r.points);
            assert(room.confirm == r.confirm, 'Error "CONFIRM"');
            assert(room_date.getDate() == r_date.getDate(), 'Error "DATE CREATED"');

            done();
        });
    });

    // Ищим по id второго пользователя
    it('Find room by id to', (done) => {
        r_repository.findRoomByUserId(user_2.id, (err, r) => {
            assert(err == null);

            let room_date = new Date(room.date_created);
            let r_date = new Date(r.date_created);

            assert(room.id == r.id, 'Error "ID"');
            assert(room.from == r.from, 'Error "FROM"');
            assert(room.to == r.to, 'Error "TO"');
            assert(room.points == r.points, 'Error "POINTS" ' + room.points + " " + r.points);
            assert(room.confirm == r.confirm, 'Error "CONFIRM"');
            assert(room_date.getDate() == r_date.getDate(), 'Error "DATE CREATED"');

            done();
        });
    });

    // Обновление комнаты
    it('Update room', (done) => {
        room.points = 100;
        room.confirm = true;

        r_repository.saveRoom(room, (err, r1) => {
            assert(err == null);
            r_repository.findRoomById(room.id, (err, r2) => {
                assert(err == null, 'Error from callback');

                assert(r2.id == room.id, 'Error "ID"');
                assert(r2.points == 100, 'Error "POINTS" ' + r2.points + " 100");
                assert(r2.confirm, 'Error "CONFIRM"');

                done();
            })
        });
    });

    // Запрет на сохранение не корректной комнаты
    it('Not save incorrect room', (done) => {
        r_repository.saveRoom(incorrect_room, (err, r) => {
            assert(err == error_messages.ERROR_MODEL);
            assert(r == null);
            done();
        });
    });

    // Проверка на запрет создания новой комнаты с уже занятым пользователем
    it('Not access create room with busy user', (done) => {
        let error_room = {
            from: user_1.id,
            to:user_2.id
        };
        r_repository.saveRoom(error_room, (err, r) => {
            assert(err == error_messages.USER_HAS_ROOM);
            assert(r == null);
            done();
        });
    });

    // Удаление комнаты по ID пользователя
    it('Remove room by user Id', (done) => {
        r_repository.removeRoomByUserId(user_3.id, (err, r) => {
            assert(err == null);
            r_repository.findRoomByUserId(user_3.id, (err, r2) => {
                assert(err == null);
                assert(r2 == null);

                done();
            })
        });
    })

    // Удаление всех временных данных
    afterEach((done) => {
        r_repository.removeRoomById(room.id, (err, r) => {
            assert(err == null);
            u_repository.removeUserById(user_1.id, (err, u1) => {
                assert(err == null);
                u_repository.removeUserById(user_2.id, (err, u2) => {
                    assert(err == null);
                    r_repository.removeRoomById(room_for_delete_test.id, (err, r) => {
                        assert(err == null);
                        u_repository.removeUserById(user_3.id, (err, u3) => {
                            assert(err == null);
                            u_repository.removeUserById(user_4.id, (err, u4) => {
                                assert(err == null);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
})