const express = require('express')
const userRouter = express.Router

//adds new user from json in request
/*
    TODO: Add registration capabilities, with email & password 
    according to project specs
*/
userRouter.post('/user', jsonParser ,(req, res) => {
    let newUser = req.body
    newUser.id = uuidv4()
    if(users.find(x => x.email === newUser.email)){
        res.send("User not added, email exists")
    } else {
        users.push(newUser)
        res.send(newUser)
    }
})

//returns user given an id 
userRouter.get('/user/:UserId', (req, res) => {
    let foundUser = users.find(x => x.id === req.params.UserId)
    if(foundUser){ res.send(foundUser) } else { res.send('User ID not found') }
})

//returns users cart
userRouter.get('/user/:UserId/cart', (req, res) => {
    let usersCart = carts.find(x => x.cartId === req.params.UserId)
    if(usersCart){ res.send(usersCart.items) } else { res.send('Users cart not found') }
})

//empty users cart
userRouter.delete('/user/:UserId/cart', (req, res) => {
    let index = carts.findIndex(x => x.cartId === req.params.UserId)
    let numItems = (carts[index].items.length)
    carts[index].items.splice(0, numItems)
    res.send(carts[index].items)
})

module.exports = userRouter