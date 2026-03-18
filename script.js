const START_MONEY = 50000;

let gameState = {
  money: START_MONEY,
  ownedCars: [] // {id, brand, model, year, mileage, condition, buyPrice}
};

function saveGame() {
  localStorage.setItem('dealershipGame', JSON.stringify(gameState));
}

function loadGame() {
  const saved = localStorage.getItem('dealershipGame');
  if (saved) {
    gameState = JSON.parse(saved);
  } else {
    gameState = { money: START_MONEY, ownedCars: [] };
    saveGame();
  }
}

function startNewGame() {
  gameState = { money: START_MONEY, ownedCars: [] };
  saveGame();
}

function renderMoney() {
  const el = document.getElementById('moneyDisplay');
  if (!el) return;
  el.textContent = `Balance: $${gameState.money.toLocaleString()}`;
}

// --- Market ---

async function loadMarket() {
  const res = await fetch('data/cars.json');
  const cars = await res.json();
  const container = document.getElementById('marketList');
  container.innerHTML = '';

  cars.forEach(car => {
    const price = calculateMarketPrice(car);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${car.year} ${car.brand} ${car.model}</h3>
      <p><span class="badge">${car.segment}</span><span class="badge">${car.condition}</span></p>
      <p>Mileage: ${car.mileage.toLocaleString()} km</p>
      <p>Market price: <strong>$${price.toLocaleString()}</strong></p>
      <button ${price > gameState.money ? 'disabled' : ''}>Buy</button>
    `;
    const btn = card.querySelector('button');
    btn.onclick = () => buyCar(car, price);
    container.appendChild(card);
  });
}

function calculateMarketPrice(car) {
  // simple realistic-ish formula
  const age = new Date().getFullYear() - car.year;
  let value = car.basePrice;

  value *= Math.max(0.4, 1 - age * 0.07); // depreciation by age
  value *= Math.max(0.5, 1 - car.mileage / 200000); // mileage impact

  if (car.condition === 'Good') value *= 1.0;
  if (car.condition === 'Fair') value *= 0.9;
  if (car.condition === 'Needs Work') value *= 0.75;

  return Math.round(value / 100) * 100;
}

function buyCar(car, price) {
  if (price > gameState.money) return;
  gameState.money -= price;
  gameState.ownedCars.push({
    id: Date.now(),
    brand: car.brand,
    model: car.model,
    year: car.year,
    mileage: car.mileage,
    condition: car.condition,
    buyPrice: price
  });
  saveGame();
  renderMoney();
  loadMarket();
}

// --- Garage ---

function renderGarage() {
  const container = document.getElementById('garageList');
  container.innerHTML = '';

  if (gameState.ownedCars.length === 0) {
    container.innerHTML = '<p>You don\'t own any cars yet. Go to the market to buy one.</p>';
    return;
  }

  gameState.ownedCars.forEach(car => {
    const sellPrice = calculateSellPrice(car);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${car.year} ${car.brand} ${car.model}</h3>
      <p>Mileage: ${car.mileage.toLocaleString()} km</p>
      <p>Condition: ${car.condition}</p>
      <p>Purchase price: $${car.buyPrice.toLocaleString()}</p>
      <p>Estimated sell price: <strong>$${sellPrice.toLocaleString()}</strong></p>
      <button>Sell</button>
    `;
    const btn = card.querySelector('button');
    btn.onclick = () => sellCar(car.id, sellPrice);
    container.appendChild(card);
  });
}

function calculateSellPrice(car) {
  // small margin over buy price to reward flipping
  return Math.round(car.buyPrice * 1.15 / 100) * 100;
}

function sellCar(id, price) {
  const idx = gameState.ownedCars.findIndex(c => c.id === id);
  if (idx === -1) return;
  gameState.ownedCars.splice(idx, 1);
  gameState.money += price;
  saveGame();
  renderMoney();
  renderGarage();
}
