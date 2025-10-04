// Ad-astrra.js

// FIX: Ensure all DOM manipulation and Leaflet initialization runs AFTER the page loads.
document.addEventListener("DOMContentLoaded", function() {

    // Check if Leaflet is available globally before proceeding
    const L = window.L;
    if (!L) {
        console.error("Leaflet (L) is not defined. Ensure 'leaflet.js' is loaded before this script.");
        return;
    }

    // --- Map Initialization ---
    const map = L.map("map").setView([20, 0], 2)
    L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 20,
        attribution: "USGS",
    }).addTo(map)

    // --- DOM Elements ---
    const asteroidSelect = document.getElementById("asteroidSelect")
    const astName = document.getElementById("astName")
    const locEl = document.getElementById("loc")
    const diamEl = document.getElementById("diameter")
    const velEl = document.getElementById("velocity")
    const eEl = document.getElementById("energy")
    const cEl = document.getElementById("crater")
    const sEl = document.getElementById("shock")
    const seiEl = document.getElementById("seismic")
    const gEl = document.getElementById("global")

    let asteroidData = []
    // NOTE: This API key is public but might need to be replaced if it stops working.
    const apiKey = "g9lgd6tg8kCLb0klT33zqyY0JxfDQKXIDGLkakvi" 

    const disclaimerBanner = document.getElementById("disclaimerBanner")
    const disclaimerClose = document.getElementById("disclaimerClose")

    // Removed non-existent elements disclaimerModal and disclaimerBtn.
    disclaimerClose.addEventListener("click", () => {
        disclaimerBanner.classList.add("hidden")
    })

    // --- API Fetch: Load Asteroid Data ---
    fetch(`https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${apiKey}`)
        .then((res) => res.json())
        .then((data) => {
            asteroidData = data.near_earth_objects
            asteroidSelect.innerHTML = asteroidData.map((a) => `<option value="${a.id}">${a.name}</option>`).join("")
        })
        .catch((err) => {
            asteroidSelect.innerHTML = "<option>Error loading data</option>"
            console.error("Error fetching asteroid data:", err)
        })

    // --- Effects and Calculation Functions ---
    function playExplosion(latlng) {
        const sound = document.getElementById("sound-explosion")
        const rumble = document.getElementById("sound-rumble")

        sound.currentTime = 0
        sound.play().catch(() => {})

        rumble.currentTime = 0
        rumble.play().catch(() => {})
        setTimeout(() => rumble.pause(), 4000)

        document.body.classList.add("shake")
        setTimeout(() => document.body.classList.remove("shake"), 500)

        const flash = document.createElement("div")
        flash.className = "flash-overlay"
        document.body.appendChild(flash)
        setTimeout(() => flash.remove(), 600)
    }

    function calcImpact(diameter, velocity) {
        // Calculation logic is correct
        const mass = (4 / 3) * Math.PI * Math.pow(diameter / 2, 3) * 3000
        const joules = 0.5 * mass * (velocity * 1000) ** 2
        const mt = joules / 4.184e15
        return {
            energy: mt.toFixed(2),
            crater: (1.8 * Math.pow(mt, 0.25) * 1000).toFixed(0),
            shock: (0.35 * Math.pow(joules / 4.184e12, 1 / 3) * 1000).toFixed(0),
            seismic: (50 * Math.pow(mt, 0.17)).toFixed(0),
            global: mt > 1000 ? (mt / 100).toFixed(0) : 0,
        }
    }

    let impactMarker, craterCircle, shockCircle

    function simulate(lat, lng) {
        const selectedId = asteroidSelect.value
        const asteroid = asteroidData.find((a) => a.id === selectedId)
        if (!asteroid || asteroidData.length === 0) return alert("Asteroid data not loaded or selected.")

        // Ensure d and v are calculated
        const d = asteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(0)
        const v = (Math.random() * 30 + 10).toFixed(1)

        const res = calcImpact(d, v)
        // Update UI
        astName.textContent = asteroid.name
        locEl.textContent = lat.toFixed(2) + ", " + lng.toFixed(2)
        diamEl.textContent = d
        velEl.textContent = v
        eEl.textContent = res.energy
        cEl.textContent = res.crater
        sEl.textContent = res.shock
        seiEl.textContent = res.seismic
        gEl.textContent = res.global

        if (impactMarker) map.removeLayer(impactMarker)
        ;[craterCircle, shockCircle].forEach((c) => c && map.removeLayer(c))

        // Add markers/circles
        impactMarker = L.marker([lat, lng]).addTo(map)
        craterCircle = L.circle([lat, lng], { radius: res.crater / 2, color: "red", fillOpacity: 0.3 }).addTo(map)
        shockCircle = L.circle([lat, lng], { radius: res.shock, color: "yellow", fillOpacity: 0.25 }).addTo(map)

        playExplosion({ lat, lng })
    }

    // --- Event Listeners ---
    map.on("click", (e) => simulate(e.latlng.lat, e.latlng.lng))

    document.getElementById("resetBtn").onclick = () => {
        if (impactMarker) map.removeLayer(impactMarker)
        ;[craterCircle, shockCircle].forEach((c) => c && map.removeLayer(c))
        ;[astName, locEl, diamEl, velEl, eEl, cEl, sEl, seiEl, gEl].forEach((el) => (el.textContent = "--"))
    }

    document.getElementById("randomBtn").onclick = () => {
        const lat = Math.random() * 180 - 90
        const lng = Math.random() * 360 - 180
        simulate(lat, lng)
        map.setView([lat, lng], 4)
    }

    document.getElementById("watchVideo").onclick = () =>
        window.open("https://drive.google.com/file/d/1eTm44hMplAr4KaCCWPze_6cdE9CGlR4t/view?usp=sharing", "_blank")
    document.getElementById("launcher").onclick = () => (window.location.href = "./launcher/Ad-Astra.html")

    const searchInput = document.getElementById("searchAsteroid")
    searchInput.addEventListener("input", function () {
        const searchValue = this.value.toLowerCase().trim()
        const foundAsteroid = asteroidData.find((a) => a.name.toLowerCase().includes(searchValue))
        astName.textContent = foundAsteroid ? foundAsteroid.name : searchValue.length > 0 ? "Couldn't find asteroid" : "--"
        if (foundAsteroid) asteroidSelect.value = foundAsteroid.id
    })

    const overlay = document.getElementById("asteroidOverlay")
    const showBtn = document.getElementById("showAsteroidViewer")
    const closeBtn = document.getElementById("closeOverlay")

    showBtn.addEventListener("click", () => {
        overlay.style.display = "flex"
    })
    closeBtn.addEventListener("click", () => {
        overlay.style.display = "none"
    })

    const chatbotToggle = document.getElementById("chatbotToggle")
    const chatbotWidget = document.getElementById("chatbotWidget")
    const chatbotClose = document.getElementById("chatbotClose")
    const faqQuestions = document.querySelectorAll(".faq-question")

    chatbotToggle.addEventListener("click", () => {
        chatbotWidget.classList.toggle("active")
    })

    chatbotClose.addEventListener("click", () => {
        chatbotWidget.classList.remove("active")
    })

    faqQuestions.forEach((question) => {
        question.addEventListener("click", () => {
            const answer = question.nextElementSibling
            const isActive = answer.classList.contains("active")

            document.querySelectorAll(".faq-answer").forEach((a) => a.classList.remove("active"))

            if (!isActive) {
                answer.classList.add("active")
            }
        })
    })

}); // End of DOMContentLoaded