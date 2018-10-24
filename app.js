const server  = require('http').createServer();
const io      = require('socket.io')(server);
const configs = require('config');
const log4js  = require('log4js');
const UsersRepository = require('./repositorys/UsersRepository');
const RoomsRepository = require('./repositorys/RoomsRepository');
const CodesRepository = require('./repositorys/CodesRepository');
const SocketsContainer = require('./models/SocketsContainer');
const ClientsContainer = require('./models/IOClientsContainer');
const RoomsContainer   = require('./models/IORoomsContainer');
const IOServer = require('./servers/io.server');
const CacheService = require('./services/cache.service');
const SMSService = require('./services/sms.service');
const StartController = require('./controllers/start.controller');
const RegisterController = require('./controllers/register.controller');
const RoomConfirmController = require('./controllers/room.confirm.controller');
const PlayController = require('./controllers/play.controller');
const DisconnectController = require('./controllers/disconnect.controller');
const ControllersContainer = require('./controllers/controllers.container');
const DataBaseService = require('./services/database.service');

const logger  = log4js.getLogger();   

logger.level = configs.log_level;

const u_repository = new UsersRepository();
const r_repository = new RoomsRepository();
const c_repository = new CodesRepository();
const s_container = new SocketsContainer();
const c_container = new ClientsContainer();
const r_container = new RoomsContainer(configs);
const sms_service = new SMSService();
const cache_service = new CacheService(c_container, r_container, s_container);
const db_service = new DataBaseService(u_repository, r_repository, c_repository);
const start_controller = new StartController(cache_service, db_service, logger, configs);
const register_controller = new RegisterController(cache_service, db_service, sms_service, logger, configs);
const play_controller = new PlayController(db_service, cache_service, logger, configs);
const room_controller = new RoomConfirmController(cache_service, db_service, logger);
const disconnect_controller = new DisconnectController(cache_service, db_service, logger);
const controllers = new ControllersContainer(start_controller, register_controller, room_controller, play_controller, disconnect_controller);

let io_server = new IOServer(io, controllers, cache_service, logger, configs);

server.listen(configs.port);

io_server.start();