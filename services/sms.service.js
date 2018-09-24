class SmsService{
    sendSms(phone, msg, cb){
        cb(null, 'Message sending', {phone: phone, msg: msg});
    }
}

module.exports = SmsService;