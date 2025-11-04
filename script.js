// -------------- Date and Time --------------
function showDateTime() {
  const now = new Date();
  document.getElementById("datetime").innerText = now.toLocaleString();
  setTimeout(showDateTime, 1000);
}

// -------------- Persistent Font & Background Settings --------------
const defaultSettings = {
  fontSize: 16,
  backgroundColor: "#f4f4f4",
};

// Apply settings when any page loads
function applyUserSettings() {
  const savedFont = localStorage.getItem("fontSize");
  const savedBg = localStorage.getItem("backgroundColor");

  const fontSize = savedFont ? parseInt(savedFont) : defaultSettings.fontSize;
  const bgColor = savedBg ? savedBg : defaultSettings.backgroundColor;

  document.querySelector("main").style.fontSize = fontSize + "px";
  document.body.style.backgroundColor = bgColor;

  // Update localStorage to ensure values always exist
  localStorage.setItem("fontSize", fontSize);
  localStorage.setItem("backgroundColor", bgColor);
}

// Call this right after page loads
document.addEventListener("DOMContentLoaded", applyUserSettings);

// -------------- Font Size Controls --------------
function increaseFont() {
  let currentFont = parseInt(localStorage.getItem("fontSize") || defaultSettings.fontSize);
  currentFont += 2;
  localStorage.setItem("fontSize", currentFont);
  document.querySelector("main").style.fontSize = currentFont + "px";
}

function decreaseFont() {
  let currentFont = parseInt(localStorage.getItem("fontSize") || defaultSettings.fontSize);
  currentFont = Math.max(10, currentFont - 2);
  localStorage.setItem("fontSize", currentFont);
  document.querySelector("main").style.fontSize = currentFont + "px";
}

// -------------- Background Color Controls --------------
function changeBackground() {
  const colors = ["#f4f4f4", "#ffe5b4", "#d4f8e8", "#f0d9ff", "#fff3b0"];
  const currentBg = localStorage.getItem("backgroundColor") || defaultSettings.backgroundColor;

  // Find current color index
  const currentIndex = colors.indexOf(currentBg);
  const nextColor = colors[(currentIndex + 1) % colors.length];

  // Apply and save
  document.body.style.backgroundColor = nextColor;
  localStorage.setItem("backgroundColor", nextColor);
}
