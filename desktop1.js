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

// Referencja do danych w Firebase pod ścieżką 'Target/data-table1'
const teamMemberRef = ref(database, 'Target/data-table1');

// Funkcja normalizująca dane liczbowe (parsuje z kropką jako separatorem tysięcznym i przecinkiem jako dziesiętnym)
function normalizeNumber(value) {
    if (!value || value.trim() === "") return 0;
    // Usuń kropki i spacje jako separatory tysięczne, zachowaj przecinek jako separator dziesiętny, konwertuj na liczbę
    let normalized = value.replace(/[\.\s]/g, '').replace(',', '.');
    return parseInt(normalized.replace('.', '')) || 0; // Używamy parseInt, aby uzyskać liczbę całkowitą, ignorując części dziesiętne
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

// Funkcja ładująca dane dla TEAM MEMBER
function loadTeamMemberData() {
    const memberNameDisplay = document.getElementById('memberName');
    const planValueDisplay = document.getElementById('planValue');
    const salesValueDisplay = document.getElementById('salesValue');
    const estimateValueDisplay = document.getElementById('estimateValue');
    const estimatePercentageDisplay = document.getElementById('estimatePercentage');

    if (memberNameDisplay && planValueDisplay && salesValueDisplay && estimateValueDisplay && estimatePercentageDisplay) {
        onValue(teamMemberRef, (snapshot) => {
            const data = snapshot.val();
            console.log('Dane z Firebase:', data); // Debugowanie – sprawdź, czy dane są pobierane
            if (data && Array.isArray(data)) {
                // Zakładamy, że dane są tablicą obiektów
                let firstEntry = data[0]; // Pobierz pierwszy obiekt z tablicy
                if (firstEntry) {
                    // Pobierz ключ i wartość z obiektu
                    const key = Object.keys(firstEntry)[0]; // Klucz, np. "PH;Sprzedaż;Plan 02_2025;Indywidualny uptime czasu;Estymacja;Estymacja %"
                    const value = firstEntry[key]; // Wartość, np. "Szemerowski Marcin;343 379;911700;39,89%;860842;94,42%"

                    // Rozbij wartość na części, używając średnika jako separatora
                    let parts = value.split(';').map(part => part.trim() === "" ? "0" : part);

                    const name = parts[0] || 'PH'; // Imię i nazwisko (pierwsza kolumna wartości)
                    const plan = normalizeNumber(parts[1]); // Wartość "Plan" (druga kolumna wartości)
                    const sales = normalizeNumber(parts[2]); // Wartość "Sprzedaż" (trzecia kolumna wartości)
                    const estimate = normalizeNumber(parts[4]); // Wartość "Estymacja" (piąta kolumna wartości)
                    const estimatePercentage = parseFloat(parts[5].replace('%', '').replace(',', '.')) || 0; // Wartość "Estymacja %" (szósta kolumna wartości), zamiana przecinka na kropkę i usunięcie %

                    // Wyświetl dane z znakiem funta (£)
                    memberNameDisplay.textContent = name;
                    planValueDisplay.textContent = formatNumberWithPoundsAndComma(plan);
                    salesValueDisplay.textContent = formatNumberWithPoundsAndComma(sales);
                    estimateValueDisplay.textContent = formatNumberWithPoundsAndComma(estimate);

                    // Wyświetl estymację % z jedną strzałką (↓ dla wartości poniżej 100%, brak strzałki dla >= 100%)
                    if (estimatePercentage < 100) {
                        estimatePercentageDisplay.innerHTML = `<span class="arrow down" style="color: #ff3333">↓</span> ${estimatePercentage.toFixed(2)}%`;
                    } else {
                        estimatePercentageDisplay.textContent = `${estimatePercentage.toFixed(2)}%`; // Brak strzałki dla wartości >= 100%
                    }
                } else {
                    console.warn('Brak danych w Firebase.');
                    memberNameDisplay.textContent = 'PH';
                    planValueDisplay.textContent = '£0,00';
                    salesValueDisplay.textContent = '£0,00';
                    estimateValueDisplay.textContent = '£0,00';
                    estimatePercentageDisplay.textContent = '0.00%';
                }
            } else {
                console.warn('Dane z Firebase nie są tablicą lub są puste.');
                memberNameDisplay.textContent = 'PH';
                planValueDisplay.textContent = '£0,00';
                salesValueDisplay.textContent = '£0,00';
                estimateValueDisplay.textContent = '£0,00';
                estimatePercentageDisplay.textContent = '0.00%';
            }
        }, (error) => {
            console.error('Błąd pobierania danych team member:', error);
            memberNameDisplay.textContent = 'PH';
            planValueDisplay.textContent = '£0,00';
            salesValueDisplay.textContent = '£0,00';
            estimateValueDisplay.textContent = '£0,00';
            estimatePercentageDisplay.textContent = '0.00%';
        });
    } else {
        console.error('Nie znaleziono elementów na stronie.');
    }
}

// Wywołaj funkcję po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    loadTeamMemberData();
});
