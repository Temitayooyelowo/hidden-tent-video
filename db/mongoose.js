const mongoose = require('mongoose');

const url = process.env.MONGODB_URI;

mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);
mongoose.connect(`${url}`, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}).then(() => {
  console.log("Mongodb connection is successful");

}).catch((err) => {
  console.error(err);
});

module.exports = {
  mongoose: mongoose
};
