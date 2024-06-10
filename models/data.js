const mongoose = require("mongoose");

const imageDataSchema = new mongoose.Schema({
  data: {
    type: String,
    required: true,
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
  },
});

imageDataSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("ImageData", imageDataSchema);
