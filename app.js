/**
 * CampusConnect - Core Application Logic
 * Integrates: HTML5, Modern CSS Themes, Vanilla JS, AngularJS compatibility, PHP REST API, & MySQL DB
 */

// Dual-Mode API Client
const API = {
  baseUrl: "api",
  isOnline: false,

  async checkStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/status.php`, { cache: "no-store" });
      const data = await res.json();
      this.isOnline = data && data.status === "connected" && data.database_connected;
      this.updateStatusBadges(data);
      return this.isOnline;
    } catch (e) {
      this.isOnline = false;
      this.updateStatusBadges({ status: "disconnected", database_connected: false });
      return false;
    }
  },

  updateStatusBadges(data) {
    const indicators = document.querySelectorAll(".db-live-indicator");
    indicators.forEach(el => {
      if (data && data.database_connected) {
        el.className = "db-live-indicator badge bg-success-subtle text-success border border-success-subtle";
        el.innerHTML = `<i class="bi bi-database-check me-1"></i> MySQL: Connected (${data.database_name || "campusconnect"})`;
      } else {
        el.className = "db-live-indicator badge bg-warning-subtle text-warning-emphasis border border-warning-subtle";
        el.innerHTML = `<i class="bi bi-hdd-network me-1"></i> Mode: Local Store / Demo <a href="db_status.html" class="ms-1 text-decoration-underline text-warning-emphasis fw-bold">DB Guide</a>`;
      }
    });
  }
};

const Auth = {
  async login(email, password, role = "student") {
    // 1. Attempt PHP / MySQL authentication if reachable
    try {
      const res = await fetch("api/auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password, role })
      });
      const data = await res.json();
      if (data.success && data.user) {
        Storage.set("currentUser", data.user);
        return { success: true, user: data.user };
      }
    } catch (e) {
      console.warn("API login failed, checking fallback store...", e);
    }

    // 2. Fallback to LocalStorage store
    if (role === "admin") {
      const admin = Storage.get("admin");
      if (admin && admin.email === email && admin.password === password) {
        const user = { role: "admin", email, name: "CESA Administrator" };
        Storage.set("currentUser", user);
        return { success: true, user };
      }
      return { success: false, message: "Invalid admin credentials" };
    }

    const students = Storage.get("students", []);
    const student = students.find(s => s.email === email && s.password === password);
    if (student) {
      const user = { ...student, role: "student" };
      Storage.set("currentUser", user);
      return { success: true, user };
    }
    return { success: false, message: "Invalid student credentials" };
  },

  async registerStudent(data) {
    try {
      const res = await fetch("api/auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", ...data })
      });
      const resData = await res.json();
      if (resData.success) {
        const students = Storage.get("students", []);
        students.push(resData.student);
        Storage.set("students", students);
        return { success: true, student: resData.student };
      } else {
        return { success: false, message: resData.message || "Registration failed" };
      }
    } catch (e) {
      // Offline fallback
      const students = Storage.get("students", []);
      if (students.some(s => s.email === data.email || s.iuNumber === data.iuNumber)) {
        return { success: false, message: "Email or IU Number already registered" };
      }
      const newStudent = {
        id: "stu" + Date.now(),
        ...data,
        password: data.password || "student123"
      };
      students.push(newStudent);
      Storage.set("students", students);
      return { success: true, student: newStudent };
    }
  },

  logout() {
    Storage.set("currentUser", null);
    window.location.href = "index.html";
  },

  getCurrentUser() {
    return Storage.get("currentUser");
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    const u = this.getCurrentUser();
    return u && u.role === "admin";
  }
};

const Registration = {
  async register(eventId, eventType, formData) {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== "student") {
      return { success: false, message: "Please login as a student to register" };
    }

    const payload = {
      eventId,
      eventType,
      studentId: user.id,
      name: formData.name || user.name,
      studentName: formData.name || user.name,
      iuNumber: formData.iuNumber || user.iuNumber,
      department: formData.department || user.department,
      semester: formData.semester || user.semester,
      email: formData.email || user.email,
      phone: formData.phone || user.phone
    };

    // Try PHP/MySQL API
    try {
      const res = await fetch("api/register_event.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.registration) {
        const regs = Storage.get("registrations", []);
        regs.push(data.registration);
        Storage.set("registrations", regs);
        return { success: true, registration: data.registration };
      } else if (data.message) {
        return { success: false, message: data.message };
      }
    } catch (e) {
      console.warn("Backend registration failed, using local store...", e);
    }

    // LocalStore fallback
    const regs = Storage.get("registrations", []);
    if (regs.some(r => r.eventId === eventId && (r.studentId === user.id || r.iuNumber === user.iuNumber))) {
      return { success: false, message: "You are already registered for this event" };
    }

    const regId = "REG" + Date.now().toString().slice(-8);
    const registration = {
      id: regId,
      eventId,
      eventType,
      studentId: user.id,
      studentName: formData.name || user.name,
      iuNumber: formData.iuNumber || user.iuNumber,
      department: formData.department || user.department,
      semester: formData.semester || user.semester,
      email: formData.email || user.email,
      phone: formData.phone || user.phone,
      registeredAt: new Date().toISOString(),
      status: "confirmed"
    };
    regs.push(registration);
    Storage.set("registrations", regs);
    return { success: true, registration };
  },

  getMyRegistrations(studentId) {
    return Storage.get("registrations", []).filter(r => r.studentId === studentId);
  }
};

const UI = {
  formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  },

  statusBadge(status) {
    const map = { upcoming: "badge-upcoming", ongoing: "badge-ongoing", completed: "badge-completed" };
    return `<span class="badge-status ${map[status] || "badge-upcoming"}"><i class="bi bi-circle-fill" style="font-size:6px;"></i> ${status}</span>`;
  },

  categoryBadge(cat) {
    const map = {
      Competition: "badge-competition", Workshop: "badge-workshop", Seminar: "badge-seminar",
      Activity: "badge-cesa", Technical: "badge-cesa", Cultural: "badge-seminar", Sports: "badge-workshop"
    };
    return `<span class="badge-status ${map[cat] || "badge-upcoming"}">${cat}</span>`;
  },

  organizerBadge(org) {
    if (org === "CESA") return `<span class="badge-status badge-cesa"><i class="bi bi-stars"></i> CESA</span>`;
    return `<span class="badge-status badge-upcoming"><i class="bi bi-building"></i> ${org}</span>`;
  },

  createEventCard(event, type = "cesa") {
    const poster = event.posterText || event.title;
    const posterImg = event.posterImage || event.poster_image;
    
    let posterHtml = "";
    if (posterImg) {
      posterHtml = `
        <div class="poster-wrapper">
          <img src="${posterImg}" alt="${event.title}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'poster-placeholder\\'>${poster}</div>';">
          <div class="poster-overlay-gradient"></div>
          <div class="poster-title-overlay">${event.title}</div>
        </div>`;
    } else {
      posterHtml = `<div class="poster-placeholder">${poster}</div>`;
    }

    const regBtn = event.registrationOpen !== false && event.registration_open !== 0
      ? `<button class="btn btn-sm btn-primary-custom" onclick="openRegisterModal('${event.id}','${type}')">Register Now</button>`
      : `<button class="btn btn-sm btn-secondary" disabled>Registration Closed</button>`;

    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card card-modern">
          ${posterHtml}
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              ${this.categoryBadge(event.category || "Event")}
              ${this.statusBadge(event.status || "upcoming")}
            </div>
            <h5 class="card-title">${event.title}</h5>
            <div class="event-meta">
              <span><i class="bi bi-calendar3"></i> ${this.formatDate(event.date)}</span>
              <span><i class="bi bi-clock"></i> ${event.time || ""}</span>
              <span><i class="bi bi-geo-alt"></i> ${event.venue || ""}</span>
            </div>
            <p class="card-text text-muted small" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              ${event.description || ""}
            </p>
            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
              ${this.organizerBadge(event.organizer || event.organizedBy || "University")}
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" onclick="viewEventDetails('${event.id}','${type}')">Details</button>
                ${regBtn}
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  createSeminarCard(seminar) {
    const poster = seminar.posterText || seminar.title;
    const posterImg = seminar.posterImage || seminar.poster_image;
    
    let posterHtml = "";
    if (posterImg) {
      posterHtml = `
        <div class="poster-wrapper">
          <img src="${posterImg}" alt="${seminar.title}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'poster-placeholder\\'>${poster}</div>';">
          <div class="poster-overlay-gradient"></div>
          <div class="poster-title-overlay">${seminar.title}</div>
        </div>`;
    } else {
      posterHtml = `<div class="poster-placeholder">${poster}</div>`;
    }

    const regBtn = seminar.registrationOpen !== false && seminar.registration_open !== 0
      ? `<button class="btn btn-sm btn-primary-custom" onclick="openRegisterModal('${seminar.id}','seminar')">Register</button>`
      : `<button class="btn btn-sm btn-secondary" disabled>Closed</button>`;

    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card card-modern">
          ${posterHtml}
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              ${this.categoryBadge(seminar.category || "Seminar")}
              ${this.statusBadge(seminar.status || "upcoming")}
            </div>
            <h5 class="card-title">${seminar.title}</h5>
            <p class="mb-1 small"><strong><i class="bi bi-person-badge"></i> Speaker:</strong> ${seminar.speaker || "Expert Speaker"}</p>
            ${seminar.speakerTitle || seminar.speaker_title ? `<p class="small text-muted mb-2">${seminar.speakerTitle || seminar.speaker_title}</p>` : ""}
            <div class="event-meta">
              <span><i class="bi bi-calendar3"></i> ${this.formatDate(seminar.date)}</span>
              <span><i class="bi bi-geo-alt"></i> ${seminar.venue || ""}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
              ${this.organizerBadge(seminar.organizedBy || seminar.organizer || "Indus University")}
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" onclick="viewEventDetails('${seminar.id}','seminar')">Details</button>
                ${regBtn}
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  createCommitteeCard(member) {
    let photoHtml = "";
    if (member.photo) {
      photoHtml = `
        <div class="committee-photo-wrap">
          <img src="${member.photo}" alt="${member.name}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'committee-avatar\\'>${member.name.charAt(0)}</div>';">
        </div>`;
    } else {
      const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
      photoHtml = `<div class="committee-photo-wrap"><div class="committee-avatar">${initials}</div></div>`;
    }

    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="committee-card">
          ${photoHtml}
          <div class="committee-name">${member.name}</div>
          <div class="committee-position">${member.position}</div>
          <div class="committee-meta mb-2">${member.department} &bull; ${member.year}</div>
          <p class="small text-muted mt-2">${member.bio || ""}</p>
          <div class="d-flex justify-content-center gap-2 mt-3">
            ${member.social && member.social.linkedin ? `<a href="${member.social.linkedin}" target="_blank" class="btn btn-sm btn-outline-primary rounded-circle"><i class="bi bi-linkedin"></i></a>` : ""}
            ${member.social && member.social.email ? `<a href="mailto:${member.social.email}" class="btn btn-sm btn-outline-secondary rounded-circle"><i class="bi bi-envelope"></i></a>` : ""}
          </div>
        </div>
      </div>`;
  },

  createAnnouncementItem(a) {
    const rawLabels = Array.isArray(a.labels) ? a.labels : (a.labels ? a.labels.split(",") : ["NOTICE"]);
    const labels = rawLabels.map(l => {
      const clean = l.trim();
      const cls = { NEW: "label-new", IMPORTANT: "label-important", DEADLINE: "label-deadline", EVENT: "label-event", NOTICE: "label-notice" }[clean] || "label-notice";
      return `<span class="badge ${cls} me-1">${clean}</span>`;
    }).join("");

    return `
      <div class="announcement-item ${a.type || "notice"}">
        <div class="flex-grow-1">
          <div class="mb-1">${labels}</div>
          <h6 class="mb-1 fw-bold">${a.title}</h6>
          <p class="mb-1 small text-muted">${a.content || a.body || ""}</p>
          <div class="d-flex align-items-center gap-3 mt-2 text-muted small">
            <span><i class="bi bi-calendar3"></i> ${this.formatDate(a.date)}</span>
            <span><i class="bi bi-person-circle"></i> ${a.author || "CESA Team"}</span>
          </div>
        </div>
      </div>`;
  },

  updateNavAuth() {
    const user = Auth.getCurrentUser();
    const isAdmin = !!(user && user.role === "admin");
    const isStudent = !!(user && user.role === "student");

    // 1. Update Brand & Badge across all pages
    document.querySelectorAll(".navbar-brand").forEach(b => {
      let badge = b.querySelector(".brand-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "brand-badge";
        b.appendChild(badge);
      }
      if (isAdmin) {
        badge.textContent = "ADMIN";
        badge.className = "brand-badge brand-badge-admin bg-primary text-white";
        b.href = "admin.html";
        b.setAttribute("title", "CampusConnect Administrator Panel");
      } else if (isStudent) {
        badge.textContent = "STUDENT";
        badge.className = "brand-badge brand-badge-student bg-info-subtle";
        b.href = "dashboard.html";
        b.setAttribute("title", "CampusConnect Student Portal");
      } else {
        badge.textContent = "INDUS";
        badge.className = "brand-badge";
        b.href = "welcome.html";
        b.setAttribute("title", "CampusConnect Welcome Portal");
      }
    });

    // 2. Uniform Admin Navigation when logged in as Admin
    if (isAdmin) {
      const collapse = document.getElementById("navMain") || document.querySelector(".navbar-collapse");
      if (collapse) {
        const path = window.location.pathname.split("/").pop() || "index.html";
        collapse.innerHTML = `
          <div class="ms-auto d-flex align-items-center gap-1 flex-wrap">
            <a href="index.html" class="nav-link ${path === 'index.html' ? 'active' : ''}"><i class="bi bi-house me-1"></i>Portal</a>
            <a href="cesa.html" class="nav-link ${path === 'cesa.html' ? 'active' : ''}"><i class="bi bi-stars me-1"></i>CESA</a>
            <a href="events.html" class="nav-link ${path === 'events.html' ? 'active' : ''}"><i class="bi bi-calendar-event me-1"></i>Events</a>
            <a href="about.html" class="nav-link ${path === 'about.html' ? 'active' : ''}"><i class="bi bi-info-circle me-1"></i>About</a>
            <a href="db_status.html" class="nav-link ${path === 'db_status.html' ? 'active' : ''}"><i class="bi bi-database me-1"></i>Database</a>
            <a href="admin.html" class="badge bg-primary px-2 py-1 small ms-1 me-1 text-decoration-none text-white ${path === 'admin.html' ? 'border border-light' : ''}"><i class="bi bi-shield-check me-1"></i>CESA Admin</a>
            <a class="nav-link text-danger-emphasis" href="#" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-1"></i>Logout</a>
            <button class="theme-toggle-btn" title="Toggle theme"><i class="bi bi-moon-stars-fill"></i></button>
          </div>
        `;
        if (typeof Theme !== "undefined" && Theme.attachToggle) {
          Theme.attachToggle();
        }
        return;
      }
    }

    // 3. Logic for Student and Guest
    const loginItem = document.getElementById("nav-login");
    const dashboardItem = document.getElementById("nav-dashboard");
    const logoutItem = document.getElementById("nav-logout");
    const aboutEl = document.getElementById("nav-about");
    const dbEl = document.getElementById("nav-database");

    // Hide About and Database for non-admin
    if (aboutEl) aboutEl.style.display = "none";
    if (dbEl) dbEl.style.display = "none";
    document.querySelectorAll(".navbar-nav a[href*='about.html'], .navbar-nav a[href*='db_status.html']").forEach(a => {
      const li = a.closest("li");
      if (li) li.style.display = "none";
      else a.style.display = "none";
    });

    if (user) {
      if (loginItem) loginItem.style.display = "none";
      if (dashboardItem) {
        dashboardItem.style.display = "";
        const link = dashboardItem.querySelector("a") || dashboardItem;
        link.className = "nav-link fw-semibold";
        link.href = "dashboard.html";
        link.innerHTML = '<i class="bi bi-speedometer2 me-1"></i>Dashboard';
        link.setAttribute("title", "Student Dashboard");
      }
      if (logoutItem) {
        logoutItem.style.display = "";
        const logoutLink = logoutItem.querySelector("a") || logoutItem;
        logoutLink.className = "nav-link text-danger-emphasis";
        logoutLink.innerHTML = '<i class="bi bi-box-arrow-right me-1"></i>Logout';
        logoutLink.setAttribute("title", "Logout of session");
      }
    } else {
      if (loginItem) loginItem.style.display = "";
      if (dashboardItem) dashboardItem.style.display = "none";
      if (logoutItem) logoutItem.style.display = "none";
    }
  },

  showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `alert alert-${type === "success" ? "success" : "danger"} position-fixed d-flex align-items-center shadow-lg`;
    toast.style.cssText = "top:85px;right:20px;z-index:9999;min-width:300px;border-radius:12px;";
    toast.innerHTML = `<i class="bi bi-${type === "success" ? "check-circle-fill text-success" : "exclamation-triangle-fill text-danger"} fs-5 me-2"></i><div>${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  // Print isolated document in separate window (Guaranteed zero UI clutter)
  printIsolatedHtml(title, elementHtml, isLandscape = false) {
    const printWin = window.open("", "_blank", "width=1000,height=750");
    if (!printWin) {
      window.print();
      return;
    }

    const currentBase = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="en" data-bs-theme="light" data-theme="light">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <base href="${currentBase}">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <link href="css/style.css" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          @page {
            size: ${isLandscape ? "A4 landscape" : "A4 portrait"};
            margin: ${isLandscape ? "6mm" : "10mm"};
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: ${isLandscape ? "4px" : "14px"};
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 98vh;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-scheme: light !important;
            font-family: 'Inter', sans-serif;
          }
          .certificate-frame {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 920px !important;
            page-break-inside: avoid !important;
          }
          .ticket-pass-card {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 680px !important;
            page-break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        <div style="width:100%; display:flex; justify-content:center;">
          ${elementHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  // Download element as PDF file using html2pdf with isolated staging
  downloadElementAsPDF(elementId, filename, isLandscape = false) {
    const originalEl = document.getElementById(elementId);
    if (!originalEl) return;

    // Clone element to an isolated off-screen node with forced light theme and exact pixel dimensions
    const clone = originalEl.cloneNode(true);
    const targetWidth = isLandscape ? 920 : 680;

    clone.style.width = targetWidth + "px";
    clone.style.maxWidth = targetWidth + "px";
    clone.style.minWidth = targetWidth + "px";
    clone.style.boxShadow = "none";
    clone.style.margin = "0 auto";
    clone.style.backgroundColor = "#ffffff";
    clone.style.colorScheme = "light";

    // Create hidden staging wrapper to ensure no viewport or dark-mode pollution
    const stage = document.createElement("div");
    stage.setAttribute("data-bs-theme", "light");
    stage.setAttribute("data-theme", "light");
    stage.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${targetWidth + 40}px;
      background: #ffffff !important;
      padding: 10px;
      z-index: -9999;
      color-scheme: light !important;
    `;
    stage.appendChild(clone);
    document.body.appendChild(stage);

    if (typeof html2pdf !== "undefined") {
      const opt = {
        margin:       isLandscape ? [6, 6, 6, 6] : [10, 8, 10, 8],
        filename:     filename,
        image:        { type: "jpeg", quality: 0.98 },
        html2canvas:  {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          windowWidth: targetWidth + 60
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: isLandscape ? "landscape" : "portrait"
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      };

      UI.showToast("Generating high-resolution official PDF document...", "success");
      html2pdf().set(opt).from(clone).save().then(() => {
        stage.remove();
        UI.showToast("PDF downloaded successfully!", "success");
      }).catch(err => {
        console.error("PDF generation fallback:", err);
        stage.remove();
        this.printIsolatedHtml(filename.replace(".pdf", ""), originalEl.outerHTML, isLandscape);
      });
    } else {
      stage.remove();
      this.printIsolatedHtml(filename.replace(".pdf", ""), originalEl.outerHTML, isLandscape);
    }
  },

  showCertificateModal(cert) {
    const user = Auth.getCurrentUser() || {};
    const studentName = cert.studentName || user.name || "Aarav Patel";
    const iuNumber = cert.iuNumber || user.iuNumber || "IU22CE045";
    const dept = cert.department || user.department || "Computer Engineering";
    const eventTitle = cert.eventTitle || "CodeSprint 2026 — Flagship Hackathon";
    const issueDate = cert.issueDate ? UI.formatDate(cert.issueDate) : "October 16, 2026";
    const certCode = cert.certificateCode || "IU-CESA-2026-0988";

    const modalHtml = `
      <div class="modal fade" id="certModal" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-award-fill me-2 text-warning"></i>Verified Certificate of Participation</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-3 p-md-4">
              <div class="certificate-preview-wrap">
                <div class="certificate-frame text-center" id="certificate-render-card">
                  <div class="certificate-inner-border">
                    <!-- Ornate Corner Flourishes -->
                    <svg class="cert-corner cert-corner-tl" viewBox="0 0 40 40" fill="none">
                      <path d="M4 36 V12 C4 7.58 7.58 4 12 4 H36 M10 36 V16 C10 12.69 12.69 10 16 10 H36 M4 4 L14 14" stroke="#d97706" stroke-width="2.5" stroke-linecap="round"/>
                      <circle cx="4" cy="4" r="3.5" fill="#d97706"/>
                      <circle cx="36" cy="4" r="2.5" fill="#d97706"/>
                      <circle cx="4" cy="36" r="2.5" fill="#d97706"/>
                    </svg>
                    <svg class="cert-corner cert-corner-tr" viewBox="0 0 40 40" fill="none">
                      <path d="M4 36 V12 C4 7.58 7.58 4 12 4 H36 M10 36 V16 C10 12.69 12.69 10 16 10 H36 M4 4 L14 14" stroke="#d97706" stroke-width="2.5" stroke-linecap="round"/>
                      <circle cx="4" cy="4" r="3.5" fill="#d97706"/>
                      <circle cx="36" cy="4" r="2.5" fill="#d97706"/>
                      <circle cx="4" cy="36" r="2.5" fill="#d97706"/>
                    </svg>
                    <svg class="cert-corner cert-corner-bl" viewBox="0 0 40 40" fill="none">
                      <path d="M4 36 V12 C4 7.58 7.58 4 12 4 H36 M10 36 V16 C10 12.69 12.69 10 16 10 H36 M4 4 L14 14" stroke="#d97706" stroke-width="2.5" stroke-linecap="round"/>
                      <circle cx="4" cy="4" r="3.5" fill="#d97706"/>
                      <circle cx="36" cy="4" r="2.5" fill="#d97706"/>
                      <circle cx="4" cy="36" r="2.5" fill="#d97706"/>
                    </svg>
                    <svg class="cert-corner cert-corner-br" viewBox="0 0 40 40" fill="none">
                      <path d="M4 36 V12 C4 7.58 7.58 4 12 4 H36 M10 36 V16 C10 12.69 12.69 10 16 10 H36 M4 4 L14 14" stroke="#d97706" stroke-width="2.5" stroke-linecap="round"/>
                      <circle cx="4" cy="4" r="3.5" fill="#d97706"/>
                      <circle cx="36" cy="4" r="2.5" fill="#d97706"/>
                      <circle cx="4" cy="36" r="2.5" fill="#d97706"/>
                    </svg>

                    <!-- Watermark University Crest -->
                    <svg class="cert-watermark" viewBox="0 0 200 200" fill="none">
                      <circle cx="100" cy="100" r="90" stroke="#0a4d8c" stroke-width="4"/>
                      <circle cx="100" cy="100" r="82" stroke="#d97706" stroke-width="2"/>
                      <path d="M100 35 L140 55 C140 100 120 135 100 155 C80 135 60 100 60 55 Z" stroke="#0a4d8c" stroke-width="3"/>
                      <path d="M85 85 L100 70 L115 85 L100 100 Z" fill="#d97706"/>
                      <text x="100" y="125" text-anchor="middle" font-size="12" font-weight="900" fill="#0a4d8c" font-family="'Inter', sans-serif">INDUS</text>
                      <text x="100" y="140" text-anchor="middle" font-size="9" font-weight="700" fill="#0a4d8c" font-family="'Inter', sans-serif">CESA 2026</text>
                    </svg>

                    <div class="cert-content-layer">
                      <!-- University Header -->
                      <div class="d-flex align-items-center justify-content-center gap-3 mb-2">
                        <span style="background:#0a4d8c; color:#ffffff; padding:4px 16px; border-radius:50px; font-size:12px; font-weight:800; letter-spacing:1px;">INDUS</span>
                        <div>
                          <div class="cert-header-univ">Indus University</div>
                          <div class="cert-header-sub">Department of Computer Engineering &bull; CESA Web Technology Hub</div>
                        </div>
                        <span style="background:#d97706; color:#ffffff; padding:4px 16px; border-radius:50px; font-size:12px; font-weight:800; letter-spacing:1px;">2026</span>
                      </div>

                      <!-- Certificate Title -->
                      <div class="cert-main-title">Certificate of Participation</div>
                      <div class="cert-title-divider"><div class="cert-title-divider-diamond"></div></div>
                      <div class="cert-presentation-text">This is proudly awarded to</div>

                      <!-- Recipient Name -->
                      <div class="cert-student-name">${studentName}</div>
                      <div class="cert-meta-info">
                        <span>IU Enrollment: <strong>${iuNumber}</strong></span> &bull; 
                        <span>Department: <strong>${dept}</strong></span>
                      </div>

                      <!-- Citation -->
                      <p class="cert-citation">
                        for active participation and demonstrating commendable technical excellence in the flagship event<br>
                        <strong>${eventTitle}</strong><br>
                        organized under the Computer Engineering Students Association (CESA) for <strong>Academic Year 2026</strong>.
                      </p>

                      <!-- Signatures & Official Seal -->
                      <div class="cert-signatures">
                        <div class="cert-sig-block">
                          <div class="cert-sig-script">H. R. Trivedi</div>
                          <div class="cert-sig-line"></div>
                          <div class="cert-sig-name">Prof. H. R. Trivedi</div>
                          <div class="cert-sig-title">Head of Department, CE</div>
                        </div>

                        <div class="cert-seal-wrap">
                          <svg viewBox="0 0 120 120" width="100" height="100">
                            <defs>
                              <radialGradient id="certGoldGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#fef08a"/>
                                <stop offset="50%" stop-color="#f59e0b"/>
                                <stop offset="100%" stop-color="#b45309"/>
                              </radialGradient>
                            </defs>
                            <polygon points="35,82 20,115 45,105 55,115 48,82" fill="#b45309"/>
                            <polygon points="85,82 72,115 65,105 95,115 100,82" fill="#78350f"/>
                            <circle cx="60" cy="52" r="46" fill="#d97706" stroke="#b45309" stroke-width="1.5"/>
                            <circle cx="60" cy="52" r="41" fill="url(#certGoldGrad)" stroke="#78350f" stroke-width="1.5"/>
                            <circle cx="60" cy="52" r="32" fill="#ffffff" stroke="#d97706" stroke-width="1.5" stroke-dasharray="3,2"/>
                            <path d="M60 32 L74 38 C74 49 67 59 60 63 C53 59 46 49 46 38 Z" fill="#0a4d8c"/>
                            <path d="M54 48 L58 52 L66 44" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <text x="60" y="70" text-anchor="middle" font-size="6" font-family="'Inter', sans-serif" font-weight="900" fill="#78350f" letter-spacing="1">CESA VERIFIED</text>
                            <text x="60" y="76" text-anchor="middle" font-size="5" font-family="'Inter', sans-serif" font-weight="800" fill="#0a4d8c" letter-spacing="1">2026 OFFICIAL</text>
                          </svg>
                        </div>

                        <div class="cert-sig-block">
                          <div class="cert-sig-script">Rohan Sharma</div>
                          <div class="cert-sig-line"></div>
                          <div class="cert-sig-name">Rohan Sharma</div>
                          <div class="cert-sig-title">President, CESA 2026</div>
                        </div>
                      </div>

                      <!-- Authenticity Strip -->
                      <div class="cert-footer-strip">
                        <div>Issued on: <strong>${issueDate}</strong></div>
                        <div class="cert-code-strip">Credential ID: ${certCode}</div>
                        <div>Indus University &bull; Rancharda, Ahmedabad, Gujarat</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer bg-light d-flex justify-content-between">
              <span class="text-muted small"><i class="bi bi-shield-check text-success me-1"></i>Official 2026 Cryptographically Verified Certificate</span>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-outline-primary" onclick="UI.printIsolatedHtml('Certificate_${studentName.replace(/\\s+/g, '_')}', document.getElementById('certificate-render-card').outerHTML, true)">
                  <i class="bi bi-printer me-1"></i> Print Certificate
                </button>
                <button type="button" class="btn btn-primary" onclick="UI.downloadElementAsPDF('certificate-render-card', 'Certificate_${studentName.replace(/\\s+/g, '_')}_${certCode}.pdf', true)">
                  <i class="bi bi-file-earmark-pdf-fill me-1"></i> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("certModal")?.remove();
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    new bootstrap.Modal(document.getElementById("certModal")).show();
  },

  showTicketReceipt(reg) {
    const user = Auth.getCurrentUser() || {};
    
    // Look up real event details from storage if registered
    let ev = null;
    if (reg.eventId) {
      const allEvents = [...Storage.get("cesaEvents", []), ...Storage.get("seminars", []), ...Storage.get("generalEvents", [])];
      ev = allEvents.find(e => e.id === reg.eventId);
    }

    const studentName = reg.studentName || user.name || "Aarav Patel";
    const iuNumber = reg.iuNumber || user.iuNumber || "IU22CE045";
    const dept = reg.department || user.department || "Computer Engineering";
    const semester = reg.semester || user.semester || "6th Semester";
    const eventTitle = reg.eventTitle || (ev ? ev.title : "CodeSprint 2026 — Flagship Hackathon");
    const regId = reg.id || "REG20261001";
    const dateStr = reg.date ? UI.formatDate(reg.date) : (ev && ev.date ? UI.formatDate(ev.date) : "October 15, 2026");
    const timeStr = reg.time || (ev ? ev.time : "09:00 AM – 06:00 PM");
    const venueStr = reg.venue || (ev ? ev.venue : "Computer Center Lab 1 & 2, Indus Campus");
    const category = ev ? (ev.category || "Flagship Technical Event") : "Technical Hackathon";

    // Vector QR Code SVG
    const qrSvg = `
      <svg viewBox="0 0 100 100" width="80" height="80">
        <rect x="0" y="0" width="100" height="100" fill="#ffffff" rx="6"/>
        <rect x="6" y="6" width="24" height="24" fill="#0a4d8c" rx="4"/>
        <rect x="10" y="10" width="16" height="16" fill="#ffffff" rx="2"/>
        <rect x="14" y="14" width="8" height="8" fill="#0a4d8c" rx="1"/>
        <rect x="70" y="6" width="24" height="24" fill="#0a4d8c" rx="4"/>
        <rect x="74" y="10" width="16" height="16" fill="#ffffff" rx="2"/>
        <rect x="78" y="14" width="8" height="8" fill="#0a4d8c" rx="1"/>
        <rect x="6" y="70" width="24" height="24" fill="#0a4d8c" rx="4"/>
        <rect x="10" y="74" width="16" height="16" fill="#ffffff" rx="2"/>
        <rect x="14" y="78" width="8" height="8" fill="#0a4d8c" rx="1"/>
        <rect x="36" y="8" width="5" height="5" fill="#0f172a"/>
        <rect x="45" y="8" width="5" height="5" fill="#0f172a"/>
        <rect x="54" y="8" width="5" height="5" fill="#0f172a"/>
        <rect x="36" y="18" width="5" height="5" fill="#0f172a"/>
        <rect x="50" y="18" width="5" height="5" fill="#0f172a"/>
        <rect x="40" y="27" width="5" height="5" fill="#0f172a"/>
        <rect x="48" y="27" width="5" height="5" fill="#0f172a"/>
        <rect x="58" y="27" width="5" height="5" fill="#0f172a"/>
        <rect x="38" y="38" width="24" height="24" fill="#0a4d8c" rx="4"/>
        <circle cx="50" cy="50" r="8" fill="#d97706"/>
        <path d="M47 50 L49 52 L54 47" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="8" y="38" width="5" height="5" fill="#0f172a"/>
        <rect x="18" y="38" width="5" height="5" fill="#0f172a"/>
        <rect x="28" y="38" width="5" height="5" fill="#0f172a"/>
        <rect x="68" y="38" width="5" height="5" fill="#0f172a"/>
        <rect x="78" y="38" width="5" height="5" fill="#0f172a"/>
        <rect x="88" y="38" width="5" height="5" fill="#0f172a"/>
        <rect x="38" y="68" width="5" height="5" fill="#0f172a"/>
        <rect x="48" y="68" width="5" height="5" fill="#0f172a"/>
        <rect x="58" y="68" width="5" height="5" fill="#0f172a"/>
        <rect x="68" y="68" width="5" height="5" fill="#0f172a"/>
        <rect x="78" y="68" width="5" height="5" fill="#0f172a"/>
        <rect x="38" y="78" width="5" height="5" fill="#0f172a"/>
        <rect x="52" y="78" width="5" height="5" fill="#0f172a"/>
        <rect x="68" y="78" width="5" height="5" fill="#0f172a"/>
        <rect x="85" y="78" width="5" height="5" fill="#0f172a"/>
        <rect x="42" y="88" width="5" height="5" fill="#0f172a"/>
        <rect x="60" y="88" width="5" height="5" fill="#0f172a"/>
        <rect x="74" y="88" width="5" height="5" fill="#0f172a"/>
      </svg>
    `;

    // Vector Barcode SVG
    const barcodeSvg = `
      <svg class="ticket-barcode-svg my-1" viewBox="0 0 300 40" preserveAspectRatio="none">
        <rect x="0" y="0" width="3" height="40" fill="#0f172a"/>
        <rect x="5" y="0" width="1" height="40" fill="#0f172a"/>
        <rect x="9" y="0" width="4" height="40" fill="#0f172a"/>
        <rect x="16" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="21" y="0" width="5" height="40" fill="#0f172a"/>
        <rect x="29" y="0" width="1" height="40" fill="#0f172a"/>
        <rect x="33" y="0" width="3" height="40" fill="#0f172a"/>
        <rect x="39" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="44" y="0" width="6" height="40" fill="#0f172a"/>
        <rect x="53" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="58" y="0" width="3" height="40" fill="#0f172a"/>
        <rect x="64" y="0" width="5" height="40" fill="#0f172a"/>
        <rect x="72" y="0" width="1" height="40" fill="#0f172a"/>
        <rect x="76" y="0" width="4" height="40" fill="#0f172a"/>
        <rect x="83" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="88" y="0" width="5" height="40" fill="#0f172a"/>
        <rect x="96" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="101" y="0" width="4" height="40" fill="#0f172a"/>
        <rect x="108" y="0" width="3" height="40" fill="#0f172a"/>
        <rect x="114" y="0" width="1" height="40" fill="#0f172a"/>
        <rect x="118" y="0" width="6" height="40" fill="#0f172a"/>
        <rect x="127" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="132" y="0" width="4" height="40" fill="#0f172a"/>
        <rect x="139" y="0" width="5" height="40" fill="#0f172a"/>
        <rect x="147" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="152" y="0" width="3" height="40" fill="#0f172a"/>
        <rect x="158" y="0" width="1" height="40" fill="#0f172a"/>
        <rect x="162" y="0" width="5" height="40" fill="#0f172a"/>
        <rect x="170" y="0" width="3" height="40" fill="#0f172a"/>
        <rect x="176" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="181" y="0" width="6" height="40" fill="#0f172a"/>
        <rect x="190" y="0" width="1" height="40" fill="#0f172a"/>
        <rect x="194" y="0" width="4" height="40" fill="#0f172a"/>
        <rect x="201" y="0" width="3" height="40" fill="#0f172a"/>
        <rect x="207" y="0" width="5" height="40" fill="#0f172a"/>
        <rect x="215" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="220" y="0" width="4" height="40" fill="#0f172a"/>
        <rect x="227" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="232" y="0" width="5" height="40" fill="#0f172a"/>
        <rect x="240" y="0" width="3" height="40" fill="#0f172a"/>
        <rect x="246" y="0" width="1" height="40" fill="#0f172a"/>
        <rect x="250" y="0" width="6" height="40" fill="#0f172a"/>
        <rect x="259" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="264" y="0" width="4" height="40" fill="#0f172a"/>
        <rect x="271" y="0" width="3" height="40" fill="#0f172a"/>
        <rect x="277" y="0" width="5" height="40" fill="#0f172a"/>
        <rect x="285" y="0" width="2" height="40" fill="#0f172a"/>
        <rect x="290" y="0" width="4" height="40" fill="#0f172a"/>
        <rect x="297" y="0" width="3" height="40" fill="#0f172a"/>
      </svg>
    `;

    const ticketModalHtml = `
      <div class="modal fade" id="ticketModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-ticket-perforated-fill me-2"></i>Official Event Entry Pass</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-3 p-md-4">
              <div class="ticket-pass-wrap">
                <div class="ticket-pass-card" id="ticket-render-card">
                  
                  <!-- Pass Top Strip -->
                  <div class="ticket-header-strip d-flex justify-content-between align-items-center">
                    <div>
                      <div style="font-size:0.75rem; font-weight:800; color:rgba(255,255,255,0.8); text-transform:uppercase; letter-spacing:1px;">
                        Indus University &bull; CESA 2026
                      </div>
                      <h4 style="font-weight:800; margin:4px 0 0 0; color:#ffffff; font-size:1.35rem;">${eventTitle}</h4>
                    </div>
                    <div class="ticket-badge-confirmed">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                      </svg>
                      CONFIRMED PASS
                    </div>
                  </div>

                  <!-- Pass Content -->
                  <div class="ticket-body-content">
                    <div class="row g-3">
                      <!-- Event Logistics -->
                      <div class="col-7 border-end" style="border-color:#e2e8f0 !important;">
                        <div class="mb-3">
                          <div class="ticket-info-label">Event Date &amp; Timing</div>
                          <div class="ticket-info-val-lg" style="color:#0f172a;">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="#0a4d8c" style="margin-right:4px;">
                              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                            </svg>
                            ${dateStr}
                          </div>
                          <div class="ticket-info-sub">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="#64748b" style="margin-right:4px;">
                              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                            </svg>
                            ${timeStr} (Reporting: 30m prior)
                          </div>
                        </div>

                        <div class="mb-3">
                          <div class="ticket-info-label">Designated Venue</div>
                          <div class="ticket-info-val" style="color:#0f172a;">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="#ef4444" style="margin-right:4px;">
                              <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                            </svg>
                            ${venueStr}
                          </div>
                          <div class="ticket-info-sub">Gate: Academic Block &bull; Single-person admit</div>
                        </div>

                        <div>
                          <div class="ticket-info-label">Category &bull; Organizer</div>
                          <span style="background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:6px; font-size:11px; font-weight:700; border:1px solid #bae6fd;">
                            ${category}
                          </span>
                          <span style="background:#f1f5f9; color:#475569; padding:3px 10px; border-radius:6px; font-size:11px; font-weight:700; border:1px solid #cbd5e1; margin-left:4px;">
                            CESA Computer Engg
                          </span>
                        </div>
                      </div>

                      <!-- Attendee Identification Stub -->
                      <div class="col-5">
                        <div class="ticket-attendee-card mb-2">
                          <div class="ticket-info-label">Attendee Name</div>
                          <div style="font-weight:800; font-size:1.05rem; color:#0a4d8c; margin-bottom:6px;">${studentName}</div>
                          <div class="ticket-info-label">Student ID (IU Number)</div>
                          <div style="font-family:'Courier New', monospace; font-weight:800; font-size:0.95rem; color:#0f172a; background:#ffffff; padding:2px 8px; border-radius:4px; border:1px solid #cbd5e1; display:inline-block; margin-bottom:6px;">
                            ${iuNumber}
                          </div>
                          <div class="ticket-info-label">Department</div>
                          <div style="font-size:0.82rem; font-weight:600; color:#334155;">${dept} (${semester})</div>
                        </div>

                        <!-- Security Scannable QR -->
                        <div class="d-flex align-items-center justify-content-between p-2 rounded" style="background:#f8fafc; border:1px solid #e2e8f0;">
                          <div>
                            <div style="font-size:0.68rem; font-weight:700; color:#64748b; text-transform:uppercase;">Entry QR Pass</div>
                            <div style="font-size:0.75rem; font-weight:800; color:#0a4d8c; font-family:'Courier New', monospace;">IU-2026-OK</div>
                          </div>
                          ${qrSvg}
                        </div>
                      </div>
                    </div>

                    <!-- Perforated Tear Line -->
                    <div class="ticket-perforated-line">
                      <div class="ticket-notch-left"></div>
                      <div class="ticket-notch-right"></div>
                    </div>

                    <!-- Barcode Strip -->
                    <div class="ticket-barcode-box">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span style="font-size:0.78rem; color:#64748b; font-weight:700;">PASS SERIAL: <strong style="color:#0f172a;">${regId}</strong></span>
                        <span style="background:#e2e8f0; color:#334155; font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:4px;">Academic Year 2026</span>
                      </div>

                      <!-- Vector Barcode -->
                      ${barcodeSvg}

                      <div class="ticket-id-display">${regId}</div>
                      <small style="color:#64748b; font-size:0.72rem; display:block; margin-top:4px;">
                        <span style="color:#10b981; font-weight:bold;">&#x2713;</span> Present this digital or printed pass along with your Indus University Student ID card at the entry desk.
                      </small>
                    </div>

                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer bg-light d-flex justify-content-between">
              <span class="text-muted small"><i class="bi bi-check2-circle text-primary me-1"></i>Valid for single-seat admission</span>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-outline-primary" onclick="UI.printIsolatedHtml('Pass_${regId}', document.getElementById('ticket-render-card').outerHTML, false)">
                  <i class="bi bi-printer me-1"></i> Print Pass
                </button>
                <button type="button" class="btn btn-primary" onclick="UI.downloadElementAsPDF('ticket-render-card', 'Pass_${regId}_${studentName.replace(/\\s+/g, '_')}.pdf', false)">
                  <i class="bi bi-file-earmark-pdf-fill me-1"></i> Download Pass (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("ticketModal")?.remove();
    document.body.insertAdjacentHTML("beforeend", ticketModalHtml);
    new bootstrap.Modal(document.getElementById("ticketModal")).show();
  }
};

function openRegisterModal(eventId, eventType) {
  if (!Auth.isLoggedIn() || Auth.getCurrentUser().role !== "student") {
    UI.showToast("Please login as a student to register for events.", "danger");
    setTimeout(() => (window.location.href = "login.html"), 1500);
    return;
  }
  const user = Auth.getCurrentUser();
  if (!document.getElementById("registerModal")) createRegisterModal();
  document.getElementById("reg-event-id").value = eventId;
  document.getElementById("reg-event-type").value = eventType;
  document.getElementById("reg-name").value = user.name || "";
  document.getElementById("reg-iu").value = user.iuNumber || "";
  document.getElementById("reg-dept").value = user.department || "Computer Engineering";
  document.getElementById("reg-sem").value = user.semester || "6th Semester";
  document.getElementById("reg-email").value = user.email || "";
  document.getElementById("reg-phone").value = user.phone || "";
  new bootstrap.Modal(document.getElementById("registerModal")).show();
}

function createRegisterModal() {
  const html = `
  <div class="modal fade" id="registerModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-pencil-square me-2 text-primary"></i>Event Registration</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="registrationForm" onsubmit="event.preventDefault(); submitRegistration();">
            <input type="hidden" id="reg-event-id">
            <input type="hidden" id="reg-event-type">
            <div class="mb-3"><label class="form-label">Student Name</label><input type="text" class="form-control" id="reg-name" required></div>
            <div class="mb-3"><label class="form-label">IU Number (Indus ID)</label><input type="text" class="form-control" id="reg-iu" required></div>
            <div class="row">
              <div class="col-md-6 mb-3"><label class="form-label">Department</label><input type="text" class="form-control" id="reg-dept" required></div>
              <div class="col-md-6 mb-3"><label class="form-label">Semester</label><input type="text" class="form-control" id="reg-sem" required></div>
            </div>
            <div class="mb-3"><label class="form-label">College Email</label><input type="email" class="form-control" id="reg-email" required></div>
            <div class="mb-3"><label class="form-label">Contact Number</label><input type="tel" class="form-control" id="reg-phone" required></div>
            <div class="d-flex justify-content-end gap-2 mt-4">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary-custom">Confirm Registration</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
}

async function submitRegistration() {
  const eventId = document.getElementById("reg-event-id").value;
  const eventType = document.getElementById("reg-event-type").value;
  const formData = {
    name: document.getElementById("reg-name").value,
    iuNumber: document.getElementById("reg-iu").value,
    department: document.getElementById("reg-dept").value,
    semester: document.getElementById("reg-sem").value,
    email: document.getElementById("reg-email").value,
    phone: document.getElementById("reg-phone").value
  };

  const result = await Registration.register(eventId, eventType, formData);
  if (result.success) {
    const modalEl = document.getElementById("registerModal");
    if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
    UI.showToast(`Registration successful! ID: <strong>${result.registration.id}</strong>`);
    setTimeout(() => {
      UI.showTicketReceipt(result.registration);
    }, 600);
  } else {
    UI.showToast(result.message || "Registration failed", "danger");
  }
}

function viewEventDetails(id, type) {
  let event;
  if (type === "cesa") event = Storage.get("cesaEvents", []).find(e => e.id === id);
  else if (type === "seminar") event = Storage.get("seminars", []).find(e => e.id === id);
  else event = Storage.get("generalEvents", []).find(e => e.id === id);
  if (!event) return;

  const posterImg = event.posterImage || event.poster_image;
  let bannerHeader = "";
  if (posterImg) {
    bannerHeader = `<img src="${posterImg}" class="img-fluid rounded-top mb-3" style="max-height:220px;width:100%;object-fit:cover;">`;
  }

  let body = `
    ${bannerHeader}
    <p><strong><i class="bi bi-calendar-event me-1"></i> Date:</strong> ${UI.formatDate(event.date)}</p>
    <p><strong><i class="bi bi-clock me-1"></i> Time:</strong> ${event.time || "TBA"}</p>
    <p><strong><i class="bi bi-geo-alt me-1"></i> Venue:</strong> ${event.venue || "TBA"}</p>
    <p><strong><i class="bi bi-building me-1"></i> Organizer:</strong> ${event.organizer || event.organizedBy || "Indus University"}</p>
    ${event.speaker ? `<p><strong><i class="bi bi-mic me-1"></i> Speaker:</strong> ${event.speaker} ${event.speakerTitle ? `(${event.speakerTitle})` : ""}</p>` : ""}
    <hr>
    <p class="mt-2 text-muted">${event.description || ""}</p>
    ${event.registrationDeadline ? `<p class="small text-danger fw-semibold"><i class="bi bi-hourglass-split me-1"></i> Registration deadline: ${UI.formatDate(event.registrationDeadline)}</p>` : ""}
  `;

  if (!document.getElementById("detailModal")) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="detailModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header"><h5 class="modal-title fw-bold" id="detailModalTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body" id="detailModalBody"></div>
            <div class="modal-footer" id="detailModalFooter"></div>
          </div>
        </div>
      </div>`);
  }
  document.getElementById("detailModalTitle").textContent = event.title;
  document.getElementById("detailModalBody").innerHTML = body;
  const footer = document.getElementById("detailModalFooter");
  footer.innerHTML = event.registrationOpen !== false
    ? `<button class="btn btn-primary-custom" onclick="bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide(); openRegisterModal('${id}','${type}')">Register Now</button>
       <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>`
    : `<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>`;
  new bootstrap.Modal(document.getElementById("detailModal")).show();
}

// Navbar scroll shadow
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar-campus");
  if (nav) {
    if (window.scrollY > 30) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
});

// Theme Management (Supports Custom Tokens + Bootstrap 5.3 Dark Mode)
const Theme = {
  getSavedTheme() {
    try {
      return localStorage.getItem("campusconnect_theme") || "light";
    } catch (e) {
      return "light";
    }
  },
  saveTheme(theme) {
    try {
      localStorage.setItem("campusconnect_theme", theme);
    } catch (e) {
      console.warn("Could not save theme preference:", e);
    }
  },
  apply(theme) {
    const validTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", validTheme);
    document.documentElement.setAttribute("data-bs-theme", validTheme);
    if (document.body) {
      document.body.setAttribute("data-theme", validTheme);
      document.body.setAttribute("data-bs-theme", validTheme);
    }
    this.updateIcon(validTheme);
  },
  init() {
    const saved = this.getSavedTheme();
    this.apply(saved);
  },
  toggle() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    this.saveTheme(next);
    this.apply(next);
  },
  updateIcon(theme) {
    const btns = document.querySelectorAll(".theme-toggle-btn");
    btns.forEach(b => {
      b.innerHTML = theme === "dark"
        ? '<i class="bi bi-sun-fill text-warning"></i>'
        : '<i class="bi bi-moon-stars-fill"></i>';
      b.setAttribute("title", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      b.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  },
  attachToggle() {
    document.querySelectorAll(".theme-toggle-btn").forEach(b => {
      b.onclick = (e) => {
        e.preventDefault();
        Theme.toggle();
      };
    });
    this.updateIcon(this.getSavedTheme());
  }
};

// Immediate application to prevent theme flash
Theme.init();

document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  UI.updateNavAuth();
  API.checkStatus();
  Theme.attachToggle();

  // Allow smooth navigation between internal portal links
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.getAttribute("href") && a.getAttribute("href").includes("index.html")) {
      try {
        sessionStorage.setItem("campusconnect_from_welcome", "1");
      } catch (err) {}
    }
  });
});

