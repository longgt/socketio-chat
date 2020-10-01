const express = require('express');
const session = require('express-session');
const bodyParser = require("body-parser");
const http = require('http');
const socketio = require('socket.io');
const { wrapMiddleware, getUsername } = require('./util/util');

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);
const sessionMiddleware = session({
    secret: 'a923iAIUa',
    resave: false,
    saveUninitialized: false
});
const io = socketio(server, { serveClient: false });

// Application initialization
app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('www', { index: false }));

app.get("/", (req, res) => {
    const isAuthenticated = !!req.session.user;
    if (isAuthenticated) {
      console.log(`user is authenticated, session is ${req.session.id}`);
    } else {
      console.log("unknown user");
    }

    res.sendFile(isAuthenticated ? "index.html" : "login.html", { root: 'www' });
  });

app.use('/login', require('./routes/login'));
app.use('/logout', require('./routes/logout'));

// Socket.IO initialization
io.use(wrapMiddleware(sessionMiddleware));

io.use((socket, next) => {
    if (socket.request.session.user) {
      next();
    } else {
      next(new Error('Unauthorized'));
    }
});

io.on('connection', socket => {
    const session = socket.request.session;
    session.socketId = socket.id;
    session.save();

    socket.on('whoami', cb => {
        const req = socket.request;
        cb(req.session.user ? req.session.user.username : '');
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} is disconnected`);
    });

    socket.on('chat message', msg => {
        socket.broadcast.emit('chat message', {
            username: getUsername(socket.request),
            msg: msg
        });
    });

      // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: getUsername(socket.request)
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
            username: getUsername(socket.request)
        });
    });
});

server.listen (port, host, () => {
    console.log(`Application is listening on ${host}:${port}`);
});