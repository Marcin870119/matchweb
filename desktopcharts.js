// Ładowanie Google Charts
google.charts.load('current', { 'packages': ['bar'] });
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    var data = google.visualization.arrayToDataTable([
        ['Rok', 'Sprzedaż 2024', 'Sprzedaż 2025'],
        ['Styczeń', 1000, 800],
        ['Luty', 1170, 900],
        ['Marzec', 660, 700],
        ['Kwiecień', 1030, 950]
    ]);

    var options = {
        chart: {
            title: 'Porównanie sprzedaży 2024 vs 2025',
            subtitle: 'Sprzedaż miesięczna',
        },
        bars: 'vertical',
        colors: ['#4BC0C0', '#FF6384'], // Niebieski dla 2024, czerwony dla 2025
        height: 400, // Zachowanie wysokości 400px dla bardziej kwadratowego wyglądu
        width: '100%',
        bar: { groupWidth: '75%' }, // Proporcjonalne słupki dla kwadratowego wyglądu
        legend: { position: 'top' },
        backgroundColor: '#1a1a1a', // Ciemne tło dla wykresu
        titleTextStyle: { color: '#ffffff' }, // Biały tekst tytułu
        hAxis: { textStyle: { color: '#ffffff' } }, // Biały tekst osi X
        vAxis: { textStyle: { color: '#ffffff' } } // Biały tekst osi Y
    };

    var chart = new google.charts.Bar(document.getElementById('columnchart_material'));
    chart.draw(data, google.charts.Bar.convertOptions(options));
}

// Funkcja obsługująca przeciąganie wykresu i zapisywanie pozycji
document.addEventListener('DOMContentLoaded', () => {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) {
        console.error('Nie znaleziono elementu .chart-container');
        return;
    }

    console.log('Chart container found:', chartContainer);

    let isDragging = false;
    let currentX = parseFloat(localStorage.getItem('chartX')) || 0; // Odczyt pozycji X z localStorage
    let currentY = parseFloat(localStorage.getItem('chartY')) || 0; // Odczyt pozycji Y z localStorage (domyślnie 0, jeśli nie zapisano)
    let initialX;
    let initialY;

    // Ustawienie początkowej pozycji na podstawie localStorage
    chartContainer.style.left = currentX + 'px';
    chartContainer.style.top = currentY + 'px';

    chartContainer.addEventListener('mousedown', (e) => {
        console.log('mousedown event triggered at position:', e.clientX, e.clientY);
        e.preventDefault(); // Zapobieganie domyślnemu zachowaniu
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        isDragging = true;
        chartContainer.style.cursor = 'grabbing'; // Zmiana kursora podczas przeciągania
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            console.log('mousemove event triggered at position:', e.clientX, e.clientY);
            e.preventDefault(); // Zapobieganie domyślnemu zachowaniu
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            // Ograniczenie ruchu w granicach całego dokumentu
            const maxX = window.innerWidth - chartContainer.offsetWidth;
            const maxY = document.documentElement.scrollHeight - chartContainer.offsetHeight;

            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));

            chartContainer.style.left = currentX + 'px';
            chartContainer.style.top = currentY + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        console.log('mouseup event triggered');
        isDragging = false;
        chartContainer.style.cursor = 'move'; // Powrót do kursora po zakończeniu przeciągania

        // Zapis pozycji do localStorage
        const currentLeft = parseFloat(chartContainer.style.left) || 0;
        const currentTop = parseFloat(chartContainer.style.top) || 0;
        localStorage.setItem('chartX', currentLeft);
        localStorage.setItem('chartY', currentTop);
        console.log('Position saved to localStorage:', { x: currentLeft, y: currentTop });
    });

    // Zapobieganie domyślnemu zachowaniu przeciągania (dla draggable="true")
    chartContainer.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
});