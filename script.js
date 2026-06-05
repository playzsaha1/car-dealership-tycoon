const START_MONEY = 150000;

let game = {
  money: START_MONEY,
  garage: [],
  day: 1,
  stats: {
    carsSold: 0,
    totalProfit: 0
  },
  upgrades: {
    mechanicBay: 0,
    premiumShowroom: 0,
    buyerNetwork: 0
  },
  tutorialComplete: false,
  achievements: {}
};

let tutorialState = {
  active: false,
  step: 0
};

let achievementData = [];

async function loadAchievements() {
  try {
    const res = await fetch("data/achievements.json");
    achievementData = await res.json();
  } catch (e) {
    console.log("Could not load achievements");
  }
}

function checkAchievements() {
  if (!achievementData || achievementData.length === 0) return;

  achievementData.forEach(achievement => {
    const currentValue = game.stats[achievement.condition];
    if (currentValue >= achievement.target && !game.achievements) {
      game.achievements = {};
    }
    if (game.achievements && !game.achievements[achievement.name] && currentValue >= achievement.target) {
      game.achievements[achievement.name] = true;
      showNotification(`🏆 Achievement Unlocked: ${achievement.name}`, achievement.description, 'achievement');
      saveGame();
    }
  });
}

function showNotification(title, message, type = 'info') {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `<div class="notification-content"><strong>${title}</strong><p>${message}</p></div>`;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('notification-show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('notification-show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

/* =========================
   SAVE / LOAD
========================= */
function saveGame() {
  localStorage.setItem("game", JSON.stringify(game));
}

function loadGame() {
  const data = localStorage.getItem("game");
  if (data) {
    game = JSON.parse(data);
  }
}

function startNewGame() {
  game = {
    money: START_MONEY,
    garage: [],
    day: 1,
    stats: {
      carsSold: 0,
      totalProfit: 0
    },
    upgrades: {
      mechanicBay: 0,
      premiumShowroom: 0,
      buyerNetwork: 0
    },
    tutorialComplete: false,
    achievements: {}
  };
  saveGame();
  startTutorial();
}

function resetGame() {
  localStorage.removeItem("game");
  location.reload();
}

/* =========================
   TUTORIAL SYSTEM
========================= */
const tutorialSteps = [
  {
    title: "Welcome to Autoline!",
    description: "Build your car dealership empire. Buy cars low, repair them, and sell them for profit. Let's get you started!",
    highlight: null,
    action: "Click 'Next' to continue"
  },
  {
    title: "The Market",
    description: "Visit the Market to find cars to buy. Each car has different conditions (Broken → Excellent), prices, and rarity levels. Look for underpriced cars with repair potential!",
    highlight: "market-link",
    action: "You'll see the market next"
  },
  {
    title: "Buying Cars",
    description: "When you find a car you like in the Market, click 'Buy' to purchase it. Your balance decreases, and the car joins your garage. You have $150,000 to start!",
    highlight: null,
    action: "Click 'Next' when ready"
  },
  {
    title: "Your Garage",
    description: "Your garage shows all the cars you own. You can see each car's current value, condition, and potential profit. This is where you manage your inventory!",
    highlight: "garage-link",
    action: "Visit your Garage next"
  },
  {
    title: "Repairing Cars",
    description: "Cars in worse condition are cheaper to buy but need repairs. Click 'Repair' to improve a car's condition. Better condition = higher resale value. Repair costs vary by condition.",
    highlight: null,
    action: "Click 'Next' to continue"
  },
  {
    title: "Selling Cars",
    description: "Once you've fixed up a car, click 'Sell' to find a buyer. Your profit is calculated based on the car's rarity, current condition, and your upgrades. Rare cars sell better!",
    highlight: null,
    action: "Click 'Next' to learn about upgrades"
  },
  {
    title: "Upgrades & Growth",
    description: "In your Garage, you'll find an Upgrades Shop. Invest in: Mechanic Bay (cheaper repairs), Premium Showroom (better sell prices), Buyer Network (more cars in market). These are key to scaling your business!",
    highlight: null,
    action: "Click 'Next' to continue"
  },
  {
    title: "The Day System",
    description: "Click 'Next Day' in the Market to advance time. Each day, a fresh set of cars appears in the market. Time doesn't stop you from earning—maximize your profits!",
    highlight: null,
    action: "Click 'Next' to start playing"
  },
  {
    title: "You're Ready!",
    description: "Now you have everything you need to build your dealership empire. Buy smart, repair strategically, and sell for maximum profit. Good luck, tycoon!",
    highlight: null,
    action: "Click 'Start Game' to begin"
  }
];

function startTutorial() {
  tutorialState.active = true;
  tutorialState.step = 0;
  showTutorialStep();
}

function showTutorialStep() {
  if (tutorialState.step >= tutorialSteps.length) {
    endTutorial();
    return;
  }

  const step = tutorialSteps[tutorialState.step];
  const modal = document.getElementById("tutorialModal");
  const overlay = document.getElementById("tutorialOverlay");

  if (!modal || !overlay) return;

  document.getElementById("tutorialTitle").innerText = step.title;
  document.getElementById("tutorialDesc").innerText = step.description;
  document.getElementById("tutorialAction").innerText = step.action;

  modal.style.display = "block";
  overlay.style.display = "block";

  if (step.highlight) {
    const highlighted = document.getElementById(step.highlight);
    if (highlighted) {
      highlighted.classList.add("tutorial-highlight");
    }
  }
}

function nextTutorialStep() {
  const step = tutorialSteps[tutorialState.step];
  if (step && step.highlight) {
    const highlighted = document.getElementById(step.highlight);
    if (highlighted) {
      highlighted.classList.remove("tutorial-highlight");
    }
  }

  tutorialState.step++;
  showTutorialStep();
}

function endTutorial() {
  const modal = document.getElementById("tutorialModal");
  const overlay = document.getElementById("tutorialOverlay");

  if (modal) modal.style.display = "none";
  if (overlay) overlay.style.display = "none";

  game.tutorialComplete = true;
  saveGame();
}

function replayTutorial() {
  tutorialState.step = 0;
  showTutorialStep();
}

/* =========================
   DISPLAY HELPERS
========================= */
function formatMoney(value) {
  return "$" + Math.floor(value).toLocaleString();
}

function renderMoney() {
  const el = document.getElementById("moneyDisplay");
  if (el) {
    el.innerText = formatMoney(game.money);
  }
}

function renderDay() {
  const el = document.getElementById("dayDisplay");
  if (el) {
    el.innerText = "Day " + game.day;
  }
}

/* =========================
   GAME LOGIC HELPERS
========================= */
function getRarity(car) {
  if (car.basePrice >= 300000) return "Exotic";
  if (car.basePrice >= 80000) return "Rare";
  return "Common";
}

function getRarityClass(rarity) {
  if (rarity === "Exotic") return "rarity-exotic";
  if (rarity === "Rare") return "rarity-rare";
  return "rarity-common";
}

function getConditionPercentage(condition) {
  const conditionMap = {
    "Broken": 10,
    "Needs Work": 40,
    "Fair": 60,
    "Good": 85,
    "Excellent": 100
  };
  return conditionMap[condition] || 0;
}

function conditionMultiplier(condition) {
  if (condition === "Broken") return 0.45;
  if (condition === "Needs Work") return 0.65;
  if (condition === "Fair") return 0.82;
  if (condition === "Good") return 1.0;
  if (condition === "Excellent") return 1.15;
  return 1.0;
}

function getCurrentValue(car) {
  return Math.floor(car.basePrice * conditionMultiplier(car.condition));
}

function getRepairCost(car) {
  let baseCost = 0;

  if (car.condition === "Broken") baseCost = 9000;
  else if (car.condition === "Needs Work") baseCost = 6000;
  else if (car.condition === "Fair") baseCost = 3500;
  else if (car.condition === "Good") baseCost = 1800;
  else if (car.condition === "Excellent") baseCost = 0;

  const mechanicDiscount = game.upgrades.mechanicBay * 0.12;
  const finalCost = baseCost * (1 - mechanicDiscount);

  return Math.max(0, Math.floor(finalCost));
}

function getNextCondition(condition) {
  if (condition === "Broken") return "Needs Work";
  if (condition === "Needs Work") return "Fair";
  if (condition === "Fair") return "Good";
  if (condition === "Good") return "Excellent";
  return "Excellent";
}

function getSellMultiplier(car) {
  let rarityBonus = 1;
  const rarity = getRarity(car);

  if (rarity === "Rare") rarityBonus = 1.12;
  if (rarity === "Exotic") rarityBonus = 1.25;

  const showroomBonus = 1 + game.upgrades.premiumShowroom * 0.08;
  const randomMarketVariance = 0.93 + Math.random() * 0.2;

  return rarityBonus * showroomBonus * randomMarketVariance;
}

/* =========================
   MARKET
========================= */
async function loadMarket() {
  const res = await fetch("data/cars.json");
  const cars = await res.json();

  const marketSize = 12 + game.upgrades.buyerNetwork * 4;

  const shuffled = [...cars].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, marketSize);

  window.marketCars = selected;

  const container = document.getElementById("marketList");
  if (!container) return;

  container.innerHTML = "";

  selected.forEach((car) => {
    const rarity = getRarity(car);
    const conditionPercent = getConditionPercentage(car.condition);

    const card = document.createElement("div");
    card.className = "card card-market";

    card.innerHTML = `
      <div class="card-header">
        <h3>${car.brand} ${car.model}</h3>
        <span class="rarity-badge ${getRarityClass(rarity)}">${rarity}</span>
      </div>
      <p class="card-year">🗓️ ${car.year}</p>
      <p class="card-price">💰 ${formatMoney(car.basePrice)}</p>
      <p class="card-mileage">📍 ${car.mileage.toLocaleString()} km</p>
      <div class="condition-bar">
        <div class="condition-fill" style="width: ${conditionPercent}%; background: ${conditionPercent > 70 ? '#4ade80' : conditionPercent > 40 ? '#fbbf24' : '#ef4444'}"></div>
      </div>
      <p class="card-condition">Condition: <strong>${car.condition}</strong></p>
      <p class="card-segment">${car.segment}</p>
      <button onclick="buyCar(${car.id})" class="btn primary" style="width: 100%">Buy Now</button>
    `;

    container.appendChild(card);
  });

  renderMarketStats();
}

function renderMarketStats() {
  const statsEl = document.getElementById("marketStats");
  if (!statsEl) return;

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Day</div>
      <div class="stat-value">${game.day}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Balance</div>
      <div class="stat-value">${formatMoney(game.money)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Cars Today</div>
      <div class="stat-value">${window.marketCars ? window.marketCars.length : 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Buyer Network</div>
      <div class="stat-value">Lv ${game.upgrades.buyerNetwork}</div>
    </div>
  `;
}

function buyCar(id) {
  const car = window.marketCars.find(c => c.id === id);

  if (!car) return;

  if (game.money < car.basePrice) {
    showNotification("Insufficient Funds", "You don't have enough money to buy this car.", 'error');
    return;
  }

  game.money -= car.basePrice;

  game.garage.push({
    ...car,
    buyPrice: car.basePrice
  });

  showNotification(`Purchased ${car.brand} ${car.model}`, `Paid ${formatMoney(car.basePrice)}`, 'success');
  saveGame();
  checkAchievements();
  renderMoney();
  renderGarage();
  renderMarketStats();
}

/* =========================
   GARAGE
========================= */
function renderGarage() {
  const container = document.getElementById("garageList");
  if (!container) return;

  container.innerHTML = "";

  game.garage.forEach((car, index) => {
    const currentValue = getCurrentValue(car);
    const profit = currentValue - car.buyPrice;
    const repairCost = getRepairCost(car);
    const rarity = getRarity(car);
    const canRepair = car.condition !== "Excellent";
    const conditionPercent = getConditionPercentage(car.condition);
    const profitEmoji = profit > 0 ? '📈' : '📉';

    const card = document.createElement("div");
    card.className = "card card-garage";

    card.innerHTML = `
      <div class="card-header">
        <h3>${car.brand} ${car.model}</h3>
        <span class="rarity-badge ${getRarityClass(rarity)}">${rarity}</span>
      </div>
      <p class="card-year">🗓️ ${car.year}</p>
      <div class="card-values">
        <div class="value-item">Bought: ${formatMoney(car.buyPrice)}</div>
        <div class="value-item">Current: ${formatMoney(currentValue)}</div>
        <div class="value-item profit-item ${profit > 0 ? 'profit-positive' : 'profit-negative'}">${profitEmoji} ${formatMoney(profit)}</div>
      </div>
      <div class="condition-bar">
        <div class="condition-fill" style="width: ${conditionPercent}%; background: ${conditionPercent > 70 ? '#4ade80' : conditionPercent > 40 ? '#fbbf24' : '#ef4444'}"></div>
      </div>
      <p class="card-condition">Condition: <strong>${car.condition}</strong></p>
      <p class="card-mileage">📍 ${car.mileage.toLocaleString()} km</p>
      <div class="card-actions">
        <button onclick="repairCar(${index})" class="btn ${canRepair ? 'primary' : 'disabled'}" ${canRepair ? "" : "disabled"}>Repair ${canRepair ? '(' + formatMoney(repairCost) + ')' : '✓'}</button>
        <button onclick="sellCar(${index})" class="btn primary">Sell</button>
      </div>
    `;

    container.appendChild(card);
  });

  renderGarageStats();
  renderUpgradeShop();
}

function renderGarageStats() {
  const statsEl = document.getElementById("garageStats");
  if (!statsEl) return;

  const inventoryValue = game.garage.reduce((sum, car) => sum + getCurrentValue(car), 0);

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Cars Owned</div>
      <div class="stat-value">${game.garage.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Inventory Value</div>
      <div class="stat-value">${formatMoney(inventoryValue)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Cars Sold</div>
      <div class="stat-value">${game.stats.carsSold}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Profit</div>
      <div class="stat-value">${formatMoney(game.stats.totalProfit)}</div>
    </div>
  `;
}

/* =========================
   REPAIR
========================= */
function repairCar(index) {
  const car = game.garage[index];
  if (!car) return;

  if (car.condition === "Excellent") {
    showNotification("Already Perfect", "This car is at maximum condition.", 'info');
    return;
  }

  const repairCost = getRepairCost(car);

  if (game.money < repairCost) {
    showNotification("Insufficient Funds", "Not enough money to repair this car.", 'error');
    return;
  }

  game.money -= repairCost;
  const oldCondition = car.condition;
  car.condition = getNextCondition(car.condition);

  showNotification(`${car.brand} ${car.model} Repaired`, `Upgraded from ${oldCondition} to ${car.condition} (Cost: ${formatMoney(repairCost)})`, 'success');
  saveGame();
  checkAchievements();
  renderMoney();
  renderGarage();
}

/* =========================
   SELL
========================= */
function sellCar(index) {
  const car = game.garage[index];
  if (!car) return;

  const currentValue = getCurrentValue(car);
  const sellPrice = Math.floor(currentValue * getSellMultiplier(car));
  const profit = sellPrice - car.buyPrice;

  game.money += sellPrice;
  game.stats.carsSold += 1;
  game.stats.totalProfit += profit;

  game.garage.splice(index, 1);

  const profitColor = profit > 0 ? '✨' : '📊';
  showNotification(`${car.brand} ${car.model} Sold!`, `Sold for ${formatMoney(sellPrice)} ${profitColor} Profit: ${formatMoney(profit)}`, 'success');
  saveGame();
  checkAchievements();
  renderMoney();
  renderGarage();
  renderMarketStats();
}

/* =========================
   UPGRADES SHOP
========================= */
function renderUpgradeShop() {
  const container = document.getElementById("upgradeShop");
  if (!container) return;

  const mechanicCost = 12000 * (game.upgrades.mechanicBay + 1);
  const showroomCost = 18000 * (game.upgrades.premiumShowroom + 1);
  const buyerCost = 15000 * (game.upgrades.buyerNetwork + 1);

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Mechanic Bay</div>
      <div class="stat-value">Lv ${game.upgrades.mechanicBay}</div>
      <p class="stat-sub">Repair costs reduced by 12% per level.</p>
      <button onclick="buyUpgrade('mechanicBay', ${mechanicCost})">Buy ${formatMoney(mechanicCost)}</button>
    </div>

    <div class="stat-card">
      <div class="stat-label">Premium Showroom</div>
      <div class="stat-value">Lv ${game.upgrades.premiumShowroom}</div>
      <p class="stat-sub">Sell prices increase by 8% per level.</p>
      <button onclick="buyUpgrade('premiumShowroom', ${showroomCost})">Buy ${formatMoney(showroomCost)}</button>
    </div>

    <div class="stat-card">
      <div class="stat-label">Buyer Network</div>
      <div class="stat-value">Lv ${game.upgrades.buyerNetwork}</div>
      <p class="stat-sub">More cars appear in the market each day.</p>
      <button onclick="buyUpgrade('buyerNetwork', ${buyerCost})">Buy ${formatMoney(buyerCost)}</button>
    </div>
  `;
}

function buyUpgrade(type, cost) {
  if (game.money < cost) {
    showNotification("Insufficient Funds", "You need more money for this upgrade.", 'error');
    return;
  }

  game.money -= cost;
  game.upgrades[type] += 1;

  const upgradeNames = {
    mechanicBay: "Mechanic Bay",
    premiumShowroom: "Premium Showroom",
    buyerNetwork: "Buyer Network"
  };

  showNotification(`📈 ${upgradeNames[type]} Upgraded!`, `Upgraded to Level ${game.upgrades[type]}`, 'success');
  saveGame();
  renderMoney();
  renderGarage();
  renderMarketStats();
}

/* =========================
   DAILY EVENTS
========================= */
function nextDay() {
  game.day++;

  const eventRoll = Math.random();

  if (eventRoll < 0.25) {
    game.garage.forEach(car => {
      car.basePrice = Math.floor(car.basePrice * 1.08);
    });
    showNotification("📊 Market Boom!", "Your inventory value increased by 8%!", 'info');
  } else if (eventRoll < 0.45 && game.garage.length > 0) {
    const randomIndex = Math.floor(Math.random() * game.garage.length);
    const target = game.garage[randomIndex];

    if (target.condition === "Excellent") target.condition = "Good";
    else if (target.condition === "Good") target.condition = "Fair";
    else if (target.condition === "Fair") target.condition = "Needs Work";
    else if (target.condition === "Needs Work") target.condition = "Broken";

    showNotification("⛈️ Storm Damage!", `${target.brand} ${target.model} was damaged. Condition decreased.`, 'warning');
  } else if (eventRoll < 0.6) {
    game.garage.forEach(car => {
      if (car.brand === "Mercedes") {
        car.basePrice = Math.floor(car.basePrice * 1.15);
      }
    });
    showNotification("💎 Luxury Demand!", "Mercedes values increased by 15%!", 'info');
  } else {
    showNotification("☀️ Next Day", `Day ${game.day} - Fresh cars are available!", 'info');
  }

  saveGame();
  renderDay();
  renderMoney();
  loadMarket();
  renderGarage();
}