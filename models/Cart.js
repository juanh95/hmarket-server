const mongoose = require('mongoose')

const CartSchema = new mongoose.Schema({
    user: {
        type: mongoose.ObjectId,
        ref: 'User'
    },
    items: [{
        type: mongoose.ObjectId,
        ref: 'StoreItem'
    }]   

})

const CartModel = new mongoose.model('Cart', CartSchema)

module.exports = CartModel