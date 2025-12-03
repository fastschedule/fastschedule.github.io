let timetableData = {};
let isLoading = false;

function showLoading() {
    isLoading = true;
    getTimetableBtn.innerHTML = '<span class="spinner"></span> Loading...';
    getTimetableBtn.disabled = true;
    timetableDisplay.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading timetable data...</p></div>';
}

function hideLoading() {
    isLoading = false;
    getTimetableBtn.innerHTML = 'Get Timetable';
    getTimetableBtn.disabled = false;
}

async function loadTimetableData() {
    showLoading();
    try {
        var response = await fetch("db/timetable.json?v=" + Date.now());
        response = await response.json();
        timetableData = response;
        loadDays(); // New function to populate day dropdown
        loadDepartments();
        loadBatchYear();
    } catch (error) {
        console.error("Error loading timetable data: ", error);
    } finally{
        hideLoading();
        setDefaultDay(); // Move setDefaultDay here after data is loaded
        loadTimetable();
    }
}

const departmentSelect = document.getElementById("department");
const batchYearSelect = document.getElementById("batchYear");
const daySelect = document.getElementById("day");
const sectionSelect = document.getElementById("section");
const timetableDisplay = document.getElementById("timetableDisplay");
const getTimetableBtn = document.getElementById("getTimetableBtn");

function loadDays() {
    daySelect.innerHTML = "<option>Select Day</option>";
    
    const days = Object.keys(timetableData);

    const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    days.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        let aIndex = -1;
        let bIndex = -1;

        for (let i = 0; i < dayOrder.length; i++) {
            if (aLower.includes(dayOrder[i])) {
                aIndex = i;
                break;
            }
        }

        for (let i = 0; i < dayOrder.length; i++) {
            if (bLower.includes(dayOrder[i])) {
                bIndex = i;
                break;
            }
        }

        if (aIndex !== -1 && bIndex !== -1) {
            if (aIndex !== bIndex) {
                return aIndex - bIndex;
            }
            // If they are the same day (e.g. "Saturday" and "Saturday (makeup)")
            return a.length - b.length;
        }

        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        // Fallback for non-day keys
        return a.localeCompare(b);
    });

    days.forEach(day => {
        const option = document.createElement("option");
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    });
}

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
    const dayKeys = Object.keys(timetableData);
    if (dayKeys.length === 0) {
        console.error("Timetable data is empty. Cannot load departments.");
        return;
    }
    const firstDayKey = dayKeys[0];
    const departments = Object.keys(timetableData[firstDayKey]);
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
        const daysToCheck = Object.keys(timetableData);
        
        for (let day of daysToCheck) {
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
    const day = daySelect.value; // Use the selected value directly
    const section = sectionSelect.value;

    if (!department || !batchYear || !day || section === "Select Section" || day === "Select Day" || !section) {
        timetableDisplay.innerHTML = `<p style="padding: 1rem">Please select all fields to get the timetable.</p>`;
        return;
    }

    // No conversion needed - use day value as-is since dropdown now contains actual JSON keys

    let dayData = timetableData[day]?.[department]?.[batchYear]?.[section] || [];

    if (dayData.length > 0) {
        const validEntries = [];
        const invalidEntries = [];

        dayData.forEach(course => {
            try {
                const timeStart = timeToNumber(course.time, true);
                validEntries.push(course);
            } catch {
                invalidEntries.push(course);
            }
        });

        const sortedValidEntries = validEntries.sort((a, b) => timeToNumber(a.time) - timeToNumber(b.time));
        const finalEntries = [...sortedValidEntries, ...invalidEntries];

        const table = document.createElement("table");
        table.classList.add("timetable-table");

        const headers = ["Course", "Location", "Time"];
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
        finalEntries.forEach(course => {
            const row = document.createElement("tr");
            const tdName = document.createElement("td");
            tdName.textContent = course.name;
            // if (day === "Wednesday") {
            //     tdName.classList.add("strikethrough");
            // }
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
    let currentDayIndex = new Date().getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (currentDayIndex === 0) {
        currentDayIndex = 1;
    }
    const currentDayName = dayNames[currentDayIndex];
    
    const saturdayKeys = Object.keys(timetableData).filter(key => key.toLowerCase().includes("saturday"));

    // If today is Saturday, select the last Saturday option from dropdown
    if (currentDayName === "Saturday" && saturdayKeys.length > 0) {
        daySelect.value = saturdayKeys[saturdayKeys.length - 1];
    } else {
        daySelect.value = currentDayName;
    }
}

// getTimetableBtn.addEventListener("click", loadTimetableData);      //TOO MANY REQUESTS SO BUTTON IS JUST FOR DECORATION (:
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
    // Removed saveSelection() - day is not saved to localStorage
    loadTimetable();
});

loadTimetableData();
