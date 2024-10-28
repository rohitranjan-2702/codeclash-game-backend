import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const MONGODB_URI = process.env.MONGODB_URI as string;
const client = new MongoClient(MONGODB_URI);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("connected to db");
  } catch (error) {
    console.log(error);
  }
}
connectToDatabase();

export default client.db("multiplayer-game");
