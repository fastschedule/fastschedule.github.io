let timetableData = {};

async function loadTimetableData() {
    try {
        const response = await fetch('timetable.json');
        timetableData = await response.json();
        loadDepartments();
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

// Helper function to convert time string to comparable number
function timeToNumber(timeStr) {
    // Extract hours and minutes
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format for proper sorting
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }
    
    return hours * 60 + minutes;
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
}

function loadBatchYears() {
    const department = departmentSelect.value;
    batchYearSelect.innerHTML = "<option>Select Batch Year</option>";
    if (department) {
        const batchYears = Object.keys(timetableData["Monday"][department]);
        batchYears.forEach(year => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            batchYearSelect.appendChild(option);
        });
    }
    loadSections();
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
        allSections.forEach(section => {
            const option = document.createElement("option");
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);
        });
    }
    loadTimetable();
}

function loadTimetable() {
    const department = departmentSelect.value;
    const batchYear = batchYearSelect.value;
    const day = daySelect.value;
    const section = sectionSelect.value;

    if (department && batchYear && section && day) {
        const dayData = timetableData[day][department][batchYear][section];
        if (dayData && dayData.length > 0) {
            // Sort the dayData array based on time
            const sortedData = [...dayData].sort((a, b) => {
                return timeToNumber(a.time) - timeToNumber(b.time);
            });

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
            timetableDisplay.innerHTML = "<p>No classes today</p>";
        }
    } else {
        timetableDisplay.innerHTML = "<p>Please select all fields to get the timetable.</p>";
    }
}

getTimetableBtn.addEventListener("click", loadTimetable);
departmentSelect.addEventListener("change", () => {
    loadBatchYears();
    loadSections();
});
batchYearSelect.addEventListener("change", loadSections);
sectionSelect.addEventListener("change", loadTimetable);
loadTimetableData();