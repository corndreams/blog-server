var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const db = require("./models/db");

const { verifyToken } = require("./middleware/auth.js");

// var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authRouter = require("./routes/auth");
var articlesRouter = require("./routes/articles");
var tagsRouter = require("./routes/tags");
var categoriesRouter = require("./routes/categories");
var commentsRouter = require("./routes/comments");
var messagesRouter = require("./routes/messages");
var filesRouter = require("./routes/files");
var archiveRouter = require("./routes/archive");
var diaryRouter = require("./routes/diary");
var visitsRouter = require("./routes/visits");
var dashboardRouter = require("./routes/dashboard");
var linksRouter = require("./routes/links");

var app = express();
app.use(cors());

app.use(logger("dev"));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/articles", articlesRouter);
app.use("/tags", tagsRouter);
app.use("/categories", categoriesRouter);
app.use("/comments", commentsRouter);
app.use("/messages", messagesRouter);
app.use("/files", filesRouter);
app.use("/archive", archiveRouter);
app.use("/diary", diaryRouter);
app.use("/visits", visitsRouter);
app.use("/dashboard", dashboardRouter);
app.use("/links", linksRouter);

module.exports = app;
