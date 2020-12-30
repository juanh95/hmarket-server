## Namazon-server (Amazon Clone Project)

### Contents: 
1. data - JSON file of every-day objects, used for database population and creation of sample user carts
2. models - Three Main Schemas: Item, Cart, User
     1. StoreItem - Has an `itemName` and `price`
     2. Cart - Has an array of references to `StoreItems`
     3. User - Has properties `firstName`, `lastName`, `email`, `password` and a reference to a `Cart` object
3. node-modules - Mod
