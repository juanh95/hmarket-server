const express = require('express')

const store = express.Router()

const StoreItemModel = require('../models/StoreItem')

// returns store items beginning with query
store.get('/StoreItem', async(req, res) => {
  let foundItems = await StoreItemModel.find({})
  //return all items if no query passed
  if(!req.query.itemName){ res.send(foundItems); return }
  let re = new RegExp(req.query.itemName)
  let results = foundItems.filter((storeItem) => re.test(storeItem.itemName))
  res.send(results)
})

// returns the 10 recently viewed items
store.get('/StoreItem/Recent', (req, res) => {
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
store.get('/StoreItem/:StoreItemId', async(req, res) => {
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

module.exports = store