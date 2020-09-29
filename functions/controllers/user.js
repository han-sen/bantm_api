// // < --------------------------------------- >
// //   DEPENDENCIES
// // < --------------------------------------- >

// const functions = require("firebase-functions");
// const express = require("express");
// const cors = require("cors");
// const userRoute = express();

// // < --------------------------------------- >
// //   MIDDLEWARE
// // < --------------------------------------- >

// userRoute.use(cors({ origin: true }));

// // < --------------------------------------- >
// //   ROUTING
// // < --------------------------------------- >

// const admin = require("firebase-admin");
// admin.initializeApp();
// const db = admin.firestore();

// // <- GET ALL users ->
// userRoute.get("/", async (req, res) => {
//     const snapshot = await db.collection("users").get();
//     let users = [];
//     snapshot.forEach((doc) => {
//         let id = doc.id;
//         let data = doc.data();
//         users.push({ id, ...data });
//     });
//     res.status(200).send(JSON.stringify(users));
// });

// // <- SHOW ONE user ->
// userRoute.get("/:id", async (req, res) => {
//     const snapshot = await db.collection("users").doc(req.params.id).get();
//     const userId = snapshot.id;
//     const userData = snapshot.data();

//     res.status(200).send(JSON.stringify({ id: userId, ...userData }));
// });

// // <- CREATE NEW user ->
// userRoute.post("/", async (req, res) => {
//     const user = req.body;
//     await db.collection("users").add(user);
//     res.status(201).send();
// });

// // <- UPDATE user ->
// userRoute.put("/:id", async (req, res) => {
//     const body = req.body;
//     await db.collection("users").doc(req.params.id).update(body);
//     res.status(200).send();
// });

// // <- DELETE user ->
// userRoute.delete("/:id", async (req, res) => {
//     await db.collection("users").doc(req.params.id).delete();
//     res.status(200).send();
// });

// exports.user = functions.https.onRequest(userRoute);
