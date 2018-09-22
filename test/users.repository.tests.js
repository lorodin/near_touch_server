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
        phone: '321'
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

    // Сохранение пользователя с номер телефона, который уже есть в базе и удаление старого
    // пользователя с этим номером телефона
    it('Save alredy exists phone and remove old user with this phone', (done) => {
        repository.saveUser(exists_phone_user, (err, user) => {
            assert(err == null, "Error not null 1");
            
            assert(user.name == exists_phone_user.name, "Error name: user.name=" + user.name +
                                                        "; exists_phone_user.name=" + exists_phone_user.name);
            assert(user.phone == exists_phone_user.phone, "Error phone: user.phone=" + user.phone + 
                                                          " exists_phone_user.phone=" + user.phone);
            exists_phone_user = user;
            
            repository.findUserByPhone(exists_phone_user.phone, (err, u) => {
                assert(err == null, "Error not null 2");
                
                assert(u.name == exists_phone_user.name, "Error name 2: u.name=" + u.name +
                                                         " exists_phone_user.name=" + exists_phone_user.name);
                assert(u.id == exists_phone_user.id, "Error id 2: " + u.id +
                                                     " exists_phone_user.id=" + exists_phone_user.id);

                repository.removeUserById(exists_phone_user.id, (err, u) => {
                    done();
                });
            });
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
