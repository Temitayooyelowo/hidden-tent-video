require('dotenv/config')
const express = require('express');
const multer = require('multer');
const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const Product = require("./db/models/Product");

const app = express();
const port = process.env.PORT || 3550;

/** Middleware */
app.use(express.json());
app.use(express.urlencoded({extended: true}))

const s3 = new S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
});

const storage = multer.memoryStorage({
  destination: function(req, file, callback) {
    callback(null, '')
  }
});

const upload = multer({storage: storage});

app.post('/videos/upload', upload.single('video'), (req, res) => {
  const barcode_id = req.query.barcode;
  const video = req.file.originalname.split('.');
  const videoType = video.pop();

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuidv4()}.${videoType}`, // make the file name unique
    Body: req.file.buffer
  };

  s3.upload(params, (error, data) => {
    if (error) {
      res.status(400).send(error);
    }

    res.status(200).send(data);
  });
});

app.get('/videos/getVideoSize', function(req, res) {
  s3.listObjectsV2(
    {MaxKeys: 1, Prefix: process.env.TEST_FILE_NAME, Bucket: process.env.AWS_BUCKET_NAME},
    function(err, data)  {
    if (err || data.KeyCount < 1)
    {
      console.log('Error', err);
        return res.sendStatus(400);
    }

    // console.log(data.Contents[0]);
    // const videoSize = data.Contents[0].Size;
    // res.send({videoSize});
    res.send(data.Contents[0]);
  });
  // const videoPath = 'media/test.mp4';
  // const videoSize = fs.statSync(videoPath).size;
  // res.send({videoSize});
});

// TODO: Need to figure out how to do this in chunks
app.get('/videos/s3/stream', function(req, res) {
  const range = req.headers.range;
  const videoSize = req.query.videoSize;
  if(!range) {
    res.status(400).send('Requires range header...');
  }

  if(!videoSize) {
    res.status(400).send('Requires "videoSize" param...');
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: process.env.TEST_FILE_NAME,
  };

  const positions = range.replace(/bytes=/, '').split('-');
  const start = parseInt(positions[0], 10);

  const end = positions[1] ? parseInt(positions[1], 10) : videoSize - 1;
  const chunksize = (end - start) + 1;

  // const CHUNK_SIZE = (10 ** 6)*2; // 1 MB
  // const start = Number(range.replace(/\D/g, ''));
  // const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // const contentLength = end - start + 1;

  const headers = {
      'Cache-Contorl': `max-age=${300}, private`, // seconds
      'Content-Range'  : 'bytes ' + start + '-' + end + '/' + videoSize,
      'Accept-Ranges'  : 'bytes',
      // 'Content-Length' : contentLength,
      'Content-Length' : chunksize,
      'Content-Type'   : 'video/mp4',
  };

  res.writeHead(206, headers);

  const stream = s3.getObject({...params, Range: range}).createReadStream();

  stream.on('error', function(err)
  {
    console.error(err);
  });

  stream.pipe(res);
});

app.get('/videos/stream', function(req, res) {
  const range = req.headers.range;
  if(!range) {
    res.status(400).send('Requires range header...');
  }

  const videoPath = 'media/test.mp4';
  const videoSize = fs.statSync(videoPath).size;
  // const videoSize = req.query.videoSize;

  const CHUNK_SIZE = 10 ** 6; // 1 MB
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  const contentLength = end - start + 1;
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  };

  res.writeHead(206, headers);

  const videoStream = fs.createReadStream(videoPath, {start, end});

  videoStream.pipe(res);
});

app.get('/', function(req, res) {
  res.sendFile(`${__dirname}/index.html`);
})

app.get('/videos/video', function(req, res) {
  const barcode_id = req.query.barcode;
  const data = {
    "products": [
        {
            "barcode_number": barcode_id,
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
  Product.findOne({id: barcode_id})
    .then((foundProduct) => {
      if(!!foundProduct){
        console.log('Product was found in database...', foundProduct)
        return res.send(foundProduct.videos);
      }

      const productInfo = data.products[0];

      const productParams = {
        "id": productInfo.barcode_number,
        "type": productInfo.category,
        "name": productInfo.product_name,
        "brand": productInfo.brand,
        "description": productInfo.description,
        "images": productInfo.images,
        "videos": [],
      }

      // const params =  {
      //   barcode: barcode_id,
      //   formatted: 'y',
      //   key: process.env.BUCKET_LOOKUP_KEY,
      // };
      // console.log(params);
      // console.log('Product was not found');
      // return axios.get('https://api.barcodelookup.com/v2/products', {params});

      /** Comment out to test with axios */
      const newProduct = new Product(productParams);
      newProduct.save().then(() => {
        console.log('Product has been saved...')
        res.send(productParams.videos);
      });
    })
    // .then((response) => {
    //   console.log('In response');
    //   if(!!response){
    //     console.log('continue');
    //     return;
    //   }
    //   const productInfo = response.data.products[0];

    //   const productParams = {
    //     "id": productInfo.barcode_number,
    //     "type": productInfo.category,
    //     "name": productInfo.product_name,
    //     "brand": productInfo.brand,
    //     "description": productInfo.description,
    //     "images": productInfo.images,
    //     "videos": [],
    //   }

    //   const newProduct = new Product(productParams);
    //   newProduct.save().then(() => {
    //     // return res.send('Product Saved');
    //     return res.send(productParams);
    //   });
    // })
    .catch((error) => {
        console.log(error);
        return res.status(400).send(error);
    });
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})