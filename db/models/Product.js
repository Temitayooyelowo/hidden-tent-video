const {mongoose} = require('./../mongoose');

const productSchema = new mongoose.Schema({
  "id": String,
  "type": String,
  "name": String,
  "brand": String,
  "description": String,
  "images": [String],
  "videos": [String],
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
