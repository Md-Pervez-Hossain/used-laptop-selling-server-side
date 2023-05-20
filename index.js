const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zr5yxev.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unAuthorised");
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send("unAuthorised");
    }
    req.decoded = decoded;
    next();
  });
}

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
    const wishListCollection = client.db("usedLaptop").collection("wishlist");
    const singleBookCollection = client
      .db("usedLaptop")
      .collection("singleBooking");
    const paymentsCollection = client.db("usedLaptop").collection("payments");

    app.post("/payments", async (req, res) => {
      const payments = req.body;
      const result = await paymentsCollection.insertOne(payments);
      const id = payments.bookingId;
      console.log(id);
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transtionId: payments.transTionId,
        },
      };
      const updateResult = await buyerBookingCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      console.log(price);
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    // jwt token
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      console.log(user);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "10h",
        });
        return res.send({ accessToken: token });
      }
      res.status(401).send("unAuthorised");
    });

    //wishlist
    app.post("/wishlist/:email", async (req, res) => {
      const wishlist = req.body;
      console.log(wishlist);
      const result = await wishListCollection.insertOne(wishlist);
      res.send(result);
    });
    app.get("/wishlist/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (decodedEmail !== email) {
        return res.status(403).send("Forbidden");
      }
      const query = { email: email };
      const result = await wishListCollection.find(query).toArray();
      res.send(result);
    });

    //getBuyer and seller
    app.get("/mybuyers/:role", verifyJWT, async (req, res) => {
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
    app.get("/advertisement", async (req, res) => {
      const query = {};
      const result = await advertisementCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/advertisement/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await advertisementCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/advertisement/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {
        advertiseProductId: id,
      };
      const result = await advertisementCollection.deleteOne(query);
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
      const id = req.params.id;
      console.log(id);
      const filter = { bookingId: id };
      console.log(filter);
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
    app.get("/myproduct/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (decodedEmail !== email) {
        return res.status(403).send("Forbidden");
      }
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
      const user = await usersCollection.findOne(query);
      res.send(user);
    });
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/user/:role", async (req, res) => {
      const role = req.params.role;
      const query = { role: role };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/userss/:status", async (req, res) => {
      const status = req.params.status;
      const query = { status: status };
      const user = await usersCollection.find(query).toArray();
      res.send(user);
    });
    app.post("/users", async (req, res) => {
      const users = req.body;
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateVerify = {
        $set: {
          status: "verified",
        },
      };
      const verify = await usersCollection.updateOne(
        filter,
        updateVerify,
        options
      );
      res.send(verify);
    });
    //booking api
    app.post("/buyerBooking", async (req, res) => {
      const buyerBooking = req.body;
      const booking = await buyerBookingCollection.insertOne(buyerBooking);
      res.send(booking);
    });
    app.get("/buyerBooking/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const decodedEmail = req.decoded.email;
      if (decodedEmail !== email) {
        return res.status(403).send("Forbidden");
      }
      const query = { email: email };
      const myBooking = await buyerBookingCollection.find(query).toArray();
      res.send(myBooking);
    });
    app.get("/buyer-booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await buyerBookingCollection.findOne(query);
      console.log(result);
      res.send(result);
    });
    app.get("/buyer-booking", async (req, res) => {
      const query = {};
      const result = await buyerBookingCollection.find(query).toArray();
      res.send(result);
    });
    // app.get("/buyerBooking/:id", async (req, res) => {
    //   const id = req.params.id;
    //   console.log(id);
    //   const query = { _id: ObjectId(id) };
    //   const result = await buyerBookingCollection.findOne(query);
    //   res.send(result);
    // });
    // app.get("/buyerBooking/:id", async (req, res) => {
    //   const id = req.params.id;
    //   console.log(id);
    //   const query = { _id: ObjectId(id) };
    //   const booking = await buyerBookingCollection.findOne(query);
    //   res.send(booking);
    // });

    app.post("/singleBooking", async (req, res) => {
      const Book = req.bodyconst;
      const singleBook = await singleBookCollection.insertOne(Book);
      res.send(singleBook);
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
