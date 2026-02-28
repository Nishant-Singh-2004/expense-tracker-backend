const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));


const app = express();

const Expense = require("./models/Expense");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("Backend running");
});

app.post("/expenses", auth, async (req, res) => {
  try {
    const expense = new Expense({
      name: req.body.name,
      amnt: req.body.amnt,
      userId: req.userId,
    });

    await expense.save();
    res.json({ message: "Expense saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save expense" });
  }
});

app.get("/expenses", auth,  async (req, res) => {
  const expenses = await Expense.find({ userId: req.userId });
  res.json(expenses);
});

app.delete("/expenses/:id", auth, async (req, res) => {
  try {
    const deletedExpense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedExpense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense delted successfully" });
  } catch (err) {
    console.error("Delete error: ", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

app.post("/signup", async(req, res)=>{
  try {
    const {email, password} = req.body;

    // basic check
    if (!email || !password){
      return res.status(400).json({ error: "Email and password required" });
    }

    // check if user exists
    const existingUser = await User.findOne({ email });
    if(existingUser) {
      return res.status(400).json({ error : "User already exists" });
    }

    // password hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // saving user data
    const user = new User({
      email,
      password : hashedPassword,
    });

    await user.save();

    res.json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: "Signup  failed!"});
  }
});

app.post("/login", async(req, res) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // find user
    const user = await User.findOne({ email });
    if( !user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      return res.status(400).json({ error: "Invalid credentials"});
    }

    // create JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});
