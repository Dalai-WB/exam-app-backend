const mongoose = require('mongoose');
mongoose.connect('mongodb://exam_app:Dalai-0115@mongodb:27017/examdb?authSource=examdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
  .then((value) => {
    console.log('Database connected.');
  })
  .catch(error => handleError(error));
module.exports = mongoose.connection;
