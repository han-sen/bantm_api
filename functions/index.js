// < --------------------------------------- >
//   DEPENDENCIES
// < --------------------------------------- >

require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const app = express();

// < --------------------------------------- >
//   MIDDLEWARE
// < --------------------------------------- >

app.use(cors());

// < --------------------------------------- >
//   INITIALIZERS
// < --------------------------------------- >

const { db, admin, firebase } = require("./helpers/initializers");

// < --------------------------------------- >
//   UTILITIES
// < --------------------------------------- >

const { testEmpty, authorizeRequest } = require("./util/utils");

// < --------------------------------------- >
//   ROUTING
// < --------------------------------------- >

const {
    getUsers,
    getOneUser,
    createUser,
    addUserDetails,
    updateUser,
    deleteUser,
    signUp,
    logIn,
    uploadImage,
} = require("./controllers/users");

const { getPosts, createPost } = require("./controllers/posts");

// <---------- USERS ----------> //

// GET ALL users
app.get("/users", getUsers);

// CREATE NEW user
app.post("/users", authorizeRequest, addUserDetails);

// SHOW ONE user
app.get("/users/:id", getOneUser);

// UPDATE user
app.put("/users/:id", updateUser);

// DELETE user
app.delete("/users/:id", deleteUser);

// ADD USER PIC
app.post("/users/image", authorizeRequest, uploadImage);

// SIGNUP & create new user
app.post("/signup", signUp);

// LOGIN
app.post("/login", logIn);

// <---------- POSTS ----------> //

// GET ALL posts
app.get("/posts", getPosts);

// CREATE NEW post
app.post("/posts", authorizeRequest, createPost);

// < --------------------------------------- >
//   EXPORTS
// < --------------------------------------- >

exports.api = functions.https.onRequest(app);
