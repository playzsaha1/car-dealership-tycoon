const START_MONEY = 150000;

let game = {
  money: START_MONEY,
  garage: [],
  day: 1
};

function saveGame(){
  localStorage.setItem("game", JSON.stringify(game));
}

function loadGame(){
  const data = localStorage.getItem("game");
  if(data){
    game = JSON.parse(data);
  }
}

function startNewGame(){
  game = {
    money: START_MONEY,
    garage: [],
    day: 1
  };
  saveGame();
}

function resetGame(){
  localStorage.removeItem("game");
  location.reload();
}

function renderMoney(){
  document.getElementById("moneyDisplay").innerText = "$"+game.money;
}

/* MARKET */

async function loadMarket(){
  const res = await fetch("data/cars.json");
  const cars = await res.json();

  const container = document.getElementById("marketList");
  container.innerHTML="";

  cars.forEach(car=>{
    const div = document.createElement("div");
    div.className="card";

    const price = car.basePrice;

    div.innerHTML = `
      <h3>${car.brand} ${car.model}</h3>
      <p>Price: $${price}</p>
      <p>Condition: ${car.condition}</p>
      <button onclick="buyCar(${car.id})">Buy</button>
    `;

    container.appendChild(div);
  });

  window.marketCars = cars;
}

/* BUY */

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

/* GARAGE */

function renderGarage(){
  const container = document.getElementById("garageList");
  container.innerHTML="";

  game.garage.forEach((car,index)=>{

    const div = document.createElement("div");
    div.className="card";

    const profit = car.basePrice - car.buyPrice;

    div.innerHTML = `
      <h3>${car.brand} ${car.model}</h3>
      <p>Value: $${car.basePrice}</p>
      <p>Profit: $${profit}</p>

      <button onclick="repairCar(${index})">Repair</button>
      <button onclick="sellCar(${index})">Sell</button>
    `;

    container.appendChild(div);
  });
}

/* REPAIR SYSTEM 🔥 */

function repairCar(index){
  let car = game.garage[index];

  let cost = 2000;

  if(car.condition === "Needs Work") cost = 5000;
  if(car.condition === "Fair") cost = 3000;

  if(game.money < cost){
    alert("Not enough money");
    return;
  }

  game.money -= cost;

  // upgrade condition
  if(car.condition === "Needs Work") car.condition = "Fair";
  else if(car.condition === "Fair") car.condition = "Good";
  else if(car.condition === "Good") car.condition = "Excellent";

  car.basePrice *= 1.2;

  saveGame();
  renderGarage();
  renderMoney();
}

/* SELL */

function sellCar(index){
  const car = game.garage[index];

  const sellPrice = car.basePrice * (1 + Math.random()*0.3);

  game.money += Math.floor(sellPrice);

  game.garage.splice(index,1);

  saveGame();
  renderGarage();
  renderMoney();
}

/* EVENTS */

function nextDay(){
  game.day++;

  // RANDOM EVENT
  const rand = Math.random();

  if(rand < 0.3){
    alert("Market Boom! Prices increased");
    game.garage.forEach(c => c.basePrice *= 1.1);
  }

  saveGame();
  loadMarket();
}