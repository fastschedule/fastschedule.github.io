document.addEventListener("DOMContentLoaded", async function () {
    let saturdayLabel = "Saturday";
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday","Saturday"];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const defaultDay = days.includes(today) ? today : "Monday";
    let roomData = {};
    let isLoading = false;

    const select = document.getElementById("roomDay");
    const roomsDisplay = document.getElementById("roomsDisplay");
    const getRoomsBtn = document.getElementById("getRoomsBtn");

    days.forEach(day => {
        const option = document.createElement("option");
        option.value = day;
        option.textContent = day;
        if (day === defaultDay) option.selected = true;
        select.appendChild(option);
    });

    function showLoading() {
        isLoading = true;
        getRoomsBtn.innerHTML = '<span class="spinner"></span> Loading...';
        getRoomsBtn.disabled = true;
        roomsDisplay.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading room data...</p></div>';
    }

    function hideLoading() {
        isLoading = false;
        getRoomsBtn.innerHTML = 'Get Free Rooms';
        getRoomsBtn.disabled = false;
    }

    async function fetchRoomData() {
        if (isLoading) return;

        showLoading();
        try {
            const response = await fetch("https://fastschedulerooms.abdulmoiz-marz.workers.dev/");
            const result = await response.json();
            roomData = result.data || {};
            for (let key of Object.keys(roomData)) {
                if (key.startsWith("Saturday")) {
                    saturdayLabel = key;
                    break;
                }
            }
            displayRooms(select.value);
        } catch (error) {
            console.error("Error fetching room data:", error);
            roomsDisplay.innerHTML = `<p style="padding: 1rem">Failed to load room data.</p>`;
        } finally {
            hideLoading();
        }
    }

    function timeToNumber(timeStr) {
        const cleanTimeStr = timeStr.replace(/\s*\(.*?\)/g, ""); 
        const [start, end] = cleanTimeStr.split('-');
        const time = start.trim();
        let [hours, minutes] = time.split(':').map(Number);

        if (hours === 12) return 12 * 60 + minutes;
        if (hours >= 8 && hours < 12) return hours * 60 + minutes;
        if (hours >= 1 && hours < 8) return (hours + 12) * 60 + minutes;

        throw new Error(`Invalid time format: ${time}`);
    }

    function displayRooms(day) {
        if (day === "Saturday") {
            day = saturdayLabel;
        }
        let rooms = roomData[day] || [];

        if (rooms.length === 0) {
            roomsDisplay.innerHTML = "<p>No available rooms.</p>";
        } else {

            rooms = rooms
            .map(room => ({
                location: room.location?.trim(),
                time: room.time?.replace(/\s*\(.*?\)/g, "").trim(),
            }))
            .filter(room => room.time && room.time.toUpperCase() !== "N/A")
            .sort((a, b) => timeToNumber(a.time) - timeToNumber(b.time));

            let output = `<table class="rooms-table"><thead><tr><th>Location</th><th>Time</th></tr></thead><tbody>`;
            rooms.forEach(room => {
                output += `<tr><td>${room.location}</td><td>${room.time}</td></tr>`;
            });
            output += `</tbody></table>`;
            roomsDisplay.innerHTML = output;
        }
    }

    select.addEventListener("change", function () {
        displayRooms(this.value);
    });

    // getRoomsBtn.addEventListener("click", fetchRoomData);      //TOO MANY REQUESTS SO BUTTON IS JUST FOR DECORATION (:

    await fetchRoomData();
});