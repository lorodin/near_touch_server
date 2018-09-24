class CacheService{
    constructor(io_clients_container, io_rooms_contaiener){
        this.ClientsContainer = io_clients_container;
        this.RoomsContainer = io_rooms_contaiener;
    }
}

module.exports = CacheService;