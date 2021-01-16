const {mongoose} = require('./../mongoose');

let UserSchema = new mongoose.Schema({
  "loggedIn": {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    minlength: 6
  },
  "user.id": String,
  "user.token": String,
  "user.name": String,
  "user.email": String
});

UserSchema.statics.getUser = async function (id) {
  const User = this; //model is the this binding

  try{
    const user = await User.findOne({ "user.id": id });
    return (user) ? user : false;
  }catch(e){
    console.log("Error encountered when finding user");
    return {error: e.description};
  }

};

UserSchema.statics.logOffUser = async function(id){
  const User = this;

  try{
    const loggedOutUser = await User.findOneAndUpdate({"user.id": id}, {loggedIn: false}, {new: true});
    return (!!loggedOutUser) ? loggedOutUser : false;
  }catch(e){
    console.log("Error logging off user...");
    return {error: e.description};
  }
}

UserSchema.statics.logInUser = async function (id) {
  const User = this;

  try{
    const loggedInUser = await User.findOneAndUpdate({"user.id": id}, {loggedIn: true}, {new: true});
    return (!!loggedInUser) ? loggedInUser : false;
  }catch(e){
    console.log("Error logging in user...");
    return {error: e.description};
  }
};

UserSchema.statics.addUserToDatabase = async function(profile, accessToken){
  const email = !!profile.emails ? profile.emails[0].value : '';
  const newUser = new User_DB({
    "loggedIn": true,
    "user.id": profile.id,
    "user.token": accessToken,
    "user.name": profile.displayName,
    "user.email": email //return the first email (incase there are numerous emails returned)
  });

  try{
    await newUser.save();
    return newUser;
  }catch(e){
    console.log(`Unable to insert user into users database`);
    return {error: e.description};
  }
}

UserSchema.statics.deleteUser = async function (id) {
  const User = this;

  try{
    const deletedUser = await User.findOneAndRemove({"user.id":id});

    return deletedUser;
  }catch(e){
    console.error("Error encountered when trying to delete a user from the database");
    return { error: e.description };
  }
}

let User_DB = mongoose.model('Users', UserSchema);

module.exports = {
  User_DB: User_DB
};
