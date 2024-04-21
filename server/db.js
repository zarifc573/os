//db.js

const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://ahnaf:digital@os.0ukkmac.mongodb.net/?retryWrites=true&w=majority&appName=os'; // MongoDB connection URI
const client = new MongoClient(uri);

async function connect() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

module.exports = {
    connect,
    client
};

