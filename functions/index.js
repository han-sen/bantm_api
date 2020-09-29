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

app.use(cors({ origin: true }));

// < --------------------------------------- >
//   INITIALIZERS
// < --------------------------------------- >

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
};

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

// < --------------------------------------- >
//   ROUTING
// < --------------------------------------- >

// <- GET ALL users ->
app.get("/users", async (req, res) => {
    const snapshot = await db.collection("users").get();
    let users = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        users.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(users));
});

// <- CREATE NEW user ->
app.post("/users", async (req, res) => {
    const user = req.body;
    await db.collection("users").add(user);
    res.status(201).send();
});

// <- SHOW ONE user ->
app.get("/users/:id", async (req, res) => {
    const snapshot = await db.collection("users").doc(req.params.id).get();
    const userId = snapshot.id;
    const userData = snapshot.data();

    res.status(200).send(JSON.stringify({ id: userId, ...userData }));
});

// <- UPDATE user ->
app.put("/users/:id", async (req, res) => {
    const body = req.body;
    await db.collection("users").doc(req.params.id).update(body);
    res.status(200).send();
});

// <- DELETE user ->
app.delete("/users/:id", async (req, res) => {
    await db.collection("users").doc(req.params.id).delete();
    res.status(200).send();
});

// SIGNUP

app.post("/signup", (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        userName: req.body.userName,
    };
    firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
        .then((data) => {
            return res.status(201).json({
                message: `user ${data.user.uid} signed up successfully`,
            });
        })
        .catch((error) => {
            return res.status(json({ error: error.code }));
        });
});

// POSTS

// <- GET ALL posts ->
app.get("/posts", async (req, res) => {
    const snapshot = await db.collection("posts").get();
    let posts = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        posts.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(posts));
});

app.post("/posts", (req, res) => {
    const newPost = {
        postBody: req.body.postBody,
        userName: req.body.userName,
    };
    return db.collection("posts").add(newPost).then(res.status(200).send());
});

// < --------------------------------------- >
//   EXPORTS
// < --------------------------------------- >

exports.api = functions.https.onRequest(app);
