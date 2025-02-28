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
const dataRef = ref(database, 'Data/data-table1');

// Zmienna globalna do śledzenia bieżącego indeksu klienta
let currentKHIndex = 0;
let khData = []; // Tablica do przechowywania przetworzonych danych KH

// Funkcja, która ładuje i wyświetla dane KH z Firebase
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
        khData = []; // Wyczyść istniejące dane

        if (data) {
            // Przetwarzanie danych z Firebase
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    let parts = typeof value === "object" 
                        ? Object.values(value).join(';') 
                        : value;
                    parts = parts.split(';').map(part => part.trim() === "" ? "0" : part); // Puste pola jako 0

                    const khName = parts[1]; // Nazwa KH (druga kolumna)
                    if (khName && khName !== "0" && !khName.toUpperCase().includes('NAZWA KH')) {
                        // Oblicz średnią z kolumn D–L (indeksy 3–11, 9 wartości)
                        const weeklyValues = parts.slice(3, 12).map(Number); // 9 wartości
                        const average = weeklyValues.reduce((sum, val) => sum + val, 0) / weeklyValues.length || 0;
                        const columnM = Number(parts[12]) || 0; // Wartość z kolumny M

                        // Określ trend
                        let trend = '';
                        if (average < columnM) {
                            trend = '↑'; // Wzrost
                        } else if (average > columnM) {
                            trend = '↓'; // Spadek
                        } else {
                            trend = '='; // Bez zmiany
                        }

                        // Dodaj dane do tablicy
                        khData.push({
                            name: khName,
                            prevValue: columnM,
                            currentValue: average,
                            trend: trend
                        });
                    }
                }
            }

            // Wyświetl pierwszego klienta, jeśli istnieją dane
            if (khData.length > 0) {
                updateDisplay();
            } else {
                console.warn('Brak danych KH w Firebase. Używam danych zapasowych.');
                useBackupData();
            }
        } else {
            console.warn('Brak danych w Firebase. Używam danych zapasowych.');
            useBackupData();
        }
    }, (error) => {
        console.error('Błąd pobierania danych z Firebase:', error);
        useBackupData();
    });

    // Obsługa kliknięcia strzałek
    prevButton.addEventListener('click', () => {
        if (khData.length > 0) {
            currentKHIndex = (currentKHIndex - 1 + khData.length) % khData.length;
            updateDisplay();
        }
    });

    nextButton.addEventListener('click', () => {
        if (khData.length > 0) {
            currentKHIndex = (currentKHIndex + 1) % khData.length;
            updateDisplay();
        }
    });
}

// Funkcja aktualizująca wyświetlanie jednego klienta
function updateDisplay() {
    const khDisplay = document.getElementById('currentKH');
    const prevValueDisplay = document.getElementById('prevValue');
    const currentValueDisplay = document.getElementById('currentValue');
    const khTrend = document.getElementById('khTrend');

    if (khData.length > 0 && khDisplay && prevValueDisplay && currentValueDisplay && khTrend) {
        const kh = khData[currentKHIndex];
        khDisplay.textContent = kh.name;
        prevValueDisplay.textContent = kh.prevValue.toFixed(2); // 2 miejsca po przecinku
        currentValueDisplay.textContent = kh.currentValue.toFixed(2); // 2 miejsca po przecinku
        khTrend.textContent = kh.trend;
        khTrend.className = `kh-arrow ${kh.trend === '↑' ? 'green-arrow' : (kh.trend === '↓' ? 'red-arrow' : 'yellow-equals')}`;
    }
}

// Funkcja z danymi zapasowymi
function useBackupData() {
    khData = [
        "MAJA NORTHOLT",
        "MAJA EXETER",
        "DELIKATESY SMACZEK LUTON 3",
        "PRASHANT PATEL",
        "DELIKATESY SMACZEK COVENTRY",
        "POLSKI SKLEP SMACZEK (READING) LIMITED",
        "POLSKIE DELIKATesy SMACZEK BASINGSTOKE",
        "SMACZEK SLOUGH 2",
        "LONDEK ILFORD",
        "SMACZEK SOUTHAMPTON BITTERNE",
        "NIMIT PATEL !! SAVE MORE",
        "LONDEK ROMFORD",
        "NASZA BIEDRONKA MARGATE"
    ].map(name => {
        if (name === "MAJA NORTHOLT") {
            return {
                name: name,
                prevValue: 11365.89,
                currentValue: 8288.41, // Poprawiona średnia z Twojego przykładu
                trend: 8288.41 < 11365.89 ? '↑' : (8288.41 > 11365.89 ? '↓' : '=')
            };
        } else if (name === "NASZA BIEDRONKA MARGATE") {
            return {
                name: name,
                prevValue: 6787.33,
                currentValue: 4458.02,
                trend: 4458.02 < 6787.33 ? '↑' : (4458.02 > 6787.33 ? '↓' : '=')
            };
        } else {
            return {
                name: name,
                prevValue: 0,
                currentValue: 0,
                trend: '='
            };
        }
    });

    currentKHIndex = 0;
    updateDisplay();
}

// Funkcja pokazująca stronę główną
function showHomePage() {
    const homePage = document.getElementById('homePage');
    if (homePage) {
        homePage.classList.remove('hidden');
    } else {
        console.error('Nie znaleziono elementu #homePage');
    }
}

// Funkcja dla MATCH JSON (przykładowa)
function showMatchJSONPage() {
    console.log('Przejście do MATCH JSON');
    // Tutaj możesz dodać logikę dla strony MATCH JSON
}

// Wywołaj funkcje po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    showHomePage();
    loadKHData(); // Ładuj dane KH z Firebase po załadowaniu strony
});
