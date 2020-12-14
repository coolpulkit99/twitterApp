var mongoose = require('mongoose');
require('dotenv').config();


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;
const tweetSchema = new Schema({
    "_id": String,
    "data": [{

        "tweet": String,
        "user": String

    }],
});
var tweetData = mongoose.model("TopicData", tweetSchema);




module.exports = {
    createUserTweet: function (dataObj, callback) {
        console.log("saving data");
        let user = new tweetData(dataObj);
        user.save(function (err, data) {
            if (err)
                return err;

            console.log("saved Data");
        });
    },
    deleteUserTweet: function (username) {
        console.log("deleting " + username);
        tweetData.deleteOne({ "user": username });
    }

};