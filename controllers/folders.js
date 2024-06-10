const foldersRouter = require("express").Router();
const Folder = require("../models/folder");
const uuid = require("uuid");
const File = require("../models/file");
const ImageData = require("../models/imagedata");

const deleteFolderRecursive = async (folder) => {
  for (const subFolderId of folder.subFolders) {
    const subFolder = await Folder.findById(subFolderId);
    await deleteFolderRecursive(subFolder);
  }
  // Once all the subfolders are deleted, delete this folder's files and itself

  for (const fileId of folder.files) {
    await File.findByIdAndDelete(fileId);
    await ImageData.findOneAndDelete({ fileId });
  }

  await Folder.findByIdAndDelete(folder._id);
};

foldersRouter.get("/", async (request, response) => {
  const { queryValue, queryType } = request.query;

  if (queryType === "url") {
    const folder = await Folder.findOne({
      url: `/${queryValue}`,
      userId: request.user,
    })
      .populate("subFolders")
      .populate("files");
    return response.json(folder);
  }

  if (queryType === "id") {
    const folder = await Folder.findById(queryValue)
      .populate("subFolders")
      .populate("files");
    if (folder.userId.toString() !== request.user.toString()) {
      return response.status(401).json({ error: "Unauthorized" });
    }
    return response.json(folder);
  }

  response.status(400).json({ error: "Invalid query" });
});

foldersRouter.post("/", async (request, response) => {
  const { queryValue, queryType } = request.query;
  const { name } = request.body;

  if (queryType === "url") {
    const parentFolder = await Folder.findOne({ url: `/${queryValue}` });
    if (!parentFolder) {
      return response.status(400).json({ error: "Parent folder not found" });
    }
    if (parentFolder.userId.toString() !== request.user.toString()) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const newFolder = new Folder({
      name,
      url: `/${uuid.v4()}`,
      userId: request.user,
      parentFolderId: parentFolder._id,
    });

    const savedFolder = await newFolder.save();

    parentFolder.subFolders = parentFolder.subFolders.concat(savedFolder._id);
    await parentFolder.save();

    return response.json(savedFolder);
  }

  response.status(400).json({ error: "Invalid query" });
});

foldersRouter.delete("/", async (request, response) => {
  const { queryValue, queryType } = request.query;

  if (queryType === "id") {
    const folder = await Folder.findById(queryValue);
    if (!folder) {
      return response.status(400).json({ error: "Folder not found" });
    }

    if (folder.userId.toString() !== request.user.toString()) {
      return response.status(401).json({ error: "Unauthorized" });
    }
    const parentFolder = await Folder.findById(folder.parentFolderId);
    await deleteFolderRecursive(folder);

    parentFolder.subFolders = parentFolder.subFolders.filter(
      (subFolderId) => subFolderId.toString() !== folder._id.toString()
    );
    await parentFolder.save();

    return response.status(204).end();
  }
});

module.exports = foldersRouter;
