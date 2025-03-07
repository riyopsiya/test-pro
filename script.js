// Import Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import Decimal.js from a CDN
import Decimal from 'https://cdn.jsdelivr.net/npm/decimal.js@10.4.3/decimal.mjs'

// Initialize Supabase client
const supabase = createClient(
  'https://fjjpyuzazduwjossmihn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqanB5dXphemR1d2pvc3NtaWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI2NjE3NTcsImV4cCI6MjAzODIzNzc1N30.N0T1H053YxFkxg8SWghuuEbWU9CsJHJDAz1W1SZWAQ0'
)

let gameState = {
    crypto: new Decimal(0),
    clickPower: new Decimal(1),
    upgrades: {
        gpu: { level: 0, cost: new Decimal(50), power: new Decimal(1), scaling: new Decimal(1.5), icon: '💻' },
        asic: { level: 0, cost: new Decimal(500), power: new Decimal(10), scaling: new Decimal(1.8), icon: '🖥️' },
        quantum: { level: 0, cost: new Decimal(5000), power: new Decimal(100), scaling: new Decimal(2.2), icon: '🔬' },
        solarPanel: { level: 0, cost: new Decimal(1000), power: new Decimal(5), scaling: new Decimal(2), icon: '☀️' },
        ai: { level: 0, cost: new Decimal(10000), power: new Decimal(200), scaling: new Decimal(2.5), icon: '🤖' },
        blockchain: { level: 0, cost: new Decimal(50000), power: new Decimal(500), scaling: new Decimal(3), icon: '🔗' },
    },
    lastUpdate: Date.now(),
    username: "Player",
    electricity: {
        current: new Decimal(50),
        max: new Decimal(50),
        regenRate: new Decimal(1),
        lastRegen: Date.now()
    },
    stats: {
        totalClicks: 0,
        totalMined: new Decimal(0),
        upgradesPurchased: 0,
        playTime: 0
    }
};

// Check if running in Telegram environment
const isTelegram = window.Telegram && window.Telegram.WebApp;

// Calculate hourly income
function calculateHourlyIncome() {
    return gameState.upgrades.gpu.level * gameState.upgrades.gpu.power
        .plus(gameState.upgrades.asic.level * gameState.upgrades.asic.power)
        .plus(gameState.upgrades.quantum.level * gameState.upgrades.quantum.power)
        .times(3600).dividedBy(20).floor();
}

// Format large numbers
function formatLargeNumber(num) {
    const decimalNum = new Decimal(num);
    if (decimalNum.gte(1e6)) {
        return decimalNum.dividedBy(1e6).toFixed(2) + 'm';
    } else if (decimalNum.gte(1e3)) {
        return decimalNum.dividedBy(1e3).toFixed(2) + 'k';
    } else {
        return decimalNum.toFixed(2);
    }
}

function updateDisplay() {
    const cryptoAmount = gameState.crypto.isNaN() || !gameState.crypto.isFinite() 
        ? "Error" 
        : formatLargeNumber(gameState.crypto);
    document.getElementById('cryptoAmount').textContent = `${cryptoAmount} BTC`;
    
    // Update approximated USD value (assuming 1 BTC = $30,000 USD)
    const usdValue = gameState.crypto.times(30000).toFixed(2);
    document.getElementById('cryptoValue').textContent = `≈ $${formatLargeNumber(usdValue)} USD`;
    
    // Update mining rate
    const miningRate = calculateMiningRate();
    document.getElementById('miningRate').textContent = `${formatLargeNumber(miningRate)} BTC/s`;
    
    // Update total mined
    document.getElementById('totalMined').textContent = `${formatLargeNumber(gameState.stats.totalMined)} BTC total`;

    // Existing code for other elements
    document.getElementById('usernameDisplay').textContent = gameState.username;
    document.getElementById('hourlyIncomeDisplay').textContent = `${formatLargeNumber(calculateHourlyIncome())} BTC/hr`;
    document.getElementById('currentElectricity').textContent = formatLargeNumber(gameState.electricity.current);
    document.getElementById('maxElectricity').textContent = formatLargeNumber(gameState.electricity.max);
    
    const electricityPercentage = gameState.electricity.current.dividedBy(gameState.electricity.max).times(100).toNumber();
    document.getElementById('electricityProgress').style.width = `${electricityPercentage}%`;
    
    updateUpgradesList();
    updateStatsList();
}

// Add this function to calculate the current mining rate
function calculateMiningRate() {
    let rate = new Decimal(0);
    Object.values(gameState.upgrades).forEach(upgrade => {
        rate = rate.plus(upgrade.power.times(upgrade.level));
    });
    return rate.dividedBy(20); // Assuming the same 20-second cycle as in passiveIncome
}

// Update upgrades list with improved UI
function updateUpgradesList() {
    const upgradesList = document.getElementById('upgradesList');
    if (!upgradesList) return;

    upgradesList.innerHTML = '';
    Object.entries(gameState.upgrades).forEach(([key, upgrade]) => {
        const li = document.createElement('div');
        li.className = 'bg-card-bg bg-opacity-80 rounded-lg p-4 shadow-md border border-gray-700 backdrop-filter backdrop-blur-sm mb-4 transition-all duration-300 hover:shadow-lg';
        li.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-semibold text-lg flex items-center">
                    <span class="mr-2 text-2xl">${upgrade.icon}</span>
                    ${key.toUpperCase()}
                </span>
                <span class="text-yellow-400">Level ${upgrade.level}</span>
            </div>
            <div class="mb-2">
                <div class="text-sm text-gray-300">Power: ${formatLargeNumber(upgrade.power.times(upgrade.level))} BTC/s</div>
                <div class="text-sm text-gray-300">Next level: ${formatLargeNumber(upgrade.power.times(upgrade.level + 1))} BTC/s</div>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-green-400">${formatLargeNumber(upgrade.cost)} BTC</span>
                <button class="upgrade-btn bg-btn-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" data-upgrade="${key}">Upgrade</button>
            </div>
        `;
        upgradesList.appendChild(li);
    });
    
    document.querySelectorAll('.upgrade-btn').forEach(button => {
        button.addEventListener('click', function() {
            buyUpgrade(this.getAttribute('data-upgrade'));
        });
    });
}

// Update stats list
function updateStatsList() {
    const statsList = document.getElementById('statsList');
    if (!statsList) return; // Exit if element doesn't exist

    statsList.innerHTML = `
        <div class="flex justify-between items-center">
            <span>Total Clicks:</span>
            <span>${formatLargeNumber(gameState.stats.totalClicks)}</span>
        </div>
        <div class="flex justify-between items-center">
            <span>Total BTC Mined:</span><span>${formatLargeNumber(gameState.stats.totalMined)} BTC</span>
        </div>
        <div class="flex justify-between items-center">
            <span>Upgrades Purchased:</span>
            <span>${formatLargeNumber(gameState.stats.upgradesPurchased)}</span>
        </div>
        <div class="flex justify-between items-center">
            <span>Play Time:</span>
            <span>${formatPlayTime(gameState.stats.playTime)}</span>
        </div>
    `;
}

// Format play time
function formatPlayTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

// Handle crypto clicking
function clickCrypto() {
    if (gameState.electricity.current.gte(1)) {
        const mined = gameState.clickPower;
        gameState.crypto = gameState.crypto.plus(mined);
        gameState.electricity.current = gameState.electricity.current.minus(1);
        gameState.stats.totalClicks++;
        gameState.stats.totalMined = gameState.stats.totalMined.plus(mined);
        updateDisplay();
        animateClick(mined);
        animateCoins(mined.toNumber());

        // Trigger vibration in Telegram environment
        if (isTelegram && window.Telegram.WebApp.hapticFeedback) {
            try {
                window.Telegram.WebApp.hapticFeedback.impactOccurred('light');
                console.log('Vibration triggered');
            } catch (error) {
                console.error('Error triggering vibration:', error);
            }
        }
    } else {
        showNotification("Not enough electricity!", "error");
    }
}

// Animate click
function animateClick(amount) {
    const container = document.getElementById('clickAnimationContainer');
    if (!container) return; // Exit if element doesn't exist

    const popup = document.createElement('div');
    popup.className = 'click-popup text-2xl text-yellow-400';
    popup.textContent = `+${formatLargeNumber(amount)} BTC`;
    
    const x = Math.random() * (container.offsetWidth - 100);
    const y = Math.random() * (container.offsetHeight - 100);
    
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    
    container.appendChild(popup);
    
    setTimeout(() => {
        container.removeChild(popup);
    }, 2000);
}

// Animate coins
function animateCoins(amount) {
    const container = document.getElementById('bitcoinContainer');
    if (!container) return; // Exit if element doesn't exist

    const coinCount = Math.min(Math.ceil(amount), 10); // Limit to 10 coins max

    for (let i = 0; i < coinCount; i++) {
        const coin = document.createElement('div');
        coin.className = 'bitcoin-coin';
        
        // Random starting position
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight;
        
        coin.style.left = `${startX}px`;
        coin.style.bottom = '0px';
        
        // Random animation duration between 1.5 and 2.5 seconds
        const duration = 1.5 + Math.random();
        
        coin.style.animation = `floatUpCoin ${duration}s ease-out`;
        
        container.appendChild(coin);
        
        // Remove the coin element after animation completes
        setTimeout(() => {
            container.removeChild(coin);
        }, duration * 1000);
    }
}

// Regenerate electricity
function regenerateElectricity() {
    const now = Date.now();
    const timeDiff = new Decimal(now - gameState.electricity.lastRegen).dividedBy(1000);
    const regenAmount = timeDiff.times(gameState.electricity.regenRate);
    gameState.electricity.current = Decimal.min(
        gameState.electricity.current.plus(regenAmount),
        gameState.electricity.max
    );
    gameState.electricity.lastRegen = now;
    updateDisplay();
}

// Refill electricity
function refillElectricity() {
    gameState.electricity.current = gameState.electricity.max;
    updateDisplay();
    showNotification("Electricity refilled!", "success");
}

// Enhanced buy upgrade function
function buyUpgrade(upgradeKey) {
    console.log(`Attempting to buy upgrade: ${upgradeKey}`);
    const upgrade = gameState.upgrades[upgradeKey];
    if (gameState.crypto.gte(upgrade.cost)) {
        gameState.crypto = gameState.crypto.minus(upgrade.cost);
        upgrade.level++;
        upgrade.cost = upgrade.cost.times(upgrade.scaling);
        if (upgradeKey === 'solarPanel') {
            gameState.electricity.max = gameState.electricity.max.plus(50);
            gameState.electricity.regenRate = gameState.electricity.regenRate.plus(0.5);
        } else {
            gameState.clickPower = gameState.clickPower.plus(upgrade.power);
        }
        gameState.stats.upgradesPurchased++;
        updateDisplay();
        saveGame();
        console.log(`Successfully upgraded ${upgradeKey}. Showing success notification.`);
        showNotification(`Upgraded ${upgradeKey.toUpperCase()} to level ${upgrade.level}!`, 'success');
        
        // Add visual feedback
        const upgradeElement = document.querySelector(`[data-upgrade="${upgradeKey}"]`).closest('.bg-card-bg');
        upgradeElement.classList.add('animate-upgrade');
        setTimeout(() => {
            upgradeElement.classList.remove('animate-upgrade');
        }, 500);
    } else {
        console.log(`Not enough BTC to upgrade ${upgradeKey}. Showing error notification.`);
        showNotification(`Not enough BTC to upgrade ${upgradeKey.toUpperCase()}!`, 'error');
    }
}


function passiveIncome() {
    const now = Date.now();
    const timeDiff = new Decimal(now - gameState.lastUpdate).dividedBy(1000);
    let passiveGain = new Decimal(0);
    
    Object.values(gameState.upgrades).forEach(upgrade => {
        if (upgrade.level > 0) {
            passiveGain = passiveGain.plus(upgrade.power.times(upgrade.level));
        }
    });
    
    passiveGain = passiveGain.times(timeDiff).dividedBy(20);
    gameState.crypto = gameState.crypto.plus(passiveGain);
    gameState.stats.totalMined = gameState.stats.totalMined.plus(passiveGain);
    gameState.stats.playTime += timeDiff.toNumber();
    gameState.lastUpdate = now;
    updateDisplay();
    saveGame();
}

function showNotification(message, type) {
    console.log(`Attempting to show notification: ${message} (${type})`);
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        console.error('Notification container not found in the DOM');
        return;
    }
    const notification = document.createElement('div');
    notification.className = `p-4 rounded-lg shadow-lg mb-2 ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`;
    notification.textContent = message;
    notificationContainer.appendChild(notification);
    console.log('Notification added to container');
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
            console.log('Notification removed from container');
        }, 500);
    }, 2500);
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('#mineSection, #upgradeSection, #statsSection, #leaderboardSection');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            sections.forEach(section => section.classList.add('hidden'));
            const targetElement = document.getElementById(`${targetSection}Section`);
            if (targetElement) {
                targetElement.classList.remove('hidden');
            }
            navButtons.forEach(navBtn => navBtn.classList.remove('text-blue-500'));
            btn.classList.add('text-blue-500');
            
            if (targetSection === 'leaderboard') {
                updateLeaderboardDisplay();
            }
        });
    });
}

// Save game
async function saveGame() {
    validateGameState();
    const gameStateString = JSON.stringify(gameState, (key, value) =>
        value instanceof Decimal ? value.toString() : value
    );
    localStorage.setItem('cryptoTycoonSave', gameStateString);
    await updateLeaderboard();
}

// Load game
function loadGame() {
    loadFromLocalStorage();
}

// Load game from localStorage
function loadFromLocalStorage() {
    const savedGame = localStorage.getItem('cryptoTycoonSave');
    if (savedGame) {
        try {
            parseAndSetGameState(savedGame);
            console.log('Game loaded from localStorage');
        } catch (error) {
            console.error('Error parsing game state from localStorage:', error);
            resetGameState();
        }
    } else {
        console.log('No saved game found');
        resetGameState();
    }
}

// Parse and set game state
function parseAndSetGameState(stateString) {
    const parsedState = JSON.parse(stateString, (key, value) => {
        if (typeof value === 'string' && /^-?\d*\.?\d+(e[+-]?\d+)?$/.test(value)) {
            return new Decimal(value);
        }
        return value;
    });
    Object.assign(gameState, parsedState);
    validateGameState();
    updateDisplay();
}

function resetGameState() {
    gameState = {
        crypto: new Decimal(0),
        clickPower: new Decimal(1),
        upgrades: {
            gpu: { level: 0, cost: new Decimal(50), power: new Decimal(1), scaling: new Decimal(1.5), icon: '💻' },
            asic: { level: 0, cost: new Decimal(500), power: new Decimal(10), scaling: new Decimal(1.8), icon: '🖥️' },
            quantum: { level: 0, cost: new Decimal(5000), power: new Decimal(100), scaling: new Decimal(2.2), icon: '🔬' },
            solarPanel: { level: 0, cost: new Decimal(1000), power: new Decimal(5), scaling: new Decimal(2), icon: '☀️' },
            ai: { level: 0, cost: new Decimal(10000), power: new Decimal(200), scaling: new Decimal(2.5), icon: '🤖' },
            blockchain: { level: 0, cost: new Decimal(50000), power: new Decimal(500), scaling: new Decimal(3), icon: '🔗' },
        },
        lastUpdate: Date.now(),
        username: gameState.username || "Player",
        electricity: {
            current: new Decimal(50),
            max: new Decimal(50),
            regenRate: new Decimal(1),
            lastRegen: Date.now()
        },
        stats: {
            totalClicks: 0,
            totalMined: new Decimal(0),
            upgradesPurchased: 0,
            playTime: 0
        }
    };
    updateDisplay();
    showNotification('Starting new game', 'info');
}

// Validate game state
function validateGameState() {
    const validationErrors = [];
    if (gameState.crypto.isNaN() || !gameState.crypto.isFinite()) {
        validationErrors.push("Invalid crypto value");
        gameState.crypto = new Decimal(0);
    }
    if (gameState.clickPower.isNaN() || !gameState.clickPower.isFinite() || gameState.clickPower.lt(1)) {
        validationErrors.push("Invalid click power");
        gameState.clickPower = new Decimal(1);
    }
    Object.values(gameState.upgrades).forEach(upgrade => {
        if (upgrade.cost.isNaN() || !upgrade.cost.isFinite() || upgrade.cost.lt(0)) {
            validationErrors.push(`Invalid cost for ${upgrade.name}`);
            upgrade.cost = new Decimal(50);
        }
    });
    if (gameState.electricity.current.isNaN() || !gameState.electricity.current.isFinite() || gameState.electricity.current.lt(0)) {
        validationErrors.push("Invalid current electricity");
        gameState.electricity.current = new Decimal(0);
    }
    if (gameState.electricity.max.isNaN() || !gameState.electricity.max.isFinite() || gameState.electricity.max.lt(50)) {
        validationErrors.push("Invalid max electricity");
        gameState.electricity.max = new Decimal(50);
    }
    if (validationErrors.length > 0) {
        console.error("Game state validation errors:", validationErrors);
        showNotification("Game state error detected and fixed", "error");
    }
}

async function updateLeaderboard() {
    try {
        const now = new Date();
        const formattedDate = now.toISOString().replace('T', ' ').replace('Z', '+00');
        const cryptoNumeric = gameState.crypto.toNumber();
        
        console.log('Sending to Supabase:', {
            username: gameState.username, 
            crypto: gameState.crypto.toString(),
            crypto_numeric: cryptoNumeric,
            last_updated: formattedDate
        });

        const { data, error } = await supabase
            .from('leaderboard')
            .upsert({ 
                username: gameState.username, 
                crypto: gameState.crypto.toString(),
                crypto_numeric: cryptoNumeric,
                last_updated: formattedDate
            }, { 
                onConflict: 'username' 
            });

        if (error) throw error;
        console.log('Leaderboard updated successfully');
    } catch (error) {
        console.error('Error updating leaderboard:', error.message, error.details);
        showNotification(`Failed to update leaderboard: ${error.message}`, 'error');
    }
}

async function getLeaderboard() {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('username, crypto, crypto_numeric')
            .order('crypto_numeric', { ascending: false })
            .limit(10);

        if (error) throw error;

        return data.map(entry => ({
            ...entry,
            crypto: new Decimal(entry.crypto || 0),
            crypto_numeric: new Decimal(entry.crypto_numeric || entry.crypto || 0)
        }));
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        showNotification('Failed to fetch leaderboard', 'error');
        return [];
    }
}

async function updateLeaderboardDisplay() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return; // Exit if element doesn't exist

    const leaderboard = await getLeaderboard();
    leaderboardList.innerHTML = '';

    leaderboard.forEach((entry, index) => {
        const item = createLeaderboardItem(index + 1, entry.username, entry.crypto_numeric);
        leaderboardList.appendChild(item);
    });

    const userRank = await getUserRank();
    const userRankElement = document.getElementById('userRank');
    if (userRankElement) {
        userRankElement.innerHTML = `
            <span class="text-lg font-semibold">Your Rank: 
                <span class="text-btc-orange">#${userRank}</span>
            </span>
            <br>
            <span class="text-sm">${formatLargeNumber(gameState.crypto)} BTC</span>
        `;
    }
}

async function getUserRank() {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('username')
            .order('crypto', { ascending: false });
        
        if (error) throw error;

        const rank = data.findIndex(entry => entry.username === gameState.username) + 1;
        return rank || 'N/A';
    } catch (error) {
        console.error('Error fetching user rank:', error);
        showNotification('Failed to fetch user rank', 'error');
        return 'N/A';
    }
}

function createLeaderboardItem(rank, username, btcAmount) {
    const item = document.createElement('div');
    item.className = 'flex justify-between items-center p-2 rounded-lg bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-colors duration-200';
    item.innerHTML = `
        <div class="flex items-center">
            <span class="text-lg font-semibold mr-3 ${rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}">#${rank}</span>
            <span class="text-white">${username}</span>
        </div>
        <span class="text-btc-orange font-semibold">${formatLargeNumber(btcAmount)} BTC</span>
    `;
    return item;
}

// Initialize game
async function init() {
    if (isTelegram && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        gameState.username = window.Telegram.WebApp.initDataUnsafe.user.username || 
                             `${window.Telegram.WebApp.initDataUnsafe.user.first_name} ${window.Telegram.WebApp.initDataUnsafe.user.last_name || ''}`.trim();
    } else {
        gameState.username = gameState.username || "Player" + Math.floor(Math.random() * 1000);
    }

    loadGame();
    updateDisplay();
    setupNavigation();
    
    const cryptoClicker = document.getElementById('cryptoClicker');
    if (cryptoClicker) {
        cryptoClicker.addEventListener('click', clickCrypto);
    }
    
    const refillElectricityBtn = document.getElementById('refillElectricity');
    if (refillElectricityBtn) {
        refillElectricityBtn.addEventListener('click', refillElectricity);
    }
    
    setInterval(passiveIncome, 1000);
    setInterval(regenerateElectricity, 1000);
    setInterval(saveGame, 60000); // Save every minute

    if (isTelegram) {
        if (window.Telegram.WebApp.ready) window.Telegram.WebApp.ready();
        
        if (window.Telegram.WebApp.MainButton) {
            window.Telegram.WebApp.MainButton.hide();
        }

        if (window.Telegram.WebApp.onEvent) {
            window.Telegram.WebApp.onEvent('backButtonClicked', () => {
                saveGame();
                window.Telegram.WebApp.close();
            });
        }
    }

    // Update leaderboard display using Supabase
    await updateLeaderboardDisplay();
}

// Start the game when the page loads
window.addEventListener('load', () => {
    (async () => {
        await init();
    })();
});

// Add click animation to the Mine BTC button
document.getElementById('cryptoClicker').addEventListener('click', function(e) {
    this.classList.add('animate-click-ripple');
    setTimeout(() => {
        this.classList.remove('animate-click-ripple');
    }, 800); // Match this to the animation duration
});

// Start the game when the page loads
window.addEventListener('load', () => {
    (async () => {
        await init();
    })();
});

// Add click animation to the Mine BTC button
document.getElementById('cryptoClicker').addEventListener('click', function(e) {
    this.classList.add('animate-click-ripple');
    setTimeout(() => {
        this.classList.remove('animate-click-ripple');
    }, 800); // Match this to the animation duration
});
