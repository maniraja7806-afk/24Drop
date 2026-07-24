const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloud_name: 'demo', api_key: '123', api_secret: 'abc' });
cloudinary.uploader.upload_large('package.json', { resource_type: "auto", chunk_size: 20000000 }, (error, result) => {
  console.log(error, result);
});
