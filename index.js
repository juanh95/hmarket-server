const mongoose = require('mongoose')
const config = require('./config')
const url = `mongodb+srv://${config.dbCred}@namazon0.9tlsu.mongodb.net/namazondb?retryWrites=true&w=majority`

const express = require('express')
const app = express()
const axios = require('axios')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
var jwt = require('jsonwebtoken')

var cors = require('cors')

app.use(express.json())
app.use(cors())

const UserModel = require('./models/User')
const StoreItemModel = require('./models/StoreItem')
const CartModel = require('./models/Cart')

const objects = require('./data/objects')

const port = 8080 
const accessTokenSecret = config.accessTokenSecret

//routes
var userRoutes = require('./routes/user')
var cartRoutes = require('./routes/cart')
var storeRoutes = require('./routes/store', )

//establish connection to the database
const initDB = async() => {
  const database = await mongoose.connect(url, {useNewUrlParser:true, useUnifiedTopology:true, useFindAndModify: false})
  if(database){ 
    app.use(session ({
      secret: config.secret,
      store: new MongoStore({mongooseConnection: mongoose.connection}),
      resave: true, 
      saveUninitialized: true
    }))
    app.use('/', authenticateJWT)
    app.use('/', userRoutes)
    app.use('/', cartRoutes)
    app.use('/', storeRoutes)
    console.log('Successfull connect to db');     
  }
  else{ console.log('Erorr connecting to database'); }
}

// populate the MongoDB database with store items and prices
const initStoreItems = async() => {
  const items = [] 

  var i
  var lim = 100  //the number of store items to be added to db, can be edited
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
  console.log('Completed initializing store items')
}


const initCarts = async() => {
  let storeItems = await StoreItemModel.find({})
  let firstNames = await axios(config.firstName)

  let totalAccs = firstNames.data.name.length
  
  let carts = []

  var i, j
  let assignedItems = []

  //creates a carts with 5 random items for the first 5 users
  for(j = 0; j < 5; j++){
    assignedItems = []
    for(i = 0; i < 5; i++){ assignedItems.push(storeItems[Math.floor(Math.random()*totalAccs)]) }
    let newCart = { items: assignedItems }
    carts.push(newCart)
  }

  //creates empty carts for the rest of the users
  for(i = 5; i < totalAccs; i++){
    newCart = { items: [] }
    carts.push(newCart)
  }

  await CartModel.create(carts)
  console.log('Completed initializing Carts');
}

//populate the MongoDB database with users according to the schema
const initUsers = async() => {
  const firstNames = await axios(config.firstName)
  const lastNames = await axios(config.lastName)
  const emails = await axios(config.email)
  const carts = await CartModel.find({})

  const users = []

  //creates the users with the appriopriate carts
  firstNames.data.name.forEach((name, index) => {
    const newUser = {
      firstName: name,
      lastName: lastNames.data.name[index],
      email: emails.data.email[index],
      password: 'password1',
      username: `${name}.${lastNames.data.name[index]}`,
      cart: carts[index]
    }
    users.push(newUser)
  })

  //uploads the users
  await UserModel.create(users)

  console.log('Completed initializing users');
}

const init = async() => {
  await initDB()
  // await StoreItemModel.deleteMany({})
  // await initStoreItems()
  // await CartModel.deleteMany({})
  // await initCarts()
  // await UserModel.deleteMany({})
  // await initUsers()
}

init() 

// authentication function
const authenticateJWT = async(req, res, next) => {
  if(req.session.accessToken){ 
    let decoded = await jwt.verify(req.session.accessToken, accessTokenSecret)
    req.body.UserId = decoded
    next() 
  }else{ next() }
}

////////////////////// UNCOMMENT TO BEGIN RESTFUL API TESTING //////////////////////////
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})