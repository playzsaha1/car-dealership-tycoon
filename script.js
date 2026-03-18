const START_MONEY = 150000;

let gameState = {
  money: START_MONEY,
  ownedCars: [],
  day: 1,
  marketSeed: Date.now(),
  totalProfit: 0
};

window.marketCars = [];

/* -------------------- SAVE / LOAD -------------------- */
function saveGame() {
  localStorage.setItem("dealershipGame", JSON.stringify(gameState));
}

function loadGame() {
  const saved = localStorage.getItem("dealershipGame");

  if (saved) {
    gameState = JSON.parse(saved);

    if (!Array.isArray(gameState.ownedCars)) gameState.ownedCars = [];
    if (typeof gameState.day !== "number") gameState.day = 1;
    if (typeof gameState.marketSeed !== "number") gameState.marketSeed = Date.now();
    if (typeof gameState.totalProfit !== "number") gameState.totalProfit = 0;
  } else {
    gameState = {
      money: START_MONEY,
      ownedCars: [],
      day: 1,
      marketSeed: Date.now(),
      totalProfit: 0
    };
    saveGame();
  }
}

function startNewGame() {
  gameState = {
    money: START_MONEY,
    ownedCars: [],
    day: 1,
    marketSeed: Date.now(),
    totalProfit: 0
  };
  saveGame();
}

/* -------------------- RANDOM / DEAL ENGINE -------------------- */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDealModifier(carId) {
  const seed = gameState.marketSeed + carId * 999;
  const roll = seededRandom(seed);

  if (roll < 0.15) {
    return { multiplier: 0.78, label: "Steal Deal", type: "good-deal" };
  }
  if (roll < 0.35) {
    return { multiplier: 0.9, label: "Good Deal", type: "good-deal" };
  }
  if (roll < 0.7) {
    return { multiplier: 1.0, label: "Market Price", type: "neutral-deal" };
  }
  if (roll < 0.9) {
    return { multiplier: 1.08, label: "High Ask", type: "bad-deal" };
  }

  return { multiplier: 1.18, label: "Overpriced", type: "bad-deal" };
}

function refreshMarketDay() {
  gameState.day += 1;
  gameState.marketSeed = Date.now() + gameState.day * 1000;

  saveGame();
  renderDay();
  renderMoney();
  loadMarket();
}

/* -------------------- CONDITION SYSTEM -------------------- */
const CONDITION_ORDER = ["Needs Work", "Fair", "Good", "Excellent"];

function getConditionMultiplier(condition) {
  switch (condition) {
    case "Needs Work":
      return 0.62;
    case "Fair":
      return 0.8;
    case "Good":
      return 0.96;
    case "Excellent":
      return 1.14;
    default:
      return 0.9;
  }
}

function getRepairCost(condition, basePrice) {
  switch (condition) {
    case "Needs Work":
      return Math.round(basePrice * 0.07);
    case "Fair":
      return Math.round(basePrice * 0.05);
    case "Good":
      return Math.round(basePrice * 0.035);
    case "Excellent":
      return 0;
    default:
      return Math.round(basePrice * 0.05);
  }
}

function getNextCondition(condition) {
  const currentIndex = CONDITION_ORDER.indexOf(condition);
  if (currentIndex === -1 || currentIndex === CONDITION_ORDER.length - 1) {
    return condition;
  }
  return CONDITION_ORDER[currentIndex + 1];
}

function getCurrentVehicleValue(basePrice, condition) {
  return Math.round(basePrice * getConditionMultiplier(condition));
}

function getMarketPurchasePrice(car) {
  const conditionAdjusted = getCurrentVehicleValue(car.basePrice, car.condition);
  const deal = getDealModifier(car.id);
  return Math.round(conditionAdjusted * deal.multiplier);
}

function getSellPrice(car) {
  return getCurrentVehicleValue(car.basePrice, car.condition);
}

function getPotentialSellAfterRepair(car) {
  const nextCondition = getNextCondition(car.condition);
  return getCurrentVehicleValue(car.basePrice, nextCondition);
}

/* -------------------- UI -------------------- */
function renderMoney() {
  const el = document.getElementById("moneyDisplay");
  if (!el) return;
  el.textContent = `Balance: $${gameState.money.toLocaleString()}`;
}

function renderDay() {
  const el = document.getElementById("dayDisplay");
  if (!el) return;
  el.textContent = `Day ${gameState.day}`;
}

function formatProfit(value) {
  if (value > 0) {
    return `<span class="value-positive">+$${value.toLocaleString()}</span>`;
  }
  if (value < 0) {
    return `<span class="value-negative">-$${Math.abs(value).toLocaleString()}</span>`;
  }
  return `<span class="value-neutral">$0</span>`;
}

function getGaragePortfolioValue() {
  return gameState.ownedCars.reduce((sum, car) => sum + getSellPrice(car), 0);
}

/* -------------------- MARKET STATS -------------------- */
function renderMarketStats(cars) {
  const container = document.getElementById("marketStats");
  if (!container) return;

  const stealDeals = cars.filter((car) => getDealModifier(car.id).label === "Steal Deal").length;
  const affordable = cars.filter((car) => gameState.money >= getMarketPurchasePrice(car)).length;

  const cheapest = cars.reduce((min, car) => {
    const price = getMarketPurchasePrice(car);
    return price < min ? price : min;
  }, Number.MAX_SAFE_INTEGER);

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Day</div>
      <div class="stat-value">${gameState.day}</div>
      <div class="stat-sub">Fresh market pricing active</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Affordable Cars</div>
      <div class="stat-value">${affordable}</div>
      <div class="stat-sub">Within your current balance</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Steal Deals</div>
      <div class="stat-value">${stealDeals}</div>
      <div class="stat-sub">Best flips in today’s market</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Cheapest Buy</div>
      <div class="stat-value">$${cheapest.toLocaleString()}</div>
      <div class="stat-sub">Entry point for your next flip</div>
    </div>
  `;
}

/* -------------------- MARKET -------------------- */
async function loadMarket() {
  try {
    const res = await fetch("data/cars.json");
    const cars = await res.json();

    window.marketCars = cars;

    renderMarketStats(cars);

    const container = document.getElementById("marketList");
    if (!container) return;

    container.innerHTML = "";

    cars.forEach((car) => {
      const deal = getDealModifier(car.id);
      const guideValue = getCurrentVehicleValue(car.basePrice, car.condition);
      const purchasePrice = getMarketPurchasePrice(car);
      const canAfford = gameState.money >= purchasePrice;
      const instantMargin = guideValue - purchasePrice;

      const premiumBrands = ["BMW", "Mercedes-Benz", "Audi", "Porsche", "Range Rover", "Tesla", "Polestar", "Lexus"];
      const premiumBadge = premiumBrands.includes(car.brand)
        ? `<span class="badge premium">Premium</span>`
        : "";

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${car.brand} ${car.model}</h3>

        <div class="badge-row">
          <span class="badge">${car.year}</span>
          <span class="badge">${car.condition}</span>
          <span class="badge">${car.segment}</span>
          ${premiumBadge}
          <span class="badge ${deal.type}">${deal.label}</span>
        </div>

        <p><strong>Mileage:</strong> ${car.mileage.toLocaleString()} km</p>
        <p><strong>Base Price:</strong> $${car.basePrice.toLocaleString()}</p>
        <p><strong>Condition Value:</strong> $${guideValue.toLocaleString()}</p>
        <p><strong>Buy Price Today:</strong> $${purchasePrice.toLocaleString()}</p>
        <p><strong>Deal Margin:</strong> ${formatProfit(instantMargin)}</p>

        <button ${canAfford ? "" : "disabled"} onclick="buyCar(${car.id})">
          ${canAfford ? "Buy Vehicle" : "Not Enough Cash"}
        </button>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading market:", error);

    const container = document.getElementById("marketList");
    if (container) {
      container.innerHTML = `
        <div class="card">
          <h3>Market unavailable</h3>
          <p>Could not load vehicle inventory. Check that <strong>data/cars.json</strong> exists and is valid.</p>
        </div>
      `;
    }
  }
}

function buyCar(carId) {
  const car = window.marketCars.find((c) => c.id === carId);
  if (!car) return;

  const purchasePrice = getMarketPurchasePrice(car);

  if (gameState.money < purchasePrice) {
    alert("You do not have enough money for this car.");
    return;
  }

  gameState.money -= purchasePrice;

  gameState.ownedCars.push({
    id: Date.now() + Math.random(),
    marketId: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
    mileage: car.mileage,
    condition: car.condition,
    segment: car.segment,
    basePrice: car.basePrice,
    buyPrice: purchasePrice,
    purchasedDay: gameState.day
  });

  saveGame();
  renderMoney();
  loadMarket();
}

/* -------------------- GARAGE STATS -------------------- */
function renderGarageStats() {
  const container = document.getElementById("garageStats");
  if (!container) return;

  const carCount = gameState.ownedCars.length;
  const portfolioValue = getGaragePortfolioValue();
  const potentialCash = gameState.money + portfolioValue;

  const totalCurrentProfit = gameState.ownedCars.reduce((sum, car) => {
    return sum + (getSellPrice(car) - car.buyPrice);
  }, 0);

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Owned Cars</div>
      <div class="stat-value">${carCount}</div>
      <div class="stat-sub">Current vehicles in your garage</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Portfolio Value</div>
      <div class="stat-value">$${portfolioValue.toLocaleString()}</div>
      <div class="stat-sub">Total resale value right now</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Unrealised Profit</div>
      <div class="stat-value">${totalCurrentProfit >= 0 ? "+" : "-"}$${Math.abs(totalCurrentProfit).toLocaleString()}</div>
      <div class="stat-sub">Across all owned vehicles</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Cash + Stock</div>
      <div class="stat-value">$${potentialCash.toLocaleString()}</div>
      <div class="stat-sub">Your current dealership worth</div>
    </div>
  `;
}

/* -------------------- GARAGE -------------------- */
function renderGarage() {
  const container = document.getElementById("garageList");
  if (!container) return;

  renderGarageStats();
  container.innerHTML = "";

  if (gameState.ownedCars.length === 0) {
    container.innerHTML = `
      <div class="card">
        <h3>No cars yet</h3>
        <p>Your showroom is empty. Head to the market and buy your first vehicle.</p>
      </div>
    `;
    return;
  }

  gameState.ownedCars.forEach((car) => {
    const sellPrice = getSellPrice(car);
    const repairCost = getRepairCost(car.condition, car.basePrice);
    const nextCondition = getNextCondition(car.condition);
    const canRepair = car.condition !== "Excellent";
    const hasRepairMoney = gameState.money >= repairCost;
    const profitNow = sellPrice - car.buyPrice;
    const nextSellPrice = getPotentialSellAfterRepair(car);
    const profitAfterRepair = nextSellPrice - car.buyPrice - repairCost;

    const daysHeld = gameState.day - (car.purchasedDay || gameState.day);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${car.brand} ${car.model}</h3>

      <div class="badge-row">
        <span class="badge">${car.year}</span>
        <span class="badge">${car.condition}</span>
        <span class="badge">${car.segment}</span>
        <span class="badge neutral-deal">Held ${daysHeld} day${daysHeld === 1 ? "" : "s"}</span>
      </div>

      <p><strong>Mileage:</strong> ${car.mileage.toLocaleString()} km</p>
      <p><strong>Bought For:</strong> $${car.buyPrice.toLocaleString()}</p>
      <p><strong>Sell Price Now:</strong> $${sellPrice.toLocaleString()}</p>
      <p><strong>Profit Now:</strong> ${formatProfit(profitNow)}</p>
      <p><strong>Repair Cost:</strong> ${canRepair ? `$${repairCost.toLocaleString()}` : "No repairs needed"}</p>
      <p><strong>After Repair:</strong> ${
        canRepair
          ? `${nextCondition} · ${formatProfit(profitAfterRepair)}`
          : "Already at max condition"
      }</p>

      <div class="card-actions">
        <button onclick="sellCar('${car.id}')">Sell Vehicle</button>
        ${
          canRepair
            ? `<button class="secondary-btn" ${hasRepairMoney ? "" : "disabled"} onclick="repairCar('${car.id}')">
                ${hasRepairMoney ? `Repair to ${nextCondition}` : "Not Enough Cash"}
              </button>`
            : `<button class="secondary-btn" disabled>Fully Repaired</button>`
        }
      </div>
    `;

    container.appendChild(card);
  });
}

function sellCar(carId) {
  const index = gameState.ownedCars.findIndex(
    (car) => String(car.id) === String(carId)
  );

  if (index === -1) return;

  const car = gameState.ownedCars[index];
  const sellPrice = getSellPrice(car);
  const realisedProfit = sellPrice - car.buyPrice;

  gameState.money += sellPrice;
  gameState.totalProfit += realisedProfit;
  gameState.ownedCars.splice(index, 1);

  saveGame();
  renderMoney();
  renderGarage();
}

function repairCar(carId) {
  const car = gameState.ownedCars.find(
    (ownedCar) => String(ownedCar.id) === String(carId)
  );

  if (!car) return;

  const repairCost = getRepairCost(car.condition, car.basePrice);

  if (repairCost <= 0) {
    alert("This car does not need repairs.");
    return;
  }

  if (gameState.money < repairCost) {
    alert("You do not have enough money to repair this car.");
    return;
  }

  gameState.money -= repairCost;
  car.condition = getNextCondition(car.condition);

  saveGame();
  renderMoney();
  renderGarage();
}