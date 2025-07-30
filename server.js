const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = 5001;
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(bodyParser.json());

// Add aggressive cache-busting headers to prevent old versions from being cached
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  res.set('Last-Modified', new Date().toUTCString());
  res.set('ETag', `"${Date.now()}"`);
  next();
});

app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

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

function updateChefStats(data) {
  data.chefStats.totalOrders = data.orders.length;
  data.chefStats.totalCheckedOut = data.orders.filter(order => order.checkedOut).length;
  
  // Reset pickup time stats
  data.chefStats.pickupTimeStats = {};
  
  // Group orders by pickup time
  data.orders.forEach(order => {
    const pickupTime = order.pickupTime;
    if (!data.chefStats.pickupTimeStats[pickupTime]) {
      data.chefStats.pickupTimeStats[pickupTime] = {};
    }
    
    order.items.forEach(item => {
      if (!data.chefStats.pickupTimeStats[pickupTime][item.id]) {
        data.chefStats.pickupTimeStats[pickupTime][item.id] = {
          ordered: 0,
          cooked: 0,
          checkedOut: 0
        };
      }
      data.chefStats.pickupTimeStats[pickupTime][item.id].ordered += item.servings;
      if (order.checkedOut) {
        data.chefStats.pickupTimeStats[pickupTime][item.id].checkedOut += item.servings;
      }
    });
  });
}

// Get meals and inventory
app.get('/api/meals', (req, res) => {
  console.log('API /api/meals called');
  const data = readData();
  console.log('Sending meals:', data.meals);
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
  const maxOrderId = data.orders.length > 0 ? data.orders.reduce((max, order) => Math.max(max, order.id || 0), 0) : 0;
  // Add order
  data.orders.push({ 
    id: maxOrderId + 1, 
    name, 
    items, 
    pickupTime, 
    time: new Date().toISOString(),
    checkedOut: false
  });
  updateChefStats(data);
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
  try {
    const data = readData();
      // Attach meal names to each order's items
  const mealsById = data.meals.reduce((acc, m) => {
    acc[m.id] = m.name;
    return acc;
  }, {});
    const orders = data.orders.map(order => ({
      ...order,
      items: order.items.map(i => ({ ...i, name: mealsById[i.id] || i.id }))
    }));
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
  updateChefStats(data);
  writeData(data);
  res.json({ success: true });
});

// Checkout an order (admin only)
app.put('/api/orders/:orderId/checkout', authMiddleware, (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const data = readData();
  const order = data.orders.find(order => order.id === orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.checkedOut = true;
  updateChefStats(data);
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
      m.price = meal.price || 0;
    }
  }
  // Add new meals
  if (Array.isArray(newMeals)) {
    let maxId = data.meals.reduce((max, m) => Math.max(max, m.id), 0);
    for (const meal of newMeals) {
      if (!meal.name || typeof meal.servings !== 'number') continue;
      maxId++;
      data.meals.push({ 
        id: maxId, 
        name: meal.name, 
        servings: meal.servings,
        price: meal.price || 0,
        images: meal.images || []
      });
    }
  }
  writeData(data);
  res.json({ success: true });
});

// Upload meal images (admin only)
app.post('/api/meals/:mealId/images', authMiddleware, upload.array('images', 3), (req, res) => {
  const mealId = parseInt(req.params.mealId);
  const data = readData();
  const meal = data.meals.find(m => m.id === mealId);
  
  if (!meal) {
    return res.status(404).json({ error: 'Meal not found' });
  }
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded' });
  }
  
  const uploadedImages = req.files.map(file => `/uploads/${file.filename}`);
  meal.images = uploadedImages;
  writeData(data);
  res.json({ success: true, images: uploadedImages });
});

// Get chef statistics (admin only)
app.get('/api/chef-stats', authMiddleware, (req, res) => {
  const data = readData();
  updateChefStats(data);
  writeData(data);
  res.json(data.chefStats);
});

// Update cooked count for a meal at a pickup time (admin only)
app.put('/api/chef-stats/cooked', authMiddleware, (req, res) => {
  const { pickupTime, mealId } = req.body;
  const data = readData();
  
  if (!data.chefStats.pickupTimeStats[pickupTime]) {
    data.chefStats.pickupTimeStats[pickupTime] = {};
  }
  if (!data.chefStats.pickupTimeStats[pickupTime][mealId]) {
    data.chefStats.pickupTimeStats[pickupTime][mealId] = {
      ordered: 0,
      cooked: 0,
      checkedOut: 0
    };
  }
  
  data.chefStats.pickupTimeStats[pickupTime][mealId].cooked += 1;
  writeData(data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 