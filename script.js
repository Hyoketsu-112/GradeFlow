// ========== GRADE FLOW – PHASE 2 (Professional & Polished) ==========
(function () {
  // ----- STATE -----
  let currentUser = JSON.parse(localStorage.getItem("gf_user") || "null");
  let classes = JSON.parse(localStorage.getItem("gf_classes") || "null") || [
    { id: "cls1", name: "JSS 2A", subject: "Mathematics", emoji: "📐" },
    { id: "cls2", name: "SS 1B", subject: "Mathematics", emoji: "📏" },
    { id: "cls3", name: "JSS 3C", subject: "Mathematics", emoji: "📊" },
  ];
  let allStudents = JSON.parse(
    localStorage.getItem("gf_students") || "null",
  ) || {
    cls1: [
      { id: "s1", name: "Chidera Obi", test: 18, prac: 17, exam: 52 },
      { id: "s2", name: "Amaka Nwosu", test: 16, prac: 15, exam: 47 },
      { id: "s3", name: "Emeka Adeyemi", test: 14, prac: 12, exam: 38 },
      { id: "s4", name: "Fatima Bello", test: 12, prac: 10, exam: "" },
      { id: "s5", name: "Tunde Okafor", test: 8, prac: 9, exam: 18 },
    ],
    cls2: [],
    cls3: [],
  };
  let activeClassId = "cls1";
  let sortAsc = false;
  const emojis = ["📐", "📏", "📊", "🔬", "🌍", "✏️", "🎨", "🏫", "📖", "🔢"];

  // ----- UTILITIES -----
  function showToast(msg, type = "info") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast show " + type;
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
      t.classList.remove("show");
      t.className = "toast";
    }, 2800);
  }
  window.showToast = showToast;

  function showLoading(message = "Processing...") {
    document.getElementById("loadingMessage").textContent = message;
    document.getElementById("loadingOverlay").style.display = "flex";
  }
  function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  window.scrollToTop = scrollToTop;

  function canAddClass() {
    if (!currentUser) return false;
    if (currentUser.plan === "school") return true;
    if (currentUser.plan === "standard") return classes.length < 3;
    return classes.length < 1;
  }
  function canUploadExcel() {
    return (
      currentUser &&
      (currentUser.plan === "standard" || currentUser.plan === "school")
    );
  }
  function canExportPDF() {
    return (
      currentUser &&
      (currentUser.plan === "standard" || currentUser.plan === "school")
    );
  }

  // ----- HAMBURGER TOGGLE -----
  window.toggleSidebar = function () {
    document.getElementById("page-dashboard").classList.toggle("collapsed");
  };

  // ----- GRADING ENGINE -----
  function compute(student) {
    const t = Math.min(parseFloat(student.test) || 0, 20);
    const p = Math.min(parseFloat(student.prac) || 0, 20);
    if (
      student.exam === "" ||
      student.exam === null ||
      student.exam === undefined
    ) {
      return { total: null, t, p, e: null };
    }
    const e = Math.min(parseFloat(student.exam) || 0, 60);
    return { total: t + p + e, t, p, e };
  }

  function gradeResult(total) {
    if (total === null || total === "" || isNaN(total))
      return { g: "—", r: "Pending", cls: "g-none" };
    if (total >= 70) return { g: "A", r: "Excellent", cls: "g-A" };
    if (total >= 60) return { g: "B", r: "Very Good", cls: "g-B" };
    if (total >= 50) return { g: "C", r: "Good", cls: "g-C" };
    if (total >= 45) return { g: "D", r: "Fair", cls: "g-D" };
    if (total >= 40) return { g: "E", r: "Pass", cls: "g-E" };
    return { g: "F", r: "Fail", cls: "g-F" };
  }

  function rankStudents(students) {
    const withTotal = students.map((s) => ({ ...s, ...compute(s) }));
    const graded = withTotal
      .filter((s) => s.total !== null)
      .sort((a, b) => b.total - a.total);
    let rank = 1;
    graded.forEach((s, i) => {
      if (i > 0 && s.total < graded[i - 1].total) rank = i + 1;
      s.pos = rank;
    });
    const ungraded = withTotal
      .filter((s) => s.total === null)
      .map((s) => ({ ...s, pos: null }));
    return [...graded, ...ungraded];
  }

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // ----- AUTH -----
  window.openAuthModal = function () {
    document.getElementById("authModal").classList.add("active");
    document.body.style.overflow = "hidden";
  };
  window.closeAuthModal = function () {
    document.getElementById("authModal").classList.remove("active");
    document.body.style.overflow = "";
  };
  document.getElementById("authModal").addEventListener("click", function (e) {
    if (e.target === this) closeAuthModal();
  });

  window.switchAuthTab = function (tab) {
    document
      .getElementById("tab-signup")
      .classList.toggle("active", tab === "signup");
    document
      .getElementById("tab-login")
      .classList.toggle("active", tab === "login");
    document.getElementById("form-signup").style.display =
      tab === "signup" ? "block" : "none";
    document.getElementById("form-login").style.display =
      tab === "login" ? "block" : "none";
  };

  window.handleSignup = function () {
    const name = document.getElementById("su-name").value.trim();
    const org = document.getElementById("su-org").value.trim();
    const subject = document.getElementById("su-subject").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const pass = document.getElementById("su-pass").value;
    if (!name || !email || !pass) {
      showToast("⚠️ Please fill in all required fields", "error");
      return;
    }
    if (pass.length < 8) {
      showToast("⚠️ Password must be at least 8 characters", "error");
      return;
    }
    const user = {
      name,
      org: org || "My School",
      subject: subject || "General",
      email,
      plan: "free",
    };
    localStorage.setItem("gf_user", JSON.stringify(user));
    currentUser = user;
    closeAuthModal();
    showPage("dashboard");
    updateDashboardUser();
    renderClasses();
    renderTable();
    showToast(
      "🎉 Welcome to GradeFlow, " + name.split(" ")[0] + "!",
      "success",
    );
  };

  window.handleLogin = function () {
    const email = document.getElementById("li-email").value.trim();
    const pass = document.getElementById("li-pass").value;
    if (!email || !pass) {
      showToast("⚠️ Enter your email and password", "error");
      return;
    }
    let user = currentUser || {
      name: "Mrs. Adaeze Okonkwo",
      org: "Greenfield Academy",
      subject: "Mathematics",
      plan: "standard",
    };
    user.email = email;
    localStorage.setItem("gf_user", JSON.stringify(user));
    currentUser = user;
    closeAuthModal();
    showPage("dashboard");
    updateDashboardUser();
    renderClasses();
    renderTable();
    showToast("✅ Welcome back!", "success");
  };

  window.handleLogout = function () {
    localStorage.removeItem("gf_user");
    currentUser = null;
    showPage("landing");
    showToast("👋 Logged out successfully", "info");
  };

  function updateDashboardUser() {
    if (!currentUser) return;
    const initials = currentUser.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const hr = new Date().getHours();
    const greet =
      hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    document.getElementById("db-greeting").textContent =
      greet + ", " + currentUser.name.split(" ")[0] + " 👋";
    document.getElementById("db-school").textContent =
      (currentUser.org || "My School") + " · 2025/2026 Session";
    document.getElementById("db-username").textContent = currentUser.name;
    document.getElementById("db-userrole").textContent =
      (currentUser.subject || "Teacher") +
      " · " +
      (currentUser.org || "School");
    document.getElementById("db-avatar").textContent = initials;
    document.getElementById("db-avatar2").textContent = initials;
    const planBadge = document.getElementById("plan-badge");
    planBadge.textContent =
      currentUser.plan === "free"
        ? "🆓 Free Plan"
        : currentUser.plan === "standard"
          ? "⭐ Standard Plan"
          : "🏫 School Plan";
    const upgradeCard = document.getElementById("upgrade-card");
    if (currentUser.plan === "free") {
      upgradeCard.innerHTML =
        '<p>Upgrade to <strong style="color:#fcd34d">Standard</strong> for Excel uploads & PDF exports.</p><button class="upgrade-btn-side" onclick="simulatePayment(\'standard\')">Upgrade — ₦10,000</button>';
    } else if (currentUser.plan === "standard") {
      upgradeCard.innerHTML =
        '<p>Upgrade to <strong style="color:#fcd34d">School Plan</strong> for unlimited classes & multi-teacher access.</p><button class="upgrade-btn-side" onclick="simulatePayment(\'school\')">Upgrade — ₦30,000</button>';
    } else {
      upgradeCard.innerHTML =
        "<p>You're on the School Plan. Enjoy all features!</p>";
    }
    document.getElementById("uploadExcelBtn").disabled = !canUploadExcel();
    document.getElementById("exportPdfBtn").disabled = !canExportPDF();
  }

  // ----- PAGE ROUTING -----
  function showPage(page) {
    document.getElementById("page-landing").style.display =
      page === "landing" ? "block" : "none";
    const db = document.getElementById("page-dashboard");
    if (page === "dashboard") {
      db.classList.add("active");
    } else {
      db.classList.remove("active");
    }
  }

  // ----- RENDER CLASSES (with delete button) -----
  function renderClasses() {
    const grid = document.getElementById("classesGrid");
    if (classes.length === 0) {
      grid.innerHTML = "";
      document.getElementById("emptyClassesState").style.display = "block";
      document.getElementById("scorePanel").style.display = "none";
    } else {
      document.getElementById("emptyClassesState").style.display = "none";
      grid.innerHTML =
        classes
          .map((c) => {
            const sts = allStudents[c.id] || [];
            const ranked = rankStudents(sts);
            const graded = ranked.filter((s) => s.total !== null);
            const avg = graded.length
              ? Math.round(
                  graded.reduce((a, s) => a + s.total, 0) / graded.length,
                )
              : "—";
            const isActive = c.id === activeClassId;
            return `<div class="class-card${isActive ? " active-class" : ""}" onclick="selectClass('${c.id}')">
              <span class="class-delete" onclick="deleteClass('${c.id}', event)">🗑️</span>
              <div class="class-card-icon">${c.emoji}</div>
              <div class="class-card-name">${c.name}</div>
              <div class="class-card-meta">${c.subject}</div>
              <div class="class-card-stats">
                <div class="cs"><strong>${sts.length}</strong>Students</div>
                <div class="cs"><strong>${avg === "—" ? "—" : avg + "%"}</strong>Avg</div>
                <div class="cs"><strong>${graded.length}</strong>Graded</div>
              </div>
            </div>`;
          })
          .join("") +
        `<div class="add-class-card" onclick="openAddClassModal()"><div class="plus">＋</div><p>Add New Class</p></div>`;
    }
    updateTopStats();
  }

  // ----- DELETE CLASS -----
  window.deleteClass = function (classId, event) {
    event.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to delete this class and all its students?",
      )
    )
      return;

    classes = classes.filter((c) => c.id !== classId);
    delete allStudents[classId];

    if (activeClassId === classId) {
      activeClassId = classes.length > 0 ? classes[0].id : null;
    }

    saveData();
    renderClasses();
    if (activeClassId) {
      renderTable();
    } else {
      document.getElementById("scorePanel").style.display = "none";
    }
    showToast("Class deleted", "success");
  };

  // ----- RENDER TABLE -----
  function renderTable() {
    const cls = classes.find((c) => c.id === activeClassId);
    if (!cls) {
      document.getElementById("scorePanel").style.display = "none";
      return;
    }
    document.getElementById("scorePanel").style.display = "block";
    document.getElementById("panelTitle").textContent =
      `📋 Score Sheet — ${cls.name}`;
    document.getElementById("activeClassName").textContent =
      `${cls.emoji} ${cls.name}`;
    document.getElementById("activeClassMeta").textContent =
      `  ${cls.subject} · Second Term 2025/2026`;
    const students = allStudents[activeClassId] || [];
    const ranked = rankStudents(students);
    renderRows(ranked);
    updateSummary(ranked);
  }

  function renderRows(ranked) {
    document.getElementById("scoreBody").innerHTML = ranked
      .map((s, i) => {
        const { total } = compute(s);
        const hasExam =
          s.exam !== "" && s.exam !== null && s.exam !== undefined;
        const g = hasExam
          ? gradeResult(total)
          : { g: "—", r: "Pending", cls: "g-none" };
        const barW = total ? Math.round(total) : 0;
        const barColor =
          total >= 70
            ? "#10B981"
            : total >= 50
              ? "#F59E0B"
              : total >= 40
                ? "#6366F1"
                : "#EF4444";
        return `<tr>
            <td class="td-sn">${i + 1}</td>
            <td class="td-name">${s.name}</td>
            <td><input class="score-input" type="number" min="0" max="20" value="${s.test}" onchange="updateScore('${s.id}','test',this)" oninput="validateInput(this,20)"/></td>
            <td><input class="score-input" type="number" min="0" max="20" value="${s.prac}" onchange="updateScore('${s.id}','prac',this)" oninput="validateInput(this,20)"/></td>
            <td><input class="score-input" type="number" min="0" max="60" value="${s.exam}" onchange="updateScore('${s.id}','exam',this)" oninput="validateInput(this,60)" placeholder="—"/></td>
            <td class="total-cell">${total !== null ? `<div>${total}</div><div class="grade-bar"><div class="grade-bar-fill" style="width:${barW}%;background:${barColor}"></div></div>` : '<span class="pending">Pending</span>'}</td>
            <td><span class="grade-pill ${g.cls}">${g.g}</span></td>
            <td class="remark-cell">${g.r}</td>
            <td class="pos-cell">${s.pos ? ordinal(s.pos) : "—"}</td>
            <td><button class="btn btn-danger btn-sm" onclick="removeStudent('${s.id}')">✕</button></td>
          </tr>`;
      })
      .join("");
  }

  window.validateInput = function (el, max) {
    const v = parseFloat(el.value);
    if (el.value !== "" && (isNaN(v) || v < 0 || v > max))
      el.classList.add("error");
    else el.classList.remove("error");
  };

  window.updateScore = function (id, field, el) {
    if (!currentUser) return;
    const v = el.value;
    const max = field === "exam" ? 60 : 20;
    const num = parseFloat(v);
    if (v !== "" && (isNaN(num) || num < 0 || num > max)) {
      el.classList.add("error");
      showToast(`⚠️ Max score for ${field} is ${max}`, "error");
      return;
    }
    el.classList.remove("error");
    const s = (allStudents[activeClassId] || []).find((s) => s.id === id);
    if (s) s[field] = v === "" ? "" : num;
    const ranked = rankStudents(allStudents[activeClassId] || []);
    renderRows(ranked);
    updateSummary(ranked);
    updateTopStats();
    saveData();
    showToast("Score updated", "success");
  };

  function updateSummary(ranked) {
    const graded = ranked.filter((s) => s.total !== null);
    const totals = graded.map((s) => s.total);
    document.getElementById("sumStudents").textContent = ranked.length;
    document.getElementById("sumHigh").textContent = totals.length
      ? Math.max(...totals)
      : "—";
    document.getElementById("sumLow").textContent = totals.length
      ? Math.min(...totals)
      : "—";
    document.getElementById("sumAvg").textContent = totals.length
      ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) + "%"
      : "—";
    const passed = graded.filter((s) => s.total >= 40).length;
    document.getElementById("sumPass").textContent = graded.length
      ? Math.round((passed / graded.length) * 100) + "%"
      : "—";
    document.getElementById("sumA").textContent = graded.filter(
      (s) => s.total >= 70,
    ).length;
  }

  function updateTopStats() {
    document.getElementById("totalClasses").textContent = classes.length;
    document.getElementById("totalStudents").textContent =
      Object.values(allStudents).flat().length;
    const students = allStudents[activeClassId] || [];
    const ranked = rankStudents(students);
    const graded = ranked.filter((s) => s.total !== null);
    const totals = graded.map((s) => s.total);
    document.getElementById("classAvg").textContent = totals.length
      ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) + "%"
      : "—";
    const passed = graded.filter((s) => s.total >= 40).length;
    document.getElementById("passRate").textContent = graded.length
      ? Math.round((passed / graded.length) * 100) + "%"
      : "—";
  }

  // ----- STUDENT CRUD -----
  window.confirmAddStudent = function () {
    if (!currentUser) return;
    const name = document.getElementById("newName").value.trim();
    if (!name) {
      showToast("⚠️ Enter a student name", "error");
      return;
    }
    const classStudents = allStudents[activeClassId] || [];
    if (currentUser.plan === "free" && classStudents.length >= 30) {
      showToast(
        "⚠️ Free plan allows max 30 students per class. Upgrade to add more.",
        "error",
      );
      return;
    }
    if (currentUser.plan === "standard" && classStudents.length >= 50) {
      showToast(
        "⚠️ Standard plan allows max 50 students per class. Upgrade to School Plan for unlimited.",
        "error",
      );
      return;
    }
    if (!allStudents[activeClassId]) allStudents[activeClassId] = [];
    allStudents[activeClassId].push({
      id: "s" + Date.now(),
      name,
      test: parseFloat(document.getElementById("newTest").value) || 0,
      prac: parseFloat(document.getElementById("newPrac").value) || 0,
      exam: document.getElementById("newExam").value || "",
    });
    document.getElementById("newName").value = "";
    document.getElementById("newTest").value = "";
    document.getElementById("newPrac").value = "";
    document.getElementById("newExam").value = "";
    renderTable();
    renderClasses();
    saveData();
    showToast("✅ Student added!", "success");
  };

  window.removeStudent = function (id) {
    if (!currentUser) return;
    if (!confirm("Remove this student?")) return;
    allStudents[activeClassId] = (allStudents[activeClassId] || []).filter(
      (s) => s.id !== id,
    );
    renderTable();
    renderClasses();
    saveData();
    showToast("🗑 Student removed", "success");
  };

  window.addStudentRow = function () {
    document.getElementById("newName").focus();
    showToast("👇 Fill in the row at the bottom of the table", "info");
  };

  window.filterStudents = function (q) {
    document.querySelectorAll("#scoreBody tr").forEach((r) => {
      const n = r.querySelector(".td-name");
      if (n)
        r.style.display = n.textContent.toLowerCase().includes(q.toLowerCase())
          ? ""
          : "none";
    });
  };

  window.sortByScore = function () {
    const ranked = rankStudents(allStudents[activeClassId] || []);
    sortAsc = !sortAsc;
    renderRows(sortAsc ? [...ranked].reverse() : ranked);
    showToast(
      sortAsc ? "⬆ Sorted: Lowest first" : "⬇ Sorted: Highest first",
      "info",
    );
  };

  // ----- CLASS CRUD -----
  window.selectClass = function (id) {
    activeClassId = id;
    renderClasses();
    renderTable();
    document
      .getElementById("scorePanel")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  };

  window.openAddClassModal = function () {
    if (!canAddClass()) {
      showToast(
        "⚠️ You have reached your class limit. Upgrade to add more classes.",
        "error",
      );
      return;
    }
    document.getElementById("classModal").classList.add("open");
  };
  window.closeAddClassModal = function () {
    document.getElementById("classModal").classList.remove("open");
  };
  document.getElementById("classModal").addEventListener("click", function (e) {
    if (e.target === this) closeAddClassModal();
  });

  window.confirmAddClass = function () {
    const name = document.getElementById("newClassName").value.trim();
    const subject =
      document.getElementById("newClassSubject").value.trim() || "General";
    if (!name) {
      showToast("⚠️ Enter a class name", "error");
      return;
    }
    const id = "cls" + Date.now();
    classes.push({
      id,
      name,
      subject,
      emoji: emojis[classes.length % emojis.length],
    });
    allStudents[id] = [];
    activeClassId = id;
    closeAddClassModal();
    document.getElementById("newClassName").value = "";
    document.getElementById("newClassSubject").value = "";
    renderClasses();
    renderTable();
    saveData();
    showToast("🎉 Class created!", "success");
  };

  // ----- EXCEL UPLOAD (enhanced) -----
  document
    .getElementById("excelUpload")
    .addEventListener("change", async function (e) {
      if (!canUploadExcel()) {
        showToast(
          "⚠️ Excel upload is a Standard feature. Please upgrade.",
          "error",
        );
        this.value = "";
        return;
      }
      const file = e.target.files[0];
      if (!file) return;

      showLoading("Reading Excel file...");
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        // If multiple sheets, let user choose (simplified: take first)
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row (look for common name columns)
        const nameKeywords = ["name", "student", "full name", "student name"];
        const testKeywords = ["test", "test score", "ca1", "continuous"];
        const pracKeywords = ["practical", "prac", "lab", "project"];
        const examKeywords = ["exam", "examination", "final"];

        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i];
          if (!row) continue;
          const rowStr = row.map((c) => String(c).toLowerCase()).join(" ");
          if (nameKeywords.some((kw) => rowStr.includes(kw))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          hideLoading();
          showToast(
            "❌ Could not find a header row with student names.",
            "error",
          );
          this.value = "";
          return;
        }

        const headers = rows[headerRowIndex].map((h) =>
          String(h).toLowerCase(),
        );
        const nameIdx = headers.findIndex((h) =>
          nameKeywords.some((kw) => h.includes(kw)),
        );
        const testIdx = headers.findIndex((h) =>
          testKeywords.some((kw) => h.includes(kw)),
        );
        const pracIdx = headers.findIndex((h) =>
          pracKeywords.some((kw) => h.includes(kw)),
        );
        const examIdx = headers.findIndex((h) =>
          examKeywords.some((kw) => h.includes(kw)),
        );

        if (nameIdx === -1) {
          hideLoading();
          showToast('❌ Could not find "Name" column.', "error");
          this.value = "";
          return;
        }

        const students = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[nameIdx]) continue;
          const name = String(row[nameIdx]).trim();
          if (!name) continue;
          students.push({
            id: "s" + Date.now() + i,
            name,
            test: testIdx !== -1 ? parseFloat(row[testIdx]) || 0 : 0,
            prac: pracIdx !== -1 ? parseFloat(row[pracIdx]) || 0 : 0,
            exam:
              examIdx !== -1
                ? row[examIdx]
                  ? parseFloat(row[examIdx])
                  : ""
                : "",
          });
        }

        if (students.length === 0) {
          hideLoading();
          showToast("❌ No valid student data found.", "error");
          this.value = "";
          return;
        }

        // Check plan limits
        const classStudents = allStudents[activeClassId] || [];
        const newCount = classStudents.length + students.length;
        if (currentUser.plan === "free" && newCount > 30) {
          hideLoading();
          showToast(
            `⚠️ Free plan allows max 30 students. You have ${classStudents.length} and trying to add ${students.length}.`,
            "error",
          );
          this.value = "";
          return;
        }
        if (currentUser.plan === "standard" && newCount > 50) {
          hideLoading();
          showToast(
            `⚠️ Standard plan allows max 50 students per class. You have ${classStudents.length} and trying to add ${students.length}.`,
            "error",
          );
          this.value = "";
          return;
        }

        // Show preview (optional) – for now just import
        if (!allStudents[activeClassId]) allStudents[activeClassId] = [];
        allStudents[activeClassId].push(...students);
        renderTable();
        renderClasses();
        saveData();
        showToast(`✅ Imported ${students.length} students.`, "success");
      } catch (err) {
        showToast("❌ Error reading file: " + err.message, "error");
      } finally {
        hideLoading();
        this.value = "";
      }
    });

  // ----- PDF EXPORT -----
  window.exportAllPDFs = async function () {
    if (!canExportPDF()) {
      showToast(
        "⚠️ PDF export is a Standard feature. Please upgrade.",
        "error",
      );
      return;
    }
    const cls = classes.find((c) => c.id === activeClassId);
    if (!cls) return;
    const students = allStudents[activeClassId] || [];
    if (students.length === 0) {
      showToast("No students to export.", "info");
      return;
    }
    const ranked = rankStudents(students);
    showLoading(`Generating PDFs for ${ranked.length} students...`);
    try {
      for (const s of ranked) await exportStudentPDF(s, cls);
      showToast("✅ PDFs generated!", "success");
    } catch (err) {
      showToast("❌ PDF generation failed: " + err.message, "error");
    } finally {
      hideLoading();
    }
  };

  async function exportStudentPDF(student, cls) {
    const { total, grade, remark } = gradeResult(compute(student).total);
    const template = document.getElementById("pdf-template").innerHTML;
    const html = template
      .replace("{{schoolName}}", currentUser?.org || "My School")
      .replace("{{studentName}}", student.name)
      .replace("{{className}}", cls.name)
      .replace("{{subject}}", cls.subject)
      .replace("{{test}}", student.test)
      .replace("{{prac}}", student.prac)
      .replace("{{exam}}", student.exam || "—")
      .replace("{{total}}", total !== null ? total : "—")
      .replace("{{grade}}", grade || "—")
      .replace("{{remark}}", remark)
      .replace("{{position}}", student.pos ? ordinal(student.pos) : "—");

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    pdf.save(`${student.name}_Report_Card.pdf`);

    document.body.removeChild(container);
  }

  // ----- SIMULATED PAYMENT -----
  window.simulatePayment = function (plan) {
    if (!currentUser) return;
    currentUser.plan = plan;
    localStorage.setItem("gf_user", JSON.stringify(currentUser));
    updateDashboardUser();
    renderClasses();
    renderTable();
    showToast(`🎉 You are now on the ${plan} plan!`, "success");
  };

  // ----- OFFLINE SUPPORT -----
  function updateOnlineStatus() {
    const banner = document.getElementById("offline-banner");
    banner.classList.toggle("show", !navigator.onLine);
  }
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log("SW registration failed:", err));
    });
  }

  // ----- SAVE DATA -----
  window.saveData = function () {
    localStorage.setItem("gf_classes", JSON.stringify(classes));
    localStorage.setItem("gf_students", JSON.stringify(allStudents));
    showToast("💾 All data saved!", "success");
  };

  // ----- INIT -----
  function init() {
    if (currentUser) {
      showPage("dashboard");
      updateDashboardUser();
      renderClasses();
      renderTable();
    } else {
      showPage("landing");
    }
  }
  init();

  // smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
})();
