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

// Referencja do danych w Firebase pod ścieżką 'SPRZEDAZ_2024_2025/data-table1'
const totalBudgetRef = ref(database, 'SPRZEDAZ_2024_2025/data-table1');

// Funkcja normalizująca dane liczbowe (parsuje ciągi znaków na liczby, ignorując , ; i .)
function normalizeNumber(value) {
    if (!value || value.trim() === "") return 0;
    // Usuń wszystkie znaki niebędące cyframi (ignoruj , ; i .), konwertuj na liczbę całkowitą
    let normalized = value.replace(/[^0-9]/g, '');
    return parseInt(normalized) || 0;
}

// Funkcja obliczająca sumę liczb dla danego roku z ciągu znaków (ignoruje , ; i ., sumuje liczby po roku)
function calculateSumFromString(dataString, year) {
    if (!dataString || typeof dataString !== 'string') return 0;
    
    // Wydziel dane dla danego roku (sprawdź, czy ciąg zaczyna się od roku)
    const yearStr = year.toString();
    if (!dataString.startsWith(yearStr + ';')) return 0;

    // Pobierz resztę ciągu po roku i separatorze ;, podziel na liczby, ignorując , ; i . i inne niecyfrowe znaki
    const numbersPart = dataString.substring(yearStr.length + 1); // Pomijamy "2024;" lub "2025;"
    const numbers = numbersPart.split(';').map(num => normalizeNumber(num));

    // Sumuj wszystkie liczby, ignorując , ; i .
    const sum = numbers.reduce((acc, num) => acc + num, 0) || 0;
    return sum;
}

// Funkcja formatująca liczby z kropką jako separatorem tysięcznym i przecinkiem jako dziesiętnym, zawsze z dwoma miejscami po przecinku
function formatNumberWithDotsAndComma(value) {
    if (value === 0) return '0,00';
    let parts = value.toFixed(2).split('.');
    let integerPart = parts[0];
    let decimalPart = parts[1] || '00';
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${integerPart},${decimalPart.padEnd(2, '0').substring(0, 2)}`;
}

// Funkcja inicjalizująca dane Total Budget (bez 'export', ale dostępna globalnie)
function initTotalBudget() {
    console.log('Inicjalizacja Total Budget');
    loadTotalBudgetData();
}

// Funkcja ładująca dane dla TOTAL BUDGET
function loadTotalBudgetData() {
    const budget2024Display = document.getElementById('budget2024Value');
    const budget2025Display = document.getElementById('budget2025Value');
    const budgetTrendDisplay = document.getElementById('budgetTrend');

    // Debugowanie – sprawdź, czy elementy istnieją
    console.log('Sprawdzanie elementów HTML:', {
        budget2024Display: budget2024Display,
        budget2025Display: budget2025Display,
        budgetTrendDisplay: budgetTrendDisplay
    });

    if (budget2024Display && budget2025Display && budgetTrendDisplay) {
        onValue(totalBudgetRef, (snapshot) => {
            const data = snapshot.val();
            console.log('Otrzymane dane z Firebase:', data); // Debugowanie – sprawdź, czy dane są pobierane

            if (data && Array.isArray(data)) {
                let sum2024 = 0;
                let sum2025 = 0;

                // Przetwarzaj każdy obiekt w tablicy
                data.forEach((item, index) => {
                    if (item && typeof item.Rok === 'string') {
                        const year = parseInt(item.Rok.split(';')[0]); // Pobierz rok z początku ciągu
                        const sum = calculateSumFromString(item.Rok, year);
                        console.log(`Przetwarzanie elementu ${index}: Rok: ${year}, Suma: ${sum}`); // Debugowanie – sprawdź sumy
                        if (year === 2024) sum2024 = sum;
                        else if (year === 2025) sum2025 = sum;
                    }
                });

                // Wyświetl sumy
                budget2024Display.textContent = `2024: ${formatNumberWithDotsAndComma(sum2024)}`;
                budget2025Display.textContent = `2025: ${formatNumberWithDotsAndComma(sum2025)}`;

                // Oblicz różnicę i procent zmiany
                const difference = sum2024 - sum2025;
                const percentageChange = sum2024 === 0 ? 0 : ((sum2025 - sum2024) / sum2024) * 100;

                // Wyświetl trend
                if (difference > 0) {
                    // Suma 2024 jest wyższa niż 2025 – spadek
                    budgetTrendDisplay.innerHTML = `<span class="arrow down" style="color: #ff3333">↓</span> Różnica: ${formatNumberWithDotsAndComma(difference)}, ${percentageChange.toFixed(2)}% DECREASE`;
                } else if (difference < 0) {
                    // Suma 2024 jest niższa niż 2025 – wzrost
                    const absDifference = Math.abs(difference);
                    budgetTrendDisplay.innerHTML = `<span class="arrow up" style="color: #00cc00">↑</span> Różnica: ${formatNumberWithDotsAndComma(absDifference)}, ${Math.abs(percentageChange).toFixed(2)}% INCREASE`;
                } else {
                    // Brak różnicy
                    budgetTrendDisplay.textContent = `Różnica: 0,00, 0.00%`;
                }

                // Ustaw atrybut data-percentage dla stylowania w CSS
                budgetTrendDisplay.setAttribute('data-percentage', percentageChange.toFixed(2));
            } else {
                console.warn('Brak danych w Firebase dla Total Budget lub dane nie są w oczekiwanym formacie (tablica).');
                budget2024Display.textContent = '2024: 0,00';
                budget2025Display.textContent = '2025: 0,00';
                budgetTrendDisplay.innerHTML = '<span class="arrow down" style="color: #ff3333">↓</span> Różnica: 0,00, 0.00% DECREASE';
                budgetTrendDisplay.setAttribute('data-percentage', '0');
            }
        }, (error) => {
            console.error('Błąd pobierania danych Total Budget:', error);
            budget2024Display.textContent = '2024: 0,00';
            budget2025Display.textContent = '2025: 0,00';
            budgetTrendDisplay.innerHTML = '<span class="arrow down" style="color: #ff3333">↓</span> Różnica: 0,00, 0.00% DECREASE';
            budgetTrendDisplay.setAttribute('data-percentage', '0');
        });
    } else {
        console.error('Nie znaleziono elementów dla Total Budget na stronie.');
    }
}

// Ustawienie initTotalBudget jako globalnej funkcji, aby była dostępna w module
window.initTotalBudget = initTotalBudget;
