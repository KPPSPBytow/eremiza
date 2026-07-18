import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "TUTAJ_API_KEY",

    authDomain: "TUTAJ_AUTHDOMAIN",

    projectId: "TUTAJ_PROJECTID",

    storageBucket: "TUTAJ_STORAGE",

    messagingSenderId: "TUTAJ_SENDER",

    appId: "TUTAJ_APPID"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const menu = document.getElementById("menu");
const pinBox = document.getElementById("pinBox");
const dyzurny = document.getElementById("dyzurnyPanel");
const remiza = document.getElementById("remizaPanel");

function ukryj() {

    menu.classList.add("hidden");
    pinBox.classList.add("hidden");
    dyzurny.classList.add("hidden");
    remiza.classList.add("hidden");

}

document.getElementById("btnDyzurny").onclick = () => {

    ukryj();
    pinBox.classList.remove("hidden");

}

document.getElementById("btnRemiza").onclick = () => {

    ukryj();
    remiza.classList.remove("hidden");

}

document.querySelectorAll(".back").forEach(btn=>{

    btn.onclick=()=>{

        ukryj();
        menu.classList.remove("hidden");

    }

});

document.getElementById("loginBtn").onclick=()=>{

    let pin=document.getElementById("pin").value;

    if(pin==="1234"){

        ukryj();
        dyzurny.classList.remove("hidden");

    }else{

        document.getElementById("loginError").innerHTML="Niepoprawny PIN";

    }

}

document.getElementById("alarmBtn").onclick=async()=>{

    const rodzaj=document.getElementById("rodzaj").value;
    const lokalizacja=document.getElementById("lokalizacja").value;
    const opis=document.getElementById("opis").value;

    const godzina=new Date().toLocaleTimeString("pl-PL");

    await setDoc(doc(db,"alarm","aktywny"),{

        rodzaj,
        lokalizacja,
        opis,
        godzina

    });

    alert("Alarm wysłany!");

}

onSnapshot(doc(db,"alarm","aktywny"),(snapshot)=>{

    if(!snapshot.exists()) return;

    const d=snapshot.data();

    document.getElementById("alarm").innerHTML=`

<h2>🚨 NOWE ZDARZENIE 🚨</h2>

<p><b>Rodzaj:</b> ${d.rodzaj}</p>

<p><b>Lokalizacja:</b><br>${d.lokalizacja}</p>

<p><b>Opis:</b><br>${d.opis}</p>

<p><b>Godzina:</b> ${d.godzina}</p>

`;

    document.getElementById("alarm").classList.add("alarm-active");

});
