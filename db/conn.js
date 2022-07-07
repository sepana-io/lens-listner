require('dotenv').config()
const { MongoClient } = require("mongodb");

const username = process.env.LENS_MONGO_USER
const password = process.env.LENS_MONGO_PASSWORD
const host = process.env.LENS_MONGO_HOST
const database = process.env.LENS_MONGO_DATABASE

const connectionString = `mongodb+srv://${username}:${password}@${host}`;
const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnection;

module.exports = {
  connectToServer: function (callback) {
    client.connect(function (err, db) {
      if (err || !db) {
        return callback(err);
      }

      dbConnection = db.db(database);
      console.log("Successfully connected to MongoDB.");

      return callback();
    });
  },

  getDb: function () {
    return dbConnection;
  },
};