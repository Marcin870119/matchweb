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
const dataRef = ref(database, 'sprzedaz10tygodni/data-table1'); // Dane sprzedaży (KH)
const teamMembersRef = ref(database, 'Data/team-members'); // Dane członków zespołu
const totalBudgetRef = ref(database, 'Data/total-budget'); // Dane budżetu
const newCustomersRef = ref(database, 'Data/new-customers'); // Dane nowych klientów

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
                    // Rozbij dane na części, używając średnika jako głównego separatora
                    parts = parts.split(';').map(part => part.trim() === "" ? "0" : part);

                    const khName = parts[1]; // Nazwa KH (druga kolumna)
                    if (khName && khName !== "0" && !khName.toUpperCase().includes('NAZWA KH')) {
                        // Pobierz wartości liczbowe, parsując z kropką jako separatorem tysięcznym i ewentualnym przecinkiem jako dziesiętnym
                        const weeklyValues = parts.slice(3, 12).map(val => normalizeNumber(val)); // 9 wartości (D–L)
                        const columnM = normalizeNumber(parts[12]); // Wartość z kolumny M

                        // Oblicz średnią z kolumn D–L (indeksy 3–11, 9 wartości), ignorując kolumnę M
                        const average = weeklyValues.reduce((sum, val) => sum + val, 0) / (weeklyValues.length || 1) || 0;

                        // Dodaj debugowanie, aby sprawdzić wartości
                        console.log(`Dla ${khName} - weeklyValues: [${weeklyValues}], columnM: ${columnM}, average: ${average}, typeof average: ${typeof average}`);

                        // Określ trend
                        let trend = '';
                        if (average < columnM) {
                            trend = '↑'; // Wzrost
                        } else if (average > columnM) {
                            trend = '↓'; // Spadek
                        } else {
                            trend = '='; // Bez zmiany
                        }

                        // Dodaj dane do tablicy jako liczby, nie ciągi znaków
                        khData.push({
                            name: khName,
                            prevValue: Number(columnM), // Upewnij się, że jest liczbą
                            currentValue: Number(average), // Upewnij się, że jest liczbą
                            trend: trend
                        });
                    }
                }
            }

            // Wyświetl pierwszego klienta, jeśli istnieją dane
            if (khData.length > 0) {
                currentKHIndex = 0; // Zresetuj indeks na pierwszego klienta
                updateKHDisplay();
            } else {
                console.warn('Brak danych KH w Firebase.');
                khData = []; // Pusta tablica, jeśli brak danych
                updateKHDisplay();
            }
        } else {
            console.warn('Brak danych w Firebase.');
            khData = []; // Pusta tablica, jeśli brak danych
            updateKHDisplay();
        }
    }, (error) => {
        console.error('Błąd pobierania danych z Firebase:', error);
        khData = []; // Pusta tablica w przypadku błędu
        updateKHDisplay();
    });

    // Obsługa kliknięcia strzałek
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

// Funkcja aktualizująca wyświetlanie danych KH
function updateKHDisplay() {
    const khDisplay = document.getElementById('currentKH');
    const prevValueDisplay = document.getElementById('prevValue');
    const currentValueDisplay = document.getElementById('currentValue');
    const khTrend = document.getElementById('khTrend');

    if (khDisplay && prevValueDisplay && currentValueDisplay && khTrend) {
        if (khData.length > 0 && currentKHIndex >= 0 && currentKHIndex < khData.length) {
            const kh = khData[currentKHIndex];
            khDisplay.textContent = kh.name || 'Brak nazwy';
            // Upewnij się, że wartości są liczbami przed formatowaniem
            prevValueDisplay.textContent = formatNumberWithDotsAndComma(Number(kh.prevValue)) || '0,00'; // Wyświetl z kropką i przecinkiem, dwa miejsca po przecinku
            currentValueDisplay.textContent = formatNumberWithDotsAndComma(Number(kh.currentValue)) || '0,00'; // Wyświetl z kropką i przecinkiem, dwa miejsca po przecinku
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

// Funkcja ładująca dane dla TEAM MEMBERS
function loadTeamMembersData() {
    const valueDisplay = document.getElementById('teamMembersValue');
    const trendDisplay = document.getElementById('teamMembersTrend');

    if (valueDisplay && trendDisplay) {
        onValue(teamMembersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                valueDisplay.textContent = data.value || '0';
                trendDisplay.innerHTML = `<span class="arrow ${data.trend === 'up' ? 'up' : 'down'}">${data.trend === 'up' ? '↑' : '↓'}</span> ${data.percentage || '0'}% ${data.trend === 'up' ? 'INCREASE' : 'DECREASE'}`;
            } else {
                valueDisplay.textContent = '0';
                trendDisplay.innerHTML = '<span class="arrow down">↓</span> 0% DECREASE';
            }
        }, (error) => {
            console.error('Błąd pobierania danych członków zespołu:', error);
            valueDisplay.textContent = '0';
            trendDisplay.innerHTML = '<span class="arrow down">↓</span> 0% DECREASE';
        });
    }
}

// Funkcja ładująca dane dla TOTAL BUDGET
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

// Funkcja ładująca dane dla NEW CUSTOMERS
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

// Funkcja pokazująca stronę główną i ładująca wszystkie dane
function showHomePage() {
    const homePage = document.getElementById('homePage');
    if (homePage) {
        homePage.classList.remove('hidden');
        loadKHData(); // Ładuj dane sprzedaży (KH)
        loadTeamMembersData(); // Ładuj dane członków zespołu
        loadTotalBudgetData(); // Ładuj dane budżetu
        loadNewCustomersData(); // Ładuj dane nowych klientów
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
