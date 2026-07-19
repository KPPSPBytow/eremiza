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


// OKREŚLENIE TRYBU STRONY

let trybStrony = "menu";



// ELEMENTY

const menu = document.getElementById("menu");
const pinBox = document.getElementById("pinBox");
const dyzurny = document.getElementById("dyzurnyPanel");
const remiza = document.getElementById("remizaPanel");
const alarmBox = document.getElementById("alarm");



// UKRYWANIE

function ukryj(){

    menu.classList.add("hidden");
    pinBox.classList.add("hidden");
    dyzurny.classList.add("hidden");
    remiza.classList.add("hidden");

}



// WEJŚCIE PANEL DYŻURNEGO

document.getElementById("btnDyzurny").onclick = ()=>{


    trybStrony = "dyzurny";


    ukryj();


    pinBox.classList.remove("hidden");


};



// WEJŚCIE E-REMIZA

document.getElementById("btnRemiza").onclick = ()=>{


    trybStrony = "remiza";


    ukryj();


    remiza.classList.remove("hidden");


};



// POWRÓT

document.querySelectorAll(".back").forEach(btn=>{


    btn.onclick=()=>{


        trybStrony = "menu";


        ukryj();


        menu.classList.remove("hidden");


    };


});



// LOGOWANIE

document.getElementById("loginBtn").onclick = ()=>{


    const pin = document.getElementById("pin").value;


    if(pin === "SKKPBytow"){


        ukryj();


        dyzurny.classList.remove("hidden");


        trybStrony = "dyzurny";


    }
    else{


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



    }
    catch(error){


        console.error(error);

        alert("Błąd wysyłania alarmu");


    }


};







// NASŁUCH FIREBASE

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





    // DŹWIĘK TYLKO E-REMIZA

    if(trybStrony === "remiza"){


        syrena.currentTime = 0;


        syrena.play().catch(error=>{


            console.log(
            "Dźwięk zablokowany przez przeglądarkę",
            error
            );


        });


    }






    // USUNIĘCIE PO 30 SEKUNDACH

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

// NASŁUCH AKTYWNEGO ALARMU

onSnapshot(
    doc(db, "alarm", "aktywny"),
    (snapshot) => {

        if (!snapshot.exists()) {

            pokazBrakAlarmu();
            return;

        }

        const d = snapshot.data();

        if (d.status !== "aktywny") {

            pokazBrakAlarmu();
            return;

        }

        alarmBox.innerHTML = `

        <h2>🚨 NOWE ZDARZENIE 🚨</h2>

        <p><b>Rodzaj:</b> ${d.rodzaj}</p>

        <p><b>Data:</b> ${d.data}</p>

        <p><b>Godzina:</b> ${d.godzina}</p>

        <p><b>Lokalizacja:</b><br>${d.lokalizacja}</p>

        <p><b>Opis:</b><br>${d.opis}</p>

        `;

        alarmBox.classList.add("alarm-active");


        // DŹWIĘK TYLKO W E-REMIZIE

        if (trybStrony === "remiza") {

            syrena.currentTime = 0;

            syrena.play().catch(() => {});

        }


        // USUNIĘCIE AKTYWNEGO ALARMU PO 30 SEKUNDACH

        if (timerAlarmu) {

            clearTimeout(timerAlarmu);

        }

        timerAlarmu = setTimeout(async () => {

            await setDoc(
                doc(db, "alarm", "aktywny"),
                {
                    status: "brak"
                }
            );

        }, 30000);

    }
);



// HISTORIA ALARMÓW

const historiaQuery = query(

    collection(db, "historia"),

    orderBy("timestamp", "desc"),

    limit(50)

);

onSnapshot(historiaQuery, (snapshot) => {

    if (snapshot.empty) {

        historiaBox.innerHTML = "<p>Brak zapisanych alarmów.</p>";

        return;

    }

    let html = "";

    snapshot.forEach((doc) => {

        const d = doc.data();

        html += `

        <div style="
            background:#2f2f2f;
            margin-bottom:15px;
            padding:15px;
            border-left:6px solid #d60000;
            border-radius:10px;
        ">

            <b>🚨 ${d.rodzaj}</b><br>

            📅 ${d.data} ${d.godzina}<br><br>

            📍 ${d.lokalizacja}<br><br>

            📝 ${d.opis}

        </div>

        `;

    });

    historiaBox.innerHTML = html;

});



// BRAK AKTYWNEGO ALARMU

function pokazBrakAlarmu() {

    alarmBox.innerHTML = `

    <h3>

        Brak aktywnego alarmu

    </h3>

    `;

    alarmBox.classList.remove("alarm-active");

}
