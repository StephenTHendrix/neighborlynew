var express = require('express');
var cookieParser = require('cookie-parser');
var path = require('path');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 5000
const multer = require("multer");
const upload = multer({ dest: "client/public/images" })
const fs = require('fs');

require('dotenv').config();

app.use(bodyParser.json())
app.use(cors())
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)
app.use(cookieParser())

var VolunteerUsers = require('./routes/VolunteerUsers')
var SeekerUsers = require('./routes/SeekerUsers')
var Users = require('./routes/Users')
var Events = require('./routes/Events')

app.use('/volunteer/', VolunteerUsers)
app.use('/seeker/', SeekerUsers)
app.use('/users/', Users)
app.use('/event/', Events)


const db = require("./models");
require("./routes/event.js")(app);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}


app.post("/api", upload.single("./client/public/images", 12), function (req, res) {
  const originalName = req.file.originalname;
  const newArr = originalName.split(".");
  const fileExt = newArr[newArr.length - 1];
  const origPath = req.file.path;
  const newPath = origPath + "." + fileExt
  console.log(newPath);
  res.cookie('imageUpload', req.file.filename + "." + fileExt, { maxAge: 180000 });


  fs.rename(origPath, newPath, (err) => {
    if (err) throw err;
    console.log('Rename complete!');
  });

  res.send(newPath)

  const form = new multiparty.Form();
  form.parse(request, async (error, fields, files) => {
    if (error) throw new Error(error);
    try {
      const path = files.file[0].path;
      const buffer = fs.readFileSync(path);
      const type = fileType(buffer);
      const timestamp = Date.now().toString();
      const fileName = `bucketFolder/${timestamp}-lg`;
      res.cookie('imageUpload', fileName, { maxAge: 180000 });
      const data = await uploadFile(buffer, fileName, type);
      return response.status(200).send(data);
    } catch (error) {
      return response.status(400).send(error);
    }
  });
})

app.get('*', (request, response) => {
  response.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});


const AWS = require('aws-sdk');
const fileType = require('file-type');
const bluebird = require('bluebird');
const multiparty = require('multiparty');

// configure the keys for accessing AWS
AWS.config.update({
  accessKeyId: "AKIAIMELVADUYKLWJI3A",
  secretAccessKey: "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"
});

// configure AWS to work with promises
AWS.config.setPromisesDependency(bluebird);

// create S3 instance
const s3 = new AWS.S3();

// abstracts function to upload a file returning a promise
const uploadFile = (buffer, name, type) => {
  const params = {
    ACL: 'public-read',
    Body: buffer,
    Bucket: "neighborly012",
    ContentType: type.mime,
    Key: `${name}.${type.ext}`
  };
  return s3.upload(params).promise();
};

// Define POST route
app.post('/test-upload', (request, response) => {
  // console.log(process.env.AWS_SECRET_ACCESS_KEY)
  const form = new multiparty.Form();
    form.parse(request, async (error, fields, files) => {
      if (error) throw new Error(error);
      try {
        const path = files.file[0].path;
        const buffer = fs.readFileSync(path);
        const type = fileType(buffer);
        const timestamp = Date.now().toString();
        const fileName = `bucketFolder/${timestamp}-lg`;
        const data = await uploadFile(buffer, fileName, type);
        return response.status(200).send(data);
      } catch (error) {
        return response.status(400).send(error);
      }
    });
});


db.sequelize.sync().then(() => {
  // inside our db sync callback, we start the server.
  // this is our way of making sure the server is not listening
  // to requests if we have not yet made a db connection
  app.listen(PORT, () => {
    console.log(`App listening on PORT ${PORT}`);
  });
});
