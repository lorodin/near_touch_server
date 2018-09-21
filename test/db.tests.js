const db     = require('../models/db.models');
const assert = require('assert');

// Тестирование создания и удаления записей из базы данных
describe('Test database models', () => {
    let created_user_1 = new db.User();
    let created_user_2 = new db.User();
    let created_code = new db.Code();
    let created_room = new db.Room();

    created_user_1.name = 'Vasy';
    created_user_1.phone = '123';

    created_user_2.name = 'Igor';
    created_user_2.phone = '321';

    created_code.code = '1111';

    // Создание первого пользователя
    it('Test add first user', (done) => {
       
        created_user_1.save((err, user)=>{
            assert(user.name  == created_user_1.name);
            assert(user.phone == created_user_1.phone);
            created_user_1 = user;
            done();    
        });
    });

    // Создание второго пользователя
    it('Test add second user', (done) => {
        created_user_2.save((err, user) => {
            assert(user.name == created_user_2.name);
            assert(user.phone == created_user_2.phone);
            created_user_2 = user;
            done();
        });
    });

    // Создание кода для первого пользователя
    it('Test create code', (done) => {
        created_code.user_id = created_user_1.id;
        created_code.save((err, code) => {
            assert(code.user_id == created_user_1.id);
            assert(created_code.code == code.code);
            created_code = code;
            done();
        })
    });

    // Создание комнаты от первого пользователя второму
    it('Test created room', (done) => {
        created_room.from = created_user_1.id;
        created_room.to   = created_user_2.id;
        created_room.save((err, room) => {
            assert(room.from == created_user_1.id);
            assert(room.to == created_user_2.id);
            assert(!room.confirm);
            done();
        });
    });

    // Удаляем все записи из базы, созданные для тестирования
    afterEach((done)=>{
        db.Room.findByIdAndDelete(created_room.id, (r_err, room) => {
            assert(r_err == undefined);
            db.Code.findByIdAndDelete(created_code.id, (c_err, code) => {
                assert(c_err == undefined);
                db.User.findByIdAndDelete(created_user_1.id, (err1, user1) => {
                    assert(err1 == undefined);
                    db.User.findByIdAndDelete(created_user_2.id, (err2, user2) => {
                        assert(err2 == undefined);
                        done();
                    });
                });
            })  
        })
    })
})