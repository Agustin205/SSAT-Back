const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const authMiddleware = require('./middleware/authMiddleware')
const log4js = require('./middleware/log4js.config');
const logger = log4js.getLogger();
const errorLogger = log4js.getLogger('error');
app.use(log4js.connectLogger(logger, { level: 'auto' }));
let connection = require("./database/db")
const fileController = require("./controllers/filesController");
const uploadController = require("./controllers/uploadController");
const userController = require('./controllers/userController')
const path = require('path');
const { spawn } = require('child_process');

app.use(
  session({
    secret: "A12343256434354",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const publicPath = path.resolve(__dirname, "../public");
app.use(express.static(publicPath));
app.set("view engine", "ejs");
app.use(cors());

app.post("/upload", uploadController.uploadMiddleware, (req, res) => {
  const pythonScriptPath = path.join(__dirname, '..', 'python', 'uploadTables.py');
  const pythonProcess = spawn('python', [pythonScriptPath,req.body.lote]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Salida del script de Python: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Error del script de Python: ${data}`);
    res.send(400)
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`El script de Python ha finalizado con código ${code}`);
    res.send(200)
    
  });
});


app.get("/transaction", fileController.transaction);
app.post("/transactionObjetcs", fileController.transactionObj);
app.post("/objectSearch",authMiddleware, fileController.objSearch);
app.post('/register', userController.register)
app.post('/login', userController.login)
app.post('/addConsult', authMiddleware, userController.addConsult)
app.post('/getConsult', authMiddleware, userController.getConsult)
app.post('/editConsult', authMiddleware, userController.editConsult)
app.post("/history", userController.getHistoryConsult);
app.post("/historyCsv", userController.devolverCsc);
app.post("/addClient", userController.addClient);
app.post("/getClients", userController.getClient);
app.delete("/deleteClients/:id", userController.deleteClient);
app.post("/addLote", userController.addLote);
app.post("/getLote", userController.getLote);
/* app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
 */

// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.json(err);
// });

app.use((err, req, res, next) => {
  console.error(err);
  errorLogger.error(err); // Registra el error en el logger de error
  res.status(500).send('Algo no ha salido como se esperaba');
});

module.exports = app;
