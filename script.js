// frontend/script.js

const map = L.map("map").setView([12.90, 80.20], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

let zones = [];
let zoneCircles = {};
let completedZones = [];
let disasterStarted = false;

// ---------------- PAGE LOAD ----------------
window.onload = async function () {

    const res = await fetch("http://127.0.0.1:5000/areas");
    zones = await res.json();

    updateTopStats();      // show counts immediately
    populateDropdowns();   // dropdown values
};

// ---------------- TOP BAR COUNTS ----------------
function updateTopStats() {

    document.getElementById("zones").innerText = zones.length;

    let people = zones.reduce((sum, z) => sum + z.people, 0);
    document.getElementById("people").innerText = people;

    let critical = zones.filter(z => z.priority > 2500).length;
    document.getElementById("critical").innerText = critical;
}

// ---------------- START DISASTER ----------------
function startDisaster() {

    disasterStarted = true;
    completedZones = [];

    // remove old circles if any
    for (let key in zoneCircles) {
        map.removeLayer(zoneCircles[key]);
    }

    zoneCircles = {};

    zones.forEach(z => {

        let color = "green";

        if (z.priority > 2500) color = "red";
        else if (z.priority > 1800) color = "orange";

        const circle = L.circle([z.lat, z.lon], {
            color: color,
            fillColor: color,
            fillOpacity: 0.45,
            radius: 500
        }).addTo(map);

        circle.bindPopup(`
            <b>${z.name}</b><br>
            🔴 Affected Area<br><br>
            👶 Children: ${z.children}<br>
            👩 Women: ${z.women}<br>
            👴 Elderly: ${z.elderly}<br>
            🚑 Patients: ${z.patients}<br>
            ⚠ Priority: ${z.priority}
        `);

        zoneCircles[z.name] = circle;
    });

    alert("🚨 Disaster Started");
}

// ---------------- DROPDOWN ----------------
function populateDropdowns() {

    const donor = document.getElementById("donor");
    const receiver = document.getElementById("receiver");

    donor.innerHTML = `<option value="">Select Donor Zone</option>`;
    receiver.innerHTML = `<option value="">Select Receiver Zone</option>`;

    zones.forEach(z => {

        donor.innerHTML += `<option value="${z.name}">${z.name}</option>`;
        receiver.innerHTML += `<option value="${z.name}">${z.name}</option>`;
    });
}

// ---------------- DRONE ----------------
function deployDrone() {

    if (!disasterStarted) {
        alert("Start disaster first");
        return;
    }

    const remaining = zones.filter(z => !completedZones.includes(z.name));

    if (remaining.length === 0) {
        alert("All zones completed");
        return;
    }

    remaining.sort((a, b) => b.priority - a.priority);

    const target = remaining[0];

    zoneCircles[target.name].setStyle({
        color: "orange",
        fillColor: "orange"
    });

    const start = [12.90, 80.20];
    const end = [target.lat, target.lon];

    const drone = L.marker(start).addTo(map);

    const line = L.polyline([start, end], {
        color: "blue",
        weight: 4
    }).addTo(map);

    let i = 0;

    const move = setInterval(() => {

        i += 0.02;

        drone.setLatLng([
            start[0] + (end[0] - start[0]) * i,
            start[1] + (end[1] - start[1]) * i
        ]);

        if (i >= 1) {

            clearInterval(move);

            zoneCircles[target.name].setStyle({
                color: "green",
                fillColor: "green"
            });

            completedZones.push(target.name);

            map.removeLayer(drone);
            map.removeLayer(line);

            alert("🚁 Delivered to " + target.name);
        }

    }, 100);
}

// ---------------- DONATE ----------------
function donate() {

    if (!disasterStarted) {
        alert("Start disaster first");
        return;
    }

    const donor = document.getElementById("donor").value;
    const receiver = document.getElementById("receiver").value;

    if (!donor || !receiver) {
        alert("Select both zones");
        return;
    }

    if (donor === receiver) {
        alert("Choose different zones");
        return;
    }

    // donor becomes orange (sent help)
    zoneCircles[donor].setStyle({
        color: "orange",
        fillColor: "orange"
    });

    // receiver becomes green (received help)
    zoneCircles[receiver].setStyle({
        color: "green",
        fillColor: "green"
    });

    alert("🤝 Resources moved from " + donor + " to " + receiver);
}

// ---------------- OTHER ----------------
function sendSMS() {
    alert("📩 Emergency Alert Sent");
}

function ngo() {
    alert("🏥 NGO Connected");
}

async function allocate() {

    const res = await fetch("http://127.0.0.1:5000/allocate");
    const data = await res.json();

    alert(data.message);
}