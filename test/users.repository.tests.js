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

    let user_3 = {
        name: 'Larisa',
        phone: '123'
    };

    let incorrect_user = {};

    let exists_phone_user = {
        name: 'Larisa',
        phone: '321'
    };

    let repository = new UsersRepository();

    // Создание трех пользоватлей пользователй
    beforeEach((done)=>{
        repository.saveUser(user_1, (err, user1)=> {
            assert(err == undefined);
            user_1 = user1;
            repository.saveUser(user_2, (err, user2) => {
                assert(err == undefined);
                user_2 = user2;
                repository.saveUser(user_3, (err, user3) => {
                    assert(err == null);
                    user_3 = user3;
                    done();
                });
            })
        })
    });

    it('Find many users by phone', (done) => {
        repository.findManyByPhone(user_1.phone, (err, users) => {
            assert(err == null);
            assert(users.length == 2);
            let find_1 = users.find(u => u.id == user_1.id);
            let find_2 = users.find(u => u.id == user_3.id);
            
            assert(find_1.id == user_1.id);
            assert(find_1.name == user_1.name);
            assert(find_1.phone == user_1.phone);
            assert(find_1.phone_confirm == user_1.phone_confirm);

            assert(find_2.id == user_3.id);
            assert(find_2.name == user_3.name);
            assert(find_2.phone == user_3.phone);
            assert(find_2.phone_confirm == user_3.phone_confirm);

            done();
        })
    })

    // Не сохранять пользователя с некорректными полями
    it('Not save incorrect user', (done) => {
        repository.saveUser(incorrect_user, (err, user) => {
            assert(err == error_messages.ERROR_MODEL);
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

    it('Find many and remove by ids', (done) => {
        repository.count((err, count) => {
            let users_length = count;
            assert(err == null);
            repository.findManyAndRemove([user_1.id, user_2.id, user_3.id], (err, result) => {
                assert(err == null);
                repository.count((err, count_2) => {
                    assert(err == null);
                    assert(users_length == count_2  + 3);
                    assert(result.n == 3);
                    assert(result.ok == 1);
                    done();
                })
            });
        });
    })

    // Если что-то пошло не так, то на всякий случай удаляем всех пользователей
    afterEach((done) => {
        repository.removeUserById(user_1.id, (err, u1) => {
            assert(err == undefined);
            repository.removeUserById(user_2.id, (err, u2) => {
                assert(err == undefined);
                repository.removeUserById(user_3.id, (err, u3) => {
                    assert(err == null);
                    done();
                });
            })
        });
    })
});
