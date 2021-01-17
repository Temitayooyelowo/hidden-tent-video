const {mongoose} = require('../mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

let UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  videoRatings: [
    {
      'videoId': String,
      'rating': {
        type: Number,
        enum: [-1, 0, 1],
        default: 0
      },
    },
  ],
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('Users', UserSchema);

module.exports = User;
