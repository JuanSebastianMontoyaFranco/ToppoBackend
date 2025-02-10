const express = require('express');
const apiRouter = require('./routes/api');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cronJob = require('./utils/cron/cronJobs');  // Importamos el cronJob

//Comentario
//Vars
let PORT;
process.env.NODE_ENV === 'production'
  ? (PORT = process.env.PROD_PORT) :
  process.env.NODE_ENV === 'test'
    ? (PORT = process.env.QA_PORT) :
    (PORT = process.env.DEV_PORT);

//instancia de express en app
const app = express();

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods: GET, POST, DELETE, PUT');
  next();
});

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Private-Network: true');
    next();
  });
};

// settings
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//routes
if (process.env.NODE_ENV === 'production') {
  app.use('/', apiRouter);
} else {
  app.use('/api', apiRouter);
}


app.listen(PORT, (error) => {
  if (!error) {
    console.log(`Running in ${process.env.NODE_ENV}`);
    console.log(`Server on port http://localhost:${PORT}`);
  } else {
    console.log(error);
  }
});


module.exports = app;
