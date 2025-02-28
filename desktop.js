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
    gap: 30px;
    margin-top: 40px;
    padding: 20px;
    border-radius: 10px;
}

.dashboard-card {
    width: 300px;
    height: 200px;
    border-radius: 15px;
    color: white;
    text-align: center;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease-in-out;
}

.dashboard-card:hover {
    transform: scale(1.05);
}

.okno1 {
    background-color: #007bff;
}

.okno2 {
    background-color: #28a745;
}

.okno3 {
    background-color: #ffc107;
}

.okno4 {
    background-color: #dc3545;
}

.dashboard-card h3 {
    font-size: 18px;
    margin: 0 0 15px 0;
    opacity: 0.8;
}

.kh-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 15px 0;
    width: 100%;
}

.nav-arrow {
    background: none;
    border: none;
    font-size: 24px;
    color: white;
    cursor: pointer;
    padding: 0 10px;
    transition: color 0.3s ease-in-out;
}

.nav-arrow:hover {
    color: #f0f0f0;
}

.kh-name-value {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.kh-name {
    font-size: 16px;
    color: white;
    text-align: center;
}

.kh-arrow {
    margin-left: 12px; /* Lekko większy odstęp między nazwą a strzałką */
    font-size: 24px; /* Zwiększenie rozmiaru strzałki z 16px na 24px */
    font-weight: bold; /* Pogrubienie dla wyrazistości */
    line-height: 1; /* Ustalenie wysokości linii dla lepszego wyrównania */
}

.green-arrow {
    color: #00cc00; /* Jaśniejszy, bardziej intensywny zielony */
}

.red-arrow {
    color: #ff3333; /* Jaśniejszy, bardziej intensywny czerwony */
}

.yellow-equals {
    color: #ffcc00; /* Jaśniejszy, bardziej intensywny żółty */
}

.kh-values {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    color: white;
    margin-top: 10px;
}

.kh-value {
    font-weight: bold;
}

.dashboard-card .value {
    font-size: 36px;
    font-weight: bold;
    margin: 0 0 15px 0;
}

.dashboard-card .trend {
    font-size: 16px;
    margin: 0;
    opacity: 0.9; /* Zwiększenie widoczności z 0.7 na 0.9 */
    display: flex;
    align-items: center; /* Wyrównanie strzałki i tekstu */
    justify-content: center;
}

.arrow {
    font-size: 24px; /* Zwiększenie rozmiaru strzałki z 16px na 24px */
    font-weight: bold; /* Pogrubienie dla wyrazistości */
    margin-right: 10px; /* Większy odstęp przed tekstem */
    line-height: 1; /* Ustalenie wysokości linii dla lepszego wyrównania */
}

.arrow.up::after {
    content: "▲"; /* Grubsza, bardziej wyrazista strzałka w górę */
    color: #00cc00; /* Intensywny zielony */
}

.arrow.down::after {
    content: "▼"; /* Grubsza, bardziej wyrazista strzałka w dół */
    color: #ff3333; /* Intensywny czerwony */
}
