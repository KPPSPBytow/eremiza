import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCiEgW5qAv3a61k4F8gXlvSFinHapOY6vU",
  authDomain: "eremiza.firebaseapp.com",
  projectId: "eremiza",
  storageBucket: "eremiza.firebasestorage.app",
  messagingSenderId: "304527774904",
  appId: "1:304527774904:web:e32d405d1ef339b190904d",
  measurementId: "G-Y7LWEKCF4H"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DŹWIĘK SYRENY
const syrena = new Audio("syrena-6.mp3");

let trybStrony = "menu";
let ostatnioOdtworzonyID = null;
let odebraneAlarmy = []; // Przechowujemy odebrane dane globalnie

// ELEMENTY DOM
const menu = document.getElementById("menu");
const pinBox = document.getElementById("pinBox");
const dyzurny = document.getElementById("dyzurnyPanel");
const remiza = document.getElementById("remizaPanel");
const alarmBox = document.getElementById("alarm");
const historiaBox = document.getElementById("historiaAlarmow");

function ukryj() {
    menu.classList.add("hidden");
    pinBox.classList.add("hidden");
    dyzurny.classList.add("hidden");
    remiza.classList.add("hidden");
}

function odblokujAudio() {
    syrena.play().then(() => {
        syrena.pause();
        syrena.currentTime = 0;
    }).catch(() => {});
}

// NAWIGACJA
document.getElementById("btnDyzurny").onclick = () => {
    trybStrony = "dyzurny";
    ukryj();
    pinBox.classList.remove("hidden");
};

document.getElementById("btnRemiza").onclick = () => {
    trybStrony = "remiza";
    odblokujAudio();
    ukryj();
    remiza.classList.remove("hidden");
};

document.querySelectorAll(".back").forEach(btn => {
    btn.onclick = () => {
        trybStrony = "menu";
        ukryj();
        menu.classList.remove("hidden");
    };
});

// LOGOWANIE DYŻURNEGO
document.getElementById("loginBtn").onclick = () => {
    const pin = document.getElementById("pin").value;
    if (pin === "SKKPBytow") {
        ukryj();
        dyzurny.classList.remove("hidden");
        trybStrony = "dyzurny";
        document.getElementById("pin").value = "";
        document.getElementById("loginError").innerHTML = "";
    } else {
        document.getElementById("loginError").innerHTML = "Niepoprawny PIN";
    }
};

// FORMATOWANIE DATY
function getObecnaDataGodzina() {
    const teraz = new Date();
    return teraz.toLocaleDateString("pl-PL") + ", " + teraz.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' });
}

// WYSYŁANIE ALARMU
document.getElementById("alarmBtn").onclick = async () => {
    const rodzaj = document.getElementById("rodzaj").value;
    const lokalizacja = document.getElementById("lokalizacja").value.trim();
    const opis = document.getElementById("opis").value.trim();
    
    const czasNadania = getObecnaDataGodzina(); 
    const timestampZwykly = Date.now(); 

    if (!lokalizacja) {
        alert("Podaj lokalizację zdarzenia!");
        return;
    }

    try {
        await addDoc(collection(db, "alarmy"), {
            rodzaj: rodzaj,
            lokalizacja: lokalizacja,
            opis: opis,
            czasNadania: czasNadania,
            created: timestampZwykly
        });

        alert("🚨 Alarm wysłany pomyślnie!");
        document.getElementById("lokalizacja").value = "";
        document.getElementById("opis").value = "";
    } catch (error) {
        console.error("Błąd wysyłania alarmu: ", error);
        alert("Błąd wysyłania alarmu: " + error.message);
    }
};

// NASŁUCHUJ ZMIAN W BAZIE (REALTIME)
const alarmyRef = collection(db, "alarmy");

onSnapshot(
    alarmyRef,
    (snapshot) => {
        const lista = [];
        snapshot.forEach((doc) => {
            lista.push({ id: doc.id, ...doc.data() });
        });

        // Sortowanie od najnowszego
        lista.sort((a, b) => (b.created || 0) - (a.created || 0));
        
        odebraneAlarmy = lista;
        renderujEremize();
    },
    (error) => {
        console.error("Błąd połączenia z bazy Firebase: ", error);
    }
);

// AUTOMATYCZNE ODŚWIEŻANIE CO 1 SEKUNDĘ (ŻEBY ALARM ZGASŁ DOKŁADNIE PO 30 SEKUNDACH)
setInterval(() => {
    if (odebraneAlarmy.length > 0) {
        renderujEremize();
    }
}, 1000);

// RENDEROWANIE E-REMIZY
function renderujEremize() {
    if (!alarmBox || !historiaBox) return;

    if (odebraneAlarmy.length === 0) {
        wylaczActiveAlarm();
        historiaBox.innerHTML = `<div class="historia-pusta">Brak zapisanych alarmów w historii.</div>`;
        return;
    }

    const najnowszy = odebraneAlarmy[0];
    const teraz = Date.now();
    const czasOdWyslania = teraz - (najnowszy.created || 0);
    const CZAS_TRWANIA_ALARMU = 30000; // 30 sekund w ms

    let aktywnyZdarzenie = null;
    let historiaZdarzen = [];

    // Sprawdzamy czy najnowszy alarm powstał mniej niż 30 sekund temu
    if (czasOdWyslania < CZAS_TRWANIA_ALARMU) {
        aktywnyZdarzenie = najnowszy;
        historiaZdarzen = odebraneAlarmy.slice(1); // Reszta idzie do historii
    } else {
        // Jeśli minęło 30s, WSZYSTKIE alarmy lądują w historii
        aktywnyZdarzenie = null;
        historiaZdarzen = odebraneAlarmy;
    }

    // --- RENDEROWANIE AKTYWNEGO ALARMU ---
    if (aktywnyZdarzenie) {
        const wyswietlanyCzas = aktywnyZdarzenie.czasNadania || "Brak daty"; 

        alarmBox.innerHTML = `
            <h2>🚨 AKTYWNE ZDARZENIE 🚨</h2>
            <p><b>Rodzaj:</b> ${aktywnyZdarzenie.rodzaj}</p>
            <p><b>Lokalizacja:</b><br>${aktywnyZdarzenie.lokalizacja}</p>
            <p><b>Opis:</b><br>${aktywnyZdarzenie.opis || "Brak opisu"}</p>
            <p><b>Data i godzina:</b> ${wyswietlanyCzas}</p>
        `;
        alarmBox.classList.add("alarm-active");

        // Odtwarzanie dźwięku
        if (trybStrony === "remiza" && ostatnioOdtworzonyID !== aktywnyZdarzenie.id) {
            ostatnioOdtworzonyID = aktywnyZdarzenie.id;
            syrena.currentTime = 0;
            syrena.play().catch(err => console.log("Dźwięk zablokowany: ", err));
        }
    } else {
        wylaczActiveAlarm();
    }

    // --- RENDEROWANIE HISTORII ---
    if (historiaZdarzen.length === 0) {
        historiaBox.innerHTML = `<div class="historia-pusta">Brak starszych alarmów w historii.</div>`;
    } else {
        historiaBox.innerHTML = historiaZdarzen.map(item => {
            const czasItem = item.czasNadania || "Brak daty";

            return `
                <div class="historia-item">
                    <h4>📍 ${item.lokalizacja} (${item.rodzaj})</h4>
                    <p><b>Data/Godzina:</b> ${czasItem}</p>
                    <p><b>Opis:</b> ${item.opis || "Brak opisu"}</p>
                </div>
            `;
        }).join("");
    }
}

function wylaczActiveAlarm() {
    alarmBox.innerHTML = `<h3>Brak aktywnego alarmu</h3>`;
    alarmBox.classList.remove("alarm-active");
    syrena.pause();
    syrena.currentTime = 0;
}
