const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const getUri = (req) => {
  return req.file.buffer.toString("base64");
};

exports.ProfileUpload = async function (req, itemId, invalidate = false) {
  const file = getUri(req);
  return (result = await cloudinary.uploader.upload(
    "data:image/png;base64," + file,
    {
      public_id: `${itemId}`,
      folder: "MouseHole_ProfileImages",
      invalidate: invalidate,
    }
  ));
};

exports.PostImageUpload = async function (raw, itemId, invalidate = false) {
  const file = raw.buffer.toString("base64");
  return (result = await cloudinary.uploader.upload(
    "data:image/png;base64," + file,
    {
      public_id: `${itemId}`,
      folder: "MouseHole_PostImages",
      invalidate: invalidate,
    }
  ));
};

exports.getImageUrl = function (publicId, size = 64) {
  if (publicId) {
    return cloudinary.url(publicId, {
      aspect_ratio: "1.0",
      width: size,
      height: size,
      crop: "fill",
      invalidate: true,
    });
  } else {
    return "";
  }
};

exports.ImageDelete = async function (publicId) {
  await cloudinary.uploader.destroy(publicId, function (result) {});
};
