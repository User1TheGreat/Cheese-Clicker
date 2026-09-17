/**
 * ==========================================
 * 1. GAME STATE & DATA DEFINITIONS
 * ==========================================
 */
let score = 0;
let baseClickPower = 1;
let upgradesData = [];
let prestigePoints = 0;
let permanentUpgrades = {};

const prestigeCatalog = [
  {
    id: "p_click_1",
    name: "Gouda Touch",
    desc: "Double manual click power (2x).",
    cost: 10,
    type: "click_mult",
    val: 2,
  },
  {
    id: "p_click_2",
    name: "Cheddar Reflexes",
    desc: "Triple manual click power (3x).",
    cost: 50,
    type: "click_mult",
    val: 3,
  },
  {
    id: "p_sps_1",
    name: "Brie Flow",
    desc: "Boost all building production by +25%.",
    cost: 15,
    type: "sps_mult",
    val: 0.25,
  },
  {
    id: "p_sps_2",
    name: "Swiss Efficiency",
    desc: "Boost all building production by +50%.",
    cost: 75,
    type: "sps_mult",
    val: 0.5,
  },
  {
    id: "p_sps_3",
    name: "Provolone Pumping",
    desc: "Boost all building production by +100% (2x).",
    cost: 250,
    type: "sps_mult",
    val: 1.0,
  },
  {
    id: "p_cheap_1",
    name: "Feta Subsidies",
    desc: "Reduce building cost scaling slightly (-2%).",
    cost: 30,
    type: "cost_reduce",
    val: 0.02,
  },
  {
    id: "p_cheap_2",
    name: "Ricotta Bargains",
    desc: "Reduce building cost scaling further (-3%).",
    cost: 100,
    type: "cost_reduce",
    val: 0.03,
  },
  {
    id: "p_start_1",
    name: "Parmesan Starter",
    desc: "Start every run with 1,000 cheese.",
    cost: 20,
    type: "starting_cash",
    val: 1000,
  },
  {
    id: "p_start_2",
    name: "Blue Cheese Vault",
    desc: "Start every run with 50,000 cheese.",
    cost: 200,
    type: "starting_cash",
    val: 50000,
  },
  {
    id: "p_grater_boost",
    name: "Sharper Edges",
    desc: "Cheese Graters produce 3x more output.",
    cost: 40,
    type: "building_spec",
    target: "grater",
    val: 3,
  },
  {
    id: "p_whisk_boost",
    name: "Turbo Motor",
    desc: "Rotary Whisks produce 3x more output.",
    cost: 90,
    type: "building_spec",
    target: "whisk",
    val: 3,
  },
  {
    id: "p_farm_boost",
    name: "Super Fertilizer",
    desc: "Dairy Farms produce 3x more output.",
    cost: 150,
    type: "building_spec",
    target: "farm",
    val: 3,
  },
  {
    id: "p_factory_boost",
    name: "Industrial Melter",
    desc: "Fondue Factories produce 3x more output.",
    cost: 300,
    type: "building_spec",
    target: "factory",
    val: 3,
  },
  {
    id: "p_lucky_1",
    name: "Golden Curd Radar",
    desc: "Increase general production global bonus by +10%.",
    cost: 120,
    type: "sps_mult",
    val: 0.1,
  },
  {
    id: "p_ultimate",
    name: "The Big Cheese Legacy",
    desc: "Multiply all production across the board by 5x.",
    cost: 1000,
    type: "sps_mult",
    val: 4.0,
  },
];

// Store control states
let storeMode = "buy"; // 'buy' or 'sell'
let batchAmount = 1; // 1, 10, 25, 100, or 'special' ('max' for buy, 'all' for sell)

// Tracking states for secrets
let clickedNewsTicker = false;
let hasSoldABuilding = false;

// 5 Rotating News Pieces
const newsHeadlines = [
  "🧀 News: Local cows got reported by record-breaking amounts of milk produced!",
  "🧀 News: Local hospitals declare that cheese is essential for health!",
  "🧀 News: Experts warn against building houses out of Swiss due to structural leakage.",
  "🧀 News: Strange rat spotted wearing a tiny golden crown near the dairy silos.",
  "🧀 News: Mozzarella stocks soar as winter approaches across northern regions.",
];
let currentNewsIndex = 0;

// 25 Total Achievements (22 Normal, 3 Secret with Hints)
const achievementsData = [
  {
    id: "click_1",
    name: "First Cheese",
    desc: "Click your first piece of cheese.",
    unlocked: false,
    isSecret: false,
    check: () => score >= 1,
  },
  {
    id: "click_100",
    name: "Cheese Collector",
    desc: "Reach 100 total cheese collected.",
    unlocked: false,
    isSecret: false,
    check: () => score >= 100,
  },
  {
    id: "click_1000",
    name: "Cheese Enthusiast",
    desc: "Reach 1,000 total cheese collected.",
    unlocked: false,
    isSecret: false,
    check: () => score >= 1000,
  },
  {
    id: "click_10000",
    name: "Cheesy Master",
    desc: "Reach 10,000 total cheese collected.",
    unlocked: false,
    isSecret: false,
    check: () => score >= 10000,
  },
  {
    id: "click_100000",
    name: "Cheese Tycoon",
    desc: "Reach 100,000 total cheese collected.",
    unlocked: false,
    isSecret: false,
    check: () => score >= 100000,
  },
  {
    id: "click_10000000",
    name: "The Big Cheese",
    desc: "Reach 10,000,000 total cheese collected.",
    unlocked: false,
    isSecret: false,
    check: () => score >= 10000000,
  },
  {
    id: "click_1000000000",
    name: "Billionaire of Swiss",
    desc: "Reach 1,000,000,000 total cheese collected.",
    unlocked: false,
    isSecret: false,
    check: () => score >= 1000000000,
  },
  {
    id: "grater_1",
    name: "Grater Starter",
    desc: "Buy your first Cheese Grater.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("grater") >= 1,
  },
  {
    id: "grater_10",
    name: "Flakes on Flakes",
    desc: "Own 10 Cheese Graters.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("grater") >= 10,
  },
  {
    id: "grater_50",
    name: "Mountain of Shreds",
    desc: "Own 50 Cheese Graters.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("grater") >= 50,
  },
  {
    id: "grater_100",
    name: "Grandmaster Grater",
    desc: "Own 100 Cheese Graters.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("grater") >= 100,
  },
  {
    id: "farm_1",
    name: "Pasture Prime",
    desc: "Buy your first Dairy Farm.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("farm") >= 1,
  },
  {
    id: "farm_10",
    name: "Bovine Empire",
    desc: "Own 10 Dairy Farms.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("farm") >= 10,
  },
  {
    id: "farm_50",
    name: "Endless Meadows",
    desc: "Own 50 Dairy Farms.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("farm") >= 50,
  },
  {
    id: "factory_1",
    name: "Melt Down",
    desc: "Buy your first Fondue Factory.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("factory") >= 1,
  },
  {
    id: "factory_10",
    name: "Vat Operator",
    desc: "Own 10 Fondue Factories.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("factory") >= 10,
  },
  {
    id: "factory_25",
    name: "Fondue Tycoon",
    desc: "Own 25 Fondue Factories.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("factory") >= 25,
  },
  {
    id: "lab_1",
    name: "Mad Scientist",
    desc: "Buy your first Genetics Lab.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("lab") >= 1,
  },
  {
    id: "mine_1",
    name: "One Small Step",
    desc: "Buy your first Moon Cheese Mine.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("mine") >= 1,
  },
  {
    id: "portal_1",
    name: "Milky Way",
    desc: "Buy your first Cheddar Portal.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("portal") >= 1,
  },
  {
    id: "portal_10",
    name: "Universal Curds",
    desc: "Own 10 Cheddar Portals.",
    unlocked: false,
    isSecret: false,
    check: () => getBuildingCount("portal") >= 10,
  },
  {
    id: "upgrade_1",
    name: "Optimized Workflow",
    desc: "Purchase your first dairy upgrade.",
    unlocked: false,
    isSecret: false,
    check: () => upgradesData.some((u) => u.type === "upgrade" && u.count > 0),
  },
  {
    id: "all_upgrades_5",
    name: "Master Craftsman",
    desc: "Purchase 5 dairy upgrades.",
    unlocked: false,
    isSecret: false,
    check: () =>
      upgradesData.filter((u) => u.type === "upgrade" && u.count > 0).length >=
      5,
  },
  {
    id: "all_upgrades_15",
    name: "The Whole Catalog",
    desc: "Purchase 15 total upgrades.",
    unlocked: false,
    isSecret: false,
    check: () =>
      upgradesData.filter((u) => u.type === "upgrade" && u.count > 0).length >=
      15,
  },
  {
    id: "sps_10",
    name: "Flowing Streams",
    desc: "Reach 10 cheese per second.",
    unlocked: false,
    isSecret: false,
    check: () => calculateTotalSPS() >= 10,
  },
  {
    id: "sps_100",
    name: "Torrents of Curds",
    desc: "Reach 100 cheese per second.",
    unlocked: false,
    isSecret: false,
    check: () => calculateTotalSPS() >= 100,
  },
  {
    id: "sps_1000",
    name: "Dairy Tsunami",
    desc: "Reach 1,000 cheese per second.",
    unlocked: false,
    isSecret: false,
    check: () => calculateTotalSPS() >= 1000,
  },
  {
    id: "sps_50000",
    name: "Intergalactic Dairy",
    desc: "Reach 50,000 cheese per second.",
    unlocked: false,
    isSecret: false,
    check: () => calculateTotalSPS() >= 50000,
  },
  {
    id: "clicks_50",
    name: "Rapid Fire Fingers",
    desc: "Click the main button 50 times in a session.",
    unlocked: false,
    isSecret: false,
    check: () => sessionClicks >= 50,
  },
  {
    id: "clicks_5000",
    name: "Heavy Metal Fingers",
    desc: "Click the main cheese button 5,000 times in a session.",
    unlocked: false,
    isSecret: false,
    check: () => sessionClicks >= 5000,
  },

  // --- Secret Achievements (8 Total) ---
  {
    id: "secret_1",
    name: "???",
    desc: "Hint: MY FINGERS ARE GOING TO VAPORIZE!",
    unlocked: false,
    isSecret: true,
    check: () => sessionClicks >= 250,
  },
  {
    id: "secret_2",
    name: "???",
    desc: "Hint: Come on man, I got to wait!",
    unlocked: false,
    isSecret: true,
    check: () => idleTimer >= 120,
  },
  {
    id: "secret_3",
    name: "???",
    desc: "Hint: Sometimes scrolling away from the top and hunting through the bottom of the store reveals hidden treasures.",
    unlocked: false,
    isSecret: true,
    check: () => checkedStoreBottom,
  },
  {
    id: "secret_4",
    name: "???",
    desc: "Hint: Wait, take these buildings back... I want a refund!",
    unlocked: false,
    isSecret: true,
    check: () => hasSoldABuilding === true,
  },
  {
    id: "secret_5",
    name: "???",
    desc: "Hint: Oh my god, I can't believe I am broke!.",
    unlocked: false,
    isSecret: true,
    check: () => score === 0 && sessionClicks > 50,
  },
  {
    id: "secret_6",
    name: "???",
    desc: "Hint: Wow, someone who will actually click the news, interesting... I wonder what they will find?",
    unlocked: false,
    isSecret: true,
    check: () => clickedNewsTicker === true,
  },
  {
    id: "secret_7",
    name: "???",
    desc: "Hint: AHH, was that a werewolf?",
    unlocked: false,
    isSecret: true,
    check: () => {
      const currentHour = new Date().getHours();
      return currentHour >= 0 && currentHour < 3;
    },
  },
  {
    id: "secret_8",
    name: "???",
    desc: "Hint: One of each, finally, sure took some time!",
    unlocked: false,
    isSecret: true,
    check: () => {
      return (
        getBuildingCount("grater") >= 1 &&
        getBuildingCount("whisk") >= 1 &&
        getBuildingCount("farm") >= 1 &&
        getBuildingCount("factory") >= 1 &&
        getBuildingCount("lab") >= 1 &&
        getBuildingCount("mine") >= 1 &&
        getBuildingCount("portal") >= 1 &&
        getBuildingCount("churner") >= 1 &&
        getBuildingCount("press") >= 1 &&
        getBuildingCount("accelerator") >= 1
      );
    },
  },
];

let sessionClicks = 0;
let idleTimer = 0;
let checkedStoreBottom = false;

/**
 * ==========================================
 * 2. NUMBER FORMATTER (PREFIX SYSTEM)
 * ==========================================
 */
function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return "0";
  if (value < 1000) return Math.floor(value).toLocaleString();

  const suffixes = [
    "",
    "K",
    "M",
    "B",
    "T",
    "Qa",
    "Qi",
    "Sx",
    "Sp",
    "Oc",
    "No",
    "Dc",
  ];
  let i = 0;
  let num = value;

  while (num >= 1000 && i < suffixes.length - 1) {
    num /= 1000;
    i++;
  }

  return num.toFixed(2) + suffixes[i];
}

/**
 * ==========================================
 * 3. AUDIO (SFX) HELPER
 * ==========================================
 */
function playSound(sfxId) {
  const sound = document.getElementById(sfxId);
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch((e) => console.log("Audio play blocked/error:", e));
  }
}

/**
 * ==========================================
 * 4. DOM ELEMENT REFERENCES
 * ==========================================
 */
const scoreDisplay = document.getElementById("score-display");
const spsDisplay = document.getElementById("sps-display");
const cpcDisplay = document.getElementById("cpc-display");
const mainClickBtn = document.getElementById("main-click-btn");
const buildingsContainer = document.getElementById("buildings-container");
const upgradesContainer = document.getElementById("upgrades-container");
const activeBuildingsContainer = document.getElementById(
  "active-buildings-container",
);
const saveStatus = document.getElementById("save-status");
const newsTicker = document.getElementById("news-ticker");
const achCountDisplay = document.getElementById("ach-count");
const achievementsModal = document.getElementById("achievements-modal");
const achievementsList = document.getElementById("achievements-list");
const modeBuyBtn = document.getElementById("mode-buy-btn");
const modeSellBtn = document.getElementById("mode-sell-btn");
const batchSpecialBtn = document.getElementById("batch-special-btn");
const batchLabel = document.getElementById("batch-label");

function getBuildingCount(id) {
  const item = upgradesData.find((u) => u.id === id);
  return item ? item.count : 0;
}

/**
 * ==========================================
 * 5. LOCAL STORAGE SAVE / LOAD SYSTEM
 * ==========================================
 */
const SAVE_KEY = "CHEESE_CLICKER_SAVE_DATA_V3_4";

function saveGame() {
  const saveData = {
    score: score,
    baseClickPower: baseClickPower,
    prestigePoints: prestigePoints,
    permanentUpgrades: permanentUpgrades,
    upgrades: upgradesData.map((u) => ({
      id: u.id,
      count: u.count,
      cost: u.cost,
    })),
    achievements: achievementsData.map((a) => ({
      id: a.id,
      unlocked: a.unlocked,
    })),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

  saveStatus.textContent = "Game saved!";
  setTimeout(() => {
    saveStatus.textContent = "Game saved automatically";
  }, 2000);
}

function loadGame() {
  const savedString = localStorage.getItem(SAVE_KEY);
  if (!savedString) return false;

  try {
    const savedData = JSON.parse(savedString);
    score = savedData.score || 0;
    baseClickPower = savedData.baseClickPower || 1;
    prestigePoints = savedData.prestigePoints || 0;
    permanentUpgrades = savedData.permanentUpgrades || {};

    if (savedData.upgrades) {
      savedData.upgrades.forEach((savedItem) => {
        const match = upgradesData.find((u) => u.id === savedItem.id);
        if (match) {
          match.count = savedItem.count;
          match.cost = savedItem.cost;
        }
      });
    }

    if (savedData.achievements) {
      savedData.achievements.forEach((savedAch) => {
        const match = achievementsData.find((a) => a.id === savedAch.id);
        if (match) match.unlocked = savedAch.unlocked;
      });
    }
    return true;
  } catch (e) {
    console.error("Load error:", e);
    return false;
  }
}

window.addEventListener("beforeunload", () => {
  saveGame();
});

/**
 * ==========================================
 * 6. INITIALIZATION & DATA FETCHING
 * ==========================================
 */
async function initGame() {
  try {
    const response = await fetch("upgrades.json");
    if (!response.ok) throw new Error("Could not fetch upgrades.json");

    upgradesData = await response.json();

    upgradesData.forEach((item) => {
      if (!item.baseCost) item.baseCost = item.cost;
    });

    loadGame();

    renderShop();
    renderActiveBuildings();
    renderAchievementsModal();
    updateDisplay();
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

/**
 * ==========================================
 * 7. STORE MODE & BATCH CONTROLS
 * ==========================================
 */
function setStoreMode(mode) {
  storeMode = mode;
  if (mode === "buy") {
    modeBuyBtn.classList.add("active");
    modeSellBtn.classList.remove("active");
    batchSpecialBtn.textContent = "Max";
    batchSpecialBtn.setAttribute("data-amt", "special");
  } else {
    modeSellBtn.classList.add("active");
    modeBuyBtn.classList.remove("active");
    batchSpecialBtn.textContent = "All";
    batchSpecialBtn.setAttribute("data-amt", "special");
  }
  renderShop();
  updateDisplay();
}

function setBatchAmount(amt) {
  batchAmount = amt;
  document
    .querySelectorAll(".batch-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
  renderShop();
  updateDisplay();
}

/**
 * ==========================================
 * 8. CALCULATING COSTS & BATCH VALUES
 * ==========================================
 */
function getBatchBuyCost(item, amount) {
  if (item.type === "upgrade") return item.cost;
  let totalCost = 0;
  for (let i = 0; i < amount; i++) {
    let costForNext = item.baseCost * Math.pow(1.15, item.count + i);
    totalCost += costForNext;
  }
  return totalCost;
}

function getMaxBuyAmount(item) {
  if (item.type === "upgrade") return item.count === 0 ? 1 : 0;
  let count = 0;
  let tempScore = score;
  let currentCount = item.count;
  while (true) {
    let costForNext = item.baseCost * Math.pow(1.15, currentCount + count);
    if (tempScore >= costForNext) {
      tempScore -= costForNext;
      count++;
    } else {
      break;
    }
    if (count >= 1000) break;
  }
  return Math.max(1, count);
}

function getBatchSellRefund(item, amount) {
  if (item.type === "upgrade") {
    return item.count > 0 ? Math.floor(item.cost * 0.5) : 0;
  }
  let actualSellCount = Math.min(amount, item.count);
  let totalRefund = 0;
  for (let i = 0; i < actualSellCount; i++) {
    let unitCost = item.baseCost * Math.pow(1.15, item.count - 1 - i);
    totalRefund += unitCost * 0.5;
  }
  return totalRefund;
}

/**
 * ==========================================
 * 9. RENDERING STORE SECTIONS & MODALS
 * ==========================================
 */
function renderShop() {
  buildingsContainer.innerHTML = "";
  upgradesContainer.innerHTML = "";

  let visibleUpgradesCount = 0;

  upgradesData.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "upgrade-card";

    if (item.type === "building") {
      let actionText = "";
      let targetAmt = 1;

      if (storeMode === "buy") {
        targetAmt =
          batchAmount === "special" ? getMaxBuyAmount(item) : batchAmount;
        let cost = getBatchBuyCost(item, targetAmt);
        actionText = `Buy ${targetAmt} (${formatNumber(cost)})`;
      } else {
        targetAmt =
          batchAmount === "special"
            ? item.count
            : Math.min(batchAmount, item.count);
        let refund = getBatchSellRefund(item, targetAmt);
        actionText =
          item.count > 0
            ? `Sell ${targetAmt} (+${formatNumber(refund)})`
            : `Sell`;
      }

      card.innerHTML = `
                <div class="upgrade-info">
                    <h4>${item.name} (${item.count})</h4>
                    <p>${item.description}</p>
                </div>
                <button class="upgrade-btn" id="upgrade-btn-${index}" onclick="handleStoreAction(${index})">
                    ${actionText}
                </button>
            `;
      buildingsContainer.appendChild(card);
    } else if (item.type === "upgrade") {
      const parentBuilding = upgradesData.find((u) => u.id === item.target);
      if (parentBuilding && parentBuilding.count === 0) return;

      if (storeMode === "buy" && item.count > 0) return;
      if (storeMode === "sell" && item.count === 0) return;

      visibleUpgradesCount++;
      let actionText =
        storeMode === "buy"
          ? `Buy (${formatNumber(item.cost)})`
          : `Sell (+${formatNumber(item.cost * 0.5)})`;

      card.innerHTML = `
                <div class="upgrade-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                </div>
                <button class="upgrade-btn" id="upgrade-btn-${index}" onclick="handleStoreAction(${index})">
                    ${actionText}
                </button>
            `;
      upgradesContainer.appendChild(card);
    }
  });

  if (storeMode === "buy" && visibleUpgradesCount === 0) {
    upgradesContainer.innerHTML =
      '<p class="placeholder-text">Buy buildings to unlock upgrades!</p>';
  } else if (storeMode === "sell" && upgradesContainer.children.length === 0) {
    upgradesContainer.innerHTML =
      '<p class="placeholder-text">No upgrades owned to sell!</p>';
  }
}

function renderActiveBuildings() {
  activeBuildingsContainer.innerHTML = "";
  const ownedBuildings = upgradesData.filter(
    (u) => u.type === "building" && u.count > 0,
  );

  if (ownedBuildings.length === 0) {
    activeBuildingsContainer.innerHTML =
      '<p class="placeholder-text">No facilities built yet. Check the shop on the right!</p>';
    return;
  }

  let globalMultiplier = 1;
  upgradesData.forEach((up) => {
    if (
      up.type === "upgrade" &&
      up.category === "global_mult" &&
      up.count > 0
    ) {
      globalMultiplier += up.value;
    }
  });

  ownedBuildings.forEach((building) => {
    const item = document.createElement("div");
    item.className = "active-building-item";

    let buildingMultiplier = 1;
    upgradesData.forEach((up) => {
      if (
        up.type === "upgrade" &&
        up.category === "building_mult" &&
        up.target === building.id &&
        up.count > 0
      ) {
        buildingMultiplier = up.value;
      }
    });

    const finalOutput =
      building.sps * building.count * buildingMultiplier * globalMultiplier;

    item.innerHTML = `
            <div class="active-building-info">
                <h4>${building.name}</h4>
                <span>(+${formatNumber(finalOutput)} /s)</span>
            </div>
            <div class="active-building-count">${building.count}</div>
        `;

    activeBuildingsContainer.appendChild(item);
  });
}

function renderAchievementsModal() {
  achievementsList.innerHTML = "";
  let unlockedCount = 0;

  achievementsData.forEach((ach) => {
    if (ach.unlocked) unlockedCount++;

    const card = document.createElement("div");
    card.className = `achievement-card ${ach.unlocked ? "" : "locked"}`;

    card.innerHTML = `
            <div class="achievement-icon">${ach.unlocked ? "🏆" : "🔒"}</div>
            <div class="achievement-info">
                <h4>${ach.unlocked || !ach.isSecret ? ach.name : "??? (Secret)"}</h4>
                <p>${ach.desc}</p>
            </div>
        `;
    achievementsList.appendChild(card);
  });

  achCountDisplay.textContent = unlockedCount;
}

function openAchievementsModal() {
  renderAchievementsModal();
  achievementsModal.style.display = "flex";
}

function closeAchievementsModal() {
  achievementsModal.style.display = "none";
}

/**
 * ==========================================
 * 10. GAMEPLAY INTERACTION LOGIC (CLICK, STORE)
 * ==========================================
 */
function calculateTotalCPC() {
  let currentCPC = baseClickPower;
  upgradesData.forEach((up) => {
    if (up.type === "upgrade" && up.category === "click" && up.count > 0) {
      currentCPC += up.value;
    }

    prestigeCatalog.forEach((up) => {
      if (permanentUpgrades[up.id] && up.type === "click_mult")
        currentCPC *= up.val;
    });
  });
  return currentCPC;
}

mainClickBtn.addEventListener("click", (e) => {
  let earned = calculateTotalCPC();
  score += earned;
  sessionClicks++;
  idleTimer = 0;

  playSound("sfx-click");
  spawnFloatingText(e, `+${formatNumber(earned)} cheese`);

  checkAchievements();
  updateDisplay();
});

// News ticker click handler for Secret #6
newsTicker.addEventListener("click", () => {
  clickedNewsTicker = true;
  checkAchievements();
});

function spawnFloatingText(e, text) {
  const floatEl = document.createElement("div");
  floatEl.className = "floating-text";
  floatEl.textContent = text;

  const x = e.clientX + (Math.random() * 30 - 15);
  const y = e.clientY + (Math.random() * 10 - 5);

  floatEl.style.left = `${x}px`;
  floatEl.style.top = `${y}px`;

  document.body.appendChild(floatEl);

  setTimeout(() => {
    floatEl.remove();
  }, 600);
}

function handleStoreAction(index) {
  const item = upgradesData[index];

  if (storeMode === "buy") {
    if (item.type === "building") {
      let targetAmt =
        batchAmount === "special" ? getMaxBuyAmount(item) : batchAmount;
      let cost = getBatchBuyCost(item, targetAmt);

      if (score >= cost && targetAmt > 0) {
        score -= cost;
        item.count += targetAmt;
        item.cost = item.baseCost * Math.pow(1.15, item.count);
        playSound("sfx-buy");
      }
    } else if (item.type === "upgrade") {
      if (score >= item.cost && item.count === 0) {
        score -= item.cost;
        item.count = 1;
        playSound("sfx-buy");
      }
    }
  } else {
    if (item.type === "building") {
      let targetAmt =
        batchAmount === "special"
          ? item.count
          : Math.min(batchAmount, item.count);
      if (targetAmt > 0 && item.count >= targetAmt) {
        let refund = getBatchSellRefund(item, targetAmt);
        score += refund;
        item.count -= targetAmt;
        item.cost = item.baseCost * Math.pow(1.15, item.count);
        hasSoldABuilding = true; // Trigger for Secret #4
        playSound("sfx-buy");
      }
    } else if (item.type === "upgrade") {
      if (item.count > 0) {
        let refund = item.cost * 0.5;
        score += refund;
        item.count = 0;
        playSound("sfx-buy");
      }
    }
  }

  renderShop();
  renderActiveBuildings();
  checkAchievements();
  updateDisplay();
  saveGame();
}

upgradesContainer.addEventListener("scroll", () => {
  if (
    upgradesContainer.scrollTop + upgradesContainer.clientHeight >=
    upgradesContainer.scrollHeight - 10
  ) {
    checkedStoreBottom = true;
    checkAchievements();
  }
});

/**
 * ==========================================
 * 11. MATH, SPS, & ACHIEVEMENTS CHECKER
 * ==========================================
 */
function calculateTotalSPS() {
  let globalMultiplier = 1;
  upgradesData.forEach((up) => {
    if (
      up.type === "upgrade" &&
      up.category === "global_mult" &&
      up.count > 0
    ) {
      globalMultiplier += up.value;
    }
  });

  // Prestige SPS Multiplier integration
  prestigeCatalog.forEach((up) => {
    if (permanentUpgrades[up.id] && up.type === "sps_mult") {
      globalMultiplier += up.val;
    }
  });

  let totalSps = 0;
  upgradesData.forEach((building) => {
    if (building.type === "building") {
      let buildingMultiplier = 1;
      upgradesData.forEach((up) => {
        if (
          up.type === "upgrade" &&
          up.category === "building_mult" &&
          up.target === building.id &&
          up.count > 0
        ) {
          buildingMultiplier = up.value;
        }
      });
      totalSps +=
        building.sps * building.count * buildingMultiplier * globalMultiplier;
    }
  });
  return totalSps;
}

function checkAchievements() {
  achievementsData.forEach((ach) => {
    if (!ach.unlocked && ach.check()) {
      ach.unlocked = true;
      playSound("sfx-achievement");
      renderAchievementsModal();
    }
  });
}
/**
 * ==========================================
 * 12. UI REFRESH & GAME LOOPS
 * ==========================================
 */
function updateDisplay() {
  scoreDisplay.textContent = formatNumber(score);
  let currentSps = calculateTotalSPS();
  let currentCpc = calculateTotalCPC();
  spsDisplay.textContent = `per second: ${formatNumber(currentSps)}`;
  cpcDisplay.textContent = `per click: ${formatNumber(currentCpc)}`;

  upgradesData.forEach((item, index) => {
    const btn = document.getElementById(`upgrade-btn-${index}`);
    if (btn) {
      if (storeMode === "buy") {
        let targetAmt =
          item.type === "building"
            ? batchAmount === "special"
              ? getMaxBuyAmount(item)
              : batchAmount
            : 1;
        let cost =
          item.type === "building"
            ? getBatchBuyCost(item, targetAmt)
            : item.cost;
        if (score < cost || (item.type === "upgrade" && item.count > 0)) {
          btn.setAttribute("disabled", "true");
        } else {
          btn.removeAttribute("disabled");
        }
      } else {
        if (
          (item.type === "building" && item.count === 0) ||
          (item.type === "upgrade" && item.count === 0)
        ) {
          btn.setAttribute("disabled", "true");
        } else {
          btn.removeAttribute("disabled");
        }
      }
    }
  });
}

// Loop 1: Passive Income tick + Idle Timer Tracker (Every 1 second)
setInterval(() => {
  let sps = calculateTotalSPS();
  if (sps > 0) {
    score += sps;
    checkAchievements();
    updateDisplay();
  }
  idleTimer++;
  checkAchievements();
}, 1000);

// Loop 2: News Ticker Cycler (Switches news every 7 seconds)
setInterval(() => {
  currentNewsIndex = (currentNewsIndex + 1) % newsHeadlines.length;
  newsTicker.style.opacity = 0;
  setTimeout(() => {
    newsTicker.textContent = newsHeadlines[currentNewsIndex];
    newsTicker.style.opacity = 1;
  }, 500);
}, 7000);

// Loop 3: Auto-Save backup every 30 seconds
setInterval(() => {
  saveGame();
}, 30000);

window.addEventListener("keydown", (e) => {
  if (
    (e.key === "Enter" || e.key === " ") &&
    document.activeElement &&
    document.activeElement.tagName === "BUTTON"
  ) {
    e.preventDefault();
    document.activeElement.blur();
  }
});

function openResetConfirm() {
  document.getElementById("reset-modal").style.display = "flex";
}
function closeModals() {
  document
    .querySelectorAll(".modal-overlay")
    .forEach((m) => (m.style.display = "none"));
}
function enterGameFromPrestige() {
  closeModals();
}

function openPrestigeMenu() {
  document.getElementById("prestige-points-display").textContent =
    formatNumber(prestigePoints);
  document.getElementById("pending-prestige-display").textContent =
    formatNumber(calculatePendingPrestigePoints());
  renderPrestigeUpgrades();
  document.getElementById("prestige-modal").style.display = "flex";
}

function calculatePendingPrestigePoints() {
  if (score < 1000000) return 0;
  return Math.floor((score - 1000000) / 500000) + 1;
}

function renderPrestigeUpgrades() {
  const container = document.getElementById("prestige-upgrades-container");
  container.innerHTML = "";
  prestigeCatalog.forEach((up) => {
    const isOwned = permanentUpgrades[up.id] === true;
    container.innerHTML += `
      <div class="prestige-upgrade-card">
        <div><strong>${up.name}</strong> (${up.cost} pts)<br><small>${up.desc}</small></div>
        <button class="upgrade-btn" onclick="buyPrestigeUpgrade('${up.id}')" ${isOwned || prestigePoints < up.cost ? "disabled" : ""}>
          ${isOwned ? "Owned" : "Buy"}
        </button>
      </div>`;
  });
}

function buyPrestigeUpgrade(id) {
  const up = prestigeCatalog.find((item) => item.id === id);
  if (up && prestigePoints >= up.cost && !permanentUpgrades[id]) {
    prestigePoints -= up.cost;
    permanentUpgrades[id] = true;
    openPrestigeMenu();
    saveGame();
  }
}

function triggerPrestige() {
  let earnedPoints = calculatePendingPrestigePoints();
  if (earnedPoints <= 0) {
    alert("You need at least 1,000,000 score to prestige!");
    return;
  }
  prestigePoints += earnedPoints;
  score = 0;
  sessionClicks = 0;
  upgradesData.forEach((item) => {
    item.count = 0;
    if (item.type === "building") item.cost = item.baseCost;
  });
  prestigeCatalog.forEach((up) => {
    if (permanentUpgrades[up.id] && up.type === "starting_cash")
      score += up.val;
  });
  saveGame();
  openPrestigeMenu();
}

function executeReset() {
  localStorage.clear();
  location.reload();
}

initGame();
