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

// Referencja do danych w Firebase dla Sprzedaz_2024_2025/data-table1
const salesDataRef = ref(database, 'Sprzedaz_2024_2025/data-table1');

// Funkcja sumująca wartości liczbowe z ciągu podzielonego średnikami (np. "2024;245834;257234;...")
function sumValues(string) {
    if (!string || typeof string !== 'string') return 0;
    const values = string.split(';').map(val => parseInt(val) || 0); // Parsowanie na liczby całkowite
    return values.reduce((sum, val) => sum + val, 0);
}

// Funkcja formatująca liczbę z kropką jako separatorem tysięcznym i przecinkiem jako dziesiętnym
function formatNumberWithDotsAndComma(value) {
    if (value === 0) return '0,00';
    let parts = value.toFixed(2).split('.');
    let integerPart = parts[0];
    let decimalPart = parts[1] || '00';
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${integerPart},${decimalPart.padEnd(2, '0').substring(0, 2)}`;
}

// Funkcja ładująca dane dla TOTAL BUDGET (okno 3)
function loadTotalBudgetData() {
    const valueDisplay = document.getElementById('totalBudgetValue');
    const trendDisplay = document.getElementById('totalBudgetTrend');

    if (valueDisplay && trendDisplay) {
        onValue(salesDataRef, (snapshot) => {
            const data = snapshot.val();
            console.log('Dane z Firebase:', data); // Dodane logowanie do debugowania

            if (data) {
                let sum2024 = 0;
                let sum2025 = 0;

                // Przetwarzanie danych dla 2024 i 2025
                data.forEach(entry => {
                    const numbers = entry[';1;2;3;4;5;6;7'];
                    const year = numbers.split(';')[0]; // Pobierz rok z pierwszej wartości w ciągu (np. "2024" lub "2025")

                    console.log(`Rok: ${year}, Liczby: ${numbers}`); // Dodane logowanie do debugowania

                    if (year === '2024') {
                        sum2024 = sumValues(numbers);
                    } else if (year === '2025') {
                        sum2025 = sumValues(numbers);
                    }
                });

                console.log(`Suma 2024: ${sum2024}, Suma 2025: ${sum2025}`); // Dodane logowanie do debugowania

                // Wyświetlanie sum w formacie z kropką i przecinkiem
                valueDisplay.textContent = `2024: ${formatNumberWithDotsAndComma(sum2024)} | 2025: ${formatNumberWithDotsAndComma(sum2025)}`;

                // Obliczenie różnicy i trendu
                const difference = sum2024 - sum2025;
                let trendText = '';
                let arrowClass = 'down';
                let arrowSymbol = '↓';
                let color = '#ff3333'; // Czerwony dla spadku
                let percentage = 0;

                if (difference > 0) {
                    // 2024 jest wyższy, więc spadek w 2025 (strzałka w dół, czerwona)
                    percentage = ((difference / sum2024) * 100).toFixed(2) || 0;
                    trendText = `${formatNumberWithDotsAndComma(difference)} (${percentage}% DECREASE)`;
                } else if (difference < 0) {
                    // 2025 jest wyższy, więc wzrost (strzałka w górę, zielona)
                    arrowClass = 'up';
                    arrowSymbol = '↑';
                    color = '#00cc00'; // Zielony dla wzrostu
                    differenceAbs = Math.abs(difference);
                    percentage = ((differenceAbs / sum2025) * 100).toFixed(2) || 0;
                    trendText = `${formatNumberWithDotsAndComma(differenceAbs)} (${percentage}% INCREASE)`;
                } else {
                    // Brak różnicy
                    trendText = '0,00 (0% NO CHANGE)';
                    arrowClass = 'down';
                    arrowSymbol = '↓';
                    color = '#ff3333';
                }

                // Wyświetlanie trendu z dynamiczną strzałką i kolorem
                trendDisplay.innerHTML = `<span class="arrow ${arrowClass}" style="color: ${color}">${arrowSymbol}</span> ${trendText}`;
            } else {
                console.warn('Brak danych w Firebase.');
                valueDisplay.textContent = '2024: 0,00 | 2025: 0,00';
                trendDisplay.innerHTML = '<span class="arrow down" style="color: #ff3333">↓</span> 0,00 (0% NO CHANGE)';
            }
        }, (error) => {
            console.error('Błąd pobierania danych budżetu:', error);
            valueDisplay.textContent = '2024: 0,00 | 2025: 0,00';
            trendDisplay.innerHTML = '<span class="arrow down" style="color: #ff3333">↓</span> 0,00 (0% NO CHANGE)';
        });
    } else {
        console.error('Nie znaleziono elementów dla Total Budget na stronie.');
    }
}

// Wywołaj funkcję po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    loadTotalBudgetData();
});
