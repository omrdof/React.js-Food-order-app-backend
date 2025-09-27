import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import bodyParser from "body-parser";
import express from "express";

const app = express();

// Setup __dirname (since ES modules don’t have it by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(express.static("public"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/meals", async (req, res) => {
  try {
    const mealsPath = path.join(__dirname, "../data/available-meals.json");
    const meals = await fs.readFile(mealsPath, "utf8");
    res.json(JSON.parse(meals));
  } catch (err) {
    res.status(500).json({ message: "Error reading meals data." });
  }
});

app.post("/orders", async (req, res) => {
  const orderData = req.body.order;

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ message: "Missing data." });
  }

  if (
    !orderData.customer.email?.includes("@") ||
    !orderData.customer.name?.trim() ||
    !orderData.customer.street?.trim() ||
    !orderData.customer["postal-code"]?.trim() ||
    !orderData.customer.city?.trim()
  ) {
    return res.status(400).json({
      message:
        "Missing data: Email, name, street, postal code or city is missing.",
    });
  }

  try {
    const ordersPath = path.join(__dirname, "../data/orders.json");
    const orders = await fs.readFile(ordersPath, "utf8");
    const allOrders = JSON.parse(orders);

    const newOrder = { ...orderData, id: (Math.random() * 1000).toString() };
    allOrders.push(newOrder);

    await fs.writeFile(ordersPath, JSON.stringify(allOrders));
    res.status(201).json({ message: "Order created!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving order." });
  }
});

app.use((req, res) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  res.status(404).json({ message: "Not found" });
});

export default app;
