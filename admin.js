document.addEventListener('DOMContentLoaded', () => {
  const loginContainer = document.getElementById('loginContainer');
  const adminContainer = document.getElementById('adminContainer');
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const logoutBtn = document.getElementById('logoutBtn');
  const ordersList = document.getElementById('ordersList');
  const mealsForm = document.getElementById('mealsForm');
  const mealsTableBody = document.querySelector('#mealsTable tbody');
  const mealsMessage = document.getElementById('mealsMessage');

  let token = localStorage.getItem('adminToken') || '';
  let tempMealId = -1;

  function showLogin() {
    loginContainer.style.display = '';
    adminContainer.style.display = 'none';
  }
  function showAdmin() {
    loginContainer.style.display = 'none';
    adminContainer.style.display = '';
  }

  async function fetchOrders() {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401) {
      showLogin();
      return;
    }
    const orders = await res.json();
    ordersList.innerHTML = orders.length === 0 ? '<em>No orders yet.</em>' : '';
    orders.forEach(order => {
      const div = document.createElement('div');
      div.className = 'order-row';
      div.innerHTML = `
        <div class="order-content">
          <strong>${order.name}</strong> ordered ${order.items.map(i => `${i.servings}x ${i.name || i.id}`).join(', ')}<br>
          Pickup: ${new Date(order.pickupTime).toLocaleString()}<br>
          <small>Ordered at: ${new Date(order.time).toLocaleString()}</small>
        </div>
        <button type="button" class="delete-order" data-id="${order.id}">Delete</button>
      `;
      ordersList.appendChild(div);
    });
  }

  async function fetchMeals() {
    const res = await fetch('/api/meals', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const meals = await res.json();
    mealsTableBody.innerHTML = '';
    meals.forEach(meal => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="text" value="${meal.name}" data-id="${meal.id}" class="meal-name"></td>
        <td><input type="number" min="0" value="${meal.servings}" data-id="${meal.id}" class="meal-servings"></td>
        <td><button type="button" class="delete-meal" data-id="${meal.id}">Delete</button></td>
      `;
      mealsTableBody.appendChild(row);
    });
  }

  // Add meal button logic
  document.getElementById('addMealBtn').addEventListener('click', () => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="" data-id="${tempMealId}" class="meal-name"></td>
      <td><input type="number" min="0" value="0" data-id="${tempMealId}" class="meal-servings"></td>
      <td><button type="button" class="delete-meal" data-id="${tempMealId}">Delete</button></td>
    `;
    mealsTableBody.appendChild(row);
    tempMealId--;
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMessage.textContent = '';
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('adminToken', token);
      showAdmin();
      fetchOrders();
      fetchMeals();
    } else {
      loginMessage.textContent = data.error || 'Login failed.';
    }
  });

  logoutBtn.addEventListener('click', () => {
    token = '';
    localStorage.removeItem('adminToken');
    showLogin();
  });

  mealsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mealsMessage.textContent = '';
    const names = Array.from(document.querySelectorAll('.meal-name')).map(input => ({ id: parseInt(input.dataset.id), name: input.value }));
    const servings = Array.from(document.querySelectorAll('.meal-servings')).map(input => ({ id: parseInt(input.dataset.id), servings: parseInt(input.value) }));
    let meals = names.map((n, i) => ({ id: n.id, name: n.name, servings: servings[i].servings }));
    // Separate new meals (id < 0) and existing
    const newMeals = meals.filter(m => m.id < 0 && m.name.trim() !== '');
    meals = meals.filter(m => m.id > 0 || m.id === 0);
    // Send to backend
    const res = await fetch('/api/meals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ meals, newMeals })
    });
    const data = await res.json();
    if (data.success) {
      mealsMessage.style.color = 'green';
      mealsMessage.textContent = 'Meals updated!';
      fetchMeals();
    } else {
      mealsMessage.style.color = '#d8000c';
      mealsMessage.textContent = data.error || 'Update failed.';
    }
  });

  mealsTableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-meal')) {
      const id = parseInt(e.target.dataset.id);
      const res = await fetch('/api/meals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ deleteId: id })
      });
      const data = await res.json();
      if (data.success) {
        mealsMessage.style.color = 'green';
        mealsMessage.textContent = 'Meal deleted!';
        fetchMeals();
      } else {
        mealsMessage.style.color = '#d8000c';
        mealsMessage.textContent = data.error || 'Delete failed.';
      }
    }
  });

  // Delete order functionality
  ordersList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-order')) {
      if (!confirm('Are you sure you want to delete this order?')) {
        return;
      }
      const id = parseInt(e.target.dataset.id);
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        fetchOrders(); // Refresh the orders list
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete order');
      }
    }
  });

  // Auto-login if token exists
  if (token) {
    showAdmin();
    fetchOrders();
    fetchMeals();
  } else {
    showLogin();
  }
}); 