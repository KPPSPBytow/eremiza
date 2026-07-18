import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// FIREBASE

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


// DŹWIĘK

const syrena = new Audio("SWD.wav");

let timerAlarmu = null;


// ELEMENTY

const menu = document.getElementById("menu");
const pinBox = document.getElementById("pinBox");
const dyzurny = document.getElementById("dyzurnyPanel");
const remiza = document.getElementById("remizaPanel");
const alarmBox = document.getElementById("alarm");


// UKRYWANIE OKIEN

function ukryj(){

    menu.classList.add("hidden");
    pinBox.classList.add("hidden");
    dyzurny.classList.add("hidden");
    remiza.classList.add("hidden");

}



// PANEL DYŻURNEGO

document.getElementById("btnDyzurny").onclick = ()=>{

    ukryj();

    pinBox.classList.remove("hidden");

};



// E-REMIZA

document.getElementById("btnRemiza").onclick = ()=>{

    ukryj();

    remiza.classList.remove("hidden");

};



// POWRÓT

document.querySelectorAll(".back").forEach(btn=>{

    btn.onclick=()=>{

        ukryj();

        menu.classList.remove("hidden");

    };

});



// LOGOWANIE DYŻURNEGO

document.getElementById("loginBtn").onclick = ()=>{


    const pin = document.getElementById("pin").value;


    if(pin === "1234"){


        ukryj();

        dyzurny.classList.remove("hidden");


    }else{


        document.getElementById("loginError").innerHTML =
        "Niepoprawny PIN";


    }

};




// WYSYŁANIE ALARMU

document.getElementById("alarmBtn").onclick = async()=>{


    const rodzaj =
    document.getElementById("rodzaj").value;


    const lokalizacja =
    document.getElementById("lokalizacja").value;


    const opis =
    document.getElementById("opis").value;


    const godzina =
    new Date().toLocaleTimeString("pl-PL");



    try{


        await setDoc(
        doc(db,"alarm","aktywny"),
        {

            rodzaj: rodzaj,

            lokalizacja: lokalizacja,

            opis: opis,

            godzina: godzina,

            status:"aktywny"

        });



        alert("🚨 Alarm wysłany!");



        document.getElementById("lokalizacja").value="";
        document.getElementById("opis").value="";


    }catch(error){


        console.error(error);

        alert("Błąd wysyłania alarmu");


    }


};





// ODBIERANIE ALARMU FIREBASE

onSnapshot(
doc(db,"alarm","aktywny"),

(snapshot)=>{


    if(!snapshot.exists()){

        pokazBrakAlarmu();

        return;

    }



    const d = snapshot.data();



    if(d.status !== "aktywny"){


        pokazBrakAlarmu();

        return;

    }



    alarmBox.innerHTML = `


    <h2>
    🚨 NOWE ZDARZENIE 🚨
    </h2>


    <p>
    <b>Rodzaj:</b>
    ${d.rodzaj}
    </p>


    <p>
    <b>Lokalizacja:</b><br>
    ${d.lokalizacja}
    </p>


    <p>
    <b>Opis:</b><br>
    ${d.opis}
    </p>


    <p>
    <b>Godzina:</b>
    ${d.godzina}
    </p>


    `;



    alarmBox.classList.add("alarm-active");



    // DŹWIĘK TYLKO DLA E-REMIZY

    if(!remiza.classList.contains("hidden")){


        syrena.currentTime = 0;


        syrena.play().catch(error=>{

            console.log(
            "Dźwięk zablokowany przez przeglądarkę",
            error
            );

        });

    }





    // USUNIĘCIE ALARMU PO 30 SEKUNDACH


    if(timerAlarmu){

        clearTimeout(timerAlarmu);

    }



    timerAlarmu = setTimeout(async()=>{


        await setDoc(
        doc(db,"alarm","aktywny"),
        {

            status:"brak"

        });


    },30000);



});





// BRAK ALARMU

function pokazBrakAlarmu(){


    alarmBox.innerHTML = `

    <h3>
    Brak aktywnego alarmu
    </h3>

    `;


    alarmBox.classList.remove("alarm-active");


}
