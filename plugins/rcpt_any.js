exports.register = function () {
    this.register_hook('rcpt', 'accept_all');
};

exports.accept_all = function (next, connection, params) {
    next(OK);
};