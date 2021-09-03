var multer = require('multer');
var path = require('path');
const { fstat } = require('fs');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, (process.env.IMAGES_ROUTE || '/media/HDD/images/'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
  }
})

var upload = multer({ 
    limits: {
        fileSize: 100000000,
    },
    storage: storage,
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)){
        cb(new Error('Please upload an image.'))
        //
        //
        //<input type="file" accept="image/*
        }
        cb(undefined, true)
    }

});

//https://medium.com/swlh/uploading-images-to-your-node-js-backend-978261eb0724

module.exports = {upload}