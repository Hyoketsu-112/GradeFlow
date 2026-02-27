const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const previewDiv = document.getElementById("preview");
const messagesDiv = document.getElementById("messages");
const spinner = document.getElementById("spinner");

uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFile);

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  messagesDiv.innerHTML = "";
  previewDiv.classList.add("hidden");
  spinner.classList.remove("hidden"); // show spinner

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

// Helper: safely convert any cell to trimmed string
const cellToString = (cell) =>
  cell !== undefined && cell !== null ? String(cell).trim() : "";

function extractData(rows) {
  let schoolName = "";
  let className = "";
  let batchYear = "";
  let classTeacher = "";
  let students = [];

  // 1. Extract metadata from top rows (first ~5 rows)
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
      className = firstCell; // e.g., "PRIMARY 2 RED"
    }
    if (firstCell.includes("BATCH-YEAR:")) {
      batchYear = firstCell.split(":")[1]?.trim() || "";
    }
  }

  // 2. Find the header row (must contain "S/N" or "SN")
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

  // 3. Parse student rows (start after header)
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;
    const sn = cellToString(row[0]);
    // Stop if we hit an empty row or a row that doesn't start with a number (S/N)
    if (sn === "" || isNaN(parseInt(sn))) break;

    students.push({
      sn: sn,
      name: cellToString(row[1]),
      test: cellToString(row[2]),
      practical: cellToString(row[3]),
      exams: cellToString(row[4]),
      total: cellToString(row[5]),
      grade: cellToString(row[6]),
    });
  }

  // 4. Update UI with metadata
  document.getElementById("schoolName").innerText = schoolName || "Not found";
  document.getElementById("className").innerText = className || "Not found";
  document.getElementById("batchYear").innerText = batchYear || "Not found";
  document.getElementById("classTeacher").innerText =
    classTeacher || "Not found";

  // 5. Populate students table
  const tbody = document.getElementById("studentsTableBody");
  tbody.innerHTML = "";
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
        `;
    tbody.appendChild(tr);
  });

  // 6. Attach event listeners to editable fields for auto-calculation
  attachEditableListeners();

  // 7. Hide spinner, show preview
  spinner.classList.add("hidden");
  previewDiv.classList.remove("hidden");
  messagesDiv.innerHTML =
    '<span class="text-[#10B981]">✅ File parsed successfully. Edit scores to update totals and grades.</span>';
}

// Auto-calculation functions
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

      const test = testCell.innerText;
      const practical = practicalCell.innerText;
      const exams = examsCell.innerText;

      const total = calculateTotal(test, practical, exams);
      totalCell.innerText = total;
      gradeCell.innerText = calculateGrade(total);
    });
  });
}

// Export to Excel
document.getElementById("exportBtn").addEventListener("click", exportToExcel);

function exportToExcel() {
  const school = document.getElementById("schoolName").innerText;
  const className = document.getElementById("className").innerText;
  const batch = document.getElementById("batchYear").innerText;
  const teacher = document.getElementById("classTeacher").innerText;

  // Collect student rows from the table
  const rows = [];
  document.querySelectorAll("#studentsTableBody tr").forEach((tr) => {
    const tds = tr.querySelectorAll("td");
    rows.push([
      tds[0].innerText, // S/N
      tds[1].innerText, // Name
      tds[2].innerText, // Test
      tds[3].innerText, // Practical
      tds[4].innerText, // Exams
      tds[5].innerText, // Total
      tds[6].innerText, // Grade
    ]);
  });

  // Build worksheet: metadata, header, data
  const wsData = [
    [school],
    [teacher],
    [className],
    [batch],
    [], // empty row
    [
      "S/N",
      "NAMES",
      "TEST (20)",
      "PRACTICAL (20)",
      "EXAMS(60)",
      "TOTAL (100)",
      "GRADE",
    ],
    ...rows,
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Compiled Scores");
  XLSX.writeFile(wb, "MCPS_Compiled_Grades.xlsx");

  // Optional success message
  messagesDiv.innerHTML =
    '<span class="text-[#10B981]">📁 File exported successfully!</span>';
  setTimeout(() => {
    messagesDiv.innerHTML =
      '<span class="text-[#10B981]">✅ File parsed successfully. Edit scores to update totals and grades.</span>';
  }, 3000);
}
