// ==================== FIREBASE CONFIG (REPLACE WITH YOUR OWN) ====================
const firebaseConfig = {
  apiKey: "AIzaSyAUJNRP9QNkx4gG95G2u94vMtfbYPbcwpQ",
  authDomain: "studio-929745001-20ef8.firebaseapp.com",
  projectId: "studio-929745001-20ef8",
  storageBucket: "studio-929745001-20ef8.firebasestorage.app",
  messagingSenderId: "160435039125",
  appId: "1:160435039125:web:4c00b31c50a98bbf0ce49c",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== PAYSTACK PUBLIC KEY (TEST MODE) ====================
const PAYSTACK_PUBLIC_KEY = "pk_test_xxxxxxxxxxxxxxxxxxxxxxxx"; // Replace with your test key

// ==================== GLOBAL STATE ====================
let currentUser = null;
let isPremium = false;
let currentStudents = []; // stores student objects for PDF generation

// ==================== DOM ELEMENTS ====================
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const previewDiv = document.getElementById("preview");
const messagesDiv = document.getElementById("messages");
const spinner = document.getElementById("spinner");
const authSection = document.getElementById("authSection");
const showLoginBtn = document.getElementById("showLoginBtn");
const userInfo = document.getElementById("userInfo");
const userNameSpan = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const authModal = document.getElementById("authModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const extraFields = document.getElementById("extraFields");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const fullNameInput = document.getElementById("fullName");
const dobInput = document.getElementById("dob");
const orgInput = document.getElementById("org");
const subjectInput = document.getElementById("subject");
const premiumBanner = document.getElementById("premiumBanner");
const upgradeBtn = document.getElementById("upgradeBtn");
const exportExcelBtn = document.getElementById("exportExcelBtn");
const exportPDFBtn = document.getElementById("exportPDFBtn");
const studentsTableBody = document.getElementById("studentsTableBody");
const schoolNameSpan = document.getElementById("schoolName");
const classNameSpan = document.getElementById("className");
const batchYearSpan = document.getElementById("batchYear");
const classTeacherSpan = document.getElementById("classTeacher");

// ==================== AUTH & PAYMENT ====================
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.data() || {};
    userNameSpan.innerText = userData.fullName || user.email;
    userInfo.classList.remove("hidden");
    showLoginBtn.classList.add("hidden");
    isPremium = userData.isPremium || false;
    if (!isPremium) {
      premiumBanner.classList.remove("hidden");
    } else {
      premiumBanner.classList.add("hidden");
    }
  } else {
    currentUser = null;
    isPremium = false;
    userInfo.classList.add("hidden");
    showLoginBtn.classList.remove("hidden");
    premiumBanner.classList.add("hidden");
  }
});

showLoginBtn.addEventListener("click", () => {
  modalTitle.innerText = "Login";
  extraFields.classList.add("hidden");
  authModal.classList.remove("hidden");
});

closeModal.addEventListener("click", () => {
  authModal.classList.add("hidden");
});

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    authModal.classList.add("hidden");
    messagesDiv.innerHTML =
      '<span class="text-[#10B981]">✅ Logged in successfully!</span>';
  } catch (error) {
    messagesDiv.innerHTML = `<span class="text-red-600">❌ ${error.message}</span>`;
  }
});

signupBtn.addEventListener("click", async () => {
  if (signupBtn.innerText === "Sign Up") {
    // Show extra fields
    modalTitle.innerText = "Sign Up";
    extraFields.classList.remove("hidden");
    signupBtn.innerText = "Create Account";
    loginBtn.classList.add("hidden");
    return;
  }
  // Create account
  const email = emailInput.value;
  const password = passwordInput.value;
  const fullName = fullNameInput.value;
  const dob = dobInput.value;
  const org = orgInput.value;
  const subject = subjectInput.value;
  if (!fullName || !dob || !org || !subject) {
    messagesDiv.innerHTML =
      '<span class="text-red-600">❌ Please fill all fields</span>';
    return;
  }
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("users").doc(cred.user.uid).set({
      fullName,
      dob,
      org,
      subject,
      isPremium: false,
      email,
    });
    authModal.classList.add("hidden");
    messagesDiv.innerHTML =
      '<span class="text-[#10B981]">✅ Account created! You are now logged in.</span>';
  } catch (error) {
    messagesDiv.innerHTML = `<span class="text-red-600">❌ ${error.message}</span>`;
  }
  // Reset modal
  extraFields.classList.add("hidden");
  signupBtn.innerText = "Sign Up";
  loginBtn.classList.remove("hidden");
});

logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// Upgrade to Premium (Paystack)
upgradeBtn.addEventListener("click", () => {
  if (!currentUser) {
    messagesDiv.innerHTML =
      '<span class="text-amber-600">⚠️ Please log in first.</span>';
    return;
  }
  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: currentUser.email,
    amount: 10000 * 100, // in kobo (₦10,000)
    currency: "NGN",
    callback: async (response) => {
      // Verify transaction on backend? For simplicity, we'll just mark as premium.
      await db
        .collection("users")
        .doc(currentUser.uid)
        .update({ isPremium: true });
      isPremium = true;
      premiumBanner.classList.add("hidden");
      messagesDiv.innerHTML =
        '<span class="text-[#10B981]">🎉 You are now a premium user! Enjoy PDF exports and offline mode.</span>';
    },
    onClose: () => {
      messagesDiv.innerHTML =
        '<span class="text-amber-600">⚠️ Payment cancelled.</span>';
    },
  });
  handler.openIframe();
});

// ==================== OFFLINE SUPPORT ====================
localforage.config({
  name: "GradeFlow",
  storeName: "gradeflow_data",
});

// Save current data offline when logged in
function saveOffline() {
  if (!currentUser) return;
  const data = {
    schoolName: schoolNameSpan.innerText,
    className: classNameSpan.innerText,
    batchYear: batchYearSpan.innerText,
    classTeacher: classTeacherSpan.innerText,
    students: currentStudents,
  };
  localforage.setItem("lastSession", data).catch(console.error);
}

// Load offline data on startup if logged in and no internet?
window.addEventListener("load", async () => {
  if (navigator.onLine === false && currentUser) {
    const data = await localforage.getItem("lastSession");
    if (data) {
      restoreFromOffline(data);
      messagesDiv.innerHTML =
        '<span class="text-amber-600">⚠️ You are offline. Showing last saved data.</span>';
    }
  }
});

function restoreFromOffline(data) {
  schoolNameSpan.innerText = data.schoolName;
  classNameSpan.innerText = data.className;
  batchYearSpan.innerText = data.batchYear;
  classTeacherSpan.innerText = data.classTeacher;
  currentStudents = data.students;
  renderStudentsTable(currentStudents);
  previewDiv.classList.remove("hidden");
}

// ==================== EXCEL HANDLING ====================
uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFile);

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  messagesDiv.innerHTML = "";
  previewDiv.classList.add("hidden");
  spinner.classList.remove("hidden");

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const data = new Uint8Array(loadEvent.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      processWorkbook(workbook);
    } catch (error) {
      messagesDiv.innerHTML = `<span class="text-red-600">Error reading file: ${error.message}</span>`;
      spinner.classList.add("hidden");
    }
  };
  reader.readAsArrayBuffer(file);
}

function processWorkbook(workbook) {
  const sheetNames = workbook.SheetNames;
  if (!sheetNames.length) {
    messagesDiv.innerHTML =
      '<span class="text-[#F59E0B]">⚠️ No sheets found.</span>';
    spinner.classList.add("hidden");
    return;
  }

  const mainSheetName = sheetNames[0];
  const worksheet = workbook.Sheets[mainSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (rows.length === 0) {
    messagesDiv.innerHTML =
      '<span class="text-[#F59E0B]">⚠️ The sheet is empty.</span>';
    spinner.classList.add("hidden");
    return;
  }

  if (sheetNames.length > 1) {
    messagesDiv.innerHTML += `<p class="text-[#F59E0B]">⚠️ Extra worksheets: ${sheetNames.slice(1).join(", ")}. They will be ignored.</p>`;
  }

  extractData(rows);
}

const cellToString = (cell) =>
  cell !== undefined && cell !== null ? String(cell).trim() : "";

function extractData(rows) {
  let schoolName = "";
  let className = "";
  let batchYear = "";
  let classTeacher = "";
  let students = [];

  // Extract metadata (first 5 rows)
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;
    const firstCell = cellToString(row[0]);
    if (
      firstCell.includes("MARYLAND CONVENT") ||
      firstCell.includes("School")
    ) {
      schoolName = firstCell;
    }
    if (firstCell.includes("CLASS TEACHER:")) {
      classTeacher = firstCell.split(":")[1]?.trim() || "";
    }
    if (firstCell.includes("PRIMARY") || firstCell.includes("CLASS")) {
      className = firstCell;
    }
    if (firstCell.includes("BATCH-YEAR:")) {
      batchYear = firstCell.split(":")[1]?.trim() || "";
    }
  }

  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;
    const firstCell = cellToString(row[0]);
    if (firstCell === "S/N" || firstCell === "SN") {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    messagesDiv.innerHTML =
      '<span class="text-[#F59E0B]">⚠️ Could not find student table (missing S/N column).</span>';
    spinner.classList.add("hidden");
    return;
  }

  // Parse student rows
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;
    const sn = cellToString(row[0]);
    if (sn === "" || isNaN(parseInt(sn))) break;

    students.push({
      sn: sn,
      name: cellToString(row[1]),
      test: cellToString(row[2]),
      practical: cellToString(row[3]),
      exams: cellToString(row[4]),
      total: cellToString(row[5]),
      grade: cellToString(row[6]),
      remark: cellToString(row[7]) || "", // if exists
    });
  }

  currentStudents = students;

  // Update UI
  schoolNameSpan.innerText = schoolName || "Not found";
  classNameSpan.innerText = className || "Not found";
  batchYearSpan.innerText = batchYear || "Not found";
  classTeacherSpan.innerText = classTeacher || "Not found";

  renderStudentsTable(students);

  spinner.classList.add("hidden");
  previewDiv.classList.remove("hidden");
  messagesDiv.innerHTML =
    '<span class="text-[#10B981]">✅ File parsed successfully. Edit scores to update totals and grades.</span>';

  // Save offline if logged in
  if (currentUser) saveOffline();
}

function renderStudentsTable(students) {
  studentsTableBody.innerHTML = "";
  students.forEach((s, index) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-[#F9FAFB]";
    tr.innerHTML = `
            <td class="px-4 py-2">${s.sn}</td>
            <td class="px-4 py-2 font-medium">${s.name}</td>
            <td class="px-4 py-2" contenteditable="true" data-field="test" data-index="${index}">${s.test}</td>
            <td class="px-4 py-2" contenteditable="true" data-field="practical" data-index="${index}">${s.practical}</td>
            <td class="px-4 py-2" contenteditable="true" data-field="exams" data-index="${index}">${s.exams}</td>
            <td class="px-4 py-2 calculated-field" data-field="total" data-index="${index}">${s.total}</td>
            <td class="px-4 py-2 calculated-field" data-field="grade" data-index="${index}">${s.grade}</td>
            <td class="px-4 py-2" contenteditable="true" data-field="remark" data-index="${index}">${s.remark}</td>
            <td class="px-4 py-2">
                <button class="download-individual text-[#4F46E5] hover:underline text-sm" data-index="${index}">📄 PDF</button>
            </td>
        `;
    studentsTableBody.appendChild(tr);
  });

  attachEditableListeners();
  attachIndividualPDFListeners();
}

// ==================== EDITING & CALCULATIONS ====================
function calculateTotal(test, practical, exams) {
  const t = parseFloat(test) || 0;
  const p = parseFloat(practical) || 0;
  const e = parseFloat(exams) || 0;
  return (t + p + e).toFixed(2);
}

function calculateGrade(total) {
  const t = parseFloat(total);
  if (isNaN(t)) return "";
  if (t >= 80) return "A";
  if (t >= 70) return "B";
  if (t >= 60) return "C";
  if (t >= 50) return "D";
  return "F";
}

function attachEditableListeners() {
  const editableCells = document.querySelectorAll(
    '#studentsTableBody td[contenteditable="true"]',
  );
  editableCells.forEach((cell) => {
    cell.addEventListener("input", function () {
      const row = this.closest("tr");
      const testCell = row.cells[2];
      const practicalCell = row.cells[3];
      const examsCell = row.cells[4];
      const totalCell = row.cells[5];
      const gradeCell = row.cells[6];
      const remarkCell = row.cells[7]; // not auto-calculated

      const test = testCell.innerText;
      const practical = practicalCell.innerText;
      const exams = examsCell.innerText;

      const total = calculateTotal(test, practical, exams);
      totalCell.innerText = total;
      gradeCell.innerText = calculateGrade(total);

      // Update currentStudents array
      const index = row.querySelector("td[data-index]")?.dataset.index;
      if (index !== undefined) {
        currentStudents[index].test = test;
        currentStudents[index].practical = practical;
        currentStudents[index].exams = exams;
        currentStudents[index].total = total;
        currentStudents[index].grade = gradeCell.innerText;
        currentStudents[index].remark = remarkCell.innerText;
      }

      // Save offline if logged in
      if (currentUser) saveOffline();
    });
  });
}

// ==================== INDIVIDUAL PDF ====================
function attachIndividualPDFListeners() {
  document.querySelectorAll(".download-individual").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (!isPremium) {
        messagesDiv.innerHTML =
          '<span class="text-amber-600">⚠️ Individual PDF download is a premium feature. Please upgrade.</span>';
        return;
      }
      const index = this.dataset.index;
      const student = currentStudents[index];
      generateIndividualPDF(student);
    });
  });
}

async function generateIndividualPDF(student) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "pt", "a4");

  // Create a temporary report card
  const container = document.createElement("div");
  container.className = "report-card";
  container.innerHTML = `
        <h1>GradeFlow Report Card</h1>
        <div class="details">
            <div><strong>Name:</strong> ${student.name}</div>
            <div><strong>S/N:</strong> ${student.sn}</div>
            <div><strong>School:</strong> ${schoolNameSpan.innerText}</div>
            <div><strong>Class:</strong> ${classNameSpan.innerText}</div>
            <div><strong>Teacher:</strong> ${classTeacherSpan.innerText}</div>
        </div>
        <table>
            <thead><tr><th>Component</th><th>Score</th></tr></thead>
            <tbody>
                <tr><td>Test (20)</td><td>${student.test}</td></tr>
                <tr><td>Practical (20)</td><td>${student.practical}</td></tr>
                <tr><td>Exams (60)</td><td>${student.exams}</td></tr>
                <tr><td><strong>Total (100)</strong></td><td><strong>${student.total}</strong></td></tr>
                <tr><td>Grade</td><td>${student.grade}</td></tr>
                <tr><td>Remark</td><td>${student.remark || "—"}</td></tr>
            </tbody>
        </table>
    `;

  document.body.appendChild(container);
  const canvas = await html2canvas(container, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 500;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, "PNG", 40, 40, imgWidth, imgHeight);
  pdf.save(`${student.name}_report.pdf`);
  document.body.removeChild(container);
}

// ==================== CLASS PDF EXPORT ====================
exportPDFBtn.addEventListener("click", async () => {
  if (!isPremium) {
    messagesDiv.innerHTML =
      '<span class="text-amber-600">⚠️ Class PDF export is a premium feature. Please upgrade.</span>';
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("l", "pt", "a4"); // landscape

  // Build a styled table using html2canvas on a hidden div
  const container = document.createElement("div");
  container.className = "report-card";
  container.style.width = "1000px";
  container.innerHTML = `
        <h1>GradeFlow Class Report</h1>
        <div class="details">
            <div><strong>School:</strong> ${schoolNameSpan.innerText}</div>
            <div><strong>Class:</strong> ${classNameSpan.innerText}</div>
            <div><strong>Teacher:</strong> ${classTeacherSpan.innerText}</div>
            <div><strong>Batch/Year:</strong> ${batchYearSpan.innerText}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>S/N</th><th>Name</th><th>Test</th><th>Pract</th><th>Exams</th><th>Total</th><th>Grade</th><th>Remark</th>
                </tr>
            </thead>
            <tbody>
                ${currentStudents
                  .map(
                    (s) => `
                    <tr>
                        <td>${s.sn}</td>
                        <td>${s.name}</td>
                        <td>${s.test}</td>
                        <td>${s.practical}</td>
                        <td>${s.exams}</td>
                        <td>${s.total}</td>
                        <td>${s.grade}</td>
                        <td>${s.remark || ""}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    `;
  document.body.appendChild(container);
  const canvas = await html2canvas(container, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 800;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
  pdf.save("GradeFlow_Class_Report.pdf");
  document.body.removeChild(container);
});

// ==================== EXCEL EXPORT ====================
exportExcelBtn.addEventListener("click", exportToExcel);

function exportToExcel() {
  const school = schoolNameSpan.innerText;
  const className = classNameSpan.innerText;
  const batch = batchYearSpan.innerText;
  const teacher = classTeacherSpan.innerText;

  const rows = currentStudents.map((s) => [
    s.sn,
    s.name,
    s.test,
    s.practical,
    s.exams,
    s.total,
    s.grade,
    s.remark,
  ]);

  const wsData = [
    [school],
    [teacher],
    [className],
    [batch],
    [],
    [
      "S/N",
      "NAMES",
      "TEST (20)",
      "PRACTICAL (20)",
      "EXAMS(60)",
      "TOTAL (100)",
      "GRADE",
      "REMARK",
    ],
    ...rows,
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Compiled Scores");
  XLSX.writeFile(wb, "GradeFlow_Compiled.xlsx");

  messagesDiv.innerHTML =
    '<span class="text-[#10B981]">📁 File exported successfully!</span>';
  setTimeout(() => {
    messagesDiv.innerHTML =
      '<span class="text-[#10B981]">✅ File parsed successfully. Edit scores to update totals and grades.</span>';
  }, 3000);
}
