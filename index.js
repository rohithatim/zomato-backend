const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

/** SCHEMAS */
const UserScheme = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  address: String,
});

const restaurantSchema = new mongoose.Schema({
  name: String,
  address: String,
  cuisine: String,
  rating: Number,
  menu: [
    {
      itemName: String,
      price: Number,
    },
  ],
});

const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  restaurantId: mongoose.Schema.Types.ObjectId,
  items: [
    {
      itemName: String,
      price: Number,
      quantity: Number,
    },
  ],
  totalAmount: Number,
  status: {
    type: String,
    enum: ["placed", "preparing", "completed"],
    default: "placed",
  },
  placedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserScheme);
const Restaurant = mongoose.model("Restaurant", restaurantSchema);
const Order = mongoose.model("Order", orderSchema);

/** USER ROUTES */
app.post("/users", async (req, res) => {
  const { name, email, password, address } = req.body;
  try {
    const user = new User({ name, email, password, address });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    res.send(user);
  } catch (err) {
    res.status(400).send(err);
  }
});

/** RESTAURANT ROUTES */
app.post("/restaurants", async (req, res) => {
  const { name, address, cuisine, rating, menu } = req.body;
  try {
    const restaurant = new Restaurant({
      name,
      address,
      cuisine,
      rating,
      menu,
    });
    await restaurant.save();
    res.status(201).send(restaurant);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.get("/restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.send(restaurants);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/restaurants/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).send("Restaurant not found");
    res.send(restaurant);
  } catch (err) {
    res.status(500).send(err);
  }
});

/** ORDER ROUTES */
app.post("/orders", async (req, res) => {
  const { userId, restaurantId, items } = req.body;
  try {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const order = new Order({ userId, restaurantId, items, totalAmount });
    await order.save();
    res.status(201).send(order);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send("Order not found");
    res.send(order);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.patch("/orders/:id", async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(400).send("Order not found");
    res.send(order);
  } catch (err) {
    res.status(400).send(err);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
