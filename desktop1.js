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

// Referencja do danych TEAM MEMBERS w Firebase
const teamMembersRef = ref(database, 'Data/team-members');

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

// Wywołaj funkcję po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    loadTeamMembersData();
});