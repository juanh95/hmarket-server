console.log('Namazon running')

const express = require('express')
var bodyParser = require('body-parser')
const app = express()
var jsonParser = bodyParser.json()
const uuidv4 = require('uuid').v4

const port = 8080 

var users = []
var carts = []
var storeItems = []

//test data population
populateTestData()

//adds new user from json in request
app.post('/user', jsonParser ,(req, res) => {
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
app.get('/user/:UserId', (req, res) => {
    let foundUser = users.find(x => x.id === req.params.UserId)
    if(foundUser){ res.send(foundUser) } else { res.send('User ID not found') }
})

//returns users cart
app.get('/user/:UserId/cart', (req, res) => {
    let usersCart = carts.find(x => x.cartId === req.params.UserId)
    if(usersCart){ res.send(usersCart.items) } else { res.send('Users cart not found') }
})

//empty users cart
app.delete('/user/:UserId/cart', (req, res) => {
    let index = carts.findIndex(x => x.cartId === req.params.UserId)
    let numItems = (carts[index].items.length)
    carts[index].items.splice(0, numItems)
    res.send(carts[index].items)
})

//adds cart item to user
app.post('/cart/:CartId/cartItem', jsonParser ,(req, res) => {
    let index = carts.findIndex(x => x.cartId === req.params.CartId)
    if(index >= 0){
        console.log("cart exists, pushing item to existing cart");
        carts[index].items.push({
            "itemId" : req.body.itemId, 
            "itemQuantity": req.body.itemQuantity
        })
        res.send(carts[index].items)
    } else {
        let passedItem = req.body.itemId 
        if(!passedItem){
            res.send("No item to add")
            return;
        }

        console.log("cart does not exist, creating cart and pushing item to existing cart");
        let cart = {
            "cartId": req.params.CartId,
            "items": [{
                "itemId": req.body.itemId,
                "itemQuantity" : req.body.itemQuantity
            }]
        }
        carts.push(cart)
        res.send(cart.items)
    }
})

app.delete('/cart/:CartId/cartItem/:cartItemId', (req, res) => {
    let index = carts.findIndex(x => x.cartId === req.params.CartId)
    let itemIndex = carts[index].items.findIndex(x => x.itemId === req.params.cartItemId)

    if(index < 0){ res.send('Cart not found') }
    if(itemIndex < 0) { res.send('Item not found') }

    if(index >= 0 && itemIndex >= 0){
        carts[index].items.splice(itemIndex, 1)
        res.send(carts[index].items)
    } else {
        res.sendStatus(400)
    }
})

app.get('/StoreItem/:StoreItemId', (req, res) => {
    let storeItemIndex = storeItems.findIndex(x => x.itemId === req.params.StoreItemId)
    if(storeItemIndex < 0) {
        res.send('Item not found')
    } else {
        res.send(storeItems[storeItemIndex])
    }
})

app.get('/StoreItem', (req, res) => {
    searchItem = req.query.itemName
    let foundItems = []
    storeItems.forEach(function(x){
        itemNameString = x.itemName.toString()
        if(itemNameString.includes(searchItem)){
            foundItems.push(x)
        }
    }) 
    if(foundItems.length === 0) { res.send('No items found') }
    else { res.send(foundItems) }
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})

//-------------------------------------------------------
// initializer functions

function createNewUser(firstName, lastName, email){
    if(users.find(x => x.email === email)){
        console.log("Duplicate email found, user not added")
    } else {
        let user = {
            "id": uuidv4(), 
            "firstName": firstName, 
            "lastName": lastName, 
            "email": email,
        }
        users.push(user)
        console.log(`User ${email} added`)
    }
}

function createNewCart(userId){
    let cart = {
        "cartId": userId,
        "items": [{
            "itemId": "thefirstitem",
            "itemQuantity" : 1
        }]
    }
    carts.push(cart)
}

function addItemToCart(userId, itemId, itemQuantity){
    var index = carts.findIndex(x => x.cartId === userId)
    let item = {
        "itemId": itemId,
        "itemQuantity" : itemQuantity
    }

    if (index >= 0){ 
        carts[index].items.push(item) 
        console.log('new item added to cart');
    }
    else { console.log('cart not found item not added'); }
}

function loadUsers() {
    createNewUser("Juan", "Hernandez", "juan@state.edu")
    createNewUser("John", "Wayne", "wayne@state.edu")
    createNewUser("John", "Doe", "john@state.edu")
}

function loadStoreItems() {
    let storeItem = {
        "itemId" : "somekeyboard",
        "itemName" : "keyboard",
        "itemPrice" : "49.99"
    }
    storeItems.push(storeItem)
    storeItems.push({
        "itemId" : "somemouse",
        "itemName" : "mouse",
        "itemPrice" : "29.99"
    })
    storeItems.push({
        "itemId" : "somepc",
        "itemName" : "pc",
        "itemPrice" : "129.99"
    })
    storeItems.push({
        "itemId" : "somemonitor",
        "itemName" : "monitor",
        "itemPrice" : "319.99"
    })
}

function populateTestData() {
    loadUsers() 
    createNewCart(users[0].id)
    console.log("Sample users & their carts loaded");
    addItemToCart(users[0].id, 'theseconditem', 1)
    addItemToCart(users[0].id, 'thethirditem', 1)
    addItemToCart(users[0].id, 'thefourthitem', 1)
    loadStoreItems()
    console.log(users);
}