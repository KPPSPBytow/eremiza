import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// 1. FIREBASE CONFIG
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

// 2. DŹWIĘK SYRENY
const syrena = new Audio("syrena-6.mp3");

let trybStrony = "menu";
let ostatnioOdtworzonyID = null;
let odebraneAlarmy = [];
let zalogowanyUzytkownik = null;

// IDENTYFIKATOR UŻYTKOWNIKA PRZEGLĄDARKI (DLA DEKLARACJI UDZIAŁU W ALARMIE)
let myUserId = localStorage.getItem("strazak_id");
if (!myUserId) {
    myUserId = "strazak_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("strazak_id", myUserId);
}

// LISTY PODRODZAJÓW ZDARZEŃ
const podrodzajeMZ = [
    "Atmosferyczne", "Budowlane", "Chemiczne", "Drogowe", "Inne MZ", "Kolejowe",
    "Kolizja", "Lotnicze", "Palenie ognisk w miejscach niedozwolonych",
    "Podejrzenie podłożenia ładunku", "Pomoc innym służbom", "Pomoc Policji",
    "Pomoc PRM", "Pomoc w otwarciu mieszkania, podejrzenie zgonu",
    "Poszukiwanie osób zaginionych", "Próba samobójcza", "Sanitarno-epidemiologiczne",
    "Topienie się", "Wodne", "Zabezpieczenie ładunku", "Zwierzęta"
];

const podrodzajeP = [
    "Inne pożary", "Instytucje, obiekty użyteczności publicznej", "Obiekty gospodarcze i inne rolnicze",
    "Obiekty magazynowe, place składowe", "Obiekty mieszkalne",
    "Obiekty produkcyjne, instalacje technologiczne, rurociągi, urządzenia",
    "Śmietniki, wysypiska", "Środki transportu drogowego", "Środki transportu kolejowego",
    "Środki transportu lotniczego", "Środki transportu wodnego", "Trawy, torfowiska, lasy, pola, stogi"
];

// ELEMENTY DOM
const menu = document.getElementById("menu");
const pinBox = document.getElementById("pinBox");
const dyzurny = document.getElementById("dyzurnyPanel");
const remiza = document.getElementById("remizaPanel");
const alarmBox = document.getElementById("alarm");
const historiaBox = document.getElementById("historiaAlarmow");

const selectRodzaj = document.getElementById("rodzaj");
const selectPodrodzaj = document.getElementById("podrodzaj");

// DYNAMICZNE PODRODZAJE
function aktualizujPodrodzaje() {
    const wybranyRodzaj = selectRodzaj.value;
    selectPodrodzaj.innerHTML = "";

    let opcje = [];
    if (wybranyRodzaj === "MZ") {
        opcje = podrodzajeMZ;
    } else if (wybranyRodzaj === "P") {
        opcje = podrodzajeP;
    } else {
        opcje = ["Standardowe"];
    }

    opcje.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        selectPodrodzaj.appendChild(opt);
    });
}

if (selectRodzaj) {
    selectRodzaj.addEventListener("change", aktualizujPodrodzaje);
    aktualizujPodrodzaje();
}

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

// LOGOWANIE OBSŁUGUJĄCE ZARÓWNO /pin JAK I /weryfikacja
document.getElementById("loginBtn").onclick = async () => {
    const wpisanaWartosc = document.getElementById("pin").value.trim();
    const errorEl = document.getElementById("loginError");
    
    errorEl.innerHTML = "Weryfikacja...";

    if (!wpisanaWartosc) {
        errorEl.innerHTML = "Wpisz PIN lub kod weryfikacyjny!";
        return;
    }

    try {
        // 1. Sprawdzamy czy wpisano jednorazowy kod z /weryfikacja
        const snapKod = await getDoc(doc(db, "kody_weryfikacyjne", wpisanaWartosc));

        if (snapKod.exists()) {
            const daneKodu = snapKod.data();
            if (Date.now() > daneKodu.waznyDo) {
                errorEl.innerHTML = "❌ Kod jednorazowy wygasł!";
                return;
            }
            zalogowanyUzytkownik = {
                discordId: daneKodu.discordId,
                nazwa: daneKodu.nazwa
            };
            pomyślneLogowanie();
            return;
        }

        // 2. Szukamy wpisanego PIN-u wśród wszystkich zarejestrowanych użytkowników (/pin)
        const snapshotUzytkownicy = await getDocs(collection(db, "uzytkownicy_osp"));
        let znalezionyUzytkownik = null;

        snapshotUzytkownicy.forEach((doc) => {
            const data = doc.data();
            if (data.pin && data.pin.toString().trim() === wpisanaWartosc) {
                znalezionyUzytkownik = data;
            }
        });

        if (znalezionyUzytkownik) {
            zalogowanyUzytkownik = {
                discordId: znalezionyUzytkownik.discordId,
                nazwa: znalezionyUzytkownik.nazwa
            };
            pomyślneLogowanie();
            return;
        }

        errorEl.innerHTML = "❌ Nieprawidłowy PIN lub kod!";

    } catch (e) {
        console.error("Błąd logowania:", e);
        errorEl.innerHTML = "Błąd połączenia z bazą danych.";
    }
};

function pomyślneLogowanie() {
    ukryj();
    dyzurny.classList.remove("hidden");
    trybStrony = "dyzurny";
    document.getElementById("pin").value = "";
    document.getElementById("loginError").innerHTML = "";
}

// POBIERANIE CZASU ZGŁOSZENIA (GODZINA:MINUTA)
function getObecnaGodzina() {
    const teraz = new Date();
    return teraz.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' });
}

// NADAWANIE ALARMU
document.getElementById("alarmBtn").onclick = async () => {
    const rodzaj = selectRodzaj.value;
    const podrodzaj = selectPodrodzaj.value;
    const lokalizacja = document.getElementById("lokalizacja").value.trim();
    const opis = document.getElementById("opis").value.trim();

    if (!lokalizacja) {
        alert("Podaj lokalizację zdarzenia!");
        return;
    }

    try {
        await addDoc(collection(db, "alarmy"), {
            rodzaj: rodzaj,
            podrodzaj: podrodzaj,
            lokalizacja: lokalizacja,
            opis: opis,
            dyzurny: zalogowanyUzytkownik ? zalogowanyUzytkownik.nazwa : "Nieokreślony",
            discordId: zalogowanyUzytkownik ? zalogowanyUzytkownik.discordId : null,
            czasNadania: getObecnaGodzina(),
            created: Date.now(),
            reakcje: {}
        });

        alert("🚨 Alarm wysłany! Powiadomienie trafia na Discorda.");
        document.getElementById("lokalizacja").value = "";
        document.getElementById("opis").value = "";
    } catch (error) {
        console.error("Błąd wysyłania alarmu: ", error);
        alert("Błąd wysyłania alarmu: " + error.message);
    }
};

// DEKLAROWANIE WYJAZDU Przez STRAŻAKÓW (BIORĘ UDZIAŁ / NIE MOGĘ)
window.zglaszReakcje = async (alarmId, status) => {
    try {
        const alarmRef = doc(db, "alarmy", alarmId);
        await updateDoc(alarmRef, {
            [`reakcje.${myUserId}`]: status
        });
    } catch (e) {
        console.error("Błąd zapisu reakcji:", e);
    }
};

// SYNCHRONIZACJA BAZY W CZASIE RZECZYWISTYM
const alarmyRef = collection(db, "alarmy");

onSnapshot(alarmyRef, (snapshot) => {
    const lista = [];
    snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
    });

    lista.sort((a, b) => (b.created || 0) - (a.created || 0));
    odebraneAlarmy = lista;
    renderujEremize();
    aktualizujStatystyki();
}, (error) => {
    console.error("Błąd połączenia Firebase:", error);
});

setInterval(() => {
    if (odebraneAlarmy.length > 0) {
        renderujEremize();
    }
}, 1000);

// PRZELICZANIE STATYSTYK WYJAZDÓW
function aktualizujStatystyki() {
    let countP = 0, countMZ = 0, countPNZR = 0, countC = 0;

    odebraneAlarmy.forEach(item => {
        if (item.rodzaj === "P") countP++;
        else if (item.rodzaj === "MZ") countMZ++;
        else if (item.rodzaj === "PNZR") countPNZR++;
        else if (item.rodzaj === "Ć") countC++;
    });

    const elRazem = document.getElementById("statRazem");
    const elP = document.getElementById("statP");
    const elMZ = document.getElementById("statMZ");
    const elPNZR = document.getElementById("statPNZR");
    const elC = document.getElementById("statC");

    if (elRazem) elRazem.textContent = odebraneAlarmy.length;
    if (elP) elP.textContent = countP;
    if (elMZ) elMZ.textContent = countMZ;
    if (elPNZR) elPNZR.textContent = countPNZR;
    if (elC) elC.textContent = countC;
}

// RENDEROWANIE WIDOKU REMIZY
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
    const CZAS_TRWANIA_ALARMU = 30000; // 30 sekund trwania aktywnego wywołania

    let aktywnyZdarzenie = null;
    let historiaZdarzen = [];

    if (czasOdWyslania < CZAS_TRWANIA_ALARMU) {
        aktywnyZdarzenie = najnowszy;
        historiaZdarzen = odebraneAlarmy.slice(1);
    } else {
        aktywnyZdarzenie = null;
        historiaZdarzen = odebraneAlarmy;
    }

    // --- AKTYWNE ZDARZENIE ---
    if (aktywnyZdarzenie) {
        const wyswietlanyCzas = aktywnyZdarzenie.czasNadania || "Brak daty"; 
        const reakcje = aktywnyZdarzenie.reakcje || {};
        let jadeLiczba = 0, nieJadeLiczba = 0;
        let mojStatus = reakcje[myUserId] || null;

        Object.values(reakcje).forEach(val => {
            if (val === "jade") jadeLiczba++;
            if (val === "nie_jade") nieJadeLiczba++;
        });

        alarmBox.innerHTML = `
            <h2>🚨 AKTYWNE ZDARZENIE 🚨</h2>
            <p><b>Rodzaj:</b> ${aktywnyZdarzenie.rodzaj} ${aktywnyZdarzenie.podrodzaj ? '(' + aktywnyZdarzenie.podrodzaj + ')' : ''}</p>
            <p><b>Lokalizacja:</b><br>${aktywnyZdarzenie.lokalizacja}</p>
            <p><b>Opis:</b><br>${aktywnyZdarzenie.opis || "Brak opisu"}</p>
            <p><b>Godzina zgłoszenia:</b> ${wyswietlanyCzas}</p>

            <div class="reakcja-box">
                <h3>DEKLARACJA WYJAZDU:</h3>
                <div class="reakcja-przyciski">
                    <button class="btn-jade ${mojStatus === 'jade' ? 'wybrany' : ''}" onclick="zglaszReakcje('${aktywnyZdarzenie.id}', 'jade')">
                        ✅ BIORĘ UDZIAŁ
                    </button>
                    <button class="btn-nie-jade ${mojStatus === 'nie_jade' ? 'wybrany' : ''}" onclick="zglaszReakcje('${aktywnyZdarzenie.id}', 'nie_jade')">
                        ❌ NIE MOGĘ
                    </button>
                </div>
                <div class="licznik-statystyki">
                    <span class="stat-jade">👨‍🚒 Biorą udział: <b>${jadeLiczba}</b></span>
                    <span class="stat-nie">❌ Nie mogą: <b>${nieJadeLiczba}</b></span>
                </div>
            </div>
        `;
        alarmBox.classList.add("alarm-active");

        if (trybStrony === "remiza" && ostatnioOdtworzonyID !== aktywnyZdarzenie.id) {
            ostatnioOdtworzonyID = aktywnyZdarzenie.id;
            syrena.currentTime = 0;
            syrena.play().catch(err => console.log("Odtwarzanie audio wstrzymane przez przeglądarkę: ", err));
        }
    } else {
        wylaczActiveAlarm();
    }

    // --- HISTORIA ZDARZEŃ ---
    if (historiaZdarzen.length === 0) {
        historiaBox.innerHTML = `<div class="historia-pusta">Brak starszych alarmów w historii.</div>`;
    } else {
        historiaBox.innerHTML = historiaZdarzen.map(item => {
            const czasItem = item.czasNadania || "Brak godziny";
            const podrodzajTekst = item.podrodzaj ? ` - ${item.podrodzaj}` : '';
            const reakcje = item.reakcje || {};
            let jade = 0;
            Object.values(reakcje).forEach(val => { if (val === "jade") jade++; });

            return `
                <div class="historia-item">
                    <div class="historia-naglowek">
                        <span class="historia-rodzaj">${item.rodzaj}${podrodzajTekst}</span>
                        <span class="historia-czas">⏰ ${czasItem}</span>
                    </div>
                    <h4>📍 ${item.lokalizacja}</h4>
                    <p>${item.opis ? '<b>Opis:</b> ' + item.opis : '<i>Brak dodatkowego opisu</i>'}</p>
                    <div class="historia-obsada">👨‍🚒 Obsada wyjazdowa: <b>${jade} osób</b></div>
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
