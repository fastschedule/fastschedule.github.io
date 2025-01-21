let timetableData = {};
async function loadTimetableData() {
    try {
        const response = await fetch('db/timetable.json');
        timetableData = await response.json();
        loadDepartments();
        loadBatchYear();
    } catch (error) {
        console.error("Error loading timetable data: ", error);
    }
}

const departmentSelect = document.getElementById("department");
const batchYearSelect = document.getElementById("batchYear");
const daySelect = document.getElementById("day");
const sectionSelect = document.getElementById("section");
const timetableDisplay = document.getElementById("timetableDisplay");
const getTimetableBtn = document.getElementById("getTimetableBtn");

function loadBatchYear() {
    const savedBatchYear = localStorage.getItem("selectedBatchYear");
    if (savedBatchYear) {
        batchYearSelect.value = savedBatchYear;
        loadSections();
    }
}

function timeToNumber(timeStr, isStart = true) {
    const [start, end] = timeStr.split('-');
    const time = isStart ? start.trim() : end.trim();
    let [hours, minutes] = time.split(':').map(Number);

    if (hours === 12) return 12 * 60 + minutes;
    if (hours >= 8 && hours < 12) return hours * 60 + minutes;
    if (hours >= 1 && hours < 8) return (hours + 12) * 60 + minutes;

    throw new Error(`Invalid time format: ${time}`);
}

function loadDepartments() {
    const departments = Object.keys(timetableData["Monday"]);
    departmentSelect.innerHTML = "<option>Select Department</option>";
    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department;
        option.textContent = department;
        departmentSelect.appendChild(option);
    });

    const savedDepartment = localStorage.getItem("selectedDepartment");
    if (savedDepartment) {
        departmentSelect.value = savedDepartment;
        loadSections();
    }
}

function loadSections() {
    const department = departmentSelect.value;
    const batchYear = batchYearSelect.value;
    sectionSelect.innerHTML = "<option>Select Section</option>";
    if (department && batchYear) {
        const allSections = new Set();
        for (let day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) {
            if (timetableData[day] && timetableData[day][department] && timetableData[day][department][batchYear]) {
                const sections = Object.keys(timetableData[day][department][batchYear]);
                sections.forEach(section => allSections.add(section));
            }
        }

        const sortedSections = [...allSections].sort();
        sortedSections.forEach(section => {
            const option = document.createElement("option");
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);
        });

        const savedSection = localStorage.getItem("selectedSection");
        if (savedSection) {
            sectionSelect.value = savedSection;
        }
    }
    loadTimetable();
}

function loadTimetable() {
    const department = departmentSelect.value;
    const batchYear = batchYearSelect.value;
    const day = daySelect.value;
    const section = sectionSelect.value;

    if (!department || !batchYear || !day || section === "Select Section" || day === "Select Day" || !section) {
        timetableDisplay.innerHTML = `<p style="padding: 1rem">Please select all fields to get the timetable.</p>`;
        return;
    }

    const dayData = timetableData[day]?.[department]?.[batchYear]?.[section];
    if (dayData && dayData.length > 0) {
        const sortedData = [...dayData].sort((a, b) => timeToNumber(a.time) - timeToNumber(b.time));

        const table = document.createElement("table");
        table.classList.add("timetable-table");

        const headers = ["Course Name", "Location", "Time"];
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        headers.forEach(header => {
            const th = document.createElement("th");
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        sortedData.forEach(course => {
            const row = document.createElement("tr");
            const tdName = document.createElement("td");
            tdName.textContent = course.name;
            const tdLocation = document.createElement("td");
            tdLocation.textContent = course.location;
            const tdTime = document.createElement("td");
            tdTime.textContent = course.time;
            row.appendChild(tdName);
            row.appendChild(tdLocation);
            row.appendChild(tdTime);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        timetableDisplay.innerHTML = "";
        timetableDisplay.appendChild(table);
    } else {
        timetableDisplay.innerHTML = `<p style="padding: 1rem">No classes today</p>`;
    }
}

function saveSelection() {
    localStorage.setItem("selectedDepartment", departmentSelect.value);
    localStorage.setItem("selectedBatchYear", batchYearSelect.value);
    localStorage.setItem("selectedSection", sectionSelect.value);
}

function setDefaultDay() {
    const currentDayIndex = new Date().getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (currentDayIndex === 0 || currentDayIndex === 6) {
        currentDayIndex = 1;
    }
    const currentDayName = dayNames[currentDayIndex];

    daySelect.value = currentDayName;
}

getTimetableBtn.addEventListener("click", loadTimetable);
departmentSelect.addEventListener("change", () => {
    saveSelection();
    loadSections();
});
batchYearSelect.addEventListener("change", () => {
    saveSelection();
    loadSections();
});
sectionSelect.addEventListener("change", () => {
    saveSelection();
    loadTimetable();
});
daySelect.addEventListener("change", () => {
    saveSelection();
    loadTimetable();
});

loadTimetableData();
setDefaultDay();