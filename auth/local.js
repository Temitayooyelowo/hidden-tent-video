// const passport = require('passport');
// const bcrypt = require('bcryptjs');
// const LocalStrategy = require('passport-local').Strategy;
// const User = require('../db/models/User');

// passport.use('local', new LocalStrategy(
//   function(email, password, done) {

//     User.findOne({ "user.email": email}).then((user) => {
//       if(user){
//         console.log("User was found in database");

//         bcrypt.compare(password, user.password, async function(err, res) {
//             // res == true
//             if(err){
//               throw err;
//             }else if(!res){
//               console.log("Invalid password");
//               return done(null, false);
//             }

//             try{
//               const loggedInUser = await User.logInUser(user.user.id);
//               console.log("Did not update user");
//               console.log(`After saving. Is user logged in? ${loggedInUser.loggedIn}`);
//               return (!loggedInUser || !!loggedInUser.error) ? done(loggedInUser, null) : done(null, loggedInUser);
//             }catch(e){
//               console.log(e);
//               throw e;
//             }
//         });

//       }else{
//         console.log("User was not found in the database");
//         bcrypt.genSalt(10, function(err, salt) {
//           bcrypt.hash(password, salt, function(err, hash) {
//             // Store hash in your password DB.
//             if(err){
//               throw err;
//             }

//             let newUser = new User({
//               "loggedIn": true,
//               "user.id": "",
//               "user.token": "",
//               "password": hash,
//               "user.email": email,
//             });

//             newUser.user.id = newUser.id;

//             newUser.save().then((doc) => {
//               console.log("User has been added to the database");
//                return done(null, newUser);
//             }).catch((e) => {
//               console.log(`Unable to insert user into users database`);
//               console.log(e);
//               done(e, null);
//             });

//           });
//         }); //end of bcrypt.genSalt


//       }

//     }).catch((err) => {
//       return done(err);
//     });

//   }
// ));

// module.exports = passport;
