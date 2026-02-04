// =============================
//     INIZIALIZZAZIONE MAPPA
// =============================
const map = L.map('map');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Oggetto per tenere traccia dei marker per id (per i pulsanti laterali)
const markersById = {};


// ========================================================
//     CARICAMENTO DEI POI DAL JSON + CREAZIONE DEI MARKER
// ========================================================
fetch('pois.json?nocache=' + Date.now())  // evita cache vecchia del JSON
  .then(res => res.json())
  .then(punti => {

    const bounds = L.latLngBounds(); // per adattare la mappa a tutti i POI

    punti.forEach(punto => {

      // -------------------------------------------
      // ICONA PERSONALIZZATA (mantiene proporzioni)
      // I file originali sono 142x227
      // -------------------------------------------
      const originalWidth = 142;
      const originalHeight = 227;
      const desiredHeight = 80; // altezza visualizzata sulla mappa

      const scaledWidth = (originalWidth / originalHeight) * desiredHeight; // ≈ 50 px

      const icona = L.icon({
        iconUrl: punto.icona, // es: "immagini/POI_Cattedrale.png"
        iconSize: [scaledWidth, desiredHeight],
        iconAnchor: [scaledWidth / 2, desiredHeight],
        popupAnchor: [0, -desiredHeight]
      });

      // ------------------------------
      // CREA MARKER CON ICONA PNG
      // ------------------------------
      const marker = L.marker([punto.lat, punto.lng], { icon: icona }).addTo(map);

      // Salva il marker per id, così possiamo ritrovarlo dai pulsanti laterali
      markersById[punto.id] = marker;

      // -----------------------------
      // CONTENUTO DEL POPUP
      // sfondo colorato da punto.colore
      // -----------------------------
      const bgColor = punto.colore || "#ffffff";

      const popupContent = `
        <div style="
          text-align: center;
          max-width: 230px;
          padding: 10px;
          border-radius: 10px;
          background-color: ${bgColor};
          color: #fff;
        ">
          <strong style="font-size: 16px;">${punto.nome}</strong><br>
          <p style="margin: 6px 0; font-size: 14px;">
            ${punto.descrizione}
          </p>
          <a href="./schedapoi.html?id=${encodeURIComponent(punto.id)}">
            <button style="
              padding: 6px 12px;
              margin-top: 6px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              background-color: #ffffff;
              color: #222;
              font-weight: bold;
            ">
              Vai alla scheda
            </button>
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      // aggiunge le coordinate del POI ai bounds
      bounds.extend([punto.lat, punto.lng]);
    });

    // Adatta automaticamente la mappa per includere tutti i POI
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      // fallback nel caso bounds fosse vuoto
      map.setView([40.6389, 17.9458], 16);
    }

    // Dopo che i marker sono pronti, colleghiamo i pulsanti laterali
    collegaPulsantiSidebar();

  })
  .catch(err => {
    console.error("Errore nel caricamento del JSON:", err);
  });


// ========================================================
//     COLLEGAMENTO PULSANTI LATERALI → MARKER SULLA MAPPA
// ========================================================
function collegaPulsantiSidebar() {
  const buttons = document.querySelectorAll('.sidebar-button[data-poi-id]');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    const poiId = btn.dataset.poiId;

    btn.addEventListener('click', () => {
      const marker = markersById[poiId];
      if (!marker) {
        console.warn('Nessun marker trovato per POI:', poiId);
        return;
      }

      const latLng = marker.getLatLng();

      // Chiudo eventuali popup aperti
      map.closePopup();

      // Uso flyTo per un movimento più evidente
      const targetZoom = 18; // puoi portare a 19 se vuoi ancora più vicino

      map.flyTo(latLng, targetZoom, {
        animate: true,
        duration: 0.7
      });

      // Quando il movimento è finito, apro il popup
      map.once('moveend', () => {
        marker.openPopup();
      });
    });
  });
}
