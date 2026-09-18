/**
 * ==========================================
 * 1. GAME STATE & DATA DEFINITIONS
 * ==========================================
 */

// Core Economic & Progress Variables
let score = 0; // Current currency (Cheese)
let currentNewsIndex = 0;
let baseClickPower = 1; // Base cheese earned per click
let upgradesData = []; // Dynamic array holding building and upgrade definitions
let prestigePoints = 0; // Currency earned from prestige resets
let permanentUpgrades = {}; // Lookup dictionary for unlocked prestige bonuses
let gameStarted = false; // <-- Added here to track the start menu state

// Frenzy & Mini-game States
let frenzyActive = false; // Tracks whether the 7x Golden Cheese Frenzy is active
let frenzyTimer = 0; // Counts down the remaining seconds of the frenzy

// Store & Batch Purchasing States
let storeMode = "buy"; // Current store tab mode: 'buy' or 'sell'
let batchAmount = 1; // Purchase multiplier: 1, 10, 25, 100, or 'special' ('max'/'all')

// Tracking States for Secret Achievements & UI Interactivity
let clickedScoreCounter = false;
let clickedNewsTicker = false; // Tracks if the user clicked the news ticker (Secret #6)
let hasSoldABuilding = false; // Tracks if the user has ever sold a building (Secret #4)
let sessionClicks = 0; // Counts clicks made during the current session
let idleTimer = 0; // Counts seconds the user has been idle
let checkedStoreBottom = false; // Tracks if the user scrolled to the bottom of the store (Secret #3)

// Golden Cheese / Rat Spawner Interval (Checks every 15 seconds with a 30% chance)
setInterval(() => {
  if (!gameStarted) return; // Pauses the rat spawns if the start menu is up!
  if (Math.random() < 0.3) {
    if (typeof spawnGoldenCheese === "function") {
      spawnGoldenCheese();
    }
  }
}, 15000);

// 5 Rotating News Pieces
const newsHeadlines = [
  "🧀 News: Local cows got reported by record-breaking amounts of milk produced in a day!",
  "🧀 News: Local hospitals declare that cheese is essential for health!",
  "🧀 News: Experts warn against building houses out of Swiss due to structural leakage.",
  "🧀 News: Strange rat spotted wearing a tiny golden crown near the dairy silos.",
  "🧀 News: Mozzarella stocks soar as winter approaches across northern regions.",
  "🧀 News: People love cheese so much, they are making everything out of it, this is getting out of hand!",
];

// Start background music on the user's very first click anywhere on the page
document.addEventListener(
  "click",
  function startAudioOnFirstClick() {
    const bgMusic = document.getElementById("bg-music");
    if (bgMusic && bgMusic.paused) {
      bgMusic.volume = 0.3; // Set volume to 30%
      bgMusic
        .play()
        .then(() => {
          // Once it successfully starts playing, remove this listener so it doesn't trigger again
          document.removeEventListener("click", startAudioOnFirstClick);
        })
        .catch((error) => {
          console.log("Waiting for user interaction to play music:", error);
        });
    }
  },
  { once: true },
);

/**
 * ==========================================
 * 2. NUMBER FORMATTER (PREFIX SYSTEM)
 * ==========================================
 * Formats large incremental numbers into readable abbreviations (K, M, B, T, etc.)
 */
function formatNumber(value) {
  // Safeguard against invalid inputs, returning "0" as a fallback
  if (value === null || value === undefined || isNaN(value)) return "0";

  // Handle numbers under 1,000 normally by rounding down and adding local comma separators
  if (value < 1000) return Math.floor(value).toLocaleString();

  // Standard incremental numbering suffixes
  const suffixes = [
    "",
    "K", // Thousand
    "M", // Million
    "B", // Billion
    "T", // Trillion
    "Qd", // Quadrillion
    "Qi", // Quintillion
    "Sx", // Sextillion
    "Sp", // Septillion
    "Oc", // Octillion
    "No", // Nonillion
    "Dc", // Decillion
    "UDe", // Undecillion
    "DDe", // Duodecillion
    "TRe", // Tredecillion
    "Vg", // Vigintillion
    "Tg", // Trigintillion
    "Qag", // Quadragintillion
    "Qig", // Quinquagintillion
    "Sxg", // Sexagintillion
    "Spg", // Septuagintillion
    "Ocg", // Octogintillion
    "Nog", // Nonagintillion
    "Ce", // Centillion
  ];

  let i = 0;
  let num = value;

  // Scale down the number by thousands while moving up the suffix array tier
  while (num >= 1000 && i < suffixes.length - 1) {
    num /= 1000;
    i++;
  }

  // Format to 2 decimal places combined with the appropriate suffix unit
  return num.toFixed(2) + suffixes[i];
}
/**
 * ==========================================
 * 3. AUDIO (SFX) HELPER
 * ==========================================
 * Plays sound effects safely, with support for overlapping audio on rapid clicks.
 */
function playSound(sfxId) {
  const sound = document.getElementById(sfxId);
  if (sound) {
    // Clone the sound element so rapid clicking allows sounds to overlap
    // instead of instantly cutting off the previous audio clip.
    const soundClone = sound.cloneNode(true);
    soundClone.volume = 0.3; // Preserve original volume settings

    soundClone.play().catch((e) => {
      // Catch and log browser autoplay restriction errors gracefully
      console.log("Audio play blocked or encountered an error:", e);
    });
  }
}

/**
 * ==========================================
 * 4. DOM ELEMENT REFERENCES & CORE HELPERS
 * ==========================================
 * Caches references to HTML elements to optimize performance and prevent repeated DOM queries.
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
const scoreElement = document.getElementById("scoreDisplay");

// Additional DOM element hooks for mini-games / modals if needed
const mouseInvasionContainer = document.getElementById(
  "mouse-invasion-container",
);
const prestigeModal = document.getElementById("prestige-modal");

// Required statements for secrets/achievements:

if (scoreElement) {
  scoreElement.addEventListener("click", () => {
    scoreClickFastCount++;

    // Clear timer if they pause clicking
    clearTimeout(scoreClickTimer);

    // If they click it 10 times quickly, trigger the secret!
    if (scoreClickFastCount >= 10) {
      clickedScoreCounter = true;
      // Optional: Call your check achievements function here so it unlocks instantly
      if (typeof checkAchievements === "function") checkAchievements();
    }

    // Reset the fast-click streak if they take longer than 1 second between clicks
    scoreClickTimer = setTimeout(() => {
      scoreClickFastCount = 0;
    }, 1000);
  });
}

/**
 * Helper function to look up how many units of a specific building the player owns.
 * Used extensively by achievement checks, costs, and requirements.
 */
function getBuildingCount(id) {
  const building = upgradesData.find(
    (u) => u.id === id && u.type === "building",
  );
  return building ? building.count : 0;
}

/**
 * ==========================================
 * START MENU & UPDATE LOGS CONTROLS
 * ==========================================
 */
function startGame() {
  gameStarted = true;
  const startMenu = document.getElementById("start-menu");
  if (startMenu) {
    startMenu.style.display = "none";
  }
}

function openUpdateLogs() {
  const updateLogsModal = document.getElementById("update-logs-modal");
  if (updateLogsModal) {
    updateLogsModal.style.display = "flex";
  }
}

function closeUpdateLogs() {
  const updateLogsModal = document.getElementById("update-logs-modal");
  if (updateLogsModal) {
    updateLogsModal.style.display = "none";
  }
}
/**
 * ==========================================
 * 5. LOCAL STORAGE SAVE / LOAD & MINI-GAMES
 * ==========================================
 * Manages game persistence (saving/loading states) and random mini-game event triggers.
 */
const SAVE_KEY = "CHEESE_CLICKER_SAVE_DATA_V3_4";

// Saves core player variables, building counts, and achievement states to browser localStorage
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

  // Feedback ticker update
  saveStatus.textContent = "Game saved!";
  setTimeout(() => {
    saveStatus.textContent = "Autosaved!";
  }, 2000);
}

// Loads saved data from localStorage and reconciles it with active data arrays
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

// Automatically save progress right before the user closes or refreshes the tab
window.addEventListener("beforeunload", () => {
  saveGame();
});

// Spawns a clickable golden cheese element randomly on screen (Paused until start menu is clicked)
setInterval(() => {
  if (!gameStarted) return;
  if (Math.random() < 0.3) {
    if (typeof spawnGoldenCheese === "function") {
      spawnGoldenCheese();
    }
  }
}, 15000);

function spawnGoldenCheese() {
  const goldenEl = document.getElementById("golden-cheese");
  if (!goldenEl || goldenEl.style.display === "block") return;

  const randomX = Math.random() * (window.innerWidth - 100);
  const randomY = Math.random() * (window.innerHeight - 100);

  goldenEl.style.left = `${randomX}px`;
  goldenEl.style.top = `${randomY}px`;
  goldenEl.style.display = "block";

  const disappearTimeout = setTimeout(() => {
    goldenEl.style.display = "none";
  }, 5000);

  goldenEl.onclick = () => {
    clearTimeout(disappearTimeout);
    goldenEl.style.display = "none";
    triggerFrenzy();
  };
}

// Triggers the Golden Frenzy buff
function triggerFrenzy() {
  if (!gameStarted) return;
  frenzyActive = true;
  frenzyTimer = 15; // 15 seconds of frenzy duration

  const ticker = document.getElementById("news-ticker");
  if (ticker) {
    ticker.textContent =
      "🌟 GOLDEN FRENZY! Production & Click power multiplied by 7x for 15 seconds!";
  }
}

// Checks every 2 minutes with a 40% chance (Spawns roughly every 5 minutes on average)
setInterval(() => {
  if (!gameStarted) return;
  if (!frenzyActive && Math.random() < 0.4) {
    spawnGoldenCheese();
  }
}, 120000);

// Spawns a wave of mice across the screen for bonus currency
function triggerMouseInvasion() {
  const container = document.getElementById("mouse-invasion-container");
  if (!container || !gameStarted) return;

  container.style.pointerEvents = "auto";

  for (let i = 0; i < 5; i++) {
    const mouse = document.createElement("div");
    mouse.className = "mouse-item";
    mouse.innerHTML = "🐭";

    const startY = Math.random() * (window.innerHeight - 100);
    mouse.style.left = "-50px";
    mouse.style.top = `${startY}px`;

    mouse.onclick = () => {
      // Calculate SPS reward scaling safely
      const sps =
        typeof calculateTotalSPS === "function" ? calculateTotalSPS() : 1;
      score += Math.max(10, sps * 10);
      playSound("sfx-buy");
      mouse.remove();
    };

    container.appendChild(mouse);

    setTimeout(() => {
      mouse.style.transform = `translateX(${window.innerWidth + 100}px) translateY(${(Math.random() - 0.5) * 200}px)`;
    }, 50);

    setTimeout(() => {
      if (mouse.parentElement) mouse.remove();
    }, 3100);
  }

  setTimeout(() => {
    container.style.pointerEvents = "none";
  }, 3500);
}

// Trigger mouse invasion loop every 60 seconds
setInterval(() => {
  if (!gameStarted) return;
  triggerMouseInvasion();
}, 60000);

/**
 * ==========================================
 * 6. INITIALIZATION & DATA FETCHING
 * ==========================================
 * Asynchronously loads building and upgrade configurations from an external JSON file,
 * restores player save data, and triggers initial UI rendering.
 */
async function initGame() {
  try {
    // 1. Fetch data from your JSON files
    const gameDataRes = await fetch("game-data.json");
    const gameData = await gameDataRes.json();

    achievementsData = gameData.achievements || [];
    prestigeCatalog = gameData.prestige || [];

    const upgradesRes = await fetch("upgrades.json");
    upgradesData = await upgradesRes.json();

    // 2. Automatically bind a dynamic rule evaluator to every achievement from JSON criteria
    achievementsData.forEach((ach) => {
      ach.check = () => {
        const c = ach.condition;
        if (!c) return false;

        switch (c.type) {
          case "score":
            return score >= c.value;
          case "session_clicks":
            return sessionClicks >= c.value;
          case "idle_timer":
            return idleTimer >= c.value;
          case "sps":
            return (
              typeof calculateTotalSPS === "function" &&
              calculateTotalSPS() >= c.value
            );
          case "building_count":
            return getBuildingCount(c.target) >= c.value;
          case "upgrade_count":
            return (
              upgradesData.filter((u) => u.type === "upgrade" && u.count > 0)
                .length >= c.value
            );
          case "flag":
            if (c.target === "checkedStoreBottom") return checkedStoreBottom;
            if (c.target === "hasSoldABuilding") return hasSoldABuilding;
            if (c.target === "clickedNewsTickerMultiple")
              return clickedNewsTickerMultiple;
            if (c.target === "clickedScoreCounter") return clickedScoreCounter;
            return false;
          case "broke_check":
            return score === 150 && sessionClicks > 50;
          case "night_owl": {
            const currentHour = new Date().getHours();
            return currentHour >= 0 && currentHour < 3;
          }
          case "all_buildings_owned": {
            const requiredBuildings = [
              "grater",
              "whisk",
              "farm",
              "factory",
              "lab",
              "mine",
              "portal",
              "churner",
              "press",
              "accelerator",
            ];
            return requiredBuildings.every((id) => getBuildingCount(id) >= 1);
          }
          case "exact_one_of_each": {
            const requiredBuildings = [
              "grater",
              "whisk",
              "farm",
              "factory",
              "lab",
              "mine",
              "portal",
              "churner",
              "press",
              "accelerator",
            ];
            return requiredBuildings.every((id) => getBuildingCount(id) === 1);
          }
          default:
            return false;
        }
      };
    });

    // Ensure base costs are tracked
    upgradesData.forEach((item) => {
      if (!item.baseCost) item.baseCost = item.cost;
    });

    loadGame();

    renderShop();
    renderActiveBuildings();
    renderAchievementsModal();
    updateDisplay();

    console.log(
      "Game initialized with fully dynamic achievements and prestige JSON data!",
    );
  } catch (error) {
    console.error("Initialization error:", error);
  }
}
/**
 * ==========================================
 * 7. STORE MODE & BATCH CONTROLS
 * ==========================================
 * Handles toggling between buying and selling structures, as well as adjusting purchase quantities.
 */

// Switches the active store mode between buying upgrades/buildings and selling them back
function setStoreMode(mode) {
  storeMode = mode;

  if (mode === "buy") {
    modeBuyBtn.classList.add("active");
    modeSellBtn.classList.remove("active");
    batchSpecialBtn.textContent = "Max"; // Special button becomes 'Max' in buy mode
    batchSpecialBtn.setAttribute("data-amt", "special");
  } else {
    modeSellBtn.classList.add("active");
    modeBuyBtn.classList.remove("active");
    batchSpecialBtn.textContent = "All"; // Special button becomes 'All' in sell mode
    batchSpecialBtn.setAttribute("data-amt", "special");
  }

  // Re-render shop and update display to reflect mode changes
  renderShop();
  updateDisplay();
}

// Sets the target batch quantity for bulk purchasing or selling (1, 10, 25, 100, Max/All)
function setBatchAmount(amt) {
  batchAmount = amt;

  // Update active state styling across all batch buttons
  document
    .querySelectorAll(".batch-btn")
    .forEach((btn) => btn.classList.remove("active"));

  // Safely add active class to the clicked button if triggered by a DOM event
  if (typeof event !== "undefined" && event && event.target) {
    event.target.classList.add("active");
  }

  // Re-render shop and update display to update cost calculations
  renderShop();
  updateDisplay();
}

/**
 * ==========================================
 * 8. CALCULATING COSTS & BATCH VALUES
 * ==========================================
 * Handles mathematical calculations for building cost scaling, bulk purchasing,
 * maximum affordable amounts, and building refund values.
 */

// Calculates the total cumulative cost to buy a specific batch amount of an item
function getBatchBuyCost(item, amount) {
  // Upgrades always cost a flat rate
  if (item.type === "upgrade") return item.cost;

  let totalCost = 0;
  // Sum up the exponential cost (1.15 multiplier) for each building in the batch
  for (let i = 0; i < amount; i++) {
    let costForNext = item.baseCost * Math.pow(1.15, item.count + i);
    totalCost += costForNext;
  }
  return totalCost;
}

// Determines how many units of a building the player can afford right now
function getMaxBuyAmount(item) {
  // Upgrades can only be bought once (returns 1 if unowned, 0 if owned)
  if (item.type === "upgrade") return item.count === 0 ? 1 : 0;

  let count = 0;
  let tempScore = score;
  let currentCount = item.count;

  // Simulate buying one-by-one until funds run out
  while (true) {
    let costForNext = item.baseCost * Math.pow(1.15, currentCount + count);
    if (tempScore >= costForNext) {
      tempScore -= costForNext;
      count++;
    } else {
      break;
    }
    // Safety cap to prevent browser lag during extreme late-game loops
    if (count >= 1000) break;
  }

  // Ensure it always returns at least 1 so the button remains interactive
  return Math.max(1, count);
}

// Calculates the refund value when selling buildings back to the store (50% return)
function getBatchSellRefund(item, amount) {
  if (item.type === "upgrade") {
    return item.count > 0 ? Math.floor(item.cost * 0.5) : 0;
  }

  let actualSellCount = Math.min(amount, item.count);
  let totalRefund = 0;

  // Calculate backwards from the most recently purchased buildings for accurate refunds
  for (let i = 0; i < actualSellCount; i++) {
    let unitCost = item.baseCost * Math.pow(1.15, item.count - 1 - i);
    totalRefund += unitCost * 0.5; // 50% refund rate
  }

  return totalRefund;
}

/**
 * ==========================================
 * 9. RENDERING STORE SECTIONS & MODALS
 * ==========================================
 * Dynamically draws shop items (buildings & upgrades), active production lists,
 * and the achievement modal interface.
 */

// Renders both the buildings and upgrade market sections based on current mode and batch quantities
function renderShop() {
  buildingsContainer.innerHTML = "";
  upgradesContainer.innerHTML = "";

  let visibleUpgradesCount = 0;

  upgradesData.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "upgrade-card";

    // 1. RENDER BUILDINGS
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

      // 2. RENDER UPGRADES
    } else if (item.type === "upgrade") {
      // Hide upgrades if their prerequisite parent building is not owned yet
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

  // Display placeholder notices if no items are available in view
  if (storeMode === "buy" && visibleUpgradesCount === 0) {
    upgradesContainer.innerHTML =
      '<p class="placeholder-text">Buy buildings to unlock upgrades!</p>';
  } else if (storeMode === "sell" && upgradesContainer.children.length === 0) {
    upgradesContainer.innerHTML =
      '<p class="placeholder-text">No upgrades owned to sell!</p>';
  }
}

// Renders the sidebar showing actively producing buildings and their production rates
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

  // Calculate global multiplier bonuses from purchased upgrades
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

// Populates the achievement modal list and updates unlocked counts
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

// Opens the achievements modal overlay
function openAchievementsModal() {
  renderAchievementsModal();
  achievementsModal.style.display = "flex";
}

// Closes the achievements modal overlay
function closeAchievementsModal() {
  achievementsModal.style.display = "none";
}

/**
 * ==========================================
 * 10. GAMEPLAY INTERACTION LOGIC (CLICK, STORE)
 * ==========================================
 * Handles core click calculations, main click listeners, floating text spawn effects,
 * store purchase/sale transactions, and UI scroll checks for secrets.
 */

// Calculates total Cheese Per Click (CPC) factoring in upgrades, prestige multipliers, and frenzies
function calculateTotalCPC() {
  let currentCPC = baseClickPower;

  // Add flat click bonuses from purchased upgrades
  upgradesData.forEach((up) => {
    if (up.type === "upgrade" && up.category === "click" && up.count > 0) {
      currentCPC += up.value;
    }
  });

  // Apply permanent multiplicative prestige bonuses
  if (typeof prestigeCatalog !== "undefined") {
    prestigeCatalog.forEach((up) => {
      if (
        permanentUpgrades &&
        permanentUpgrades[up.id] &&
        up.type === "click_mult"
      ) {
        currentCPC *= up.val;
      }
    });
  }

  // Apply Golden Frenzy multiplier (matched to 7x multiplier logic)
  if (frenzyActive) {
    currentCPC *= 7;
  }

  return currentCPC;
}

// Main clicker button event listener
mainClickBtn.addEventListener("click", (e) => {
  if (!gameStarted) return;
  let earned = calculateTotalCPC();
  score += earned;
  sessionClicks++;
  idleTimer = 0; // Reset idle timer on active click

  playSound("sfx-click");
  spawnFloatingText(e, `+${formatNumber(earned)} cheese`);

  checkAchievements();
  updateDisplay();
});

// News ticker click handler (Triggers Secret Achievement #6)
newsTicker.addEventListener("click", () => {
  clickedNewsTicker = true;
  checkAchievements();
});

// Spawns floating text numbers at cursor coordinates when clicking the main button
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

// Handles buying and selling logic for buildings and upgrades in the shop
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
    // Sell Mode
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
        hasSoldABuilding = true; // Trigger for Secret Achievement #4
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

  // Refresh UI states and trigger saves
  renderShop();
  renderActiveBuildings();
  checkAchievements();
  updateDisplay();
  saveGame();
}

// Scroll listener on the upgrades container to detect reaching the bottom (Secret Achievement)
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
 * Computes total passive Cheese Per Second (SPS) and evaluates achievement unlocks.
 */
function calculateTotalSPS() {
  if (!gameStarted) return;
  let totalSps = 0;
  let globalMultiplier = 1;

  // Add global multiplicative bonuses from upgrades
  upgradesData.forEach((up) => {
    if (
      up.type === "upgrade" &&
      up.category === "global_mult" &&
      up.count > 0
    ) {
      globalMultiplier += up.value;
    }
  });

  // Add global multiplicative bonuses from prestige upgrades
  if (typeof prestigeCatalog !== "undefined" && permanentUpgrades) {
    prestigeCatalog.forEach((up) => {
      if (permanentUpgrades[up.id] && up.type === "sps_mult") {
        globalMultiplier += up.val;
      }
    });
  }

  // Calculate output from all owned buildings factored by building-specific multipliers
  upgradesData.forEach((building) => {
    if (building.type === "building") {
      let buildingMultiplier = 1;

      // Check normal shop building upgrades
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

      // Check if prestige building-specific upgrades (like grater/whisk boosts)
      if (typeof prestigeCatalog !== "undefined" && permanentUpgrades) {
        prestigeCatalog.forEach((up) => {
          if (
            permanentUpgrades[up.id] &&
            up.type === "building_spec" &&
            up.target === building.id
          ) {
            buildingMultiplier *= up.val;
          }
        });
      }

      totalSps +=
        building.sps * building.count * buildingMultiplier * globalMultiplier;
    }
  });

  // Apply Golden Frenzy multiplier if active (3x passive production boost)
  if (frenzyActive) {
    totalSps *= 3;
  }

  return totalSps;
}

// Scans all achievements and triggers unlocks if conditions are met
function checkAchievements() {
  achievementsData.forEach((ach) => {
    if (!ach.unlocked && typeof ach.check === "function" && ach.check()) {
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
 * Manages screen element updates, interval loops, keybind handlers, and the prestige system.
 */
function updateDisplay() {
  scoreDisplay.textContent = formatNumber(score);
  let currentSps = calculateTotalSPS();
  let currentCpc = calculateTotalCPC();
  spsDisplay.textContent = `per second: ${formatNumber(currentSps)}`;
  cpcDisplay.textContent = `per click: ${formatNumber(currentCpc)}`;

  // Update shop button interactive/disabled states based on affordability and mode
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
        // Sell mode constraints
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

  if (frenzyActive) {
    frenzyTimer--;
    if (frenzyTimer <= 0) {
      frenzyActive = false;

      // Reset the news ticker directly right here!
      const ticker = document.getElementById("news-ticker");
      if (ticker && newsHeadlines.length > 0) {
        const randomHeadline =
          newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
        ticker.textContent = randomHeadline;
      }
    }
  }

  checkAchievements();
}, 1000);

// Loop 2: News Ticker Cycler (Switches news every 7 seconds)
setInterval(() => {
  if (typeof newsHeadlines !== "undefined" && newsHeadlines.length > 0) {
    currentNewsIndex = (currentNewsIndex + 1) % newsHeadlines.length;
    newsTicker.style.opacity = 0;
    setTimeout(() => {
      newsTicker.textContent = newsHeadlines[currentNewsIndex];
      newsTicker.style.opacity = 1;
    }, 500);
  }
}, 7000);

// Loop 3: Auto-Save backup every 30 seconds
setInterval(() => {
  saveGame();
}, 30000);

// Prevent spacebar or enter key from re-triggering focused buttons repetitively
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

// Modal and Prestige helper functions
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
      <div class="prestige-card">
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
    if (permanentUpgrades[up.id] && up.type === "starting_cash") {
      score += up.val;
    }
  });

  saveGame();
  openPrestigeMenu();
}

function executeReset() {
  localStorage.removeItem(SAVE_KEY);

  score = 0;
  baseClickPower = 1;
  prestigePoints = 0;
  permanentUpgrades = {};

  if (typeof upgradesData !== "undefined") {
    upgradesData.forEach((item) => {
      item.count = 0;
      if (item.type === "building" && item.baseCost) {
        item.cost = item.baseCost;
      }
    });
  }

  if (typeof achievementsData !== "undefined") {
    achievementsData.forEach((ach) => {
      ach.unlocked = false;
    });
  }

  setTimeout(() => {
    location.reload();
  }, 100);
}

// Admin Things
let keyBuffer = "";
const targetCode = "105026";

window.addEventListener("keydown", (e) => {
  // Only track numbers if we are in active gameplay
  if (!gameStarted) return;

  // Append typed number to buffer
  keyBuffer += e.key;

  // Keep the buffer length limited to the target code length
  if (keyBuffer.length > targetCode.length) {
    keyBuffer = keyBuffer.slice(-targetCode.length);
  }

  // Check if code matches
  if (keyBuffer === targetCode) {
    openAdminPanel();
    keyBuffer = ""; // Reset buffer
  }
});

function openAdminPanel() {
  const panel = document.getElementById("admin-panel-modal");
  if (panel) panel.style.display = "flex";
  playSound("sfx-buy");
}

function closeAdminPanel() {
  const panel = document.getElementById("admin-panel-modal");
  if (panel) panel.style.display = "none";
}

// Admin Action Functions
function adminAddCheese() {
  const amount =
    parseInt(document.getElementById("admin-cheese-input").value) || 0;
  score += amount;
  if (typeof updateDisplay === "function") updateDisplay();
  playSound("sfx-buy");
}

function adminAddBuildings() {
  const buildingId = document.getElementById("admin-building-select").value;
  const countToAdd =
    parseInt(document.getElementById("admin-building-amount").value) || 1;

  const building = upgradesData.find(
    (u) =>
      u.id === buildingId || (u.type === "building" && u.id === buildingId),
  );
  if (building) {
    building.count = (building.count || 0) + countToAdd;
    // Scale cost up accordingly if your game uses dynamic cost scaling
    if (typeof renderShop === "function") renderShop();
    if (typeof renderActiveBuildings === "function") renderActiveBuildings();
    playSound("sfx-buy");
  }
}

function adminTriggerFrenzy() {
  if (typeof triggerFrenzy === "function") {
    triggerFrenzy();
  }
  closeAdminPanel();
}

function adminTriggerMice() {
  if (typeof triggerMouseInvasion === "function") {
    triggerMouseInvasion();
  }
  closeAdminPanel();
}

// Kick off game initialization on script load
initGame();
