document.addEventListener('DOMContentLoaded', () => {
  const mealsList = document.getElementById('mealsList');
  const orderForm = document.getElementById('orderForm');
  const orderMessage = document.getElementById('orderMessage');

  // Use full URL since relative URLs don't work on this server
  const SERVER_URL = 'http://homeye.sdsu.edu/robotmeal';

  // Fetch meals and render
  console.log('Starting to fetch meals...');
  fetch(`${SERVER_URL}/api/meals`)
    .then(res => {
      console.log('Response received:', res.status, res.statusText);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(meals => {
      console.log('Meals loaded:', meals);
      mealsList.innerHTML = '';
      meals.forEach(meal => {
        const row = document.createElement('div');
        row.className = 'meal-row';
        row.innerHTML = `
          <label>
            ${meal.name} - $${meal.price || 0} (<span id="meal-count-${meal.id}">${meal.servings}</span> left)
          </label>
          <input type="number" min="0" max="${meal.servings}" value="0" id="meal-input-${meal.id}" ${meal.servings === 0 ? 'disabled' : ''}>
        `;
        mealsList.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error loading meals:', error);
      mealsList.innerHTML = `<p style="color: red;">Error loading meals: ${error.message}</p><p>Please try refreshing the page.</p>`;
    });

  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    orderMessage.textContent = '';
    const name = document.getElementById('name').value.trim();
    const pickupTime = document.getElementById('pickupTime').value;
    const mealInputs = Array.from(document.querySelectorAll('[id^="meal-input-"]'));
    const items = mealInputs.map(input => ({
      id: parseInt(input.id.replace('meal-input-', '')),
      servings: parseInt(input.value) || 0
    })).filter(item => item.servings > 0);
    if (!name) {
      orderMessage.textContent = 'Please enter your name.';
      return;
    }
    if (items.length === 0) {
      orderMessage.textContent = 'Please select at least one meal.';
      return;
    }
    if (!pickupTime) {
      orderMessage.textContent = 'Please select a pickup time.';
      return;
    }
    // Submit order
    const res = await fetch(`${SERVER_URL}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, items, pickupTime })
    });
    const data = await res.json();
    if (data.success) {
      orderMessage.style.color = 'green';
      orderMessage.textContent = 'Order placed successfully!';
      orderForm.reset();
      // Update meal counts
      fetch(`${SERVER_URL}/api/meals`)
        .then(res => res.json())
        .then(meals => {
          meals.forEach(meal => {
            document.getElementById(`meal-count-${meal.id}`).textContent = meal.servings;
            const input = document.getElementById(`meal-input-${meal.id}`);
            input.max = meal.servings;
            if (meal.servings === 0) input.disabled = true;
            else input.disabled = false;
          });
        });
    } else {
      orderMessage.style.color = '#d8000c';
      orderMessage.textContent = data.error || 'Order failed.';
    }
  });
}); 