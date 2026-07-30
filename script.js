import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// KONFIGURACJA FIREBASE
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

let odebraneAlarmy = [];
let zalogowanyUzytkownik = null;

const podrodzajeMZ = ["Atmosferyczne", "Drogowe", "Poszukiwawcze", "Pomoc PRM/Policji", "Inne MZ"];
const podrodzajeP = ["Mieszkalne", "Uprawy/Trawy", "Pojazdy", "Obiekty", "Inne Pożary"];

// ELEMENTY HTML
const menu = document.getElementById("menu");
const pinBox = document.getElementById("pinBox");
const dyzurny = document.getElementById("dyzurnyPanel");
const remiza = document.getElementById("remizaPanel");

const selectRodzaj = document.getElementById("rodzaj");
const selectPodrodzaj = document.getElementById("podrodzaj");

function aktualizujPodrodzaje() {
    selectPodrodzaj.innerHTML = "";
    const opcje = selectRodzaj.value === "MZ" ? podrodzajeMZ : (selectRodzaj.value === "P" ? podrodzajeP : ["Standard"]);
    opcje.forEach(opt => {
        const el = document.createElement("option");
        el.value = opt;
        el.textContent = opt;
        selectPodrodzaj.appendChild(el);
    });
}
selectRodzaj.addEventListener("change", aktualizujPodrodzaje);
aktualizujPodrodzaje();

function ukryjWszystko() {
    menu.classList.add("hidden");
    pinBox.classList.add("hidden");
    dyzurny.classList.add("hidden");
    remiza.classList.add("hidden");
}

document.getElementById("btnDyzurny").onclick = () => { ukryjWszystko(); pinBox.classList.remove("hidden"); };
document.getElementById("btnRemiza").onclick = () => { ukryjWszystko(); remiza.classList.remove("hidden"); };
document.querySelectorAll(".back").forEach(b => b.onclick = () => { ukryjWszystko(); menu.classList.remove("hidden"); });

// LOGOWANIE DWUETAPOWE
document.getElementById("loginBtn").onclick = async () => {
    const wpisanyPin = document.getElementById("inputPin").value.trim();
    const wpisanyKod = document.getElementById("inputKod").value.trim();
    const errorEl = document.getElementById("loginError");
    
    errorEl.innerHTML = "Weryfikacja...";

    if (!wpisanyPin || !wpisanyKod) {
        errorEl.innerHTML = "❌ Wpisz zarówno PIN, jak i Kod Weryfikacyjny!";
        return;
    }

    try {
        const kodSnap = await getDoc(doc(db, "kody_weryfikacyjne", wpisanyKod));
        if (!kodSnap.exists()) {
            errorEl.innerHTML = "❌ Błędny kod weryfikacyjny";
            return;
        }

        const daneKodu = kodSnap.data();
        if (Date.now() > daneKodu.waznyDo) {
            errorEl.innerHTML = "❌ Kod wygasł! Wygeneruj nowy komendą `/weryfikacja`";
            return;
        }

        const userSnap = await getDoc(doc(db, "uzytkownicy_osp", daneKodu.discordId));
        if (!userSnap.exists() || userSnap.data().pin !== wpisanyPin) {
            errorEl.innerHTML = "❌ Podany PIN nie pasuje do użytkownika!";
            return;
        }

        zalogowanyUzytkownik = {
            discordId: daneKodu.discordId,
            nazwa: daneKodu.nazwa || userSnap.data().nazwa || "Nieznany"
        };

        document.getElementById("zalogowanyUserBadge").textContent = `Zalogowany: ${zalogowanyUzytkownik.nazwa}`;
        ukryjWszystko();
        dyzurny.classList.remove("hidden");

    } catch (e) {
        console.error(e);
        errorEl.innerHTML = "❌ Błąd połączenia z bazą danych!";
    }
};

// WYSYŁANIE ALARMU
document.getElementById("alarmBtn").onclick = async () => {
    const lokalizacja = document.getElementById("lokalizacja").value.trim();
    const opis = document.getElementById("opis").value.trim();

    if (!lokalizacja) {
        alert("Wpisz lokalizację!");
        return;
    }

    try {
        await addDoc(collection(db, "alarmy"), {
            rodzaj: selectRodzaj.value,
            podrodzaj: selectPodrodzaj.value,
            lokalizacja: lokalizacja,
            opis: opis || "Brak dodatkowego opisu.",
            dyzurny: zalogowanyUzytkownik ? zalogowanyUzytkownik.nazwa : "Dyżurny",
            discordId: zalogowanyUzytkownik ? zalogowanyUzytkownik.discordId : "",
            czasNadania: new Date().toLocaleTimeString("pl-PL", {hour: '2-digit', minute:'2-digit'}),
            created: Date.now()
        });

        alert("🚨 Alarm wysłany!");
        document.getElementById("lokalizacja").value = "";
        document.getElementById("opis").value = "";
    } catch (e) {
        alert("Błąd wysyłania alarmu: " + e.message);
    }
};

// NASŁUCHIWANIE ALARMÓW W CZASIE RZECZYWISTYM
onSnapshot(collection(db, "alarmy"), (snapshot) => {
    odebraneAlarmy = [];
    snapshot.forEach(doc => odebraneAlarmy.push({ id: doc.id, ...doc.data() }));
    odebraneAlarmy.sort((a, b) => b.created - a.created);
    renderujRemize();
});

function renderujRemize() {
    const alarmBox = document.getElementById("alarm");
    const historiaBox = document.getElementById("historiaAlarmow");

    if (odebraneAlarmy.length === 0) {
        historiaBox.innerHTML = "<div class='historia-pusta'>Brak alarmów w historii.</div>";
        return;
    }

    const najnowszy = odebraneAlarmy[0];
    const czyKrotko = (Date.now() - najnowszy.created) < 30000;

    if (czyKrotko) {
        alarmBox.className = "alarm-box alarm-active";
        alarmBox.innerHTML = `
            <h2>🚨 AKTYWNE ZDARZENIE 🚨</h2>
            <p style="color: #fff;"><b>Rodzaj:</b> ${najnowszy.rodzaj} (${najnowszy.podrodzaj})</p>
            <p style="color: #fff;"><b>Lokalizacja:</b> ${najnowszy.lokalizacja}</p>
            <p style="color: #fff;"><b>Opis:</b> ${najnowszy.opis}</p>
        `;
    } else {
        alarmBox.className = "alarm-box";
        alarmBox.innerHTML = "<h3>Brak aktywnego alarmu</h3>";
    }

    historiaBox.innerHTML = odebraneAlarmy.map(a => `
        <div class="historia-item">
            <div class="historia-naglowek">
                <span><b>${a.rodzaj}</b> (${a.podrodzaj || 'Standard'})</span>
                <span>⏰ ${a.czasNadania}</span>
            </div>
            <div style="margin-top: 5px;">📍 <b>${a.lokalizacja}</b></div>
            <div style="margin-top: 5px; color: #cbd5e1; font-size: 0.85rem;">📝 <i>${a.opis || 'Brak opisu'}</i></div>
        </div>
    `).join("");
}
