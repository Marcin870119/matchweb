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
const dataRef = ref(database, 'sprzedaz10tygodni/data-table1'); // Dane sprzedaży (KH) dla okna 1
const teamMemberRef = ref(database, 'Target/data-table1'); // Dane Team Member (okno 2)
const totalBudgetRef = ref(database, 'Data/total-budget'); // Dane budżetu dla okna 3
const newCustomersRef = ref(database, 'Data/new-customers'); // Dane nowych klientów dla okna 4

// Zmienna globalna do śledzenia bieżącego indeksu klienta
let currentKHIndex = 0;
let khData = []; // Tablica do przechowywania przetworzonych danych KH

// Funkcja normalizująca dane liczbowe (parsuje z kropką jako separatorem tysięcznym i przecinkiem jako dziesiętnym)
function normalizeNumber(value) {
    if (!value || value.trim() === "") return 0;
    // Usuń kropki jako separatory tysięczne, zachowaj przecinek jako separator dziesiętny, konwertuj na liczbę
    let normalized = value.replace(/\./g, '').replace(',', '.');
    return parseInt(normalized.replace('.', '')) || 0; // Używamy parseInt, aby uzyskać liczbę całkowitą, ignorując części dziesiętne
}

// Funkcja formatująca liczby z kropką jako separatorem tysięcznym i przecinkiem jako dziesiętnym, zawsze z dwoma miejscami po przecinku
function formatNumberWithDotsAndComma(value) {
    if (value === 0) return '0,00';
    // Konwertuj liczbę na string, dodaj kropki jako separatory tysięczne i przecinek jako separator dziesiętny
    let parts = value.toFixed(2).split('.');
    let integerPart = parts[0];
    let decimalPart = parts[1] || '00'; // Domyślnie dwa miejsca po przecinku, jeśli brak
    // Dodaj kropki jako separatory tysięczne do części całkowitej
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Połącz części z przecinkiem jako separatorem dziesiętnym
    return `${integerPart},${decimalPart.padEnd(2, '0').substring(0, 2)}`;
}

// Funkcja formatująca liczby z kropką jako separatorem tysięcznym, przecinkiem jako dziesiętnym i znakiem funta (£), zawsze z dwoma miejscami po przecinku
function formatNumberWithPoundsAndComma(value) {
    if (value === 0) return '£0,00';
    // Konwertuj liczbę na string, dodaj kropki jako separatory tysięczne, przecinek jako separator dziesiętny i znak funta (£)
    let parts = value.toFixed(2).split('.');
    let integerPart = parts[0];
    let decimalPart = parts[1] || '00'; // Domyślnie dwa miejsca po przecinku, jeśli brak
    // Dodaj kropki jako separatory tysięczne do części całkowitej
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Połącz części z przecinkiem jako separatorem dziesiętnym i dodaj znak funta (£)
    return `£${integerPart},${decimalPart.padEnd(2, '0').substring(0, 2)}`;
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
        khData = []; // Wyczyść istniejące dane

        if (data) {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    let parts = typeof value === "object" 
                        ? Object.values(value).join(';') 
                        : value;
                    parts = parts.split(';').map(part => part.trim() === "" ? "0" : part);

                    const khName = parts[1]; // Nazwa KH (druga kolumna)
                    if (khName && khName !== "0" && !khName.toUpperCase().includes('NAZWA KH')) {
                        const weeklyValues = parts.slice(3, 12).map(val => normalizeNumber(val)); // 9 wartości (D–L)
                        const columnM = normalizeNumber(parts[12]); // Wartość z kolumny M

                        const average = weeklyValues.reduce((sum, val) => sum + val, 0) / (weeklyValues.length || 1) || 0;

                        let trend = '';
                        if (average < columnM) {
                            trend = '↑'; // Wzrost
                        } else if (average > columnM) {
                            trend = '↓'; // Spadek
                        } else {
                            trend = '='; // Bez zmiany
                        }

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
            } else {
                console.warn('Brak danych KH w Firebase.');
                updateKHDisplay();
            }
        } else {
            console.warn('Brak danych w Firebase.');
            updateKHDisplay();
        }
    }, (error) => {
        console.error('Błąd pobierania danych KH:', error);
        updateKHDisplay();
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

// Funkcja ładująca dane dla TOTAL BUDGET (okno 3)
function loadTotalBudgetData() {
    const valueDisplay = document.getElementById('totalBudgetValue');
    const trendDisplay = document.getElementById('totalBudgetTrend');

    if (valueDisplay && trendDisplay) {
        onValue(totalBudgetRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                valueDisplay.textContent = `$${data.value || '0'}`;
                trendDisplay.innerHTML = `<span class="arrow ${data.trend === 'up' ? 'up' : 'down'}">${data.trend === 'up' ? '↑' : '↓'}</span> ${data.percentage || '0'}% ${data.trend === 'up' ? 'INCREASE' : 'DECREASE'}`;
            } else {
                valueDisplay.textContent = '$0';
                trendDisplay.innerHTML = '<span class="arrow down">↓</span> 0% DECREASE';
            }
        }, (error) => {
            console.error('Błąd pobierania danych budżetu:', error);
            valueDisplay.textContent = '$0';
            trendDisplay.innerHTML = '<span class="arrow down">↓</span> 0% DECREASE';
        });
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
        }, (error) => {
            console.error('Błąd pobierania danych nowych klientów:', error);
            valueDisplay.textContent = '0';
            trendDisplay.innerHTML = '<span class="arrow down">↓</span> 0% DECREASE';
        });
    }
}

// Funkcja ładująca dane dla TEAM MEMBER (okno 2)
function loadTeamMemberData() {
    const memberNameDisplay = document.getElementById('memberName');
    const planValueDisplay = document.getElementById('planValue');
    const salesValueDisplay = document.getElementById('salesValue');
    const estimateValueDisplay = document.getElementById('estimateValue');
    const estimatePercentageDisplay = document.getElementById('estimatePercentage');

    if (memberNameDisplay && planValueDisplay && salesValueDisplay && estimateValueDisplay && estimatePercentageDisplay) {
        onValue(teamMemberRef, (snapshot) => {
            const data = snapshot.val();
            console.log('Dane z Firebase (Team Member):', data);
            if (data && Array.isArray(data)) {
                let firstEntry = data[0];
                if (firstEntry) {
                    const key = Object.keys(firstEntry)[0];
                    const value = firstEntry[key];

                    let parts = value.split(';').map(part => part.trim() === "" ? "0" : part);

                    const name = parts[0] || 'PH';
                    const plan = normalizeNumber(parts[1]);
                    const sales = normalizeNumber(parts[2]);
                    const estimate = normalizeNumber(parts[4]);
                    const estimatePercentage = parseFloat(parts[5].replace('%', '').replace(',', '.')) || 0;

                    memberNameDisplay.textContent = name;
                    planValueDisplay.textContent = formatNumberWithPoundsAndComma(plan);
                    salesValueDisplay.textContent = formatNumberWithPoundsAndComma(sales);
                    estimateValueDisplay.textContent = formatNumberWithPoundsAndComma(estimate);

                    if (estimatePercentage < 100) {
                        estimatePercentageDisplay.innerHTML = `<span class="arrow down" style="color: #ff3333">↓</span> ${estimatePercentage.toFixed(2)}%`;
                    } else {
                        estimatePercentageDisplay.textContent = `${estimatePercentage.toFixed(2)}%`;
                    }
                    estimatePercentageDisplay.setAttribute('data-percentage', estimatePercentage.toFixed(2));
                } else {
                    console.warn('Brak danych w Firebase dla Team Member.');
                    memberNameDisplay.textContent = 'PH';
                    planValueDisplay.textContent = '£0,00';
                    salesValueDisplay.textContent = '£0,00';
                    estimateValueDisplay.textContent = '£0,00';
                    estimatePercentageDisplay.textContent = '0.00%';
                    estimatePercentageDisplay.setAttribute('data-percentage', '0');
                }
            } else {
                console.warn('Dane z Firebase dla Team Member nie są tablicą lub są puste.');
                memberNameDisplay.textContent = 'PH';
                planValueDisplay.textContent = '£0,00';
                salesValueDisplay.textContent = '£0,00';
                estimateValueDisplay.textContent = '£0,00';
                estimatePercentageDisplay.textContent = '0.00%';
                estimatePercentageDisplay.setAttribute('data-percentage', '0');
            }
        }, (error) => {
            console.error('Błąd pobierania danych Team Member:', error);
            memberNameDisplay.textContent = 'PH';
            planValueDisplay.textContent = '£0,00';
            salesValueDisplay.textContent = '£0,00';
            estimateValueDisplay.textContent = '£0,00';
            estimatePercentageDisplay.textContent = '0.00%';
            estimatePercentageDisplay.setAttribute('data-percentage', '0');
        });
    } else {
        console.error('Nie znaleziono elementów dla Team Member na stronie.');
    }
}

// Funkcja pokazująca stronę główną i ładująca wszystkie dane
function showHomePage() {
    const homePage = document.getElementById('homePage');
    if (homePage) {
        homePage.classList.remove('hidden'); // Upewnij się, że klasa 'hidden' jest zdefiniowana w CSS
        loadKHData(); // Ładuj dane sprzedaży (KH) dla okna 1
        loadTeamMemberData(); // Ładuj dane Team Member (okno 2)
        loadTotalBudgetData(); // Ładuj dane budżetu dla okna 3
        loadNewCustomersData(); // Ładuj dane nowych klientów dla okna 4
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
    showHomePage(); // Ładuj stronę główną i dane z Firebase
});
