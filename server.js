require('dotenv/config')
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const multer = require('multer');
const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


const users = require('./routes/users');
const auth = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3550;

/** Middleware */
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const expressSession = session({
  secret: process.env.JWT_SECRET,
  resave: true,
  saveUninitialized: true
});

app.use(expressSession);

app.use(passport.initialize());
app.use(passport.session());

app.use('/users', users);
app.use('/auth', auth);

function ensureAuthenticated(req, res, next) {
  console.log("In ensure authenticated")
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/login')
}

const s3 = new S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
});

// since we're uploading to s3 we want to store files in memory
// as buffer objects using the memory storage engine and then
// upload to s3
// CONSTRAINT: Uploading very large files to memory can make
// application run out of memory. Might be better to use diskStorage
const storage = multer.memoryStorage({
  destination: function(req, file, callback) {
    callback(null, '')
  }
});

const upload = multer({storage: storage});

app.post('/videos/upload', ensureAuthenticated, upload.single('video'), (req, res) => {
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

    const videoSize = data.Contents[0].Size;
    res.send({videoSize});
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

app.get('/', ensureAuthenticated, function(req, res) {
  res.sendFile(`${__dirname}/index.html`);
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})