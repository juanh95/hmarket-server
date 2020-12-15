const express = require('express')

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

const cart = express.Router()

const StoreItemModel = require('../models/StoreItem')
const CartModel = require('../models/Cart')


//adds cart item to user given a cart id and store item id
cart.post('/cart/:CartId/cartItem/:StoreItemId', jsonParser, async(req, res) => {
  //checking if cart and item to be added exist
  let foundCart = await CartModel.findById(req.params.CartId).populate('items')
  if(!foundCart){ res.send(`Could not find cart with id ${req.params.CartId}`); return }
  let foundItem = await StoreItemModel.findById(req.params.StoreItemId)
  if(!foundItem){ res.send(`Could not find store item with id ${req.params.StoreItemId}`); return }

  //updating and sending the updated cart as a response
  foundCart.items.push(foundItem)
  let updatedCart = await CartModel.findByIdAndUpdate(req.params.CartId, foundCart)
  updatedCart = await CartModel.findById(req.params.CartId).populate('items')
  res.send(`${updatedCart.items}`)
})

// removes an item from a cart given the cart id and the item id
cart.delete('/cart/:CartId/cartItem/:StoreItemId', async(req, res) => {
  //checking if cart and item to be deleted exist
  let foundCart = await CartModel.findById(req.params.CartId).populate('items')
  if(!foundCart){ res.send(`Could not find cart with id ${req.params.CartId}`); return }
  let foundItem = await StoreItemModel.findById(req.params.StoreItemId)
  if(!foundItem){ res.send(`Could not find store item with id ${req.params.StoreItemId}`); return }
  
  //if the item already doesn't exist in the cart, exit out of the call
  var i = 0
  while(foundCart.items[i]._id != req.params.StoreItemId){ 
    i++
    if(i >= foundCart.items.length) { break } 
  }
  if(i >= foundCart.items.length){res.send('Item already removed from cart'); return}
  
  //if the item is found in the cart, remove it and update the cart
  foundCart.items.splice(i, 1)
  let updatedCart = await CartModel.findByIdAndUpdate(req.params.CartId, foundCart)
  updatedCart = await CartModel.findById(req.params.CartId).populate('items')
  res.send(JSON.stringify(updatedCart.items))
})

module.exports = cart