const randomCode = (length) => {
    if(!length) length = 5;
    let result = Math.random() * Math.pow(10, length);
    let str_result = Math.ceil(result) + '';
    while(str_result.length < length){
        str_result = '0' + str_result;
    }
    return str_result;
}

module.exports = randomCode;