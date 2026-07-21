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

// WYSYŁANIE ALARMU
document.getElementById("alarmBtn").onclick = async () => {
    const rodzaj = document.getElementById("rodzaj").value;
    const lokalizacja = document.getElementById("lokalizacja").value.trim();
    const opis = document.getElementById("opis").value.trim();

    if (!lokalizacja) {
        alert("Podaj lokalizację zdarzenia!");
        return;
    }

    try {
        await addDoc(collection(db, "alarmy"), {
            rodzaj: rodzaj,
            lokalizacja: lokalizacja,
            opis: opis,
            created: Date.now()
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
        const listaAlarmow = [];
        snapshot.forEach((doc) => {
            listaAlarmow.push({ id: doc.id, ...doc.data() });
        });

        // Sortowanie po czasie w JS (od najnowszego do najstarszego)
        listaAlarmow.sort((a, b) => (b.created || 0) - (a.created || 0));

        renderujEremize(listaAlarmow);
    },
    (error) => {
        console.error("Błąd połączenia z bazy Firebase: ", error);
        alert("Błąd połączenia z bazą Firebase! Sprawdź reguły dostępu w konsoli.");
    }
);

// RENDEROWANIE E-REMIZY
function renderujEremize(alarmy) {
    if (!alarmBox || !historiaBox) return;

    if (alarmy.length === 0) {
        alarmBox.innerHTML = `<h3>Brak aktywnego alarmu</h3>`;
        alarmBox.classList.remove("alarm-active");
        historiaBox.innerHTML = `<div class="historia-pusta">Brak zapisanych alarmów w historii.</div>`;
        return;
    }

    // 1. AKTYWNY ALARM (NAJNOWSZY)
    const najnowszy = alarmy[0];
    const dataGodzina = najnowszy.created ? new Date(najnowszy.created).toLocaleString("pl-PL") : "Brak daty";

    alarmBox.innerHTML = `
        <h2>🚨 AKTYWNE ZDARZENIE 🚨</h2>
        <p><b>Rodzaj:</b> ${najnowszy.rodzaj}</p>
        <p><b>Lokalizacja:</b><br>${najnowszy.lokalizacja}</p>
        <p><b>Opis:</b><br>${najnowszy.opis || "Brak opisu"}</p>
        <p><b>Data i godzina:</b> ${dataGodzina}</p>
    `;
    alarmBox.classList.add("alarm-active");

    // Odtwarzanie dźwięku
    if (trybStrony === "remiza" && ostatnioOdtworzonyID !== najnowszy.id) {
        ostatnioOdtworzonyID = najnowszy.id;
        syrena.currentTime = 0;
        syrena.play().catch(err => console.log("Dźwięk zablokowany: ", err));
    }

    // 2. HISTORIA ALARMÓW
    const historia = alarmy.slice(1);

    if (historia.length === 0) {
        historiaBox.innerHTML = `<div class="historia-pusta">Brak starszych alarmów w historii.</div>`;
    } else {
        historiaBox.innerHTML = historia.map(item => {
            const czasItem = item.created ? new Date(item.created).toLocaleString("pl-PL") : "Brak daty";

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
