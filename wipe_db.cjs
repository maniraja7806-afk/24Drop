const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://24drop_app:24drop_app@cluster0.ytwevos.mongodb.net/24drop?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    const db = client.db("24drop");
    await db.collection("messages").deleteMany({});
    await db.collection("chats").deleteMany({});
    await db.collection("posts").deleteMany({});
    await db.collection("sessions").deleteMany({});
    await db.collection("attachments").deleteMany({});
    await db.collection("messagereactions").deleteMany({});
    await db.collection("postreactions").deleteMany({});
    await db.collection("pinnedposts").deleteMany({});
    await db.collection("pinnedmessages").deleteMany({});
    console.log("Database cleared successfully");
  } catch (e) {
    console.error("Connection failed:", e.message);
  } finally {
    await client.close();
  }
}
run();
