const BusBoy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { admin, db, firebase } = require("../helpers/initializers");
const { testEmpty } = require("../util/utils");

// register and authenticate a new user

exports.signUp = (req, res) => {
    // prep new user payload from form
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        userName: req.body.userName,
    };
    const stockAvatar = "stockAvatar.png";
    const stockHeader = "stockHeader.png";
    let userToken, userId;
    let inputErrors = {};

    // test each field
    if (testEmpty(newUser.email)) {
        inputErrors.email = "Email field is required";
    }
    // else if (!testEmail(newUser.email)) {
    //     inputErrors.email = "Email is not a valid address";
    // }
    if (testEmpty(newUser.password)) {
        inputErrors.password = "Password is required";
    }
    if (newUser.password !== newUser.confirmPassword) {
        inputErrors.password = "Passwords do not match";
    }
    if (testEmpty(newUser.userName)) {
        inputErrors.userName = "Username is required";
    }

    // short circuit the rest of the operation if our
    // errors object has accumulated any errors
    if (Object.keys(inputErrors).length > 0) {
        return res.status(400).json(inputErrors);
    }
    // check if username is available
    db.doc(`/users/${newUser.userName}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return res
                    .status(400)
                    .json({ userName: "this user name is already taken" });
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(
                        newUser.email,
                        newUser.password
                    );
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((token) => {
            userToken = token;
            // create new user doc after validation
            const userCred = {
                userName: newUser.userName,
                email: newUser.email,
                createdAt: new Date(),
                userId: userId,
                location: "The Internet",
                bio: "I was born at a very young age..",
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${process.env.STORAGE_BUCKET}/o/${stockAvatar}?alt=media`,
                headerUrl: `https://firebasestorage.googleapis.com/v0/b/${process.env.STORAGE_BUCKET}/o/${stockHeader}?alt=media`,
            };
            return db.doc(`/users/${newUser.userName}`).set(userCred);
        })
        .then((data) => {
            return res.status(201).json({ userToken });
        })
        .catch((error) => {
            console.log(error);
            if (error.code === "auth/email-already-in-use") {
                return res
                    .status(400)
                    .json({ email: "this email is already registered" });
            } else {
                return res.status(500).json({ error: error.code });
            }
        });
};

// log in an existing user

exports.logIn = (req, res) => {
    const returningUser = {
        email: req.body.email,
        password: req.body.password,
    };
    let inputErrors = {};
    if (testEmpty(returningUser.email))
        inputErrors.email = "Please give an email address";
    if (testEmpty(returningUser.password))
        inputErrors.password = "Please enter your password";
    Object.keys(inputErrors).length > 0 && res.status(400).json(inputErrors);

    firebase
        .auth()
        .signInWithEmailAndPassword(returningUser.email, returningUser.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((userToken) => {
            return res.json({ userToken });
        })
        .catch((error) => {
            console.log(error);
            return res
                .status(403)
                .json({ message: "Incorrect login information" });
        });
};

exports.getUsers = async (req, res) => {
    const snapshot = await db.collection("users").get();
    let users = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        users.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(users));
};

exports.getUserByAuth = (req, res) => {
    // finds user doc that matches the auth token in request header
    db.doc(`/users/${req.user.userName}`)
        .get()
        .then((doc) => {
            userInfo = doc.data();
            return res.status(200).send(JSON.stringify(userInfo));
        })
        .catch((error) => {
            console.log(error);
            return res.status(500).json({ error: error.code });
        });
};

exports.getOneUser = (req, res) => {
    db.doc(`/users/${req.params.id}`)
        .get()
        .then((doc) => {
            userInfo = doc.data();
            const userDetails = {
                userId: userInfo.userId,
                userName: userInfo.userName,
                location: userInfo.location,
                imageUrl: userInfo.imageUrl,
                headerUrl: userInfo.headerUrl,
                bio: userInfo.bio,
            };
            return res.status(200).send(JSON.stringify(userDetails));
        })
        .catch((error) => {
            console.log(error);
            return res.status(500).json({ error: error.code });
        });
};

exports.createUser = async (req, res) => {
    const user = req.body;
    await db.collection("users").add(user);
    res.status(201).send();
};

exports.updateUser = (req, res) => {
    const userDetails = {
        location: req.body.location,
        bio: req.body.bio,
    };
    if (req.body.imageUrl) {
        userDetails.imageUrl = req.body.imageUrl;
    }
    if (req.body.headerUrl) {
        userDetails.headerUrl = req.body.headerUrl;
    }
    db.collection("users").doc(req.user.userName).update(userDetails);
    res.status(200).json(userDetails);
};

exports.deleteUser = async (req, res) => {
    await db.collection("users").doc(req.params.id).delete();
    res.status(200).send();
};

// add user details

exports.addUserDetails = (req, res) => {
    let userDetails = req.body;
    db.doc(`/users/${req.user.userName}`)
        .update(userDetails)
        .then(() => {
            return res.status(200).json({ message: "user details updated" });
        })
        .catch((error) => {
            console.log(error);
            return res.status(500).json({ error: error.code });
        });
};

// add user profile pic
exports.uploadImage = (req, res) => {
    let imageFileName;
    let imageFileToBeUpload = {};

    const busBoy = new BusBoy({ headers: req.headers });
    busBoy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        const imageSplit = filename.split(".");
        const imageExtension = imageSplit[imageSplit.length - 1];
        imageFileName = `${Math.round(
            Math.random() * 100000
        )}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageFileToBeUpload = { filePath, mimetype };
        file.pipe(fs.createWriteStream(filePath));
    });
    busBoy.on("finish", () => {
        admin
            .storage()
            .bucket()
            .upload(imageFileToBeUpload.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageFileToBeUpload.mimetype,
                    },
                },
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.STORAGE_BUCKET}/o/${imageFileName}?alt=media`;
                return db
                    .doc(`/users/${req.user.userName}`)
                    .update({ imageUrl: imageUrl });
            })
            .then(() => {
                return res.json({ message: "profile pic uploaded" });
            })
            .catch((error) => {
                return res.status(500).json({ error: error.code });
            });
    });
    busBoy.end(req.rawBody);
};

// ^^replicate this logic to add photo to post ?
