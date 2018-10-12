const server  = require('http').createServer();
const io      = require('socket.io')(server);
const config  = require('config');
const log4js  = require('log4js');
const logger  = log4js.getLogger();   
const db    = require('./models/db.models');

logger.level = config.log_level;

io.on('connection', (socket)=>{
    console.log('Client connected:' + socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected: ' + socket.id);
    });
    socket.on('any_event', (data) => {
        console.log('Client send any_event: ' + socket.id);
        console.log(data);
        socket.emit('server_answer', {data: 'test'});
    })
});

server.listen(config.port);
