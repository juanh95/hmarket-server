const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  firstName: String, 
  lastName: String,
  email: String,
  password: String,
  username: String, 
  cart: { type: mongoose.ObjectId, ref: 'Cart' }
})

const UserModel = new mongoose.model('User', UserSchema)

module.exports = UserModel