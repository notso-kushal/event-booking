// 🔴 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCXAT8_6QJFdjsIGP70FA3oIArAVYErQNI",
  authDomain: "ukeventbooking.firebaseapp.com",
  projectId: "ukeventbooking",
  storageBucket: "ukeventbooking.firebasestorage.app",
  messagingSenderId: "207448958646",
  appId: "1:207448958646:web:b35511189b5d37bfed6817",
  measurementId: "G-H2VL93B8K2"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();





function loadDashboard() {
  loadEvents();
  loadUpcomingEvents();

function loadAdmin() {
  loadUsers();
  loadAdminEvents();
}


firebase.auth().onAuthStateChanged(async (user) => {

  const dropdown = document.getElementById("profileDropdown");
  const navName = document.getElementById("navUserName");
  const navInitials = document.getElementById("navInitials");

  if (user) {

    const uid = user.uid;


    const doc = await firebase.firestore().collection("users").doc(uid).get();

    const data = doc.exists ? doc.data() : {};

    const name = data.name || "User";
    const email = data.email || user.email;

    const initials = name.charAt(0).toUpperCase();

    navName.textContent = name;
    navInitials.textContent = initials;


    dropdown.innerHTML = `
      <div class="dropdown-user-info">
        <div class="dropdown-avatar">${initials}</div>
        <div class="user-meta">
          <strong>${name}</strong>
          <span>${email}</span>
        </div>
      </div>

      <div class="dropdown-divider"></div>

      <div class="dropdown-links">
        <button onclick="goToBookings()">
          <span class="icon">📅</span>
          <div class="link-text">
            <strong>My Bookings</strong>
            <p>View and manage your tickets</p>
          </div>
        </button>

        <button onclick="goDashboard(); return false;">
          <span class="icon">🔍</span>
          <div class="link-text">
            <strong>Discover Events</strong>
            <p>Find new things to do</p>
          </div>
        </button>
      </div>

      <div class="dropdown-divider"></div>

      <button class="logout-row" onclick="logout()">
        Logout
      </button>
    `;

  } else {

    navName.textContent = "Guest";
    navInitials.textContent = "G";

    dropdown.innerHTML = `
      <div class="dropdown-links">
        <button onclick="window.location.href='login.html'">
          <span class="icon">🔐</span>
          <div class="link-text">
            <strong>Login</strong>
            <p>Access your account</p>
          </div>
        </button>
      </div>
    `;
  }
});
 setTimeout(() => {
      document.getElementById("loadingScreen").style.display = "none";
    }, 600); 
}


async function loadBookings() {

  const user = auth.currentUser;

  const container = document.getElementById("bookingsList");
  if (!container || !user) return;

  container.innerHTML = "<p>Updating your ticket status...</p>";

  try {
    const snapshot = await db.collection("bookings")
      .where("userId", "==", user.uid)
      .get();

    if (snapshot.empty) {
      container.innerHTML = "<p>No bookings found.</p>";
      return;
    }

    let activeHtml = "";
    let cancelledHtml = "";

    for (const doc of snapshot.docs) {

      const b = doc.data();
      const bookingId = doc.id;

      const eventDoc = await db.collection("events").doc(b.eventId).get();

      let status = b.status || "active";
      let e = eventDoc.exists ? eventDoc.data() : null;

      const displayTitle = e ? (e.Title || e.title) : "REMOVED EVENT";
      const displayLoc = e ? (e.Location || e.location) : "N/A";
      const displayDate = e ? (e.Date || e.date) : "N/A";

      const cardTemplate = `
        <div class="booking-card ${status}">
          <div class="booking-info">

            <div class="booking-header">
              <h3>${displayTitle}</h3>
            </div>

            <div class="booking-meta">
              <span>📍 ${displayLoc}</span>
              <span>📅 ${displayDate}</span>
            </div>

            <div class="booking-divider"></div>

            <div class="booking-actions">
              <span class="booking-status ${status}">
                ${status.toUpperCase()}
              </span>

              ${status === 'active' ? `
                <button onclick="cancelBooking('${bookingId}')">
                  Cancel
                </button>
              ` : ''}
            </div>

          </div>
        </div>
      `;

      if (status === "active") activeHtml += cardTemplate;
      else cancelledHtml += cardTemplate;
    }

    container.innerHTML = `
      <h2 style="font-size: 1.2rem; margin: 20px 0;">Active Tickets</h2>
      ${activeHtml || "<p style='color:#94a3b8;'>No active bookings.</p>"}

      <h2 style="font-size: 1.2rem; margin: 30px 0 10px; color: #64748b;">
        History / Cancelled
      </h2>
      ${cancelledHtml || "<p style='color:#94a3b8;'>No past history.</p>"}
    `;

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading bookings</p>";
  }
}

function applyGuestUI() {
  document.getElementById("navInitials").innerText = "G";
  document.getElementById("navUserName").innerText = "Guest";

  const dropdown = document.getElementById("profileDropdown");

  dropdown.innerHTML = `
    <div class="dropdown-user-info">
      <div class="dropdown-avatar">G</div>
      <div class="user-meta">
        <strong>Guest</strong>
        <span>Not signed in</span>
      </div>
    </div>

    <div class="dropdown-divider"></div>

    <div class="dropdown-links">

      <button onclick="goLogin()">
        <span class="icon">🔑</span> 
        <div class="link-text">
          <strong>Login</strong>
          <p>Access your account</p>
        </div>
      </button>

      <button onclick="goRegister()">
        <span class="icon">📝</span> 
        <div class="link-text">
          <strong>Register</strong>
          <p>Create a new account</p>
        </div>
      </button>

    </div>
  `;
}


function loadEvents() {
  const container = document.getElementById("eventsList");
  const filter = document.getElementById("eventFilter")?.value || "all";

  container.innerHTML = "<p>Loading events...</p>";

  db.collection("events").get()
    .then(snapshot => {

      if (snapshot.empty) {
        container.innerHTML = "<p>No events found</p>";
        return;
      }

      const fallbackImage =
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678";

      let html = "";

      snapshot.forEach(doc => {
        const e = doc.data();

        const genreRaw = (e.genre || e.Genre || "other");
const genre = genreRaw.charAt(0).toUpperCase() + genreRaw.slice(1).toLowerCase();

       
        if (filter !== "all" && genre !== filter) return;

        const title = e.title || e.Title || "Untitled";
        const location = e.location || e.Location || "Unknown";
        const date = e.date || e.Date || "TBD";
        const image = e.image || e.Image || fallbackImage;

        html += `
          <div class="card">
            <img src="${image}" style="width:100%; height:150px; object-fit:cover;">
            
            <h3>${title}</h3>
            <p>🏷️ ${genre}</p>
            <p>📍 ${location}</p>
            <p>📅 ${date}</p>

            <button onclick="openEvent('${doc.id}', 'events')">
              View Details
            </button>
          </div>
        `;
      });

      container.innerHTML = html || "<p>No events match filter</p>";
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<p>Error loading events</p>`;
    });
}


function addEvent() {
  const title = document.getElementById("title").value;
  const location = document.getElementById("location").value;
  const date = document.getElementById("date").value;
  const description = document.getElementById("description").value;
  const msg = document.getElementById("msg");

  if (!title || !location || !date) {
    msg.innerText = "Fill required fields";
    return;
  }

  db.collection("events").add({
    title,
    location,
    date,
    description
  })
  .then(() => {
    msg.innerText = "Event added!";
  })
  .catch(err => {
    msg.innerText = err.message;
  });
}



function openEvent(eventId, source = "events") {
  localStorage.setItem("selectedEvent", eventId);
  localStorage.setItem("eventSource", source); // 👈 NEW
  window.location.href = "event.html";
}


function loadEventDetails() {
  const eventId = localStorage.getItem("selectedEvent");
  const source = localStorage.getItem("eventSource") || "events";
  const container = document.getElementById("eventBox");

  if (!eventId) {
    window.location.href = "dashboard.html";
    return;
  }

  db.collection(source).doc(eventId).get()
    .then(doc => {
      if (!doc.exists) {
        container.innerHTML = "<h2>Event not found</h2>";
        return;
      }

      const e = doc.data();
      const fallbackImage = "https://images.unsplash.com/photo-1505373877841-8d25f7d46678";

      // check if upcoming event
      const isUpcoming = source === "upcomevents";

      let bookingSection = "";

      if (!isUpcoming) {
        bookingSection = `
          <div class="booking-section">
            <h3>Select Your Seat</h3>
            <select id="seatType" class="booking-input">
              <option value="General Admission">General Admission</option>
              <option value="VIP Section">VIP Section (+£20)</option>
              <option value="Front Row">Front Row (+£10)</option>
            </select>
            
            <button class="confirm-btn" onclick="bookEvent('${eventId}')">
              Confirm Booking
            </button>
          </div>
        `;
      } else {
        bookingSection = `
          <p style="margin-top:20px; color:#64748b; font-weight:500;">
            🔔 This is an upcoming event. Booking will open soon.
          </p>
        `;
      }

      container.innerHTML = `
        <div class="event-detail-view">
          <img src="${e.Image || e.image || fallbackImage}" class="event-hero-img">
          
          <div class="event-info-header">
            <span class="genre-tag">${e.Genre || e.genre || "General"}</span>
            <h1>${e.Title || e.title}</h1>
            <p class="event-meta">📍 ${e.Location || e.location} | 📅 ${e.Date || e.date}</p>
          </div>

          <div class="event-description">
            <h3>About this event</h3>
            <p>${e.Description || e.description || "No description available."}</p>
          </div>

          ${bookingSection}
        </div>
      `;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Error loading event</p>";
    });
}


function loadUpcomingEvents() {
  const container = document.getElementById("upcomingEventsList");

  if (!container) return;

  container.innerHTML = "<p>Loading upcoming events...</p>";

  const today = new Date().toISOString().split("T")[0];

  db.collection("upcomevents").get()
    .then(snapshot => {

      if (snapshot.empty) {
        container.innerHTML = "<p>No upcoming events</p>";
        return;
      }

      let html = "";
      const fallbackImage =
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678";

      snapshot.forEach(doc => {
        const e = doc.data();

        const genreRaw = (e.genre || e.Genre || "other");
        const genre =
          genreRaw.charAt(0).toUpperCase() +
          genreRaw.slice(1).toLowerCase();

        const date = e.date || e.Date;

        // ✅ only future events
        if (!date || date < today) return;

        const title = e.title || e.Title || "Untitled";
        const location = e.location || e.Location || "Unknown";
        const image = e.image || e.Image || fallbackImage;

        html += `
          <div class="card">
            <img src="${image}" style="width:100%; height:150px; object-fit:cover;">
            
            <h3>${title}</h3>
            <p>🏷️ ${genre}</p>
            <p>📍 ${location}</p>
            <p>📅 ${date}</p>

           <button onclick="openEvent('${doc.id}', 'upcomevents')">
  View Details
</button>
          </div>
        `;
      });

      container.innerHTML = html || "<p>No upcoming events</p>";
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Error loading upcoming events</p>";
    });
}


function bookEvent(eventId, eventType = "normal") {

  const user = firebase.auth().currentUser;

  if (!user) {
    alert("Please log in to book this event.");
    window.location.href = "login.html";
    return;
  }

  const seatType = document.getElementById("seatType")?.value || "General Admission";

  db.collection("bookings").add({
    userId: user.uid,
    eventId: eventId,
    seatType: seatType,


    type: eventType,

    status: "active",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert("🎉 Booking Successful!");
    window.location.href = "dashboard.html";
  })
  .catch(err => {
    console.error("Booking error:", err);
    alert("Booking failed");
  });
}




function toggleProfile() {
  const box = document.getElementById("profileDropdown");
  box.style.display = box.style.display === "block" ? "none" : "block";
}

function goToBookings() {
  document.getElementById("profileDropdown").style.display = "none";


  const hero = document.querySelector(".home-hero");
  const events = document.getElementById("events-section-target");
  const upcoming = document.getElementById("upcoming-section");

  if (hero) hero.style.display = "none";
  if (events) events.style.display = "none";
  if (upcoming) upcoming.style.display = "none";


  const bookingsPage = document.getElementById("bookingsPage");
  bookingsPage.style.display = "block";

  bookingsPage.innerHTML = `
    <div class="dashboard-header" style="margin:20px;">
      <h1>My Bookings</h1>
      <h3>Only your confirmed bookings</h3>
    </div>

    <div id="bookingsList"></div>
  `;

  loadBookings();
}


function loadHome() {
  db.collection("events").limit(3).get()
    .then(snapshot => {
      let html = "";

      snapshot.forEach(doc => {
        const e = doc.data();

        html += `
          <div class="card">
            <h3>${e.title}</h3>
            <p>${e.location}</p>
            <p>${e.date}</p>
          </div>
        `;
      });

      document.getElementById("eventsPreview").innerHTML = html;
    });
}




function goLogin() {
  window.location.href = "login.html";
}

function goRegister() {
  window.location.href = "register.html";
}


function cancelBooking(bookingId) {
  const confirmDelete = confirm("Cancel this booking?");

  if (!confirmDelete) return;

  db.collection("bookings").doc(bookingId).update({
    status: "cancelled" // 🔥 instead of delete
  })
  .then(() => {
    alert("Booking cancelled!");
    loadBookings();
  });
}

function goDashboard() {

  const hero = document.querySelector(".home-hero");
  const events = document.getElementById("events-section-target");
  const upcoming = document.getElementById("upcoming-section");

  if (hero) hero.style.display = "block";
  if (events) events.style.display = "block";
  if (upcoming) upcoming.style.display = "block";

  const bookingsPage = document.getElementById("bookingsPage");
  if (bookingsPage) bookingsPage.style.display = "none";

  loadEvents();
  loadUpcomingEvents();
}

function loadCarousel() {
  db.collection("events").limit(5).get()
    .then(snapshot => {
      const container = document.getElementById("carousel");

      let slides = "";
      let index = 0;

      snapshot.forEach(doc => {
        const e = doc.data();

        slides += `
          <div class="carousel-slide ${index === 0 ? "active" : ""}">
            
            <img src="${e.image || 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678'}">

            <div class="carousel-text">
              <h2>${e.title}</h2>
              <p>${e.location} • ${e.date}</p>
              <button onclick="openEvent('${doc.id}')">
                View Event
              </button>
            </div>

          </div>
        `;

        index++;
      });

      container.innerHTML = slides;

      startCarousel();
    });
}

function startCarousel() {
  let slides = document.querySelectorAll(".carousel-slide");
  let current = 0;

  setInterval(() => {
    slides[current].classList.remove("active");

    current = (current + 1) % slides.length;

    slides[current].classList.add("active");
  }, 3000);
}


function logout() {
  auth.signOut().then(() => {
    localStorage.clear();
    window.location.replace("dashboard.html"); // stay on same page as guest
  });
}


function cancelBooking(id) {
  if (confirm("Cancel this booking?")) {
    db.collection("bookings").doc(id).update({ status: "cancelled" })
      .then(() => {
        alert("Cancelled!");
        loadBookings(); 
      });
  }
}

