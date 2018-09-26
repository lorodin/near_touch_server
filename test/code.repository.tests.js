const CodesRepository = require('../repositorys/CodesRepository');
const UsersRepository = require('../repositorys/UsersRepository');
const assert = require('assert');
const error_messages = require('../enums/error.messages');

describe('Tests codes repository', () => {
    let u_repository = new UsersRepository();
    let c_repository = new CodesRepository();

    let user = {
        name: 'Vasy',
        phone: '12344444'
    };
    
    let code = {};

    // Создание пользователя для тестов
    beforeEach((done) => {
        u_repository.saveUser(user, (err, u) => {
            assert(err == null);
            assert(u != null);
            user = u;
            code.code = '555';
            code.user_id = user.id;
            c_repository.saveCode(code, (err, c) => {
                assert(err == null);
                assert(c != null);
                code = c;
                done();
            });
        });
    });

    // Поиск кода по номеру телефона пользователя
    it('Find code by user phone number', (done) => {
        c_repository.findCodeByPhone(user.phone, (err, c) => {
            assert(err == null);
            assert(c != null, 'Not found code for user phone: ' + user.phone);
            assert(c.code == code.code);
            assert(c.user_id == code.user_id);
            let code_created = new Date(code.date_created);
            let c_created = new Date(c.date_created);
            assert(c_created.getDate() == code_created.getDate());
            done();
        });
    });

    // Поиск кода по id пользователя
    it('Find code by user id', (done) => {
        c_repository.findCodeByUserId(user.id, (err, c) => {
            assert(err == null);
            assert(c != null);
            assert(c.code == code.code);
            assert(c.date_created.getDate() == code.date_created.getDate());
            done();
        })
    })

    // Удаление кода
    it('Remove code', (done) => {
        c_repository.removeCode(code, (err, c)=>{
            assert(err == null);
            c_repository.findCodeByPhone(user.phone, (err, c) => {
                assert(err == null);
                assert(c == null);
                done();
            });
        });
    });

    // Проверка обновления кода
    it('Update old code', (done) => {
        code.code = '666';
        c_repository.saveCode(code, (err, c) => {
            assert(err == null, err);
            assert(c.code == '666');
            assert(c.user_id == code.user_id);
            done();
        });
    });

    // Запрет на запись не корректной модели в базу
    it('Not access created incorrect code', (done) => {
        let incorrect_code = {};
        c_repository.saveCode(incorrect_code, (err, c) => {
            assert(err == error_messages.ERROR_MODEL);
            assert(c == null);
            done();
        });
    });

    // Пользователь с номером телефона не найден
    it('User not found', (done) => {
        c_repository.findCodeByPhone('error_phone', (err, c) => {
            assert(err == error_messages.USER_NOT_FOUND);
            assert(c == null);
            done();
        })
    });

    // Удаление пользователя для тестов
    afterEach((done) => {
        c_repository.removeCode(code, (err, c) => {
            assert(err == null);
            u_repository.removeUserById(user.id, (err, u) => {
                assert(err == null);
                done();
            });
        })
    });
});