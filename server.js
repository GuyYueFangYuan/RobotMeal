const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Simple in-memory token store (for demo)
const adminTokens = new Set();

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  if (!adminTokens.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get meals and inventory
app.get('/api/meals', (req, res) => {
  const data = readData();
  res.json(data.meals);
});

// Submit an order
app.post('/api/order', (req, res) => {
  const { name, items, pickupTime } = req.body;
  if (!name || !Array.isArray(items) || !pickupTime) {
    return res.status(400).json({ error: 'Invalid order data' });
  }
  const data = readData();
  // Check inventory
  for (const item of items) {
    const meal = data.meals.find(m => m.id === item.id);
    if (!meal || meal.servings < item.servings) {
      return res.status(400).json({ error: `Not enough servings for ${meal ? meal.name : 'Unknown Meal'}` });
    }
  }
  // Deduct servings
  for (const item of items) {
    const meal = data.meals.find(m => m.id === item.id);
    meal.servings -= item.servings;
  }
  // Generate order ID
  const maxOrderId = data.orders.reduce((max, order) => Math.max(max, order.id || 0), 0);
  // Add order
  data.orders.push({ 
    id: maxOrderId + 1, 
    name, 
    items, 
    pickupTime, 
    time: new Date().toISOString() 
  });
  writeData(data);
  res.json({ success: true });
});

// Admin login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const data = readData();
  if (username === data.operator.username && password === data.operator.password) {
    const token = generateToken();
    adminTokens.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get all orders (admin only)
app.get('/api/orders', authMiddleware, (req, res) => {
  const data = readData();
  // Attach meal names to each order's items
  const mealsById = Object.fromEntries(data.meals.map(m => [m.id, m.name]));
  const orders = data.orders.map(order => ({
    ...order,
    items: order.items.map(i => ({ ...i, name: mealsById[i.id] || i.id }))
  }));
  res.json(orders);
});

// Delete an order (admin only)
app.delete('/api/orders/:orderId', authMiddleware, (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const data = readData();
  const orderIndex = data.orders.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // Remove the order
  data.orders.splice(orderIndex, 1);
  writeData(data);
  res.json({ success: true });
});

// Edit meals (admin only)
app.put('/api/meals', authMiddleware, (req, res) => {
  const { meals, deleteId, newMeals } = req.body;
  const data = readData();
  if (deleteId !== undefined) {
    // Delete meal
    const idx = data.meals.findIndex(m => m.id === deleteId);
    if (idx === -1) return res.status(400).json({ error: 'Meal not found' });
    data.meals.splice(idx, 1);
    writeData(data);
    return res.json({ success: true });
  }
  if (!Array.isArray(meals)) return res.status(400).json({ error: 'Invalid meals data' });
  // Update meals by id
  for (const meal of meals) {
    const m = data.meals.find(x => x.id === meal.id);
    if (m) {
      m.name = meal.name;
      m.servings = meal.servings;
    }
  }
  // Add new meals
  if (Array.isArray(newMeals)) {
    let maxId = data.meals.reduce((max, m) => Math.max(max, m.id), 0);
    for (const meal of newMeals) {
      if (!meal.name || typeof meal.servings !== 'number') continue;
      maxId++;
      data.meals.push({ id: maxId, name: meal.name, servings: meal.servings });
    }
  }
  writeData(data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 