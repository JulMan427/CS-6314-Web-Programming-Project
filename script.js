/************ Date-time ************/
function showDateTime() {
  const el = document.getElementById("datetime");
  if (!el) return;
  el.innerText = new Date().toLocaleString();
  setTimeout(showDateTime, 1000);
}

/************ UI Persistence ************/
const defaults = { fontSize: 16, bg: "#f4f4f4" };

function applyUserSettings(){
  const size = parseInt(localStorage.getItem("fontSize") || defaults.fontSize);
  const bg = localStorage.getItem("bgColor") || defaults.bg;
  const main = document.querySelector("main");
  if (main) main.style.fontSize = size + "px";
  document.body.style.backgroundColor = bg;
  localStorage.setItem("fontSize", size);
  localStorage.setItem("bgColor", bg);
}
function increaseFont(){
  const main = document.querySelector("main"); if(!main) return;
  const s = Math.min(48, parseInt(localStorage.getItem("fontSize")||defaults.fontSize)+2);
  localStorage.setItem("fontSize", s); main.style.fontSize = s+"px";
}
function decreaseFont(){
  const main = document.querySelector("main"); if(!main) return;
  const s = Math.max(10, parseInt(localStorage.getItem("fontSize")||defaults.fontSize)-2);
  localStorage.setItem("fontSize", s); main.style.fontSize = s+"px";
}
function changeBackground(){
  const palette = ["#f4f4f4","#fff3b0","#d4f8e8","#f0d9ff","#ffe5b4"];
  const cur = localStorage.getItem("bgColor")||defaults.bg;
  const next = palette[(palette.indexOf(cur)+1)%palette.length];
  document.body.style.backgroundColor = next; localStorage.setItem("bgColor", next);
}
document.addEventListener("DOMContentLoaded", applyUserSettings);

/************ Contact JSON ************/
function saveContactToJSON(obj){
  const key = "contactSubmissions";
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  arr.push(obj);
  localStorage.setItem(key, JSON.stringify(arr));
}
function downloadContactJSON(){
  const data = localStorage.getItem("contactSubmissions") || "[]";
  const blob = new Blob([data], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "contact-submissions.json";
  a.click(); URL.revokeObjectURL(a.href);
}

/************ XML (cities) via jQuery ************/
function loadCitiesIntoDatalist(datalistId){
  if (typeof $ === "undefined") return; // jQuery not loaded
  $.ajax({
    url: "cities.xml", dataType: "xml",
    success: (xml)=>{
      const $dl = $("#"+datalistId).empty();
      $(xml).find("city").each(function(){
        const name = $(this).text().trim();
        $dl.append($("<option>").attr("value", name));
      });
    }
  });
}

/************ Flights Inventory JSON ************/
const FLIGHTS_KEY = "flightsInventory";

async function ensureFlightsLoaded(){
  const have = localStorage.getItem(FLIGHTS_KEY);
  if (have) return JSON.parse(have);
  try {
    const res = await fetch("flights.json", {cache:"no-store"});
    if (!res.ok) throw new Error("no file");
    const json = await res.json();
    localStorage.setItem(FLIGHTS_KEY, JSON.stringify(json));
    return json;
  } catch {
    const gen = generateFlights();
    localStorage.setItem(FLIGHTS_KEY, JSON.stringify(gen));
    return gen;
  }
}
function updateFlightsInventory(newList){
  localStorage.setItem(FLIGHTS_KEY, JSON.stringify(newList));
}
function dateOnlyStr(d){ return d.toISOString().slice(0,10); }
function inWindow(d){ const t=d.getTime(); return t>=Date.parse("2024-09-01") && t<=Date.parse("2024-12-01"); }

function generateFlights(){
  // Make ~60 flights TX <-> CA across the window with plausible times/price/seats
  const TX = ["Dallas","Austin","Houston","San Antonio"];
  const CA = ["Los Angeles","San Diego","San Francisco","San Jose"];
  const all = [];
  const dayMs = 86400000;
  let id = 1000;

  for (let day = Date.parse("2024-09-01"); day <= Date.parse("2024-12-01"); day += 5*dayMs){
    TX.forEach(o=>{
      CA.forEach(d=>{
        const dep = new Date(day + (Math.floor(Math.random()*10))*3600000);
        const arr = new Date(dep.getTime() + (2 + Math.floor(Math.random()*3))*3600000);
        const price = 120 + Math.floor(Math.random()*180);
        const seats = 5 + Math.floor(Math.random()*25);
        all.push({
          flightId: "F"+(id++),
          origin: o, destination: d,
          departureDate: dateOnlyStr(dep), arrivalDate: dateOnlyStr(arr),
          departureTime: dep.toTimeString().slice(0,5),
          arrivalTime: arr.toTimeString().slice(0,5),
          availableSeats: seats, price
        });
        // Return legs
        const dep2 = new Date(dep.getTime() + 2*dayMs);
        const arr2 = new Date(dep2.getTime() + (2 + Math.floor(Math.random()*3))*3600000);
        const price2 = 120 + Math.floor(Math.random()*180);
        const seats2 = 5 + Math.floor(Math.random()*25);
        all.push({
          flightId: "F"+(id++),
          origin: d, destination: o,
          departureDate: dateOnlyStr(dep2), arrivalDate: dateOnlyStr(arr2),
          departureTime: dep2.toTimeString().slice(0,5),
          arrivalTime: arr2.toTimeString().slice(0,5),
          availableSeats: seats2, price: price2
        });
      });
    });
  }
  // Ensure at least 50
  return all.slice(0, Math.max(50, all.length));
}

function searchFlights({origin, destination, dateStr, seatsNeeded}){
  const list = JSON.parse(localStorage.getItem(FLIGHTS_KEY)||"[]");
  const date = new Date(dateStr); const dayMs = 86400000;

  const matchesOn = (d) => list.filter(f =>
    f.origin===origin && f.destination===destination &&
    f.departureDate===dateOnlyStr(d) && f.availableSeats>=seatsNeeded
  );

  let results = matchesOn(date);
  if (results.length) return {results, usedDate: dateOnlyStr(date)};

  for (let delta=1; delta<=3; delta++){
    const before = new Date(date.getTime()-delta*dayMs);
    const after  = new Date(date.getTime()+delta*dayMs);
    const rB = matchesOn(before); if (rB.length) return {results:rB, usedDate: dateOnlyStr(before)};
    const rA = matchesOn(after);  if (rA.length) return {results:rA, usedDate: dateOnlyStr(after)};
  }
  return {results:[], usedDate: dateOnlyStr(date)};
}

/************ Cart & Booking ************/
const CART_KEY = "cart";
const BOOKINGS_KEY = "bookings";

function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || "{}"); }
function setCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
function clearCart(){ localStorage.removeItem(CART_KEY); }
function addToCart(item){ const c=getCart(); Object.assign(c,item); setCart(c); }

function ticketTotal(base, a, c, i){
  return base*a + 0.7*base*c + 0.1*base*i;
}
function uniqueId(prefix="BK"){ return prefix + "-" + Math.random().toString(36).slice(2,10).toUpperCase(); }

function saveBooking(record){
  const arr = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
  arr.push(record);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(arr));
}
function downloadBookingsJSON(){
  const data = localStorage.getItem(BOOKINGS_KEY)||"[]";
  const blob = new Blob([data], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bookings.json"; a.click(); URL.revokeObjectURL(a.href);
}
