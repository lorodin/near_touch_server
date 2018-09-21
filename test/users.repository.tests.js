const UsersRepository = require('../repositorys/UsersRepository');
const assert          = require('assert');
const error_messages  = require('../enums/error.messages');

describe('Test users repository', () => {
    let user_1 = {
        name: 'Vasy',
        phone: '123'
    };

    let user_2 = {
        name: 'Igor',
        phone: '321'
    };

    let incorrect_user = {};

    let exists_phone_user = {
        name: 'Larisa',
        phone: '123'
    };

    let repository = new UsersRepository();

    // Создание двух пользователй
    beforeEach((done)=>{
        repository.saveUser(user_1, (err, user1)=> {
            assert(err == undefined);
            user_1 = user1;
            repository.saveUser(user_2, (err, user2) => {
                assert(err == undefined);
                user_2 = user2;
                done();
            })
        })
    });

    // Не сохранять пользователя с некорректными полями
    it('Not save incorrect user', (done) => {
        repository.saveUser(incorrect_user, (err, user) => {
            assert(err == error_messages.ERROR_MODEL);
            assert(user == undefined);
            done();
        })
    });

    // Не сохранять пользователя с уже существующим номером телефона
    it('Not save alredy exists phone', (done) => {
        repository.saveUser(exists_phone_user, (err, user) => {
            assert(err == error_messages.PHONE_REGISTRATE);
            assert(user == undefined);
            done();
        })
    });

    // Поиск пользователя по id
    it('Find user by id', (done) => {
        repository.findUserById(user_1.id, (err, user) => {
            assert(err == null);
            assert(user.name == user_1.name);
            assert(user.phone == user_1.phone);
            assert(user.id == user_1.id);
            assert(user.phone_confirm == user_1.phone_confirm);
            done();
        });
    });

    // Поиск пользователя по номеру телефона
    it('Find user by phone', (done) => {
        repository.findUserByPhone(user_1.phone, (err, user) => {
            assert(err == null);
            assert(user.phone == user_1.phone);
            assert(user.name == user_1.name);
            assert(user.id == user_1.id);
            assert(user.phone_confirm == user_1.phone_confirm);
            done();
        });
    });

    // Обновление данных пользователя
    it('Test update user', (done) => {
        user_1.phone = '333';
        user_1.name = 'Oleg';
        user_1.phone_confirm = true;
        repository.saveUser(user_1, (err, u) => {
            assert(err == null);
            repository.findUserById(user_1.id, (err, u1) => {
                assert(err == null);
                assert(u1.id == user_1.id);
                assert(u1.name == 'Oleg');
                assert(u1.phone == '333');
                assert(u1.phone_confirm);
                done();
            });
        });
    })


    // Поиск пользователя по новому номеру телефона
    it('Test find user by new phone number', (done) => {
        repository.findUserByPhone(user_1.phone, (err, u) => {
            assert(err == null);
            assert(u.id == user_1.id);
            assert(u.name == user_1.name);
            assert(u.phone == user_1.phone);
            assert(u.phone != user_2.phone);
            assert(u.phone_confirm == user_1.phone_confirm);
            done();
        })
    })
    

    // Удаление пользователя по id
    it('Remove user by id', (done) => {
        repository.removeUserById(user_1.id, (err, user) => {
            assert(err == null);
            assert(user.name == user_1.name);
            done();
        });
    });

    // Удаление пользователя по номеру телефона
    it('Remove user by phone', (done) => {
        repository.removeUserByPhone(user_2.phone, (err, user) => {
            assert(err == null);
            assert(user.name == user_2.name);
            done();
        })
    });

    // Если что-то пошло не так, то на всякий случай удаляем всех пользователей
    afterEach((done) => {
        repository.removeUserById(user_1.id, (err, u1) => {
            assert(err == undefined);
            repository.removeUserById(user_2.id, (err, u2) => {
                assert(err == undefined);
                done();
            })
        });
    })
});
