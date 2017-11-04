const express = require('express');
const controllers = require('./controllers');

const app = express();
// const io = require('socket.io')(app);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    next();
});

app.use(express.json());
app.use(express.static('dist'));
app.use('/api', controllers);

// io.on('connection', (client) => {
//     client.emit('news', { hello: 'world' });
//
//     client.on('subscribeToTimer', (interval) => {
//         console.log('client is subscribing to timer with interval ', interval);
//         setInterval(() => {
//             client.emit('timer', new Date());
//         }, interval);
//     });
// });

app.listen(6701);
