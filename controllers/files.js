const filesRouter = require("express").Router();
const File = require("../models/file");
const uuid = require("uuid");
const ImageData = require("../models/data");
const Folder = require("../models/folder");

filesRouter.get("/", async (request, response) => {
  const { queryValue, queryType } = request.query;
  if (queryType === "url") {
    const file = await File.findOne({
      url: `/${queryValue}`,
    }).populate("imageDataRef");

    if (!file) {
      return response.status(404).json({ error: "File not found" });
    }
    if (!request.user || file.userId.toString() !== request.user.toString()) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const base64Data = file.imageDataRef.data;

    return response.json({ base64Data, type: file.type });
  }

  if (queryType === "all") {
    const files = await File.find({ userId: request.user });
    return response.json(files);
  }

  response.status(400).json({ error: "Invalid query" });
});

filesRouter.post("/", async (request, response) => {
  const { queryValue, queryType } = request.query;
  const { name, size, base64Data, type } = request.body;

  if (queryType === "url") {
    const parentFolder = await Folder.findOne({ url: `/${queryValue}` });
    if (!parentFolder) {
      return response.status(400).json({ error: "Parent folder not found" });
    }
    if (parentFolder.userId.toString() !== request.user.toString()) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const newFile = new File({
      name,
      url: `/${uuid.v4()}`,
      userId: request.user,
      parentFolderId: parentFolder._id,
      size,
      type,
    });

    const newImageData = new ImageData({
      data: base64Data,
      fileId: newFile._id,
    });

    newFile.imageDataRef = newImageData._id;

    parentFolder.files = parentFolder.files.concat(newFile._id);

    await parentFolder.save();
    const savedFile = await newFile.save();
    await newImageData.save();

    response.status(201).json(savedFile);
  }
});

filesRouter.delete("/", async (request, response) => {
  const { queryValue, queryType } = request.query;

  if (queryType === "id") {
    const file = await File.findById(queryValue);
    if (!file) {
      return response.status(404).json({ error: "File not found" });
    }
    if (!request.user || file.userId.toString() !== request.user.toString()) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const parentFolder = await Folder.findById(file.parentFolderId);

    if (!parentFolder) {
      return response.status(404).json({ error: "Parent folder not found" });
    }

    parentFolder.files = parentFolder.files.filter(
      (f) => f.toString() !== file._id.toString()
    );

    await ImageData.findOneAndDelete({ fileId: file._id });
    await File.findByIdAndDelete(file._id);
    await parentFolder.save();

    return response.status(204).end();
  }
});

module.exports = filesRouter;
