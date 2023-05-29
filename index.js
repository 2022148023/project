const express = require("express");
const path = require("path");
require("dotenv").config();

// initialize new express app
const app = express();

// set template engine to ejs
app.set("view engine", "ejs");

// serve static files located in public directory testing
app.use(express.static(path.join(__dirname, "public")));

app.engine("html", require("ejs").renderFile);

app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// main page
app.get("/map", function (req, res) {
  res.render("map", {
    KAKAO_MAP_JAVASCRIPT_KEY:
      process.env.KAKAO_MAP_JAVASCRIPT_KEY ||
      "64e36d7df07a48189e25336dc4137d96",
  });
});

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/scan", (req, res) => {
  res.render("scan");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
