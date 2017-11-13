const express = require('express');
const socketIo = require('socket.io');
const controllers = require('./controllers');
const logger = require('morgan');

const app = express();
const server = app.listen(6701);
const io = socketIo(server);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    next();
});

app.use(logger('tiny'));
app.use(express.json());
app.use(express.static('dist'));
app.use('/api', controllers);
app.set('io', io);
