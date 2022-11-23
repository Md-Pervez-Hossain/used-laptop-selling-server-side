const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zr5yxev.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const productsCollection = client.db("usedLaptop").collection("laptop");
    //add products api
    app.post("/addproducts", async (req, res) => {
      const products = req.body;
      const result = await productsCollection.insertOne(products);
      res.send(result);
    });

    app.get("/addproducts", async (req, res) => {
      const query = {};
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/addproducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { productId: id };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    console.log("database Connected");
  } finally {
  }
}
run().catch((error) => {
  console.log(error);
});

app.get("/", (req, res) => {
  res.send("server running");
});
app.listen(port, () => {
  console.log("server running");
});
