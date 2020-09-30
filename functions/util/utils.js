const { admin, db, firebase } = require("../helpers/initializers");

exports.testEmpty = (str) => {
    str.trim() === "" ? true : false;
};

exports.authorizeRequest = (req, res, next) => {
    let idToken;
    if (req.headers.authorization) {
        idToken = req.headers.authorization.split("Bearer ")[1];
    } else {
        return res.status(403).json({ error: "Unauthorized request" });
    }
    return admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
            req.user = decodedToken;
            return db
                .collection("users")
                .where("userId", "==", req.user.uid)
                .limit(1)
                .get();
        })
        .then((data) => {
            req.user.userName = data.docs[0].data().userName;
            return next();
        })
        .catch((error) => {
            return res.status(403).json(error);
        });
};
