class CacheService{
    constructor(io_clients_container, io_rooms_contaiener, sockets_service){
        this.ClientsContainer = io_clients_container;
        this.RoomsContainer = io_rooms_contaiener;
        this.SocketsService = sockets_service;
    }
}

module.exports = CacheService;