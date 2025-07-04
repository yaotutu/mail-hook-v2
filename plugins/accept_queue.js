exports.register = function () {
    this.register_hook('queue', 'accept_queue');
};

exports.accept_queue = function (next, connection) {
    // 这里表示Haraka邮件队列处理完成，可以继续后续流程
    console.log('queue hook: 邮件投递被接受');
    next(OK);
};