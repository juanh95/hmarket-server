const mongoose = require('mongoose')

const StoreItemSchema = new mongoose.Schema(
    {
        itemName: String, 
        price: Number,
    }
)

const StoreItemModel = new mongoose.model('StoreItem', StoreItemSchema)

module.exports = StoreItemModel