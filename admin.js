// ==========================
// 🔥 ADMIN PANEL JS
// ==========================

// 🚨 Make sure firebase is already initialized in app.js

// ==========================
// 🔐 ADMIN PROTECTION
// ==========================
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (user.email !== "admin@gmail.com") {
    alert("Access denied");
    window.location.href = "dashboard.html";
    return;
  }

  loadUsers();
  loadEvents();
});


// ==========================
// 👤 LOAD USERS
// ==========================
function loadUsers() {
  const container = document.getElementById("usersList");

  db.collection("users").get()
    .then(snapshot => {

      let html = "";

      snapshot.forEach(doc => {
        const u = doc.data();

        html += `
          <div class="item">
            <b>${u.name || "No Name"}</b><br>
            ${u.email || ""}<br><br>

            <button class="delete-btn" onclick="deleteUser('${doc.id}')">
              Delete User
            </button>
          </div>
        `;
      });

      container.innerHTML = html || "<p>No users found</p>";
    });
}


// ==========================
// ❌ DELETE USER (Firestore only)
// ==========================
function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  db.collection("users").doc(userId).delete()
    .then(() => {
      alert("User deleted from database");
      loadUsers();
    })
    .catch(err => {
      console.error(err);
      alert("Error deleting user");
    });
}


// ==========================
// 🎟️ LOAD EVENTS
// ==========================
function loadEvents() {
  const container = document.getElementById("eventsList");

  db.collection("events").get()
    .then(snapshot => {

      let html = "";

      snapshot.forEach(doc => {
        const e = doc.data();

        const title = e.title || e.Title;
        const location = e.location || e.Location;
        const date = e.date || e.Date;

        html += `
          <div class="item">
            <b>${title}</b><br>
            📍 ${location}<br>
            📅 ${date}<br><br>

            <button class="delete-btn" onclick="deleteEvent('${doc.id}')">
      Delete Event
    </button>
          </div>
        `;
      });

      container.innerHTML = html || "<p>No events found</p>";
    });
}


// ==========================
// ❌ DELETE EVENT
// ==========================
function deleteEvent(eventId) {
  if (!confirm("Delete this event?")) return;

  db.collection("events").doc(eventId).delete()
    .then(() => {
      alert("Event deleted");
      loadEvents();
    })
    .catch(err => {
      console.error(err);
      alert("Error deleting event");
    });
}


// ==========================
// ➕ ADD EVENT
// ==========================
function addEvent() {
  const title = document.getElementById("title").value;
  const location = document.getElementById("location").value;
  const date = document.getElementById("date").value;
  const description = document.getElementById("description").value;
  const genre = document.getElementById("genre").value;
  const image = document.getElementById("image").value;

  if (!title || !location || !date) {
    alert("Fill required fields");
    return;
  }

  db.collection("events").add({
    Title: title,
    Location: location,
    Date: date,
    Description: description,
    Genre: genre,
    Image: image
  })
  .then(() => {
    alert("Event added!");

    document.getElementById("addEventForm").reset?.();
    toggleAddEvent();
    loadEvents();
  })
  .catch(err => {
    console.error(err);
    alert("Error adding event");
  });
}

function toggleAddEvent() {
  const form = document.getElementById("addEventForm");

  form.style.display =
    form.style.display === "block" ? "none" : "block";
}