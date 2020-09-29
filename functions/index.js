// < --------------------------------------- >
//   DEPENDENCIES
// < --------------------------------------- >

const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const userRoute = express();

// < --------------------------------------- >
//   MIDDLEWARE
// < --------------------------------------- >

userRoute.use(cors({ origin: true }));

// < --------------------------------------- >
//   INITIALIZERS
// < --------------------------------------- >

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// < --------------------------------------- >
//   ROUTING
// < --------------------------------------- >

// <- GET ALL users ->
userRoute.get("/", async (req, res) => {
    const snapshot = await db.collection("users").get();
    let users = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        users.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(users));
});

// <- SHOW ONE user ->
userRoute.get("/:id", async (req, res) => {
    const snapshot = await db.collection("users").doc(req.params.id).get();
    const userId = snapshot.id;
    const userData = snapshot.data();

    res.status(200).send(JSON.stringify({ id: userId, ...userData }));
});

// <- CREATE NEW user ->
userRoute.post("/", async (req, res) => {
    const user = req.body;
    await db.collection("users").add(user);
    const newBlog = { name: req.body.userName };
    generateBlog(newBlog);
    res.status(201).send();
});

// <- REGISTER NEW user ->
userRoute.post("/register", (req, res) => {
    admin
        .auth()
        .createUser({
            email: req.body.email,
            password: req.body.password,
        })
        .then((userRecord) => {
            console.log(userRecord.uid);
            return db.collection("users").add({
                uid: userRecord.uid,
                userName: req.body.userName,
            });
        })
        .then(res.status(201).send())
        .catch((error) => {
            console.log("Error creating new user:", error);
        });
});

// <- UPDATE user ->
userRoute.put("/:id", async (req, res) => {
    const body = req.body;
    await db.collection("users").doc(req.params.id).update(body);
    res.status(200).send();
});

// <- DELETE user ->
userRoute.delete("/:id", async (req, res) => {
    await db.collection("users").doc(req.params.id).delete();
    res.status(200).send();
});

exports.user = functions.https.onRequest(userRoute);

// < --------------------------------------- >
//   CLOUD TRIGGERS
// < --------------------------------------- >

// account signup
exports.newUserSignup = functions.auth.user().onCreate((user) => {
    console.log("user created", user.email, user.uid);
    return db.collection("blogs").add({
        owner: user.uid,
        name: "testing",
    });
});

// account delete
exports.deleteUser = functions.auth.user().onDelete((user) => {
    const doc = db.collection("users").doc(user.uid);
    return doc.delete();
});

// for background triggers you must return a promise/value

// < --------------------------------------- >
//   UTILITY ACTIONS
// < --------------------------------------- >
