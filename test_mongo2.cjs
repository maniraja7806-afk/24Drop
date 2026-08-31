const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://24drop_app:24drop_app@cluster0.ytwevos.mongodb.net/24drop?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to server");
  } catch (e) {
    console.error("Connection failed:", e.message);
  } finally {
    await client.close();
  }
}
run();
