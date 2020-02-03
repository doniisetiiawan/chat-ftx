const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const routes = require('./routes/index');

const app = express();

const env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env === 'development';

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      title: 'error',
    });
  });
}

app.use((err, req, res) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    title: 'error',
  });
});

app.set('port', process.env.PORT || 3000);
const server = app.listen(app.get('port'), () => {
  console.log(
    `Express server listening on port ${app.get('port')}`,
  );
});

// eslint-disable-next-line import/order
const io = require('socket.io').listen(server);

const userList = [];
const connections = [];

io.sockets.on('connection', (socket) => {
  connections.push(socket);
  console.log('Connected:', connections.length);

  function updateUsernames() {
    io.sockets.emit('get userList', userList);
  }

  socket.on('disconnect', () => {
    if (socket.username) {
      userList.splice(userList.indexOf(socket.username), 1);
      updateUsernames();
    }
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected:', connections.length);
  });

  socket.on('send message', (data) => {
    io.sockets.emit('new message', {
      msg: data,
      user: socket.username,
    });
  });

  socket.on('new user', (data, callback) => {
    callback(!!data);
    socket.username = data;
    userList.push(socket.username);
    updateUsernames();
  });
});
