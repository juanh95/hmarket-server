const mongoose = require('mongoose')
const url = 'mongodb+srv://admin:admin1234@namazon0.9tlsu.mongodb.net/namazondb?retryWrites=true&w=majority'

const express = require('express')
const app = express()
const axios = require('axios')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
var jwt = require('jsonwebtoken')

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

app.use(express.json())
const router = express.Router()

const UserModel = require('./models/User')
const StoreItemModel = require('./models/StoreItem')
const CartModel = require('./models/Cart')

const objects = require('./data/objects')
const config = require('./config')
const e = require('express')

const port = 8080 
const accessTokenSecret = 'tokenSecret'

///////////////////////////////// BEGIN PART 2 CODE //////////////////////////////////

//establish connection to the database
const initDB = async() => {
    const database = await mongoose.connect(url, {useNewUrlParser:true, useUnifiedTopology:true, useFindAndModify: false})
    if(database){ 
        app.use(session ({
            secret: 'itIsASecret',
            store: new MongoStore({mongooseConnection: mongoose.connection}),
            resave: true, 
            saveUninitialized: true
        }))
        app.use(router)
        console.log('Successfull connect to db');     
    }
    else{ console.log('Erorr connecting to database'); }
}

//populate the MongoDB database with users according to the schema
const initUsers = async() => {
    const firstNames = await axios(config.firstName)
    const lastNames = await axios(config.lastName)
    const emails = await axios(config.email)

    const users = []

    firstNames.data.name.forEach((name, index) => {
        const newUser = {
            firstName: name,
            lastName: lastNames.data.name[index],
            email: emails.data.email[index],
            password: 'password1',
            username: `${name}.${lastNames.data.name[index]}`
        }
        users.push(newUser)
    })

    await UserModel.create(users)
    console.log(`Completed initializing users`)
}

// populate the MongoDB database with store items and prices
const initStoreItems = async() => {
    const items = [] 

    var i
    var lim = 50  //the number of store items to be added to db, can be edited
    for(i = 0; i < lim; i++){
        var x = Math.floor(Math.random() * (465 - 1) + 1)
        var price = (Math.floor(Math.random() * (100 - 1) + 1) + 0.99)
        const newItem = {
            itemName : objects.objects[x],
            price : price
        }
        items.push(newItem)
    }

    //items not guaranteed to be unique
    await StoreItemModel.create(items)
    console.log(`Completed initializing store items`)
}

// make carts for first 5 users and fills their with 5 random items 
// the rest of the users have carts, even if they are empty
const initCarts = async() => {
    const carts = []
    const storeItems = await StoreItemModel.find({})
    const users = await UserModel.find({})
    
    var i, j
    let assignedItems = []

    for(j = 0; j < 5; j++){
        assignedItems = []
        for(i = 0; i < 5; i++){ assignedItems.push(storeItems[Math.floor(Math.random()*users.length)]) }
        let newCart = {
            user: users[j],
            items: assignedItems
        }
        carts.push(newCart)
    }
    for(i = 5; i < users.length; i++){
        newCart = {
            user: users[i],
            items: []
        }
        carts.push(newCart)
    }
    await CartModel.create(carts)

    console.log(`Completed initializing carts`)
}

const init = async() => {
    await initDB()
    // await UserModel.deleteMany({})
    // await initUsers()
    // await StoreItemModel.deleteMany({})
    // await initStoreItems()
    // await CartModel.deleteMany({})
    // await initCarts()
}

init() 

// authentication function
const authenticateJWT = async(req, res, next) => {
    if(req.session.accessToken){ 
        let decoded = await jwt.verify(req.session.accessToken, accessTokenSecret)
        req.body = decoded
        next() 
    }else{ next() }
}

//////////////////////////////////////////////////////////////////////////////////////////////////

// adds new user from json in request
router.post('/user', jsonParser , async(req, res) => {
    let newUser = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        username: req.body.username
    }

    let foundUser = await UserModel.find({email: req.body.email}).exec()

    // user exists with specified email
    if(foundUser.length >= 1){ res.send(`User with email: ${req.body.email} exists`) } 
    //user does not exist so will add to db
    else{ 
        UserModel.create(newUser)
        res.send(`Added user ${JSON.stringify(newUser)}`) 
    } 
})

router.post('/user/login',async(req, res) => {
    let foundUser = await UserModel.findOne({username: req.body.username})
    if(foundUser.password != req.body.password){ res.send('Password did not match'); return }

    if(!req.session.accessToken){
        const accessToken = jwt.sign(JSON.stringify(foundUser), accessTokenSecret)
        req.session.accessToken = accessToken
        res.send(accessToken)
        return
    }

    let decoded = await jwt.verify(req.session.accessToken, accessTokenSecret)
    if(decoded){ res.send('User already logged in') }
})

//returns user given an id 
router.get('/user/:UserId', authenticateJWT, async(req, res) => {
    if(req.body.username){ res.send(JSON.stringify(req.body)); return }
    
    let foundUser = await UserModel.findById(req.params.UserId).exec()
    if(foundUser){
        console.log('some user was found');
        res.send(JSON.stringify(foundUser))
        return
    }else{
        res.send(`User ${req.params.UserId} was not found`)
    }
})

//returns users cart
router.get('/user/:UserId/cart', authenticateJWT, async(req, res) => {
    let foundCart = 0
    
    // if a user is not logged in, the cart of the user id provided will be returned
    if(!req.body.username){ foundCart = await CartModel.findOne({user: req.params.UserId}).populate('items') }
    // if a user is logged in return the logged in user's cart
    else{ foundCart = await CartModel.findOne({user: req.body._id}).populate('items') }
    
    // validity checking that either cart was found
    if(foundCart){ res.send(JSON.stringify(foundCart.items)); return }
    else { res.send(`Cart belonging to ${req.params.UserId} not found`) }
})

//empty users cart
router.delete('/user/:UserId/cart', authenticateJWT, async(req, res) => {
    let foundCart = 0

    // check if there's a current user logged in
    if(!req.body.username){ 
        //updating cart
        foundCart = await CartModel.findOneAndUpdate({user: req.params.UserId}, {items: []})
        //getting the updated cart
        foundCart = await CartModel.findOne({user: req.params.UserId})  
    } else { 
        //updating cart
        foundCart = await CartModel.findOneAndUpdate({user: req.body._id}, {items: []}) 
        //geting the updated cart
        foundCart = await CartModel.findOne({user: req.body._id}) 
    }
    
    // validation
    if(foundCart){ res.send(`${foundCart}`) }
    else{ res.send(`User ${req.params.UserId}'s cart not found`) }
})

//adds cart item to user given a cart id and store item id
router.post('/cart/:CartId/cartItem/:CartItemId', jsonParser, async(req, res) => {
    //checking if cart and item to be added exist
    let foundCart = await CartModel.findById(req.params.CartId).populate('items')
    if(!foundCart){ res.send(`Could not find cart with id ${req.params.CartId}`); return }
    let foundItem = await StoreItemModel.findById(req.params.CartItemId)
    if(!foundItem){ res.send(`Could not find store item with id ${req.params.CartItemId}`); return }

    //updating and sending the updated cart as a response
    foundCart.items.push(foundItem)
    let updatedCart = await CartModel.findByIdAndUpdate(req.params.CartId, foundCart)
    updatedCart = await CartModel.findById(req.params.CartId).populate('items')
    res.send(`${updatedCart.items}`)
})

router.delete('/cart/:CartId/cartItem/:CartItemId', async(req, res) => {
    //checking if cart and item to be deleted exist
    let foundCart = await CartModel.findById(req.params.CartId).populate('items')
    if(!foundCart){ res.send(`Could not find cart with id ${req.params.CartId}`); return }
    let foundItem = await StoreItemModel.findById(req.params.CartItemId)
    if(!foundItem){ res.send(`Could not find store item with id ${req.params.CartItemId}`); return }
    
    //if the item already doesn't exist in the cart, exit out of the call
    var i = 0
    while(foundCart.items[i]._id != req.params.CartItemId){ 
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

// returns store items beginning with query
router.get('/StoreItem', async(req, res) => {
    let foundItems = await StoreItemModel.find({})
    //return all items if no query passed
    if(!req.query.itemName){ res.send(foundItems); return }
    let re = new RegExp(req.query.itemName)
    let results = foundItems.filter((storeItem) => re.test(storeItem.itemName))
    res.send(`${results}`)
})

// returns the 10 recently viewed items
router.get('/StoreItem/Recent', (req, res) => {
    //validation
    if(isNaN(req.query.num)){ res.send('Query was not a valid number'); return }
    if(!req.session.lastItemsViewed){ res.send('No recently viewed items'); return }
    else if(req.session.lastItemsViewed[0] == null){ 
        req.session.lastItemsViewed = []
        res.send('No recently viewed items'); return 
    }

    //making sure number of items to be displayed is valid
    let limit
    if(req.query.num > 10){ limit = 10 }
    else if(req.session.lastItemsViewed.length < req.query.num) { limit = req.session.lastItemsViewed.length }
    else{ limit = req.query.num }

    //popping the recently viewed items into a new temp array to be displayed
    let viewedItems = [] ; var i = 0
    while(i < limit){ viewedItems.push(req.session.lastItemsViewed.pop()); i++ }


    res.send(JSON.stringify(viewedItems))
})

// returns a store item given a store item id
router.get('/StoreItem/:StoreItemId', async(req, res) => {
    let foundItem = await StoreItemModel.findById(req.params.StoreItemId).lean()
    if(!foundItem){ res.send(`Could not find store item with id ${req.params.StoreItemId}`); return }
    
    // if there is no list of recently viewed items for this session, start one with found item
    if(!req.session.lastItemsViewed){ 
        req.session.lastItemsViewed = [foundItem]
        res.send(JSON.stringify(foundItem))
        return
    }

    //converting ids of recently viewed to strings and storing them in a temp array
    let seenItemIds = []
    req.session.lastItemsViewed.forEach((x) => { seenItemIds.push(JSON.stringify(x._id) ) })

    // if the found item is already in recently viewed list, return found item
    if(seenItemIds.includes(JSON.stringify(foundItem._id))){ res.send(JSON.stringify(foundItem)); return }
    else { req.session.lastItemsViewed.push(foundItem) }


    //default behavior of this route
    res.send(JSON.stringify(foundItem))
})

////////////////////// UNCOMMENT TO BEGIN RESTFUL API TESTING //////////////////////////
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})