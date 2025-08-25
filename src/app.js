
require('dotenv').config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const { sequelize } = require("./configs/db"); 
const app = express();
const methodOverride = require("method-override");

const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require('./routes/userRoutes');
const authRoutes = require("./routes/authRoutes");

app.use(methodOverride("_method"));

// Create the session store instance
const sessionStore = new SequelizeStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
  extendDefaultFields: (defaults, session) => {
    return {
      ...defaults,
      userId: session.userId || null,
    };
  },
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_default_secret_key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware to expose models to requests
app.use((req, res, next) => {
  req.models = require("./models");
  next();
});

// Home route
app.get('/', (req, res) => {
  res.render('home');
});

app.use('/user', userRoutes);
app.use("/admin", adminRoutes);
app.use("/", authRoutes);

module.exports = app;