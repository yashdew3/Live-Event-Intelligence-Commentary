require('dotenv').config();
const mongoose = require('mongoose');

let isConnected = false;

const connectMongo = async () => {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DB_NAME,
    });
    isConnected = true;
    console.log('Workers: Connected to MongoDB Atlas');
};

module.exports = { connectMongo };