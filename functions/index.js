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
    getUserByAuth,
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
    getUsersPosts,
} = require("./controllers/posts");

// <---------- REGISTRATION & LOGIN ----------> //

// SIGNUP & create new user
app.post("/signup", signUp);

// LOGIN
app.post("/login", logIn);

// <---------- USERS ----------> //

// GET CURRENT USER DETAILS FROM AUTH TOKEN
app.get("/user", authorizeRequest, getUserByAuth);

// GET ALL users
app.get("/users", authorizeRequest, getUsers);

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

// GET ALL posts by ONE USER
app.get("posts/users/:userName", getUsersPosts);

// GET ONE post
app.get("/posts/:postId", getOnePost);

// LIKE a post
app.post("/posts/:postId/like", authorizeRequest, addLike);

// UNLIKE a post
app.post("/posts/:postId/unlike", authorizeRequest, unLike);

// ADD COMMENT to a post
app.post("/posts/:postId/comment", authorizeRequest, addComment);

// CREATE NEW post
app.post("/posts", authorizeRequest, createPost);

// DELETE a post
app.delete("/posts/:postId", authorizeRequest, deletePost);

// TODO -- NOTIFICATION SYSTEM
// add a cloud trigger for likes and comments
// push a new notification document with:
// name of liker/commenter, post being liked/commented, and post owner
// then we can get display a notification feed

// < --------------------------------------- >
//   EXPORTS
// < --------------------------------------- >

exports.api = functions.https.onRequest(app);

// USER CHANGES IMAGES TRIGGER
// need to add new imageURL to all of their posts

exports.onUserImageChange = functions
    .region("us-east1")
    .firestore.document("/users/{userId}")
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log("image has changed");
            const batch = db.batch();
            return db
                .collection("posts")
                .where("userName", "==", change.before.data().userName)
                .get()
                .then((data) => {
                    data.forEach((doc) => {
                        const post = db.doc(`/posts/${doc.id}`);
                        batch.update(post, {
                            imageUrl: change.after.data().imageUrl,
                        });
                    });
                    return batch.commit();
                });
        } else return true;
    });
