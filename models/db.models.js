const mongoose = require('mongoose');
const config  = require('config');
const log4js   = require('log4js');
const logger   = log4js.getLogger();

logger.level = config.log_level;

mongoose.connect(config.mongoose.uri);

const db = mongoose.connection;

db.on('error', function(err){
    logger.error('Connection error: ', err.message);
});

db.once('open', function callback(){
    logger.info('Connected to DB!');
});

var Schema = mongoose.Schema;

var User = new Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    phone_confirm:{
        type: Boolean,
        default: false
    }
});

User.virtual('userId')
    .get(function(){
        return this.id
    });

var UserModel = mongoose.model('User', User);

var Room = new Schema({
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    confirm: {
        type: Boolean,
        default: false
    },
    points: {
        type: Number,
        default: 0
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

var RoomModel = mongoose.model('Room', Room);

var Code = new Schema({
    user_id: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

var CodeModel = mongoose.model('Code', Code);

module.exports.User = UserModel;
module.exports.Room = RoomModel;
module.exports.Code = CodeModel;


