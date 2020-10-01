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

const {
    getPosts,
    getOnePost,
    createPost,
    addComment,
    addLike,
    unLike,
    deletePost,
} = require("./controllers/posts");

// <---------- REGISTRATION & LOGIN ----------> //

// SIGNUP & create new user
app.post("/signup", signUp);

// LOGIN
app.post("/login", logIn);

// <---------- USERS ----------> //

// GET ALL users
app.get("/users", getUsers);

// ADD USER details
app.post("/users", authorizeRequest, addUserDetails);

// SHOW ONE user
app.get("/users/:id", getOneUser);

// UPDATE user
app.put("/users/:id", authorizeRequest, updateUser);

// DELETE user
app.delete("/users/:id", authorizeRequest, deleteUser);

// ADD USER PIC
app.post("/users/image", authorizeRequest, uploadImage);

// <---------- POSTS ----------> //

// GET ALL posts
app.get("/posts", getPosts);

// GET ONE post
app.get("/posts/:postId", getOnePost);

// LIKE a post
app.post("/posts/:postId/like", authorizeRequest, addLike);

// UNLIKE a post
app.post("/posts/:postId/unlike", authorizeRequest, unLike);

// ADD COMMENTS to a post
app.post("/posts/:postId/comment", authorizeRequest, addComment);

// CREATE NEW post
app.post("/posts", authorizeRequest, createPost);

// DELETE a post
app.delete("/posts/:postId", authorizeRequest, deletePost);

// TODOS
// DELETE POST

// < --------------------------------------- >
//   EXPORTS
// < --------------------------------------- >

exports.api = functions.https.onRequest(app);
