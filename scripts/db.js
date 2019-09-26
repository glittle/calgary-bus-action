var firebaseAdmin = require("firebase-admin");
var serviceAccount = require(process.env.serviceFile);

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: process.env.fireBaseUrl
});

var db = firebaseAdmin.database();
var rootRef = db.ref("/");
var lastAccessRef = db.ref("/last_access");

lastAccessRef.once("value", function(snapshot) {
    console.log('last_access was: ', snapshot.val());
    rootRef.update({
        last_access: new Date()
    });
});

var knownUsersRef = db.ref('/usersV2');

module.exports = {
    knownUsersRef: knownUsersRef
}
