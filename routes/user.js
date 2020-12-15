const express = require('express')
var jwt = require('jsonwebtoken')

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

const user = express.Router()

const UserModel = require('../models/User')
const CartModel = require('../models/Cart')

const config = require('../config')

/*
  TODO:
  - needs to check that username does not already exist
  - needs to check that a user is not currently logged in
*/
// adds new user from json in request
user.post('/user', jsonParser , async(req, res) => {
  let foundUser = await UserModel.find({email: req.body.email}).exec()

  // user exists with specified email
  if(foundUser.length >= 1){ res.send(`User with email: ${req.body.email} exists`) } 
  //user does not exist so will add to db
  else{ 
    let newUser = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      username: req.body.username,
      cart: await CartModel.create(newCart = {items: []})
    }
    
    await UserModel.create(newUser)
    res.send(`Added user ${JSON.stringify(newUser)}`) 
  } 
})

/*
  TODO: 
  - implement logout
*/
user.post('/user/login', async(req, res) => {
  if(req.body.UserId){ res.send('User already logged in'); return }

  let foundUser = await UserModel.findOne({username: req.body.username})
  if(!foundUser){ res.status(401).send('Username not found'); return; }
  if(foundUser.password != req.body.password){ res.status(401).send('Password did not match'); return }

  //no access token detected so it will issue one
  if(!req.session.accessToken){
    const accessToken = jwt.sign(JSON.stringify(foundUser._id), config.accessTokenSecret)
    req.session.accessToken = accessToken
    res.send({jwt: accessToken, userId: foundUser._id, cartId: foundUser.cart._id})
    return
  }

  let decoded = await jwt.verify(req.session.accessToken, config.accessTokenSecret)
  if(decoded){ res.send(decoded) }
})

//returns user given an id 
user.get('/user/:UserId', async(req, res) => {
  let foundUser = ''
  
  if(req.body.UserId){
    req.params.UserId = JSON.parse(req.body.UserId)
  }
  
  foundUser = await UserModel.findById(req.params.UserId)
  if(foundUser){
    console.log('Returned the user provided in the params');
    res.send(JSON.stringify(foundUser))
    return
  }else{
    res.send(`User ${req.params.UserId} was not found`)
  }
})

//returns users cart given a user ID
user.get('/user/:UserId/cart', async(req, res) => {
  if(req.body.UserId){
    req.params.UserId = JSON.parse(req.body.UserId)
  }
  
  let response = ''
  
  try {
    response = await UserModel.findById(req.params.UserId)
      .populate({
        path: 'cart',
        populate: {path: 'items'}
      })
  } catch (error) {
    res.send(`Could not find user ${req.params.UserId}`)
    return
  }
  
  res.send(response.cart.items)
})

//empty users cart
user.delete('/user/:UserId/cart', async(req, res) => {
  let foundCart = 0
  let foundUser = ''

  // get the id of the user that's logged in if any
  if(req.body.UserId){
    req.params.UserId = JSON.parse(req.body.UserId)
  }

  // get cart with user id provided
  try {
    foundUser = await UserModel.findById(req.params.UserId)
    foundCart = await CartModel.findByIdAndUpdate(foundUser.cart, {items: []})
    foundCart = await CartModel.findById(foundUser.cart)
    res.send(foundCart.items)
    return
  } catch (error) {
    res.send('Cannot find user\'s cart')
  }
})

module.exports = user