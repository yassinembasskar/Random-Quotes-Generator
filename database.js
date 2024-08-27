import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017'; 

const dbName = 'random-quotes-generator';

let db;

export async function connectToDatabase() {
    if (db) return db; 

    try {
        const client = new MongoClient(uri);

        await client.connect();

        db = client.db(dbName);

        console.log(`Connected to database: ${dbName}`);
        return db;
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        throw err;
    }
}