const loginRouter = require("./login");
const foldersRouter = require("./folders");
const middleware = require("../utils/middleware");
const registerRouter = require("./register");
const filesRouter = require("./files");

const apiRouter = require("express").Router();

apiRouter.use(middleware.tokenExtractor);

apiRouter.use("/login", loginRouter);
apiRouter.use("/register", registerRouter);
apiRouter.use("/folders", middleware.userExtractor, foldersRouter);
apiRouter.use("/files", middleware.userExtractor, filesRouter);

apiRouter.use(middleware.unknownEndpoint);

module.exports = apiRouter;
