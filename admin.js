let authToken = null;
const SERVER_URL = 'http://localhost:5001';

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabName + 'Tab').classList.add('active');
      
      // Load data for the active tab
      if (tabName === 'orders') {
        loadOrders();
      } else if (tabName === 'meals') {
        loadMeals();
      } else if (tabName === 'chef') {
        loadChefStats();
      }
    });
  });
});

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const message = document.getElementById('loginMessage');

  try {
    const response = await fetch(`${SERVER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.token) {
      authToken = data.token;
      document.getElementById('loginContainer').style.display = 'none';
      document.getElementById('adminContainer').style.display = 'block';
      loadOrders();
      loadMeals();
      loadChefStats();
    } else {
      message.textContent = data.error || 'Login failed';
      message.style.color = '#d8000c';
    }
  } catch (error) {
    message.textContent = 'Connection error';
    message.style.color = '#d8000c';
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  authToken = null;
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('adminContainer').style.display = 'none';
  document.getElementById('loginForm').reset();
  document.getElementById('loginMessage').textContent = '';
});

// Load and display orders
async function loadOrders() {
  try {
    const response = await fetch(`${SERVER_URL}/api/orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const orders = await response.json();
    
    const ordersList = document.getElementById('ordersList');
    if (orders.length === 0) {
      ordersList.innerHTML = '<p>No orders yet.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'orders-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Name</th>
          <th>Pickup Time</th>
          <th>Items</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    orders.forEach(order => {
      const row = document.createElement('tr');
      row.className = order.checkedOut ? 'checked-out' : '';
      
      const itemsHtml = order.items.map(item => 
        `${item.name}: ${item.servings} servings`
      ).join('<br>');
      
      row.innerHTML = `
        <td>#${order.id}</td>
        <td>${order.name}</td>
        <td>${new Date(order.pickupTime).toLocaleString()}</td>
        <td>${itemsHtml}</td>
        <td>${order.checkedOut ? '✓ Checked Out' : '⏳ Pending'}</td>
        <td>
          ${!order.checkedOut ? 
            `<button onclick="checkoutOrder(${order.id})" class="checkout-btn">Check Out</button>` : 
            ''
          }
          <button onclick="deleteOrder(${order.id})" class="delete-btn">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    ordersList.innerHTML = '';
    ordersList.appendChild(table);
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// Checkout order
async function checkoutOrder(orderId) {
  try {
    const response = await fetch(`${SERVER_URL}/api/orders/${orderId}/checkout`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      loadOrders();
      loadChefStats();
    }
  } catch (error) {
    console.error('Error checking out order:', error);
  }
}

// Delete order
async function deleteOrder(orderId) {
  if (!confirm('Are you sure you want to delete this order?')) return;
  
  try {
    const response = await fetch(`${SERVER_URL}/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      loadOrders();
      loadChefStats();
    }
  } catch (error) {
    console.error('Error deleting order:', error);
  }
}

// Load and display meals
async function loadMeals() {
  try {
    const response = await fetch(`${SERVER_URL}/api/meals`);
    const meals = await response.json();
    
    const tbody = document.querySelector('#mealsTable tbody');
    tbody.innerHTML = '';
    
    meals.forEach(meal => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="text" value="${meal.name}" data-field="name" data-id="${meal.id}">
        </td>
        <td>
          <input type="number" step="0.01" value="${meal.price || 0}" data-field="price" data-id="${meal.id}">
        </td>
        <td>
          <input type="number" value="${meal.servings}" data-field="servings" data-id="${meal.id}">
        </td>
        <td>
          <div class="image-upload">
            <input type="file" accept="image/*" multiple onchange="uploadImages(${meal.id}, this)" class="image-input">
            <div class="image-preview" id="images-${meal.id}">
              ${(meal.images || []).map(img => 
                `<img src="${SERVER_URL}${img}" alt="Meal image" class="meal-image">`
              ).join('')}
            </div>
          </div>
        </td>
        <td>
          <button type="button" onclick="deleteMeal(${meal.id})" class="delete-btn">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading meals:', error);
  }
}

// Upload images for a meal
async function uploadImages(mealId, input) {
  const files = input.files;
  if (files.length === 0) return;
  
  const formData = new FormData();
  for (let i = 0; i < Math.min(files.length, 3); i++) {
    formData.append('images', files[i]);
  }
  
  try {
    const response = await fetch(`${SERVER_URL}/api/meals/${mealId}/images`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });
    
    if (response.ok) {
      loadMeals();
    }
  } catch (error) {
    console.error('Error uploading images:', error);
  }
}

// Delete meal
async function deleteMeal(mealId) {
  if (!confirm('Are you sure you want to delete this meal?')) return;
  
  try {
    const response = await fetch(`${SERVER_URL}/api/meals`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deleteId: mealId })
    });
    
    if (response.ok) {
      loadMeals();
    }
  } catch (error) {
    console.error('Error deleting meal:', error);
  }
}

// Save meal changes
document.getElementById('mealsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const inputs = document.querySelectorAll('#mealsTable input[data-id]');
  const meals = [];
  
  inputs.forEach(input => {
    const id = parseInt(input.dataset.id);
    const field = input.dataset.field;
    const value = input.type === 'number' ? parseFloat(input.value) : input.value;
    
    let meal = meals.find(m => m.id === id);
    if (!meal) {
      meal = { id };
      meals.push(meal);
    }
    meal[field] = value;
  });
  
  try {
    const response = await fetch(`${SERVER_URL}/api/meals`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ meals })
    });
    
    if (response.ok) {
      document.getElementById('mealsMessage').textContent = 'Meals updated successfully!';
      document.getElementById('mealsMessage').style.color = 'green';
      loadMeals();
    }
  } catch (error) {
    console.error('Error updating meals:', error);
    document.getElementById('mealsMessage').textContent = 'Error updating meals';
    document.getElementById('mealsMessage').style.color = '#d8000c';
  }
});

// Add new meal
document.getElementById('addMealBtn').addEventListener('click', () => {
  const tbody = document.querySelector('#mealsTable tbody');
  const newRow = document.createElement('tr');
  newRow.className = 'new-meal';
  newRow.innerHTML = `
    <td><input type="text" placeholder="Meal name" data-field="name" data-id="new"></td>
    <td><input type="number" step="0.01" placeholder="0.00" data-field="price" data-id="new"></td>
    <td><input type="number" placeholder="0" data-field="servings" data-id="new"></td>
    <td><div class="image-upload"><span>Add images after saving</span></div></td>
    <td><button type="button" onclick="this.closest('tr').remove()" class="delete-btn">Cancel</button></td>
  `;
  tbody.appendChild(newRow);
});

// Load chef statistics
async function loadChefStats() {
  try {
    const response = await fetch(`${SERVER_URL}/api/chef-stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const stats = await response.json();
    
    // Update summary stats
    document.getElementById('totalOrders').textContent = stats.totalOrders;
    document.getElementById('totalCheckedOut').textContent = stats.totalCheckedOut;
    document.getElementById('totalPending').textContent = stats.totalOrders - stats.totalCheckedOut;
    
    // Update pickup time stats
    const pickupTimeStats = document.getElementById('pickupTimeStats');
    pickupTimeStats.innerHTML = '';
    
    if (Object.keys(stats.pickupTimeStats).length === 0) {
      pickupTimeStats.innerHTML = '<p>No orders yet.</p>';
      return;
    }
    
    Object.entries(stats.pickupTimeStats).forEach(([pickupTime, mealStats]) => {
      const panel = document.createElement('div');
      panel.className = 'pickup-panel';
      panel.innerHTML = `
        <h4>Pickup: ${new Date(pickupTime).toLocaleString()}</h4>
        <div class="meal-stats"></div>
      `;
      
      const mealStatsDiv = panel.querySelector('.meal-stats');
      Object.entries(mealStats).forEach(([mealId, stats]) => {
        const mealDiv = document.createElement('div');
        mealDiv.className = 'meal-stat';
        mealDiv.innerHTML = `
          <div class="meal-info">
            <span class="meal-name" id="meal-name-${mealId}">Loading...</span>
            <div class="stat-numbers">
              <span>Ordered: ${stats.ordered}</span>
              <span>Cooked: ${stats.cooked}</span>
              <span>Checked Out: ${stats.checkedOut}</span>
            </div>
          </div>
          <button onclick="incrementCooked('${pickupTime}', ${mealId})" class="cook-btn">+1 Cooked</button>
        `;
        mealStatsDiv.appendChild(mealDiv);
      });
      
      pickupTimeStats.appendChild(panel);
    });
    
    // Load meal names
    loadMealNames();
  } catch (error) {
    console.error('Error loading chef stats:', error);
  }
}

// Load meal names for chef stats
async function loadMealNames() {
  try {
    const response = await fetch(`${SERVER_URL}/api/meals`);
    const meals = await response.json();
    
    meals.forEach(meal => {
      const nameElement = document.getElementById(`meal-name-${meal.id}`);
      if (nameElement) {
        nameElement.textContent = meal.name;
      }
    });
  } catch (error) {
    console.error('Error loading meal names:', error);
  }
}

// Increment cooked count
async function incrementCooked(pickupTime, mealId) {
  try {
    const response = await fetch(`${SERVER_URL}/api/chef-stats/cooked`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pickupTime, mealId })
    });
    
    if (response.ok) {
      loadChefStats();
    }
  } catch (error) {
    console.error('Error incrementing cooked count:', error);
  }
} 