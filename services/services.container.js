class ServicesContainer{
    constructor(cahce_service, database_service, sms_service){
        this.CahceService = cahce_service;
        this.DataBaseService = database_service;
        this.SmsService = sms_service;
    }
}

module.exports = ServicesContainer;