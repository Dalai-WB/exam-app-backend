const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://baaskaberkhee:QuAQCkoB7zZRKMSs@cluster0.58xlb.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
  .then((value) => {
    console.log('Database connected.');
  })
  .catch(error => handleError(error));
module.exports = mongoose.connection;
