const { admin, db, firebase } = require("../helpers/initializers");

exports.getPosts = async (req, res) => {
    const snapshot = await db
        .collection("posts")
        .orderBy("createdAt", "desc")
        .get();
    let posts = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        posts.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(posts));
};

// get posts that match a username
exports.getUsersPosts = async (req, res) => {
    const snapshot = await db
        .collection("posts")
        .where("userName", "=", req.params.userName)
        .orderBy("createdAt", "desc")
        .get();
    let posts = [];
    snapshot.forEach((doc) => {
        let data = doc.data();
        posts.push(data);
    });
    res.status(200).send(JSON.stringify(posts));
};

exports.getOnePost = (req, res) => {
    let postData = {};
    db.doc(`/posts/${req.params.postId}`)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res
                    .status(404)
                    .json({ error: "We couldn't find that post" });
            }
            postData = doc.data();
            postData.postId = doc.id;
            // also fetch any comments associated with this post
            // this will use the index FB created
            return db
                .collection("comments")
                .orderBy("createdAt", "desc")
                .where("postId", "=", req.params.postId)
                .get();
        })
        // then stick all those comments into the object we'll return in json
        .then((data) => {
            postData.comments = [];
            data.forEach((doc) => {
                postData.comments.push(doc.data());
            });
            return res.json(postData);
        })
        .catch((error) => {
            console.log(error);
            return res.status(500).json({ error: error.code });
        });
};

exports.createPost = (req, res) => {
    // set 0 values for likes and comments on a new post
    // otherwise FB will give a NaN when we try and update them
    const newPost = {
        postBody: req.body.postBody,
        postImg: req.body.postImg,
        userName: req.user.userName,
        imageUrl: req.user.imageUrl,
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
    };
    return db
        .collection("posts")
        .add(newPost)
        .then((doc) => {
            const formattedPost = newPost;
            formattedPost.postId = doc.id;
            return res.json(formattedPost);
        })
        .catch((error) => {
            res.status(500).json({ error: error.code });
        });
};

exports.addComment = (req, res) => {
    // add in the user's avatar so we can display it inline on the front-end
    const newComment = {
        commentBody: req.body.commentBody,
        createdAt: new Date().toISOString(),
        postId: req.params.postId,
        userName: req.user.userName,
        imageUrl: req.user.imageUrl,
    };
    db.doc(`/posts/${req.params.postId}`)
        .get()
        // first make sure we're on a valid post
        .then((doc) => {
            if (!doc.exists) {
                return res
                    .status(404)
                    .json({ error: "this post no longer exists" });
            }
            // increment the post that's recieving the comment
            return doc.ref.update({ comments: doc.data().comments + 1 });
        })
        .then(() => {
            // add the new comment to the comment collection
            return db.collection("comments").add(newComment);
        })
        .then(() => {
            return res.json(newComment);
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({ error: error.code });
        });
};

exports.addLike = (req, res) => {
    // grab reference to the like we're creating so we can check if it exists
    const likeDoc = db
        .collection("likes")
        .where("userName", "=", req.user.userName)
        .where("postId", "=", req.params.postId)
        .limit(1);
    // grab reference to the post we're liking
    const postDoc = db.doc(`/posts/${req.params.postId}`);

    let postData = {};

    postDoc
        .get()
        .then((doc) => {
            // if post exists
            if (doc.exists) {
                // fill our empty json obj with the post data
                postData = doc.data();
                postData.postId = doc.id;
                return likeDoc.get();
            } else {
                return res
                    .status(404)
                    .json({ error: "This post no longer exists" });
            }
        })
        .then((data) => {
            // if like record doesn't exist then we haven't like this post yet and can proceed
            // add a new like doc containing to id of the 'liked' post, and the user name of the 'liker'
            if (data.empty) {
                postData.likes++;
                return postDoc.update({ likes: postData.likes });
            } else {
                return res
                    .status(400)
                    .json({ error: "This post has already been liked" });
            }
        })
        .then(() => {
            return db.doc(`/users/${req.user.userName}`).update({
                likes: arrayUnion(postData.postId),
            });
        })
        .then(() => {
            return res.json(postData);
        })
        .catch((error) => {
            res.status(500).json({ error: error.code });
        });
};

exports.unLike = (req, res) => {
    // this route is essentially identical to liking a post
    // except we need to decrement like count, and delete the like record
    const likeDoc = db
        .collection("likes")
        .where("userName", "=", req.user.userName)
        .where("postId", "=", req.params.postId)
        .limit(1);
    const postDoc = db.doc(`/posts/${req.params.postId}`);

    let postData = {};

    postDoc
        .get()
        .then((doc) => {
            if (doc.exists) {
                postData = doc.data();
                postData.postId = doc.id;
                return likeDoc.get();
            } else {
                return res
                    .status(404)
                    .json({ error: "This post no longer exists" });
            }
        })
        .then((data) => {
            if (data.empty) {
                return res
                    .status(400)
                    .json({ error: "This post has already been liked" });
            } else {
                return (
                    db
                        // delete the 'like' doc that was created when post was initially liked
                        // data returns an array even with 1 result so we need to add index 0
                        .doc(`/likes/${data.docs[0].id}`)
                        .delete()
                        .then(() => {
                            // make sure we don't go into negative likes
                            // then decrement the link count
                            if (postData.likes > 0) {
                                postData.likes--;
                            }
                            return postDoc.update({ likes: postData.likes });
                        })
                        .then(() => {
                            return res.json(postData);
                        })
                );
            }
        })
        .catch((error) => {
            res.status(500).json({ error: error.code });
        });
};

exports.deletePost = (req, res) => {
    // get ref to post we want to delete
    const postToDelete = db.doc(`/posts/${req.params.postId}`);
    postToDelete
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res
                    .status(404)
                    .json({ error: "This post no longer exists" });
            }
            // make sure that the delete request is coming from the post author
            if (doc.data().userName !== req.user.userName) {
                return res.status(503).json({
                    error: "You don't have permission to delete this post",
                });
            } else {
                return postToDelete.delete();
            }
        })
        .then(() => {
            return res.json({ message: "Post has been deleted" });
        })
        .catch((error) => {
            return res.status(500).json({ error: error.code });
        });
};
