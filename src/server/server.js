const express = require('express');
const controllers = require('./controllers');

const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    next();
});

app.use(express.json());
app.use(express.static('dist'));
app.use('/api', controllers);

app.listen(6701);
