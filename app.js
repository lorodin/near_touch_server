const server  = require('http').createServer();
const io      = require('socket.io')(server);
const config  = require('config');
const log4js  = require('log4js');
const logger  = log4js.getLogger();   
const db    = require('./models/db.models');

logger.level = config.log_level;

server.listen(config.port);