class DataBaseService{
    constructor(users_repository, rooms_repository, codes_repository){
        this.UsersRepository = users_repository;
        this.RoomsRepository = rooms_repository;
        this.CodesRepository = codes_repository;
    }
}

module.exports = DataBaseService;
