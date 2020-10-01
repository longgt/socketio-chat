function getUsername(req) {
    return req.session.user ? req.session.user.username : '';
}

function wrapMiddleware (middleware) {
    return (socket, next) => middleware(socket.request, {}, next);
}

module.exports = {
    getUsername,
    wrapMiddleware
};