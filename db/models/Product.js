const {mongoose} = require('./../mongoose');
const axios = require('axios');

const ProductSchema = new mongoose.Schema({
  "id": String,
  "type": String,
  "name": String,
  "brand": String,
  "description": String,
  "images": [String],
  "videos": [
    {
      "likes": Number,
      "dislikes": Number,
      "url": String,
    }
  ],
});

const data = {
  "products": [
      {
          "barcode_number": '060410901205111',
          "barcode_type": "UPC",
          "barcode_formats": "UPC 017817770620, EAN 0017817770620",
          "mpn": "789564-0020",
          "model": "qc35iis",
          "asin": "",
          "product_name": "Bose QuietComfort 35 Wireless Headphones II Silver",
          "title": "",
          "category": "Electronics > Audio > Audio Components > Headphones & Headsets > Headphones",
          "manufacturer": "Bose",
          "brand": "Bose",
          "label": "",
          "author": "",
          "publisher": "",
          "artist": "",
          "actor": "",
          "director": "",
          "studio": "",
          "genre": "",
          "audience_rating": "Adult",
          "ingredients": "",
          "nutrition_facts": "",
          "color": "Silver",
          "format": "",
          "package_quantity": "",
          "size": "One Size",
          "length": "",
          "width": "",
          "height": "",
          "weight": "3 lb",
          "release_date": "",
          "description": "Lose the noise with QuietComfort 35 noise cancelling wireless headphones from Bose Get world class comfort and performance with these Alexa and Google Assistant enabled smart headphones Headphones 7 1 H x 6 7 W x 3 2 D 8 3 oz Audio cable 47 2 USB cable 12 QC35 wireless headphones II USB charging cable Audio cable Carrying case.",
          "features": [],
          "images": [
              "https://images.barcodelookup.com/154/1541244-1.jpg"
          ],
          "stores": [],
          "reviews": []
      }
  ]
};

ProductSchema.statics.addVideo = async function (url, barcode_id) {
  const Product = this; //model is the this binding

  try{
    const videoInfo = {
      likes: 0,
      dislikes: 0,
      url,
    }

    const product = await Product.findOneAndUpdate(
      {id: barcode_id},
      {$push: {videos: videoInfo}},
      {new: true },
    );

    console.log('Barcode: ', barcode_id);

    // If product found
    if(!!product){
      console.log('Product was found in database...', product)
      return product;
    }

    const params =  {
      barcode: barcode_id,
      formatted: 'y',
      key: process.env.BUCKET_LOOKUP_KEY,
    };

    console.log('Calling barcode lookup api');
    const response = await axios.get('https://api.barcodelookup.com/v2/products', {params});

    const productInfo = response.data.products[0];
    // const productInfo = data.products[0];

    // console.log('product info', productInfo);
    const productParams = {
      "id": barcode_id,
      "type": productInfo.category,
      "name": productInfo.product_name,
      "brand": productInfo.brand,
      "description": productInfo.description,
      "images": productInfo.images,
      "videos": [
        videoInfo
      ],
    }

    console.log('About to save a product');
    const newProduct = new Product(productParams);
    await newProduct.save();
    return newProduct;
  }catch(e){
    console.log("Error encountered when finding product", e);
    return {error: e};
  }
};

// function compare(a, b){
//   const a_rating = a.likes - a.dislikes;
//   const b_rating = b.likes - b.dislikes;

//   if(a_rating < b_rating){
//     return 1;
//   }else if(a_rating > b_rating) {
//     return -1;
//   }

//   return 0;
// }

ProductSchema.statics.getVideo = async function (barcode_id) {
  const Product = this; //model is the this binding

  try{
    const products = await Product.aggregate([{
      "$match": {id: barcode_id}
      }, {
          "$unwind": "$videos"
      }, {
          "$sort": {
              "videos.likes": -1,
              "videos.dislikes": 1
          }
      }, {
          "$group": {
              "videos": {
                  "$push": "$videos"
              },
              "_id": 0
          }
      }, {
          "$project": {
              "_id": 0,
              "videos": 1
          }
      }]);

    // console.log('Product is: ', products);

    if(!!products && products.length > 0){
      console.log('Product was found in database...');


      const product = products[0];
      return product.videos;
      // product.videos.sort(compare);
      // console.log()
      // return product;
    }

    const params =  {
      barcode: barcode_id,
      formatted: 'y',
      key: process.env.BUCKET_LOOKUP_KEY,
    };

    console.log('Calling barcode lookup api');
    const response = await axios.get('https://api.barcodelookup.com/v2/products', {params});

    const productInfo = response.data.products[0];
    // const productInfo = data.products[0];

    const productParams = {
      "id": barcode_id,
      "type": productInfo.category,
      "name": productInfo.product_name,
      "brand": productInfo.brand,
      "description": productInfo.description,
      "images": productInfo.images,
      "videos": [],
    }

    console.log('About to save a product', productParams);
    const newProduct = new Product(productParams);
    await newProduct.save();
    return newProduct;
  }catch(e){
    console.log("Error encountered when finding product");
    return {error: e};
  }
};

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
