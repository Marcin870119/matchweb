body { 
    font-family: 'Arial', sans-serif; 
    text-align: center; 
    background-color: #1a1a1a; /* Czarne tło dla całej strony */
    margin: 0; /* Usunięcie marginesów */
    padding: 0; /* Usunięcie paddingu */
}

.navbar { 
    height: 50px; 
    padding: 5px 10px; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
}

.navbar-brand { 
    display: flex; 
    align-items: center; 
    font-size: 16px; 
    font-weight: bold; 
}

.navbar-brand img { 
    height: 30px; 
    margin-right: 5px; 
}

.navbar-nav .nav-link { 
    font-size: 14px; 
    font-weight: 500; 
    color: rgba(255, 255, 255, 0.8); 
    padding: 6px 12px; 
    transition: color 0.3s ease-in-out; 
}

.navbar-nav .nav-link:hover, 
.navbar-nav .nav-link.active { 
    color: white; 
}

.dropdown-menu a:hover { 
    background-color: #343A40; 
    color: white; 
}

.container-buttons { 
    display: flex; 
    justify-content: center; 
    gap: 15px; 
    margin-bottom: 20px; 
    margin-top: 40px; 
}

.tile { 
    padding: 12px; 
    font-size: 16px; 
    font-weight: bold; 
    border-radius: 10px; 
    cursor: pointer; 
    width: 160px; 
    text-align: center; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    transition: all 0.3s ease-in-out; 
    background: rgba(255, 255, 255, 0.3); 
    backdrop-filter: blur(10px); 
    border: 1px solid rgba(255,255,255,0.2); 
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1); 
    color: #333; 
}

.tile:hover, 
.tile.active { 
    background: #343A40; 
    color: white; 
    transform: scale(1.05); 
    box-shadow: 6px 6px 14px rgba(0, 0, 0, 0.2); 
}

.tile.active { 
    background: #007BFF; 
    color: white; 
}

.upload-container { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    margin-top: 20px; 
}

.upload-area { 
    border: 2px dashed #ccc; 
    border-radius: 10px; 
    padding: 30px; 
    width: 50%; 
    text-align: center; 
    background: white; 
    transition: 0.3s; 
}

.upload-area.dragover { 
    border-color: #198754; 
    background: #f3f3f3; 
}

.upload-area p { 
    font-size: 16px; 
    color: #555; 
    margin-bottom: 10px; 
}

.button-group { 
    display: flex; 
    gap: 15px; 
    margin-top: 15px; 
}

button { 
    padding: 12px 18px; 
    border: none; 
    cursor: pointer; 
    font-size: 16px; 
    border-radius: 8px; 
    transition: all 0.3s ease-in-out; 
}

.btn-primary { 
    background-color: #343A40; 
    color: white; 
}

.btn-secondary { 
    background-color: #198754; 
    color: white; 
}

button:hover { 
    transform: scale(1.05); 
    opacity: 0.9; 
}

.table-container { 
    margin-top: 20px; 
    background: white; 
    padding: 20px; 
    border-radius: 10px; 
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); 
}

.tabulator { 
    font-size: 14px; 
}

.tabulator .tabulator-header .tabulator-col { 
    background: #343A40; 
    color: white; 
}

.tabulator .tabulator-row { 
    background-color: #fff; 
}

.tabulator .tabulator-row:nth-child(even) { 
    background-color: #f2f2f2; 
}

.tabulator .tabulator-cell { 
    padding: 10px; 
}

.summary-container { 
    margin-top: 20px; 
    font-size: 16px; 
    font-weight: bold; 
    color: #333; 
}

.hidden { 
    display: none; 
}

/* Style dla dashboardu */
.dashboard-container {
    display: flex;
    justify-content: center;
    gap: 30px; /* Zwiększenie odstępu między kartami dla większej przestrzeni */
    margin-top: 40px;
    padding: 20px;
    border-radius: 10px;
}

.dashboard-card {
    width: 300px; /* Zwiększenie szerokości z 200px na 300px */
    height: 200px; /* Zwiększenie wysokości z 150px na 200px */
    border-radius: 15px; /* Nieco większe zaokrąglenie dla większych kart */
    color: white;
    text-align: center;
    padding: 20px; /* Zwiększenie paddingu dla lepszego rozmieszczenia treści */
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3); /* Lekko mocniejszy cień dla większych kart */
    transition: transform 0.3s ease-in-out;
}

.dashboard-card:hover {
    transform: scale(1.05);
}

.okno1 {
    background-color: #007bff; /* Niebieski */
}

.okno2 {
    background-color: #28a745; /* Zielony */
}

.okno3 {
    background-color: #ffc107; /* Żółty */
}

.okno4 {
    background-color: #dc3545; /* Czerwony */
}

.dashboard-card h3 {
    font-size: 18px; /* Zwiększenie rozmiaru tekstu nagłówka */
    margin: 0 0 15px 0; /* Większy margines dolny */
    opacity: 0.8;
}

.kh-list {
    overflow-y: auto; /* Włącza pionowe przewijanie */
    height: 100px; /* Zmniejszenie wysokości, aby zmieścić logo */
    padding: 10px; /* Dodatkowy odstęp wewnątrz listy */
    line-height: 1.2; /* Mniejszy odstęp między liniami dla mniejszej czcionki */
    font-size: 14px; /* Zmniejszenie rozmiaru czcionki z 16px na 14px */
    color: white; /* Kolor tekstu, aby pasował do tła karty niebieskiego */
    text-align: right; /* Wyjustowanie tekstu do prawej strony */
}

.kh-entry {
    display: flex;
    justify-content: space-between; /* Rozmieszczenie nazwy i strzałki z odstępem */
    align-items: center; /* Wyrównanie w pionie */
    margin-bottom: 5px; /* Odstęp między wpisami */
}

.kh-name {
    flex-grow: 1; /* Nazwa zajmuje większość miejsca */
    text-align: right; /* Wyjustowanie nazwy do prawej strony */
}

.kh-arrow {
    margin-left: 10px; /* Odstęp między nazwą a strzałką */
    font-size: 16px; /* Rozmiar strzałki */
}

.green-arrow {
    color: #28a745; /* Zielona strzałka w górę */
}

.red-arrow {
    color: #dc3545; /* Czerwona strzałka w dół */
}

.yellow-equals {
    color: #ffc107; /* Żółty znak równości */
}

.dashboard-card .value {
    font-size: 36px; /* Zwiększenie rozmiaru wartości */
    font-weight: bold;
    margin: 0 0 15px 0; /* Większy margines dolny */
}

.dashboard-card .trend {
    font-size: 16px; /* Zwiększenie rozmiaru trendu */
    margin: 0;
    opacity: 0.7;
}

.arrow {
    font-size: 16px; /* Zwiększenie rozmiaru strzałki */
    margin-right: 8px; /* Większy odstęp przed tekstem */
}

.arrow.up::after {
    content: "↑";
}

.arrow.down::after {
    content: "↓";
}
