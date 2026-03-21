const START_MONEY = 150000;

let game = {
  money: START_MONEY,
  garage: [],
  day: 1
};

/* SAVE / LOAD */
function saveGame(){
  localStorage.setItem("game", JSON.stringify(game));
}

function loadGame(){
  const data = localStorage.getItem("game");
  if(data) game = JSON.parse(data);
}

function startNewGame(){
  game = { money: START_MONEY, garage: [], day: 1 };
  saveGame();
}

function resetGame(){
  localStorage.removeItem("game");
  location.reload();
}

function renderMoney(){
  document.getElementById("moneyDisplay").innerText = "$"+game.money;
}

/* 🎯 RARITY SYSTEM */
function getRarity(car){
  if(car.basePrice > 200000) return "Exotic";
  if(car.basePrice > 80000) return "Rare";
  return "Common";
}

/* 📊 CONDITION MULTIPLIER */
function conditionMultiplier(cond){
  if(cond === "Excellent") return 1.2;
  if(cond === "Good") return 1.0;
  if(cond === "Fair") return 0.8;
  if(cond === "Needs Work") return 0.6;
  return 0.5;
}

/* 🛒 MARKET */
async function loadMarket(){
  const res = await fetch("data/cars.json");
  const cars = await res.json();

  // RANDOM 12 CARS
  const selected = cars.sort(()=>0.5-Math.random()).slice(0,12);

  const container = document.getElementById("marketList");
  container.innerHTML="";

  selected.forEach(car=>{
    const rarity = getRarity(car);

    const div = document.createElement("div");
    div.className="card";

    div.innerHTML = `
      <h3>${car.brand} ${car.model}</h3>
      <p>Price: $${car.basePrice}</p>
      <p>Condition: ${car.condition}</p>
      <p>Rarity: ${rarity}</p>
      <button onclick="buyCar(${car.id})">Buy</button>
    `;

    container.appendChild(div);
  });

  window.marketCars = selected;
}

/* 💰 BUY */
function buyCar(id){
  const car = window.marketCars.find(c=>c.id===id);

  if(game.money < car.basePrice){
    alert("Not enough money");
    return;
  }

  game.money -= car.basePrice;

  game.garage.push({
    ...car,
    buyPrice: car.basePrice
  });

  saveGame();
  renderMoney();
}

/* 🏠 GARAGE */
function renderGarage(){
  const container = document.getElementById("garageList");
  container.innerHTML="";

  game.garage.forEach((car,index)=>{

    const rarity = getRarity(car);
    const multiplier = conditionMultiplier(car.condition);

    const currentValue = Math.floor(car.basePrice * multiplier);

    const profit = currentValue - car.buyPrice;

    const div = document.createElement("div");
    div.className="card";

    div.innerHTML = `
      <h3>${car.brand} ${car.model}</h3>
      <p>Condition: ${car.condition}</p>
      <p>Rarity: ${rarity}</p>
      <p>Value: $${currentValue}</p>
      <p>Profit: $${profit}</p>

      <button onclick="repairCar(${index})">Repair</button>
      <button onclick="sellCar(${index})">Sell</button>
    `;

    container.appendChild(div);
  });
}

/* 🔧 REPAIR SYSTEM */
function repairCar(index){
  let car = game.garage[index];

  let cost = 3000;

  if(car.condition === "Needs Work") cost = 6000;
  if(car.condition === "Fair") cost = 4000;

  if(game.money < cost){
    alert("Not enough money");
    return;
  }

  game.money -= cost;

  if(car.condition === "Needs Work") car.condition = "Fair";
  else if(car.condition === "Fair") car.condition = "Good";
  else if(car.condition === "Good") car.condition = "Excellent";

  car.basePrice *= 1.25;

  saveGame();
  renderGarage();
  renderMoney();
}

/* 💸 SELL */
function sellCar(index){
  const car = game.garage[index];

  const rarity = getRarity(car);

  let bonus = 1;

  if(rarity === "Rare") bonus = 1.2;
  if(rarity === "Exotic") bonus = 1.5;

  const sellPrice = Math.floor(car.basePrice * bonus);

  game.money += sellPrice;

  game.garage.splice(index,1);

  saveGame();
  renderGarage();
  renderMoney();
}

/* 📅 NEXT DAY */
function nextDay(){
  game.day++;

  const rand = Math.random();

  if(rand < 0.3){
    alert("🔥 Market Boom! Prices +10%");
    game.garage.forEach(c => c.basePrice *= 1.1);
  }

  if(rand > 0.7 && game.garage.length > 0){
    const i = Math.floor(Math.random()*game.garage.length);
    game.garage[i].condition = "Fair";
    alert("⚠️ Damage Event! One car got worse");
  }

  saveGame();
  loadMarket();
}