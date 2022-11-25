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
    const buyerBookingCollection = client
      .db("usedLaptop")
      .collection("buyerBooking");
    const usersCollection = client.db("usedLaptop").collection("users");
    const advertisementCollection = client
      .db("usedLaptop")
      .collection("advertisement");

    //getBuyer and seller
    app.get("/mybuyers/:role", async (req, res) => {
      const role = req.params.role;
      console.log(role);
      const query = { role: role };
      const buyer = await usersCollection.find(query).toArray();
      res.send(buyer);
    });

    //delete buyer and seller
    app.delete("/deleteBuyers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const removeBuyers = await usersCollection.deleteOne(query);
      res.send(removeBuyers);
    });

    //advertisement
    app.post("/advertisement", async (req, res) => {
      const advertisement = req.body;
      const advertisementProduct = await advertisementCollection.insertOne(
        advertisement
      );
      res.send(advertisementProduct);
    });
    //show advertisement on ui
    app.get("/advertisement/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await advertisementCollection.find(query).toArray();
      res.send(result);
    });
    //add products api
    app.post("/addproducts", async (req, res) => {
      const products = req.body;
      const result = await productsCollection.insertOne(products);
      res.send(result);
    });
    app.put("/addproducts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $set: {
          booked: true,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });
    //after order cancle change product booked status
    app.put("/productupdate/:id", async (req, res) => {
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $set: {
          booked: false,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });

    app.get("/addproducts", async (req, res) => {
      const query = {};
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/addproducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { categoryProduct: id };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/addproduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });
    //seller own product
    app.get("/myproduct/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const myProduct = await productsCollection.find(query).toArray();
      res.send(myProduct);
    });
    // seller product delete
    app.delete("/deleteMyProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deleteMyProduct = await productsCollection.deleteOne(query);
      res.send(deleteMyProduct);
    });
    //users api
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.find(query).toArray();
      res.send(user);
    });
    app.post("/users", async (req, res) => {
      const users = req.body;
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });
    //booking api
    app.post("/buyerBooking", async (req, res) => {
      const buyerBooking = req.body;
      const booking = await buyerBookingCollection.insertOne(buyerBooking);
      res.send(booking);
    });
    app.get("/buyerBooking/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const myBooking = await buyerBookingCollection.find(query).toArray();
      res.send(myBooking);
    });
    //delete booking
    app.delete("/mybooking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deleteMybooking = await buyerBookingCollection.deleteOne(query);
      res.send(deleteMybooking);
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
