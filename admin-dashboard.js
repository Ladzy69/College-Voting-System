/* =========================================================
   COLLEGE VOTING SYSTEM
   ADMIN DASHBOARD JAVASCRIPT
   ========================================================= */

/* =========================================================
   ACCESS PROTECTION
   ========================================================= */

if (sessionStorage.getItem("adminLoggedIn") !== "true") {
    window.location.href = "admin-login.html";
}

/* =========================================================
   STORAGE KEYS
   ========================================================= */

const STORAGE_KEYS = {
    candidates: "candidates",
    students: "registeredStudents",
    votes: "votes",
    votedStudents: "votedStudents",
    electionStatus: "electionStatus",
    votingSchedule: "votingSchedule"
};

const POSITIONS = ["president", "vicePresident", "secretary"];

const POSITION_LABELS = {
    president: "President",
    vicePresident: "Vice President",
    secretary: "Secretary"
};

/* =========================================================
   DEFAULT DATA
   ========================================================= */

const DEFAULT_STUDENTS = [
    {
        id: "2024-0001",
        name: "Juan Dela Cruz",
        program: "BSIT",
        year: "2nd Year"
    },
    {
        id: "2024-0002",
        name: "Maria Santos",
        program: "BSBA",
        year: "1st Year"
    },
    {
        id: "2024-0003",
        name: "Pedro Reyes",
        program: "BSED",
        year: "3rd Year"
    }
];

const DEFAULT_CANDIDATES = {
    president: [
        { name: "Candidate A" },
        { name: "Candidate B" }
    ],
    vicePresident: [
        { name: "Candidate C" },
        { name: "Candidate D" }
    ],
    secretary: [
        { name: "Candidate E" },
        { name: "Candidate F" }
    ]
};

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function readJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        const parsed = JSON.parse(value);
        return parsed;
    } catch (error) {
        console.error("Unable to read localStorage:", key, error);
        return fallback;
    }
}

function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Unable to save localStorage:", key, error);
        return false;
    }
}

function getElement(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getCandidateName(candidate) {
    if (typeof candidate === "string") {
        return candidate.trim();
    }

    if (candidate && typeof candidate === "object") {
        return String(
            candidate.name ||
            candidate.candidateName ||
            ""
        ).trim();
    }

    return "";
}

function normalizeCandidates(data) {
    const result = {
        president: [],
        vicePresident: [],
        secretary: []
    };

    POSITIONS.forEach(function (position) {
        const list = Array.isArray(data && data[position])
            ? data[position]
            : [];

        result[position] = list
            .map(function (candidate) {
                const name = getCandidateName(candidate);

                if (!name) {
                    return null;
                }

                return { name: name };
            })
            .filter(Boolean);
    });

    return result;
}

function getCandidates() {
    const stored = readJSON(
        STORAGE_KEYS.candidates,
        null
    );

    if (!stored) {
        writeJSON(
            STORAGE_KEYS.candidates,
            DEFAULT_CANDIDATES
        );

        return normalizeCandidates(DEFAULT_CANDIDATES);
    }

    return normalizeCandidates(stored);
}

function saveCandidates(candidates) {
    return writeJSON(
        STORAGE_KEYS.candidates,
        normalizeCandidates(candidates)
    );
}

function getStudents() {
    const stored = readJSON(
        STORAGE_KEYS.students,
        null
    );

    if (!stored) {
        writeJSON(
            STORAGE_KEYS.students,
            DEFAULT_STUDENTS
        );

        return DEFAULT_STUDENTS.slice();
    }

    return Array.isArray(stored) ? stored : [];
}

function getVotes() {
    const stored = readJSON(
        STORAGE_KEYS.votes,
        {}
    );

    return stored && typeof stored === "object"
        ? stored
        : {};
}

function getVotedStudents() {
    const stored = readJSON(
        STORAGE_KEYS.votedStudents,
        []
    );

    return Array.isArray(stored) ? stored : [];
}

function getElectionStatus() {
    return localStorage.getItem(
        STORAGE_KEYS.electionStatus
    ) || "closed";
}

function setElectionStatus(status) {
    localStorage.setItem(
        STORAGE_KEYS.electionStatus,
        status
    );
}

function getVotingSchedule() {
    return readJSON(
        STORAGE_KEYS.votingSchedule,
        null
    );
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    initializeDashboard();
});

function initializeDashboard() {
    initializeStorage();
    bindButtons();
    synchronizeElectionSchedule();
    refreshDashboard();

    setInterval(function () {
        synchronizeElectionSchedule();
        updateCountdown();
    }, 1000);
}

function initializeStorage() {
    getCandidates();
    getStudents();
    getVotes();
    getVotedStudents();

    if (!localStorage.getItem(STORAGE_KEYS.electionStatus)) {
        setElectionStatus("closed");
    }
}

/* =========================================================
   REFRESH DASHBOARD
   ========================================================= */

function refreshDashboard() {
    updateStatistics();
    updateResults();
    updateWinners();
    updateTurnout();
    updateCandidateLists();
    updateVoterTable();
    updateElectionStatusDisplay();
    updateScheduleDisplay();
    updateCountdown();
}

/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {
    const students = getStudents();
    const votedStudents = getVotedStudents();
    const votes = getVotes();

    let voteRecords = 0;

    Object.keys(votes).forEach(function (studentId) {
        const record = votes[studentId];

        if (record && typeof record === "object") {
            voteRecords++;
        }
    });

    const totalVotes = Math.max(
        votedStudents.length,
        voteRecords
    );

    const notVoted = Math.max(
        students.length - totalVotes,
        0
    );

    const totalStudentsElement = getElement("totalStudents");
    const totalVotesElement = getElement("totalVotes");
    const votedStudentsElement = getElement("votedStudents");
    const notVotedStudentsElement = getElement("notVotedStudents");

    if (totalStudentsElement) {
        totalStudentsElement.textContent = students.length;
    }

    if (totalVotesElement) {
        totalVotesElement.textContent = totalVotes;
    }

    if (votedStudentsElement) {
        votedStudentsElement.textContent = totalVotes;
    }

    if (notVotedStudentsElement) {
        notVotedStudentsElement.textContent = notVoted;
    }
}

/* =========================================================
   RESULTS
   ========================================================= */

function countVotesForPosition(position) {
    const candidates = getCandidates();
    const votes = getVotes();

    const validNames = candidates[position]
        .map(function (candidate) {
            return getCandidateName(candidate);
        })
        .filter(Boolean);

    const counts = {};

    validNames.forEach(function (name) {
        counts[name] = 0;
    });

    Object.keys(votes).forEach(function (studentId) {
        const record = votes[studentId];

        if (!record || typeof record !== "object") {
            return;
        }

        const selected = record[position];

        if (typeof selected !== "string") {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(counts, selected)) {
            counts[selected]++;
        }
    });

    return counts;
}

function updateResults() {
    POSITIONS.forEach(function (position) {
        const container = getElement(
            position === "president"
                ? "presidentResults"
                : position === "vicePresident"
                    ? "vicePresidentResults"
                    : "secretaryResults"
        );

        if (!container) {
            return;
        }

        const counts = countVotesForPosition(position);
        const names = Object.keys(counts);

        if (names.length === 0) {
            container.innerHTML =
                '<div class="empty-message">No candidates available.</div>';
            return;
        }

        names.sort(function (a, b) {
            return counts[b] - counts[a] ||
                a.localeCompare(b);
        });

        container.innerHTML = names.map(function (name) {
            return (
                '<div class="result-item">' +
                    '<div class="result-name">' +
                        escapeHTML(name) +
                    '</div>' +
                    '<div class="result-votes">' +
                        counts[name] +
                        " vote" +
                        (counts[name] === 1 ? "" : "s") +
                    "</div>" +
                "</div>"
            );
        }).join("");
    });
}

/* =========================================================
   WINNERS
   ========================================================= */

function getWinner(position) {
    const counts = countVotesForPosition(position);
    const names = Object.keys(counts);

    if (names.length === 0) {
        return {
            name: "No winner yet",
            votes: 0,
            tie: false
        };
    }

    let highest = -1;
    let winners = [];

    names.forEach(function (name) {
        const count = counts[name];

        if (count > highest) {
            highest = count;
            winners = [name];
        } else if (count === highest) {
            winners.push(name);
        }
    });

    if (highest <= 0) {
        return {
            name: "No winner yet",
            votes: 0,
            tie: false
        };
    }

    return {
        name: winners.join(" / "),
        votes: highest,
        tie: winners.length > 1
    };
}

function updateWinners() {
    const winnerMap = {
        president: {
            name: "presidentWinner",
            votes: "presidentWinnerVotes"
        },
        vicePresident: {
            name: "vicePresidentWinner",
            votes: "vicePresidentWinnerVotes"
        },
        secretary: {
            name: "secretaryWinner",
            votes: "secretaryWinnerVotes"
        }
    };

    POSITIONS.forEach(function (position) {
        const winner = getWinner(position);
        const ids = winnerMap[position];

        const nameElement = getElement(ids.name);
        const votesElement = getElement(ids.votes);

        if (nameElement) {
            nameElement.textContent = winner.name;
        }

        if (votesElement) {
            votesElement.textContent =
                winner.votes +
                " vote" +
                (winner.votes === 1 ? "" : "s");
        }
    });
}

/* =========================================================
   TURNOUT
   ========================================================= */

function updateTurnout() {
    const students = getStudents();
    const votedStudents = getVotedStudents();
    const votes = getVotes();

    let voteCount = votedStudents.length;

    if (voteCount === 0) {
        voteCount = Object.keys(votes).filter(function (id) {
            return votes[id] &&
                typeof votes[id] === "object";
        }).length;
    }

    const percentage = students.length > 0
        ? (voteCount / students.length) * 100
        : 0;

    const turnoutElement = getElement("turnoutPercentage");

    if (turnoutElement) {
        turnoutElement.textContent =
            percentage.toFixed(1) + "%";
    }
}

/* =========================================================
   CANDIDATE MANAGEMENT
   ========================================================= */

function updateCandidateLists() {
    const candidates = getCandidates();

    const elementMap = {
        president: "adminPresidentCandidates",
        vicePresident: "adminVicePresidentCandidates",
        secretary: "adminSecretaryCandidates"
    };

    POSITIONS.forEach(function (position) {
        const container = getElement(
            elementMap[position]
        );

        if (!container) {
            return;
        }

        const list = candidates[position];

        if (list.length === 0) {
            container.innerHTML =
                '<div class="empty-message">No candidates added.</div>';
            return;
        }

        container.innerHTML = list.map(function (candidate) {
            const name = getCandidateName(candidate);

            return (
                '<div class="candidate-item">' +
                    '<span class="candidate-name">' +
                        escapeHTML(name) +
                    "</span>" +
                    '<button type="button" ' +
                        'class="delete-candidate-button" ' +
                        'data-position="' +
                        escapeHTML(position) +
                        '" ' +
                        'data-name="' +
                        escapeHTML(name) +
                        '">' +
                        "Delete" +
                    "</button>" +
                "</div>"
            );
        }).join("");

        const deleteButtons =
            container.querySelectorAll(
                ".delete-candidate-button"
            );

        deleteButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                const position =
                    button.getAttribute("data-position");

                const name =
                    button.getAttribute("data-name");

                deleteCandidate(position, name);
            });
        });
    });
}

function addCandidate() {
    const positionElement =
        getElement("candidatePosition");

    const nameElement =
        getElement("candidateName");

    if (!positionElement || !nameElement) {
        return;
    }

    const position =
        positionElement.value.trim();

    const name =
        nameElement.value.trim();

    if (!position || !POSITIONS.includes(position)) {
        alert("Please select a valid position.");
        return;
    }

    if (!name) {
        alert("Please enter a candidate name.");
        nameElement.focus();
        return;
    }

    const candidates = getCandidates();

    const exists = candidates[position].some(function (candidate) {
        return getCandidateName(candidate).toLowerCase() ===
            name.toLowerCase();
    });

    if (exists) {
        alert("That candidate already exists for this position.");
        return;
    }

    candidates[position].push({
        name: name
    });

    saveCandidates(candidates);

    nameElement.value = "";

    updateCandidateLists();
    updateResults();
    updateWinners();

    alert(
        name +
        " has been added as " +
        POSITION_LABELS[position] +
        "."
    );
}

function deleteCandidate(position, name) {
    if (!POSITIONS.includes(position)) {
        return;
    }

    const candidates = getCandidates();

    const confirmed = confirm(
        'Delete "' +
        name +
        '" from ' +
        POSITION_LABELS[position] +
        "?"
    );

    if (!confirmed) {
        return;
    }

    candidates[position] = candidates[position].filter(
        function (candidate) {
            return getCandidateName(candidate).toLowerCase() !==
                name.toLowerCase();
        }
    );

    saveCandidates(candidates);

    updateCandidateLists();
    updateResults();
    updateWinners();
}

/* =========================================================
   VOTER TABLE
   ========================================================= */

function hasStudentVoted(studentId) {
    const votedStudents = getVotedStudents();
    const votes = getVotes();

    if (votedStudents.includes(studentId)) {
        return true;
    }

    return Boolean(
        votes[studentId] &&
        typeof votes[studentId] === "object"
    );
}

function updateVoterTable() {
    const tableBody = getElement("voterTableBody");

    if (!tableBody) {
        return;
    }

    const students = getStudents();

    if (students.length === 0) {
        tableBody.innerHTML =
            '<tr><td colspan="5">No registered students.</td></tr>';
        return;
    }

    tableBody.innerHTML = students.map(function (student) {
        const id = student.id ||
            student.studentID ||
            student.Student_id_number ||
            "";

        const name = student.name ||
            student.fullName ||
            "";

        const program = student.program ||
            "";

        const year = student.year ||
            student.yearLevel ||
            "";

        const voted = hasStudentVoted(id);

        return (
            "<tr>" +
                "<td>" + escapeHTML(id) + "</td>" +
                "<td>" + escapeHTML(name) + "</td>" +
                "<td>" + escapeHTML(program) + "</td>" +
                "<td>" + escapeHTML(year) + "</td>" +
                "<td>" +
                    '<span class="' +
                        (voted
                            ? "status-voted"
                            : "status-not-voted") +
                    '">' +
                        (voted ? "Voted" : "Not Voted") +
                    "</span>" +
                "</td>" +
            "</tr>"
        );
    }).join("");
}

/* =========================================================
   ELECTION STATUS
   ========================================================= */

function updateElectionStatusDisplay() {
    const status =
        getElectionStatus();

    const statusText =
        getElement("electionStatusText");

    const statusBadge =
        getElement("electionStatusBadge");

    const isOpen = status === "open";

    if (statusText) {
        statusText.textContent =
            isOpen ? "Election is Open" : "Election is Closed";
    }

    if (statusBadge) {
        statusBadge.textContent =
            isOpen ? "OPEN" : "CLOSED";

        statusBadge.classList.remove(
            "open",
            "closed",
            "active",
            "inactive"
        );

        statusBadge.classList.add(
            isOpen ? "open" : "closed"
        );
    }
}

function openElection() {
    const schedule = getVotingSchedule();
    const now = new Date();

    if (schedule) {
        const start = new Date(schedule.start);
        const end = new Date(schedule.end);

        if (now < start) {
            alert(
                "The election cannot be opened yet.\n\n" +
                "The scheduled voting period has not started."
            );
            return;
        }

        if (now >= end) {
            alert(
                "The scheduled voting period has already ended."
            );
            setElectionStatus("closed");
            updateElectionStatusDisplay();
            return;
        }
    }

    setElectionStatus("open");
    updateElectionStatusDisplay();
    updateCountdown();

    alert("The election is now OPEN.");
}

function closeElection() {
    setElectionStatus("closed");
    updateElectionStatusDisplay();
    updateCountdown();

    alert("The election is now CLOSED.");
}

/* =========================================================
   SCHEDULE MANAGEMENT
   ========================================================= */

function setVotingSchedule() {
    const startDateElement =
        getElement("votingStartDate");

    const startTimeElement =
        getElement("votingStartTime");

    const endDateElement =
        getElement("votingEndDate");

    const endTimeElement =
        getElement("votingEndTime");

    if (
        !startDateElement ||
        !startTimeElement ||
        !endDateElement ||
        !endTimeElement
    ) {
        alert("Schedule fields could not be found.");
        return;
    }

    const startValue =
        startDateElement.value +
        "T" +
        startTimeElement.value;

    const endValue =
        endDateElement.value +
        "T" +
        endTimeElement.value;

    const start = new Date(startValue);
    const end = new Date(endValue);

    if (
        !startDateElement.value ||
        !startTimeElement.value ||
        !endDateElement.value ||
        !endTimeElement.value
    ) {
        alert("Please complete all voting schedule fields.");
        return;
    }

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        alert("Please enter valid schedule dates and times.");
        return;
    }

    if (end <= start) {
        alert(
            "The voting end date and time must be later than the start date and time."
        );
        return;
    }

    const schedule = {
        start: start.toISOString(),
        end: end.toISOString()
    };

    writeJSON(
        STORAGE_KEYS.votingSchedule,
        schedule
    );

    setElectionStatus("closed");

    updateScheduleDisplay();
    synchronizeElectionSchedule();
    updateCountdown();

    alert("Voting schedule saved successfully.");
}

function clearVotingSchedule() {
    const confirmed = confirm(
        "Clear the current voting schedule?"
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        STORAGE_KEYS.votingSchedule
    );

    setElectionStatus("closed");

    const startDateElement =
        getElement("votingStartDate");

    const startTimeElement =
        getElement("votingStartTime");

    const endDateElement =
        getElement("votingEndDate");

    const endTimeElement =
        getElement("votingEndTime");

    if (startDateElement) {
        startDateElement.value = "";
    }

    if (startTimeElement) {
        startTimeElement.value = "";
    }

    if (endDateElement) {
        endDateElement.value = "";
    }

    if (endTimeElement) {
        endTimeElement.value = "";
    }

    updateScheduleDisplay();
    updateElectionStatusDisplay();
    updateCountdown();

    alert("Voting schedule cleared.");
}

function synchronizeElectionSchedule() {
    const schedule = getVotingSchedule();

    if (!schedule || !schedule.start || !schedule.end) {
        updateElectionStatusDisplay();
        return;
    }

    const start = new Date(schedule.start);
    const end = new Date(schedule.end);
    const now = new Date();

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        setElectionStatus("closed");
        updateElectionStatusDisplay();
        return;
    }

    if (now < start) {
        setElectionStatus("closed");
    } else if (now >= start && now < end) {
        setElectionStatus("open");
    } else {
        setElectionStatus("closed");
    }

    updateElectionStatusDisplay();
}

function formatDateTime(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return date.toLocaleString();
}

function updateScheduleDisplay() {
    const schedule = getVotingSchedule();

    const startDisplay =
        getElement("currentStartSchedule");

    const endDisplay =
        getElement("currentEndSchedule");

    if (!schedule) {
        if (startDisplay) {
            startDisplay.textContent = "Not scheduled";
        }

        if (endDisplay) {
            endDisplay.textContent = "Not scheduled";
        }

        return;
    }

    if (startDisplay) {
        startDisplay.textContent =
            formatDateTime(schedule.start);
    }

    if (endDisplay) {
        endDisplay.textContent =
            formatDateTime(schedule.end);
    }

    fillScheduleInputs(schedule);
}

function fillScheduleInputs(schedule) {
    if (!schedule) {
        return;
    }

    const start = new Date(schedule.start);
    const end = new Date(schedule.end);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return;
    }

    const startDateElement =
        getElement("votingStartDate");

    const startTimeElement =
        getElement("votingStartTime");

    const endDateElement =
        getElement("votingEndDate");

    const endTimeElement =
        getElement("votingEndTime");

    if (startDateElement) {
        startDateElement.value =
            toDateInputValue(start);
    }

    if (startTimeElement) {
        startTimeElement.value =
            toTimeInputValue(start);
    }

    if (endDateElement) {
        endDateElement.value =
            toDateInputValue(end);
    }

    if (endTimeElement) {
        endTimeElement.value =
            toTimeInputValue(end);
    }
}

function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

function toTimeInputValue(date) {
    const hours = String(
        date.getHours()
    ).padStart(2, "0");

    const minutes = String(
        date.getMinutes()
    ).padStart(2, "0");

    return hours + ":" + minutes;
}

/* =========================================================
   COUNTDOWN
   ========================================================= */

function updateCountdown() {
    const timeElement =
        getElement("adminCountdownTime");

    const messageElement =
        getElement("adminCountdownMessage");

    const schedule = getVotingSchedule();

    if (!timeElement && !messageElement) {
        return;
    }

    if (!schedule) {
        if (timeElement) {
            timeElement.textContent = "--:--:--:--";
        }

        if (messageElement) {
            messageElement.textContent =
                "No voting schedule is set.";
        }

        return;
    }

    const start = new Date(schedule.start);
    const end = new Date(schedule.end);
    const now = new Date();

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        if (timeElement) {
            timeElement.textContent = "--:--:--:--";
        }

        if (messageElement) {
            messageElement.textContent =
                "Invalid voting schedule.";
        }

        return;
    }

    let difference;
    let message;

    if (now < start) {
        difference = start.getTime() - now.getTime();
        message = "Voting starts in";
    } else if (now < end) {
        difference = end.getTime() - now.getTime();
        message = "Voting closes in";
    } else {
        difference = 0;
        message = "Voting period has ended";
    }

    const totalSeconds =
        Math.max(
            0,
            Math.floor(difference / 1000)
        );

    const days =
        Math.floor(totalSeconds / 86400);

    const hours =
        Math.floor(
            (totalSeconds % 86400) / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    if (timeElement) {
        timeElement.textContent =
            String(days).padStart(2, "0") +
            ":" +
            String(hours).padStart(2, "0") +
            ":" +
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0");
    }

    if (messageElement) {
        messageElement.textContent = message;
    }
}

/* =========================================================
   RESET VOTES
   ========================================================= */

function resetVotes() {
    const confirmed = confirm(
        "Are you sure you want to reset all votes?\n\n" +
        "This will remove all vote records and voted-student records."
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        STORAGE_KEYS.votes
    );

    localStorage.removeItem(
        STORAGE_KEYS.votedStudents
    );

    sessionStorage.removeItem(
        "selectedCandidates"
    );

    updateStatistics();
    updateResults();
    updateWinners();
    updateTurnout();
    updateVoterTable();

    alert("All votes have been reset.");
}

/* =========================================================
   REFRESH BUTTON
   ========================================================= */

function refreshDashboardData() {
    synchronizeElectionSchedule();
    refreshDashboard();

    alert("Dashboard refreshed.");
}

/* =========================================================
   LOGOUT
   ========================================================= */

function logoutAdmin() {
    const confirmed = confirm(
        "Are you sure you want to log out?"
    );

    if (!confirmed) {
        return;
    }

    sessionStorage.removeItem(
        "adminLoggedIn"
    );

    window.location.href =
        "admin-login.html";
}

/* =========================================================
   EXPORT DATA
   ========================================================= */

function exportData() {
    const backup = {
        backupType: "College Voting System Backup",
        version: "1.0",
        exportedAt: new Date().toISOString(),

        candidates: getCandidates(),
        registeredStudents: getStudents(),
        votes: getVotes(),
        votedStudents: getVotedStudents(),
        electionStatus: getElectionStatus(),
        votingSchedule: getVotingSchedule()
    };

    const json = JSON.stringify(
        backup,
        null,
        2
    );

    const blob = new Blob(
        [json],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    const date = new Date()
        .toISOString()
        .slice(0, 10);

    link.href = url;
    link.download =
        "college-voting-backup-" +
        date +
        ".json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function importData() {
    const fileInput =
        getElement("importDataFile");

    if (!fileInput) {
        alert("Import file control was not found.");
        return;
    }

    fileInput.click();
}

function handleImportFile(event) {
    const file =
        event.target.files &&
        event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        try {
            const backup =
                JSON.parse(reader.result);

            if (
                !backup ||
                backup.backupType !==
                "College Voting System Backup"
            ) {
                alert(
                    "This is not a valid College Voting System backup file."
                );

                event.target.value = "";
                return;
            }

            const confirmed = confirm(
                "Import this backup?\n\n" +
                "Existing browser data with the same storage keys will be replaced."
            );

            if (!confirmed) {
                event.target.value = "";
                return;
            }

            if (backup.candidates) {
                saveCandidates(
                    normalizeCandidates(
                        backup.candidates
                    )
                );
            }

            if (
                Array.isArray(
                    backup.registeredStudents
                )
            ) {
                writeJSON(
                    STORAGE_KEYS.students,
                    backup.registeredStudents
                );
            }

            if (backup.votes) {
                writeJSON(
                    STORAGE_KEYS.votes,
                    backup.votes
                );
            }

            if (
                Array.isArray(
                    backup.votedStudents
                )
            ) {
                writeJSON(
                    STORAGE_KEYS.votedStudents,
                    backup.votedStudents
                );
            }

            if (
                backup.electionStatus === "open" ||
                backup.electionStatus === "closed"
            ) {
                setElectionStatus(
                    backup.electionStatus
                );
            }

            if (backup.votingSchedule) {
                writeJSON(
                    STORAGE_KEYS.votingSchedule,
                    backup.votingSchedule
                );
            } else {
                localStorage.removeItem(
                    STORAGE_KEYS.votingSchedule
                );
            }

            synchronizeElectionSchedule();
            refreshDashboard();

            alert(
                "Backup imported successfully."
            );
        } catch (error) {
            console.error(
                "Import error:",
                error
            );

            alert(
                "Unable to import the backup file. " +
                "Please make sure you selected a valid JSON backup."
            );
        }

        event.target.value = "";
    };

    reader.onerror = function () {
        alert("Unable to read the selected file.");
        event.target.value = "";
    };

    reader.readAsText(file);
}

/* =========================================================
   BUTTON BINDING
   ========================================================= */

function bindButtons() {
    const logoutButton =
        getElement("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logoutAdmin
        );
    }

    const refreshButton =
        getElement("refreshButton");

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            refreshDashboardData
        );
    }

    const controlRefreshButton =
        getElement("controlRefreshButton");

    if (controlRefreshButton) {
        controlRefreshButton.addEventListener(
            "click",
            refreshDashboardData
        );
    }

    const addCandidateButton =
        getElement("addCandidateButton");

    if (addCandidateButton) {
        addCandidateButton.addEventListener(
            "click",
            addCandidate
        );
    }

    const openElectionButton =
        getElement("openElectionButton");

    if (openElectionButton) {
        openElectionButton.addEventListener(
            "click",
            openElection
        );
    }

    const closeElectionButton =
        getElement("closeElectionButton");

    if (closeElectionButton) {
        closeElectionButton.addEventListener(
            "click",
            closeElection
        );
    }

    const setVotingScheduleButton =
        getElement("setVotingScheduleButton");

    if (setVotingScheduleButton) {
        setVotingScheduleButton.addEventListener(
            "click",
            setVotingSchedule
        );
    }

    const clearVotingScheduleButton =
        getElement("clearVotingScheduleButton");

    if (clearVotingScheduleButton) {
        clearVotingScheduleButton.addEventListener(
            "click",
            clearVotingSchedule
        );
    }

    const resetVotesButton =
        getElement("resetVotesButton");

    if (resetVotesButton) {
        resetVotesButton.addEventListener(
            "click",
            resetVotes
        );
    }

    const exportDataButton =
        getElement("exportDataButton");

    if (exportDataButton) {
        exportDataButton.addEventListener(
            "click",
            exportData
        );
    }

    const importDataButton =
        getElement("importDataButton");

    if (importDataButton) {
        importDataButton.addEventListener(
            "click",
            importData
        );
    }

    const importDataFile =
        getElement("importDataFile");

    if (importDataFile) {
        importDataFile.addEventListener(
            "change",
            handleImportFile
        );
    }
}

/* =========================================================
   END OF ADMIN DASHBOARD JAVASCRIPT
   ========================================================= */
