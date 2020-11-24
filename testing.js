const objects = require('./data/objects.json')

const items = []

function getRandomItems(lim) {
    var i
    for(i = 0; i < lim; i++){
        var x = Math.floor(Math.random() * (465 - 1) + 1)
        var price = (Math.floor(Math.random() * (100 - 1) + 1) + 0.99)
        let item = {
            "itemName" : JSON.parse(JSON.stringify(objects.objects[x])),
            "price" : price
        }
        items.push(item)
    }
}

getRandomItems(10)

console.log(`${item[1]}`);
