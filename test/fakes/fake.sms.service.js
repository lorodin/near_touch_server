class FakeSmsService{
    constructor(){
        this.msgs = [];
    }
    sendSms(phone, msg, cb){
        this.msgs.push({
            msg: msg,
            phone: phone
        });

        cb(null, 'Message sending', {phone: phone, msg: msg});
    }
    clear(){
        this.msgs = [];
    }
}

module.exports = FakeSmsService;