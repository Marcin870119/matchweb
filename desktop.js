// Funkcja, która ładuje dane z URL-a (np. raporty2.html) i wyświetla je w oknie 1
function loadKHData() {
    // Przykład pobierania danych z URL-a (musisz dostosować do rzeczywistej struktury strony)
    fetch('https://marcin870119.github.io/matchweb/raporty2.html')
        .then(response => response.text())
        .then(html => {
            // Parsowanie HTML, aby wyciągnąć nazwy KH (prosty przykład – musisz dostosować do rzeczywistej struktury)
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const khNames = Array.from(doc.querySelectorAll('td')) // Zakładam, że nazwy KH są w komórkach tabeli <td>
                .map(td => td.textContent.trim())
                .filter(name => name && !name.includes('NAZWA KH')); // Filtrujemy puste lub nagłówkowe wpisy

            // Wyświetlanie maksymalnie 2 nazw KH w liście
            const khList = document.querySelector('.kh-list');
            if (khList) {
                khList.innerHTML = ''; // Wyczyść istniejącą treść
                khNames.slice(0, 2).forEach(name => { // Pokaż tylko pierwsze 2 nazwy
                    const p = document.createElement('p');
                    p.textContent = name;
                    khList.appendChild(p);
                });
            }
        })
        .catch(error => console.error('Błąd pobierania danych:', error));
}

// Funkcja pokazująca stronę główną (domyślna funkcja, którą miałeś w kodzie)
function showHomePage() {
    document.getElementById('homePage').classList.remove('hidden');
    // Tutaj możesz dodać więcej logiki, jeśli jest potrzebna
}

// Wywołaj funkcję po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    showHomePage();
    loadKHData(); // Ładuj dane KH po załadowaniu strony
});

// Przykładowa funkcja dla MATCH JSON (jeśli potrzebujesz)
function showMatchJSONPage() {
    // Tutaj możesz dodać logikę dla strony MATCH JSON
    console.log('Przejście do MATCH JSON');
}