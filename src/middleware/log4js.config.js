const log4js = require('log4js');

try{
log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: { type: 'file', filename: 'logs.txt' },
    errorFile: { type: 'file', filename: 'logsError.txt' }
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'info' },
    error: { appenders: ['console', 'errorFile'], level: 'error' }
  },
});
}catch(error){
  console.error("Error configuring log4js:", error);
}

module.exports = log4js;
