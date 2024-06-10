const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  parentFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  size: {
    type: Number,
    required: true,
    default: 0,
  },
  url: {
    type: String,
    required: true,
  },
  imageDataRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ImageData",
    default: null,
  },
  type: {
    type: String,
    required: true,
  },
});

fileSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("File", fileSchema);
