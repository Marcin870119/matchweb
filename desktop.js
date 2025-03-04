// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Konfiguracja Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCPZ0OsJmaDpJjkVFl3vGv4WalDYDY23xQ",
    authDomain: "webmatcher-94f0e.firebaseapp.com",
    databaseURL: "https://webmatcher-94f0e-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "webmatcher-94f0e",
    storageBucket: "webmatcher-94f0e.appspot.com",
    messagingSenderId: "970664630623",
    appId: "G-RMMBEY655B"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referencje do danych w Firebase
const dataRef = ref(database, 'sprzedaz10tygodni/data-table1'); // Okno 1
const newCustomersRef = ref(database, 'Data/new-customers'); // Okno 4

// Zmienna globalna do śledzenia bieżącego indeksu klienta
let currentKHIndex = 0;
let khData = [];

// Funkcja normalizująca dane liczbowe
function normalizeNumber(value) {
    if (!value || value.trim() === "") return 0;
    let normalized = value.replace(/\./g, '').replace(',', '.');
    return parseInt(normalized.replace('.', '')) || 0;
}

// Funkcja formatująca liczby z kropką i przecinkiem
function formatNumberWithDotsAndComma(value) {
    if (value === 0) return '0,00';
    let parts = value.toFixed(2).split('.');
    let integerPart = parts[0];
    let decimalPart = parts[1] || '00';
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${integerPart},${decimalPart.padEnd(2, '0').substring(0, 2)}`;
}

// Funkcja ładująca dane KH (okno 1)
function loadKHData() {
    const khDisplay = document.getElementById('currentKH');
    const prevValueDisplay = document.getElementById('prevValue');
    const currentValueDisplay = document.getElementById('currentValue');
    const khTrend = document.getElementById('khTrend');
    const prevButton = document.getElementById('prevKH');
    const nextButton = document.getElementById('nextKH');

    if (!khDisplay || !prevValueDisplay || !currentValueDisplay || !khTrend || !prevButton || !nextButton) {
        console.error('Nie znaleziono elementów wyświetlania KH');
        return;
    }

    onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        khData = [];
        if (data) {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    let parts = typeof value === "object" ? Object.values(value).join(';') : value;
                    parts = parts.split(';').map(part => part.trim() === "" ? "0" : part);

                    const khName = parts[1];
                    if (khName && khName !== "0" && !khName.toUpperCase().includes('NAZWA KH')) {
                        const weeklyValues = parts.slice(3, 12).map(val => normalizeNumber(val));
                        const columnM = normalizeNumber(parts[12]);
                        const average = weeklyValues.reduce((sum, val) => sum + val, 0) / (weeklyValues.length || 1) || 0;

                        let trend = '';
                        if (average < columnM) trend = '↑';
                        else if (average > columnM) trend = '↓';
                        else trend = '=';

                        khData.push({
                            name: khName,
                            prevValue: Number(columnM),
                            currentValue: Number(average),
                            trend: trend
                        });
                    }
                }
            }
            if (khData.length > 0) {
                currentKHIndex = 0;
                updateKHDisplay();
            }
        }
    }, {
        onlyOnce: false // Upewnienie się, że nasłuchiwanie jest aktywne, ale nie blokuje innych zdarzeń
    });

    prevButton.addEventListener('click', () => {
        if (khData.length > 0) {
            currentKHIndex = (currentKHIndex - 1 + khData.length) % khData.length;
            updateKHDisplay();
        }
    });

    nextButton.addEventListener('click', () => {
        if (khData.length > 0) {
            currentKHIndex = (currentKHIndex + 1) % khData.length;
            updateKHDisplay();
        }
    });
}

function updateKHDisplay() {
    const khDisplay = document.getElementById('currentKH');
    const prevValueDisplay = document.getElementById('prevValue');
    const currentValueDisplay = document.getElementById('currentValue');
    const khTrend = document.getElementById('khTrend');

    if (khDisplay && prevValueDisplay && currentValueDisplay && khTrend) {
        if (khData.length > 0 && currentKHIndex >= 0 && currentKHIndex < khData.length) {
            const kh = khData[currentKHIndex];
            khDisplay.textContent = kh.name || 'Brak nazwy';
            prevValueDisplay.textContent = formatNumberWithDotsAndComma(Number(kh.prevValue)) || '0,00';
            currentValueDisplay.textContent = formatNumberWithDotsAndComma(Number(kh.currentValue)) || '0,00';
            khTrend.textContent = kh.trend || '=';
            khTrend.className = `kh-arrow ${kh.trend === '↑' ? 'green-arrow' : (kh.trend === '↓' ? 'red-arrow' : 'yellow-equals')}`;
        } else {
            khDisplay.textContent = 'Brak danych';
            prevValueDisplay.textContent = '0,00';
            currentValueDisplay.textContent = '0,00';
            khTrend.textContent = '=';
            khTrend.className = 'kh-arrow yellow-equals';
        }
    }
}

// Funkcja ładująca dane dla NEW CUSTOMERS (okno 4)
function loadNewCustomersData() {
    const valueDisplay = document.getElementById('newCustomersValue');
    const trendDisplay = document.getElementById('newCustomersTrend');

    if (valueDisplay && trendDisplay) {
        onValue(newCustomersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                valueDisplay.textContent = data.value || '0';
                trendDisplay.innerHTML = `<span class="arrow ${data.trend === 'up' ? 'up' : 'down'}">${data.trend === 'up' ? '↑' : '↓'}</span> ${data.percentage || '0'}% ${data.trend === 'up' ? 'INCREASE' : 'DECREASE'}`;
            } else {
                valueDisplay.textContent = '0';
                trendDisplay.innerHTML = '<span class="arrow down">↓</span> 0% DECREASE';
            }
        }, {
            onlyOnce: false // Upewnienie się, że nasłuchiwanie jest aktywne, ale nie blokuje innych zdarzeń
        });
    }
}

// Funkcja pokazująca stronę główną i ładująca dane dla okien 1 i 4
function showHomePage() {
    const homePage = document.getElementById('homePage');
    if (homePage) {
        homePage.classList.remove('hidden');
        loadKHData(); // Okno 1
        loadNewCustomersData(); // Okno 4
    }
}

// Uruchomienie po załadowaniu DOM, aby uniknąć konfliktów z innymi zdarzeniami
document.addEventListener('DOMContentLoaded', () => {
    showHomePage();
    // Upewnienie się, że nie dodajemy żadnych zdarzeń myszy lub dotyku, które mogłyby kolidować
});
