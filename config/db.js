const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://dalai:DImfwlCjkg2pzs4J@cluster0.ldpusoz.mongodb.net/')
  .then((value) => {
    console.log('Database connected.');
  })
  .catch(error => handleError(error));
module.exports = mongoose.connection;
