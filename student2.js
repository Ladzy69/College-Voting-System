// ======================================================
// COLLEGE VOTING SYSTEM - STUDENT SIDE
// ======================================================
// FULL UPDATED VERSION
//
// Compatible with Admin Dashboard:
// localStorage keys:
//   electionStatus
//   votingSchedule
//   votes
//   votedStudents
//
// Added:
//   - Live voting countdown
//   - Automatic voting lock when schedule ends
//   - Voting status display
//   - Duplicate-vote protection
//   - Printable ballot/receipt
//   - Return to login after voting
//   - Preserves existing candidate selection system
// ======================================================


// ======================================================
// STUDENT DATA / REGISTRATION
// ======================================================
// Student accounts are created by student-signup.js and
// stored in localStorage under "registeredStudents".
// Student IDs must contain exactly 8 digits.
// Example: 20100969
// ======================================================

const REGISTERED_STUDENTS_KEY = "registeredStudents";


function getRegisteredStudents() {

    try {

        const savedStudents =
            localStorage.getItem(REGISTERED_STUDENTS_KEY);

        if (!savedStudents) {
            return [];
        }

        const parsedStudents =
            JSON.parse(savedStudents);

        return Array.isArray(parsedStudents)
            ? parsedStudents
            : [];

    }

    catch (error) {

        console.error(
            "Unable to read registered students:",
            error
        );

        return [];

    }

}


function getStudentByID(studentID) {

    const registeredStudents =
        getRegisteredStudents();

    return registeredStudents.find(
        function(student) {

            return (
                String(student.studentID || "").trim() ===
                String(studentID || "").trim()
            );

        }
    ) || null;

}


// ======================================================
// CURRENT STUDENT
// ======================================================

let currentStudent = null;


// ======================================================
// CURRENT POSITION
// ======================================================

let currentPosition = 1;


// ======================================================
// SELECTED CANDIDATES
// ======================================================

let selectedCandidates = {

    president: null,

    vicePresident: null,

    secretary: null

};


// Restore selections saved during the current student session.
try {

    const savedSelections =
        sessionStorage.getItem("selectedCandidates");

    if (savedSelections) {

        const parsedSelections =
            JSON.parse(savedSelections);

        if (parsedSelections && typeof parsedSelections === "object") {

            selectedCandidates = {
                president:
                    parsedSelections.president || null,
                vicePresident:
                    parsedSelections.vicePresident || null,
                secretary:
                    parsedSelections.secretary || null
            };

        }

    }

}

catch (error) {

    console.warn(
        "Unable to restore previous candidate selections:",
        error
    );

}



// ======================================================
// COUNTDOWN TIMER
// ======================================================

let countdownInterval = null;


// ======================================================
// ELECTION STATUS
// ======================================================

function getElectionStatus() {

    const status =
        localStorage.getItem("electionStatus");

    if (status === "open") {

        return "open";

    }

    return "closed";

}


// ======================================================
// GET VOTING SCHEDULE
// ======================================================

function getVotingSchedule() {

    const savedSchedule =
        localStorage.getItem("votingSchedule");

    if (!savedSchedule) {

        return null;

    }

    try {

        const schedule =
            JSON.parse(savedSchedule);

        if (
            !schedule ||
            !schedule.start ||
            !schedule.end
        ) {

            return null;

        }

        const start =
            new Date(schedule.start);

        const end =
            new Date(schedule.end);

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {

            return null;

        }

        if (end <= start) {

            return null;

        }

        return {

            start: start,

            end: end

        };

    }

    catch (error) {

        console.error(
            "Unable to read voting schedule:",
            error
        );

        return null;

    }

}


// ======================================================
// FORMAT DATE AND TIME
// ======================================================

function formatScheduleDate(date) {

    if (!date) {

        return "";

    }

    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// ======================================================
// FORMAT COUNTDOWN
// ======================================================

function formatCountdown(milliseconds) {

    if (milliseconds < 0) {

        milliseconds = 0;

    }

    const totalSeconds =
        Math.floor(milliseconds / 1000);

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

    const paddedHours =
        String(hours).padStart(2, "0");

    const paddedMinutes =
        String(minutes).padStart(2, "0");

    const paddedSeconds =
        String(seconds).padStart(2, "0");

    if (days > 0) {

        return (
            days +
            "d " +
            paddedHours +
            ":" +
            paddedMinutes +
            ":" +
            paddedSeconds
        );

    }

    return (
        paddedHours +
        ":" +
        paddedMinutes +
        ":" +
        paddedSeconds
    );

}


// ======================================================
// GET VOTING AVAILABILITY
// ======================================================

function getVotingAvailability() {

    const adminStatus =
        getElectionStatus();

    const schedule =
        getVotingSchedule();

    const now =
        new Date();


    // --------------------------------------------------
    // ADMIN CLOSED
    // --------------------------------------------------

    if (adminStatus !== "open") {

        if (schedule) {

            if (now < schedule.start) {

                return {

                    allowed: false,

                    reason:
                        "Voting has not started yet."

                };

            }

            if (now > schedule.end) {

                return {

                    allowed: false,

                    reason:
                        "The voting period has ended."

                };

            }

        }

        return {

            allowed: false,

            reason:
                "The election is currently closed."

        };

    }


    // --------------------------------------------------
    // NO SCHEDULE
    // --------------------------------------------------

    if (!schedule) {

        return {

            allowed: true,

            reason:
                "Voting is open."

        };

    }


    // --------------------------------------------------
    // BEFORE START
    // --------------------------------------------------

    if (now < schedule.start) {

        return {

            allowed: false,

            reason:
                "Voting has not started yet."

        };

    }


    // --------------------------------------------------
    // AFTER END
    // --------------------------------------------------

    if (now > schedule.end) {

        return {

            allowed: false,

            reason:
                "The voting period has ended."

        };

    }


    // --------------------------------------------------
    // INSIDE SCHEDULE
    // --------------------------------------------------

    return {

        allowed: true,

        reason:
            "Voting is open."

    };

}


// ======================================================
// CHECK IF STUDENT MAY VOTE
// ======================================================

function canStudentVote() {

    const availability =
        getVotingAvailability();

    return availability.allowed;

}


// ======================================================
// GET VOTED STUDENTS
// ======================================================

function getVotedStudents() {

    const savedStudents =
        localStorage.getItem(
            "votedStudents"
        );

    if (!savedStudents) {

        return [];

    }

    try {

        const parsed =
            JSON.parse(savedStudents);

        if (Array.isArray(parsed)) {

            return parsed;

        }

        return [];

    }

    catch (error) {

        console.error(
            "Unable to read voted students:",
            error
        );

        return [];

    }

}


// ======================================================
// CHECK IF STUDENT ALREADY VOTED
// ======================================================

function hasStudentVoted(studentID) {

    const votedStudents =
        getVotedStudents();

    return votedStudents.includes(
        studentID
    );

}


// ======================================================
// MARK STUDENT AS VOTED
// ======================================================

function markStudentAsVoted(studentID) {

    const normalizedID =
        String(studentID || "").trim();

    if (!/^\d{8}$/.test(normalizedID)) {
        return;
    }


    // --------------------------------------------------
    // SAVE THE STUDENT ID IN votedStudents
    // --------------------------------------------------

    const votedStudents =
        getVotedStudents();

    if (
        !votedStudents.includes(normalizedID)
    ) {

        votedStudents.push(
            normalizedID
        );

        localStorage.setItem(
            "votedStudents",
            JSON.stringify(
                votedStudents
            )
        );

    }


    // --------------------------------------------------
    // ALSO UPDATE THE REGISTERED STUDENT RECORD
    // --------------------------------------------------

    try {

        const savedStudents =
            localStorage.getItem(
                REGISTERED_STUDENTS_KEY
            );

        if (!savedStudents) {
            return;
        }

        const students =
            JSON.parse(savedStudents);

        if (!Array.isArray(students)) {
            return;
        }

        let changed = false;

        const updatedStudents =
            students.map(
                function(student) {

                    if (!student || typeof student !== "object") {
                        return student;
                    }

                    if (
                        String(student.studentID || "").trim() ===
                        normalizedID
                    ) {

                        changed = true;

                        return Object.assign({}, student, {
                            hasVoted: true
                        });

                    }

                    return student;

                }
            );

        if (changed) {

            localStorage.setItem(
                REGISTERED_STUDENTS_KEY,
                JSON.stringify(updatedStudents)
            );

        }

    }
    catch (error) {

        console.error(
            "Unable to update registered student vote status:",
            error
        );

    }

}


// ======================================================
// GET VOTES
// ======================================================

function getVotes() {

    const savedVotes =
        localStorage.getItem("votes");

    if (!savedVotes) {

        return [];

    }

    try {

        const parsedVotes =
            JSON.parse(savedVotes);

        if (Array.isArray(parsedVotes)) {

            return parsedVotes;

        }

        return [];

    }

    catch (error) {

        console.error(
            "Unable to read votes:",
            error
        );

        return [];

    }

}


// ======================================================
// SHOW SELECTION ERROR
// ======================================================

function showSelectionError(message) {

    const selectionError =
        document.getElementById(
            "selectionError"
        );

    if (selectionError) {

        selectionError.textContent =
            message;

    }

}


// ======================================================
// CLEAR SELECTION ERROR
// ======================================================

function clearSelectionError() {

    const selectionError =
        document.getElementById(
            "selectionError"
        );

    if (selectionError) {

        selectionError.textContent = "";

    }

}


// ======================================================
// STUDENT LOGIN
// ======================================================

const studentLoginForm =
    document.getElementById(
        "studentLoginForm"
    );


if (studentLoginForm) {

    studentLoginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const studentIDInput =
                document.getElementById(
                    "studentID"
                );

            const errorMessage =
                document.getElementById(
                    "errorMessage"
                );


            if (!studentIDInput) {

                return;

            }


            const studentID =
                studentIDInput.value.trim();


            if (errorMessage) {

                errorMessage.textContent = "";

            }


            // --------------------------------------------------
            // EMPTY ID
            // --------------------------------------------------

            if (!studentID) {

                if (errorMessage) {

                    errorMessage.textContent =
                        "Please enter your Student ID.";

                }

                return;

            }


            // --------------------------------------------------
            // CHECK VOTING AVAILABILITY
            // --------------------------------------------------

            const availability =
                getVotingAvailability();


            if (!availability.allowed) {

                const schedule =
                    getVotingSchedule();

                const now =
                    new Date();


                if (
                    schedule &&
                    now < schedule.start
                ) {

                    if (errorMessage) {

                        errorMessage.textContent =
                            "Voting has not started yet. Voting will begin on " +
                            formatScheduleDate(
                                schedule.start
                            ) +
                            ".";

                    }

                }

                else if (
                    schedule &&
                    now > schedule.end
                ) {

                    if (errorMessage) {

                        errorMessage.textContent =
                            "The voting period has ended.";

                    }

                }

                else {

                    if (errorMessage) {

                        errorMessage.textContent =
                            "The election is currently closed. Please wait until the administrator opens the election.";

                    }

                }

                return;

            }


            // --------------------------------------------------
            // STUDENT ID FORMAT
            // --------------------------------------------------

            if (!/^\d{8}$/.test(studentID)) {

                if (errorMessage) {

                    errorMessage.textContent =
                        "Student ID must contain exactly 8 digits.";

                }

                return;

            }


            // --------------------------------------------------
            // FIND REGISTERED STUDENT
            // --------------------------------------------------

            const student =
                getStudentByID(studentID);


            // --------------------------------------------------
            // INVALID STUDENT
            // --------------------------------------------------

            if (!student) {

                if (errorMessage) {

                    errorMessage.textContent =
                        "Student ID is not registered. Please sign up first.";

                }

                return;

            }


            // --------------------------------------------------
            // DUPLICATE VOTE CHECK
            // --------------------------------------------------

            if (
                hasStudentVoted(
                    student.studentID
                )
            ) {

                if (errorMessage) {

                    errorMessage.textContent =
                        "You have already submitted your vote.";

                }

                return;

            }


            // --------------------------------------------------
            // SAVE STUDENT SESSION
            // --------------------------------------------------

            sessionStorage.setItem(
                "studentID",
                student.studentID
            );

            sessionStorage.setItem(
                "studentName",
                student.studentName
            );

            sessionStorage.setItem(
                "program",
                student.program
            );

            sessionStorage.setItem(
                "yearLevel",
                student.yearLevel
            );


            // --------------------------------------------------
            // OPEN VOTING PAGE
            // --------------------------------------------------

            window.location.href =
                "voting.html";

        }
    );

}


// ======================================================
// LOAD STUDENT INFORMATION
// ======================================================

function loadStudentInformation() {

    const studentID =
        sessionStorage.getItem(
            "studentID"
        );

    const studentName =
        sessionStorage.getItem(
            "studentName"
        );

    const program =
        sessionStorage.getItem(
            "program"
        );

    const yearLevel =
        sessionStorage.getItem(
            "yearLevel"
        );


    if (!studentID) {

        window.location.href =
            "index.html";

        return;

    }


    const student =
        getStudentByID(studentID);


    if (!student) {

        alert(
            "Student information could not be verified."
        );

        clearStudentSession();

        window.location.href =
            "index.html";

        return;

    }


    // --------------------------------------------------
    // DUPLICATE VOTE CHECK
    // --------------------------------------------------

    if (
        hasStudentVoted(studentID)
    ) {

        alert(
            "You have already submitted your vote."
        );

        clearStudentSession();

        window.location.href =
            "index.html";

        return;

    }


    currentStudent = {

        studentID:
            student.studentID,

        studentName:
            studentName ||
            student.studentName ||
            "Student",

        program:
            program ||
            student.program ||
            "College Student",

        yearLevel:
            yearLevel ||
            student.yearLevel ||
            "Registered Student"

    };


    // --------------------------------------------------
    // DISPLAY STUDENT NAME
    // --------------------------------------------------

    const studentNameElement =
        document.getElementById(
            "studentName"
        );

    const studentDetailsElement =
        document.getElementById(
            "studentDetails"
        );


    if (studentNameElement) {

        studentNameElement.textContent =
            currentStudent.studentName;

    }


    if (studentDetailsElement) {

        studentDetailsElement.textContent =
            currentStudent.program +
            " • " +
            currentStudent.yearLevel;

    }

}


// ======================================================
// CLEAR STUDENT SESSION
// ======================================================

function clearStudentSession() {

    sessionStorage.removeItem(
        "studentID"
    );

    sessionStorage.removeItem(
        "studentName"
    );

    sessionStorage.removeItem(
        "program"
    );

    sessionStorage.removeItem(
        "yearLevel"
    );

}


// ======================================================
// CREATE COUNTDOWN ELEMENT
// ======================================================

function createVotingCountdown() {

    let countdown = document.getElementById("votingCountdown");

    if (countdown) {
        return countdown;
    }

    countdown = document.createElement("section");
    countdown.id = "votingCountdown";
    countdown.className = "student-countdown-card";

    countdown.innerHTML = `
        <div class="countdown-header">
            <div class="countdown-heading">
                <span class="countdown-eyebrow">ELECTION COUNTDOWN</span>
                <h2 id="countdownTitle">Checking voting schedule...</h2>
            </div>
            <div id="countdownStatusBadge" class="countdown-status-badge checking">
                <span class="status-dot"></span>
                <span id="countdownStatusText">CHECKING</span>
            </div>
        </div>

        <div class="countdown-time-grid">
            <div class="countdown-unit">
                <strong id="countdownDays">00</strong>
                <span>Days</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <strong id="countdownHours">00</strong>
                <span>Hours</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <strong id="countdownMinutes">00</strong>
                <span>Minutes</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <strong id="countdownSeconds">00</strong>
                <span>Seconds</span>
            </div>
        </div>

        <div class="countdown-schedule">
            <div class="schedule-item">
                <span class="schedule-label">Voting starts</span>
                <strong id="countdownStart">Not scheduled</strong>
            </div>
            <div class="schedule-divider"></div>
            <div class="schedule-item schedule-end">
                <span class="schedule-label">Voting ends</span>
                <strong id="countdownEnd">Not scheduled</strong>
            </div>
        </div>

        <div class="countdown-progress-area">
            <div class="countdown-progress-labels">
                <span id="countdownProgressLabel">Voting period progress</span>
                <strong id="countdownProgressPercent">0%</strong>
            </div>
            <div class="countdown-progress-track">
                <div id="countdownProgressBar" class="countdown-progress-bar"></div>
            </div>
        </div>

        <p id="countdownMessage" class="countdown-message">
            Checking voting schedule...
        </p>
    `;

    const status = document.getElementById("electionStatus");
    const progress = document.querySelector(".progress-container");
    const content = document.querySelector(".voting-content");

    if (status && status.parentNode) {
        status.parentNode.insertBefore(countdown, status.nextSibling);
    } else if (progress && progress.parentNode) {
        progress.parentNode.insertBefore(countdown, progress);
    } else if (content) {
        content.insertBefore(countdown, content.firstChild);
    } else {
        document.body.insertBefore(countdown, document.body.firstChild);
    }

    return countdown;
}


// ======================================================
// UPDATE COUNTDOWN DISPLAY
// ======================================================

function updateVotingCountdown() {

    const countdown = createVotingCountdown();

    if (!countdown) {
        return;
    }

    const titleElement = document.getElementById("countdownTitle");
    const badge = document.getElementById("countdownStatusBadge");
    const badgeText = document.getElementById("countdownStatusText");
    const daysElement = document.getElementById("countdownDays");
    const hoursElement = document.getElementById("countdownHours");
    const minutesElement = document.getElementById("countdownMinutes");
    const secondsElement = document.getElementById("countdownSeconds");
    const startElement = document.getElementById("countdownStart");
    const endElement = document.getElementById("countdownEnd");
    const progressBar = document.getElementById("countdownProgressBar");
    const progressPercent = document.getElementById("countdownProgressPercent");
    const progressLabel = document.getElementById("countdownProgressLabel");
    const messageElement = document.getElementById("countdownMessage");

    const schedule = getVotingSchedule();
    const now = new Date();
    const adminStatus = getElectionStatus();

    const setUnits = function(milliseconds) {
        milliseconds = Math.max(0, milliseconds);

        const totalSeconds = Math.floor(milliseconds / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (daysElement) daysElement.textContent = String(days).padStart(2, "0");
        if (hoursElement) hoursElement.textContent = String(hours).padStart(2, "0");
        if (minutesElement) minutesElement.textContent = String(minutes).padStart(2, "0");
        if (secondsElement) secondsElement.textContent = String(seconds).padStart(2, "0");
    };

    const setState = function(state, label, title) {
        if (badge) {
            badge.className = "countdown-status-badge " + state;
        }

        if (badgeText) {
            badgeText.textContent = label;
        }

        if (titleElement) {
            titleElement.textContent = title;
        }
    };

    const setProgress = function(value) {
        const safeValue = Math.min(100, Math.max(0, value));

        if (progressBar) {
            progressBar.style.width = safeValue.toFixed(1) + "%";
        }

        if (progressPercent) {
            progressPercent.textContent = Math.round(safeValue) + "%";
        }
    };

    // --------------------------------------------------
    // NO SCHEDULE
    // --------------------------------------------------

    if (!schedule) {

        setUnits(0);
        setProgress(0);
        setState(
            adminStatus === "open" ? "open" : "closed",
            adminStatus === "open" ? "OPEN" : "CLOSED",
            adminStatus === "open" ? "Voting is open" : "Voting is currently closed"
        );

        if (startElement) startElement.textContent = "Not scheduled";
        if (endElement) endElement.textContent = "Not scheduled";

        if (progressLabel) {
            progressLabel.textContent = "Schedule controlled by administrator";
        }

        if (messageElement) {
            messageElement.textContent = adminStatus === "open"
                ? "Voting is open. You may cast your vote now."
                : "The administrator has not opened the election yet.";
        }

        countdown.classList.remove("before-start", "ending-soon", "active", "ended");
        countdown.classList.add(adminStatus === "open" ? "active" : "ended");

        return;
    }

    if (startElement) startElement.textContent = formatScheduleDate(schedule.start);
    if (endElement) endElement.textContent = formatScheduleDate(schedule.end);

    const totalDuration = schedule.end.getTime() - schedule.start.getTime();

    // --------------------------------------------------
    // BEFORE START
    // --------------------------------------------------

    if (now < schedule.start) {

        const remaining = schedule.start.getTime() - now.getTime();

        setUnits(remaining);
        setProgress(0);
        setState("before-start", "STARTING SOON", "Voting starts soon");

        if (progressLabel) {
            progressLabel.textContent = "Waiting for voting to begin";
        }

        if (messageElement) {
            messageElement.textContent = "Voting starts on " + formatScheduleDate(schedule.start) + ".";
        }

        countdown.classList.remove("active", "ending-soon", "ended");
        countdown.classList.add("before-start");

        return;
    }

    // --------------------------------------------------
    // ACTIVE VOTING
    // --------------------------------------------------

    if (now >= schedule.start && now <= schedule.end) {

        const remaining = schedule.end.getTime() - now.getTime();
        const elapsed = now.getTime() - schedule.start.getTime();
        const progress = totalDuration > 0
            ? (elapsed / totalDuration) * 100
            : 0;

        setUnits(remaining);
        setProgress(progress);

        const tenMinutes = 10 * 60 * 1000;
        const endingSoon = remaining <= tenMinutes;

        if (endingSoon) {
            setState("ending-soon", "ENDING SOON", "Voting ends soon");
        } else {
            setState("open", "VOTING IS OPEN", "Voting is currently open");
        }

        if (progressLabel) {
            progressLabel.textContent = endingSoon
                ? "Hurry! The voting period is almost over"
                : "Voting period progress";
        }

        if (messageElement) {
            messageElement.textContent = endingSoon
                ? "Please complete and submit your vote before " + formatScheduleDate(schedule.end) + "."
                : "You may cast your vote now. Voting ends on " + formatScheduleDate(schedule.end) + ".";
        }

        countdown.classList.remove("before-start", "ended");
        countdown.classList.add(endingSoon ? "ending-soon" : "active");

        return;
    }

    // --------------------------------------------------
    // ENDED
    // --------------------------------------------------

    setUnits(0);
    setProgress(100);
    setState("ended", "VOTING ENDED", "The voting period has ended");

    if (progressLabel) {
        progressLabel.textContent = "Voting period completed";
    }

    if (messageElement) {
        messageElement.textContent = "Voting ended on " + formatScheduleDate(schedule.end) + ".";
    }

    countdown.classList.remove("before-start", "active", "ending-soon");
    countdown.classList.add("ended");
}


// ======================================================
// START COUNTDOWN
// ======================================================

function startVotingCountdown() {

    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    updateVotingCountdown();

    countdownInterval = setInterval(function() {
        updateVotingCountdown();
        updateElectionStatus();
    }, 1000);
}


// ======================================================
// UPDATE ELECTION STATUS
// ======================================================

function updateElectionStatus() {

    const statusElement =
        document.getElementById(
            "electionStatus"
        );


    const availability =
        getVotingAvailability();

    const schedule =
        getVotingSchedule();

    const now =
        new Date();


    if (!statusElement) {

        updateVotingCountdown();

        return;

    }


    // --------------------------------------------------
    // VOTING OPEN
    // --------------------------------------------------

    if (availability.allowed) {

        statusElement.textContent =
            "● Election is OPEN — You may cast your vote.";

        statusElement.classList.remove(
            "closed"
        );

        statusElement.classList.add(
            "open"
        );

        enableVoting();

        return;

    }


    // --------------------------------------------------
    // BEFORE SCHEDULE
    // --------------------------------------------------

    if (
        schedule &&
        now < schedule.start
    ) {

        statusElement.textContent =
            "● Voting has NOT STARTED — Please wait until the scheduled opening time.";

    }


    // --------------------------------------------------
    // AFTER SCHEDULE
    // --------------------------------------------------

    else if (
        schedule &&
        now > schedule.end
    ) {

        statusElement.textContent =
            "● Voting has ENDED — The scheduled voting period is over.";

    }


    // --------------------------------------------------
    // ADMIN CLOSED
    // --------------------------------------------------

    else {

        statusElement.textContent =
            "● Election is CLOSED — Voting is currently unavailable.";

    }


    statusElement.classList.remove(
        "open"
    );

    statusElement.classList.add(
        "closed"
    );

    disableVoting();

}


// ======================================================
// ENABLE VOTING
// ======================================================

function enableVoting() {

    const candidateCards =
        document.querySelectorAll(
            ".candidate-card"
        );


    candidateCards.forEach(
        function(card) {

            card.classList.remove(
                "disabled"
            );

            card.style.pointerEvents =
                "auto";

            card.style.opacity =
                "1";

        }
    );


    const nextButton =
        document.getElementById(
            "nextButton"
        );


    if (nextButton) {

        nextButton.disabled =
            false;

        nextButton.style.opacity =
            "1";

        nextButton.style.cursor =
            "pointer";

    }

}


// ======================================================
// DISABLE VOTING
// ======================================================

function disableVoting() {

    const candidateCards =
        document.querySelectorAll(
            ".candidate-card"
        );


    candidateCards.forEach(
        function(card) {

            card.classList.add(
                "disabled"
            );

            card.style.pointerEvents =
                "none";

            card.style.opacity =
                "0.5";

        }
    );


    const nextButton =
        document.getElementById(
            "nextButton"
        );


    if (nextButton) {

        nextButton.disabled =
            true;

        nextButton.style.opacity =
            "0.5";

        nextButton.style.cursor =
            "not-allowed";

    }

}


// ======================================================
// LOAD CANDIDATES FROM ADMIN DASHBOARD
// ======================================================
// The Admin Dashboard saves candidates in:
// localStorage["candidates"]
//
// Expected structure:
// {
//     president: [],
//     vicePresident: [],
//     secretary: []
// }
//
// This function keeps the existing student-page design and
// simply replaces the candidate cards with the candidates
// currently maintained by the administrator.
// ======================================================

function getAdminCandidates() {

    const savedCandidates =
        localStorage.getItem("candidates");

    if (!savedCandidates) {

        return {
            president: [],
            vicePresident: [],
            secretary: []
        };

    }

    try {

        const parsed =
            JSON.parse(savedCandidates);

        return {
            president:
                Array.isArray(parsed.president)
                    ? parsed.president
                    : [],

            vicePresident:
                Array.isArray(parsed.vicePresident)
                    ? parsed.vicePresident
                    : [],

            secretary:
                Array.isArray(parsed.secretary)
                    ? parsed.secretary
                    : []
        };

    }

    catch (error) {

        console.error(
            "Unable to read candidates from Admin Dashboard:",
            error
        );

        return {
            president: [],
            vicePresident: [],
            secretary: []
        };

    }

}


// ======================================================
// CREATE STUDENT CANDIDATE CARD
// ======================================================

function createStudentCandidateCard(
    candidateName,
    position
) {

    const card =
        document.createElement("div");

    card.className = "candidate-card";

    // Keep the candidate name in a data attribute as well.
    card.dataset.candidateName = candidateName;
    card.dataset.position = position;

    const nameElement =
        document.createElement("h3");

    nameElement.textContent = candidateName;

    card.appendChild(nameElement);

    card.addEventListener(
        "click",
        function() {

            selectCandidate(
                card,
                position,
                candidateName
            );

        }
    );

    return card;

}


// ======================================================
// RENDER ADMIN CANDIDATES ON STUDENT PAGE
// ======================================================

function loadAdminCandidates() {

    const candidateData =
        getAdminCandidates();

    const candidateContainers = [

        {
            id: "presidentCandidates",
            position: "president",
            emptyMessage:
                "No candidates have been added for President yet."
        },

        {
            id: "vicePresidentCandidates",
            position: "vicePresident",
            emptyMessage:
                "No candidates have been added for Vice President yet."
        },

        {
            id: "secretaryCandidates",
            position: "secretary",
            emptyMessage:
                "No candidates have been added for Secretary yet."
        }

    ];


    candidateContainers.forEach(
        function(item) {

            const container =
                document.getElementById(item.id);

            if (!container) {

                return;

            }

            container.innerHTML = "";

            const candidates =
                candidateData[item.position];


            if (!candidates.length) {

                const emptyMessage =
                    document.createElement("p");

                emptyMessage.className =
                    "student-empty-candidates";

                emptyMessage.textContent =
                    item.emptyMessage;

                container.appendChild(
                    emptyMessage
                );

                return;

            }


            candidates.forEach(
                function(candidate) {

                    // Admin currently stores candidate names as strings.
                    // This also safely supports an object with a name field.
                    let candidateName = "";

                    if (typeof candidate === "string") {

                        candidateName =
                            candidate.trim();

                    }

                    else if (
                        candidate &&
                        typeof candidate === "object"
                    ) {

                        candidateName =
                            String(
                                candidate.name ||
                                candidate.candidateName ||
                                ""
                            ).trim();

                    }

                    if (!candidateName) {

                        return;

                    }

                    const card =
                        createStudentCandidateCard(
                            candidateName,
                            item.position
                        );

                    container.appendChild(card);

                }
            );

        }
    );


    // Restore any valid selections already made during this page session.
    restoreCandidateSelections();

    // Re-apply the current position after the containers are rebuilt.
    showCurrentPosition();

}


// ======================================================
// RESTORE SELECTED CANDIDATES
// ======================================================

function restoreCandidateSelections() {

    const positions = [
        "president",
        "vicePresident",
        "secretary"
    ];

    positions.forEach(
        function(position) {

            const candidateName =
                selectedCandidates[position];

            if (!candidateName) {

                return;

            }

            const containerID =
                position === "president"
                    ? "presidentCandidates"
                    : position === "vicePresident"
                        ? "vicePresidentCandidates"
                        : "secretaryCandidates";

            const container =
                document.getElementById(
                    containerID
                );

            if (!container) {

                return;

            }

            const cards =
                container.querySelectorAll(
                    ".candidate-card"
                );

            cards.forEach(
                function(card) {

                    if (
                        String(
                            card.dataset.candidateName || ""
                        ).toLowerCase() ===
                        String(candidateName).toLowerCase()
                    ) {

                        card.classList.add("selected");

                    }

                }
            );

        }
    );

}


// ======================================================
// REFRESH CANDIDATES WHEN ADMIN CHANGES THEM
// ======================================================

window.addEventListener(
    "storage",
    function(event) {

        if (event.key === "candidates") {

            loadAdminCandidates();

        }

    }
);


// ======================================================
// SELECT CANDIDATE
// ======================================================

function selectCandidate(
    card,
    position,
    candidateName
) {

    if (!canStudentVote()) {

        alert(
            "Voting is currently unavailable."
        );

        updateElectionStatus();

        return;

    }


    if (!card) {

        return;

    }


    clearSelectionError();


    const container =
        card.parentElement;


    if (container) {

        const cards =
            container.querySelectorAll(
                ".candidate-card"
            );


        cards.forEach(
            function(candidateCard) {

                candidateCard.classList.remove(
                    "selected"
                );

            }
        );

    }


    card.classList.add(
        "selected"
    );


    if (
        Object.prototype.hasOwnProperty.call(
            selectedCandidates,
            position
        )
    ) {

        selectedCandidates[position] =
            candidateName;

        sessionStorage.setItem(
            "selectedCandidates",
            JSON.stringify(selectedCandidates)
        );

    }

}


// ======================================================
// UPDATE POSITION DISPLAY
// ======================================================

function updatePositionDisplay() {

    const positionNumber =
        document.getElementById(
            "positionNumber"
        );

    const positionTitle =
        document.getElementById(
            "positionTitle"
        );

    const positionInstruction =
        document.getElementById(
            "positionInstruction"
        );


    const positions = [

        {
            number: "Position 1 of 3",
            title: "President",
            instruction:
                "Select one candidate for President."
        },

        {
            number: "Position 2 of 3",
            title: "Vice President",
            instruction:
                "Select one candidate for Vice President."
        },

        {
            number: "Position 3 of 3",
            title: "Secretary",
            instruction:
                "Select one candidate for Secretary."
        },

        {
            number: "Review",
            title: "Review Your Vote",
            instruction:
                "Review your selections before submitting."
        }

    ];


    const current =
        positions[
            currentPosition - 1
        ];


    if (!current) {

        return;

    }


    if (positionNumber) {

        positionNumber.textContent =
            current.number;

    }


    if (positionTitle) {

        positionTitle.textContent =
            current.title;

    }


    if (positionInstruction) {

        positionInstruction.textContent =
            current.instruction;

    }


    updateProgress();

}


// ======================================================
// UPDATE PROGRESS
// ======================================================

function updateProgress() {

    const progressIDs = [

        "progressPresident",

        "progressVicePresident",

        "progressSecretary",

        "progressReview"

    ];


    progressIDs.forEach(
        function(id, index) {

            const element =
                document.getElementById(
                    id
                );


            if (!element) {

                return;

            }


            element.classList.remove(
                "active"
            );

            element.classList.remove(
                "completed"
            );


            if (
                index + 1 ===
                currentPosition
            ) {

                element.classList.add(
                    "active"
                );

            }


            if (
                index + 1 <
                currentPosition
            ) {

                element.classList.add(
                    "completed"
                );

            }

        }
    );

}


// ======================================================
// SHOW CURRENT POSITION
// ======================================================

function showCurrentPosition() {

    const presidentCandidates =
        document.getElementById(
            "presidentCandidates"
        );

    const vicePresidentCandidates =
        document.getElementById(
            "vicePresidentCandidates"
        );

    const secretaryCandidates =
        document.getElementById(
            "secretaryCandidates"
        );

    const reviewSection =
        document.getElementById(
            "reviewSection"
        );


    // --------------------------------------------------
    // HIDE EVERYTHING
    // --------------------------------------------------

    if (presidentCandidates) {

        presidentCandidates.style.display =
            "none";

    }

    if (vicePresidentCandidates) {

        vicePresidentCandidates.style.display =
            "none";

    }

    if (secretaryCandidates) {

        secretaryCandidates.style.display =
            "none";

    }

    if (reviewSection) {

        reviewSection.style.display =
            "none";

    }


    // --------------------------------------------------
    // SHOW CURRENT SECTION
    // --------------------------------------------------

    if (currentPosition === 1) {

        if (presidentCandidates) {

            presidentCandidates.style.display =
                "grid";

        }

    }

    else if (currentPosition === 2) {

        if (vicePresidentCandidates) {

            vicePresidentCandidates.style.display =
                "grid";

        }

    }

    else if (currentPosition === 3) {

        if (secretaryCandidates) {

            secretaryCandidates.style.display =
                "grid";

        }

    }

    else if (currentPosition === 4) {

        if (reviewSection) {

            reviewSection.style.display =
                "block";

        }

        displayReview();

    }


    updatePositionDisplay();

    updateNavigationButtons();

    updateElectionStatus();

}


// ======================================================
// UPDATE NAVIGATION BUTTONS
// ======================================================

function updateNavigationButtons() {

    const backButton =
        document.getElementById(
            "backButton"
        );

    const nextButton =
        document.getElementById(
            "nextButton"
        );


    // --------------------------------------------------
    // BACK BUTTON
    // --------------------------------------------------

    if (backButton) {

        if (
            currentPosition === 1
        ) {

            backButton.style.visibility =
                "hidden";

        }

        else {

            backButton.style.visibility =
                "visible";

        }

    }


    // --------------------------------------------------
    // NEXT BUTTON
    // --------------------------------------------------

    if (nextButton) {

        if (
            currentPosition === 4
        ) {

            nextButton.textContent =
                "Submit Vote";

        }

        else {

            nextButton.textContent =
                "Next →";

        }

    }

}


// ======================================================
// VALIDATE CURRENT SELECTION
// ======================================================

function validateCurrentSelection() {

    let position = "";


    if (
        currentPosition === 1
    ) {

        position =
            "president";

    }

    else if (
        currentPosition === 2
    ) {

        position =
            "vicePresident";

    }

    else if (
        currentPosition === 3
    ) {

        position =
            "secretary";

    }


    if (
        position &&
        !selectedCandidates[position]
    ) {

        showSelectionError(
            "Please select a candidate before continuing."
        );

        return false;

    }


    clearSelectionError();

    return true;

}


// ======================================================
// NEXT BUTTON
// ======================================================

function goNext() {

    if (!canStudentVote()) {

        alert(
            "Voting is currently unavailable. You cannot continue voting."
        );

        updateElectionStatus();

        return;

    }


    // --------------------------------------------------
    // REVIEW -> SUBMIT
    // --------------------------------------------------

    if (
        currentPosition === 4
    ) {

        submitVote();

        return;

    }


    if (
        !validateCurrentSelection()
    ) {

        return;

    }


    currentPosition++;

    showCurrentPosition();

}


// ======================================================
// BACK BUTTON
// ======================================================

function goBack() {

    if (
        currentPosition <= 1
    ) {

        return;

    }


    currentPosition--;

    clearSelectionError();

    showCurrentPosition();

}


// ======================================================
// DISPLAY REVIEW
// ======================================================

function displayReview() {

    const reviewSection =
        document.getElementById(
            "reviewSection"
        );


    if (!reviewSection) {

        return;

    }


    reviewSection.innerHTML = `

        <div class="review-item">

            <span class="review-label">
                President
            </span>

            <strong>
                ${
                    selectedCandidates.president ||
                    "No selection"
                }
            </strong>

        </div>


        <div class="review-item">

            <span class="review-label">
                Vice President
            </span>

            <strong>
                ${
                    selectedCandidates.vicePresident ||
                    "No selection"
                }
            </strong>

        </div>


        <div class="review-item">

            <span class="review-label">
                Secretary
            </span>

            <strong>
                ${
                    selectedCandidates.secretary ||
                    "No selection"
                }
            </strong>

        </div>

    `;

}


// ======================================================
// ESCAPE HTML FOR PRINT RECEIPT
// ======================================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// SAVE RECEIPT DATA
// ======================================================

function saveReceiptData(vote) {

    sessionStorage.setItem(
        "lastVoteReceipt",
        JSON.stringify(vote)
    );

}


// ======================================================
// CREATE SUCCESS SCREEN
// ======================================================

function showVoteSuccess(vote) {

    const votingContent =
        document.querySelector(
            ".voting-content"
        );


    if (!votingContent) {

        // If the current HTML does not contain
        // .voting-content, still show the
        // printable ballot.

        showPrintButtonFallback();

        return;

    }


    votingContent.innerHTML = `

        <div class="vote-success-screen"
             style="
                text-align:center;
                padding:40px 20px;
             ">

            <div style="
                font-size:64px;
                margin-bottom:15px;
            ">
                ✓
            </div>

            <h2>
                Vote Submitted Successfully!
            </h2>

            <p>
                Thank you for participating
                in the College Election.
            </p>

            <p>
                Your vote has been recorded.
            </p>

            <div style="
                margin:25px auto;
                max-width:500px;
                padding:20px;
                border-radius:12px;
                background:#f4f8f5;
                text-align:left;
            ">

                <strong>
                    Student:
                </strong>
                ${escapeHTML(vote.studentName)}

                <br><br>

                <strong>
                    Student ID:
                </strong>
                ${escapeHTML(vote.studentID)}

                <br><br>

                <strong>
                    Submitted:
                </strong>
                ${escapeHTML(
                    new Date(
                        vote.dateSubmitted
                    ).toLocaleString()
                )}

            </div>

            <div style="
                display:flex;
                gap:12px;
                justify-content:center;
                flex-wrap:wrap;
            ">

                <button
                    type="button"
                    id="printBallotButton"
                    style="
                        padding:12px 24px;
                        border:none;
                        border-radius:8px;
                        background:#1f5d42;
                        color:white;
                        font-size:16px;
                        cursor:pointer;
                    "
                >
                    🖨 Print My Ballot
                </button>

                <button
                    type="button"
                    id="returnLoginButton"
                    style="
                        padding:12px 24px;
                        border:none;
                        border-radius:8px;
                        background:#777;
                        color:white;
                        font-size:16px;
                        cursor:pointer;
                    "
                >
                    Return to Login
                </button>

            </div>

        </div>

    `;


    const printButton =
        document.getElementById(
            "printBallotButton"
        );

    const returnButton =
        document.getElementById(
            "returnLoginButton"
        );


    if (printButton) {

        printButton.addEventListener(
            "click",
            function() {

                printBallot();

            }
        );

    }


    if (returnButton) {

        returnButton.addEventListener(
            "click",
            function() {

                clearStudentSession();

                window.location.href =
                    "index.html";

            }
        );

    }

}


// ======================================================
// FALLBACK SUCCESS SCREEN
// ======================================================

function showPrintButtonFallback() {

    const container =
        document.createElement("div");

    container.id =
        "voteSuccessFallback";


    container.style.cssText = `
        position:fixed;
        inset:0;
        background:white;
        z-index:9999;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        padding:30px;
        font-family:Segoe UI, Arial, sans-serif;
    `;


    container.innerHTML = `

        <div>

            <div style="
                font-size:60px;
                color:#1f5d42;
            ">
                ✓
            </div>

            <h2>
                Vote Submitted Successfully!
            </h2>

            <p>
                Your vote has been recorded.
            </p>

            <button
                id="fallbackPrintButton"
                style="
                    padding:12px 24px;
                    margin:8px;
                    border:none;
                    border-radius:8px;
                    background:#1f5d42;
                    color:white;
                    cursor:pointer;
                "
            >
                🖨 Print My Ballot
            </button>

            <button
                id="fallbackLoginButton"
                style="
                    padding:12px 24px;
                    margin:8px;
                    border:none;
                    border-radius:8px;
                    background:#777;
                    color:white;
                    cursor:pointer;
                "
            >
                Return to Login
            </button>

        </div>

    `;


    document.body.appendChild(
        container
    );


    const printButton =
        document.getElementById(
            "fallbackPrintButton"
        );

    const loginButton =
        document.getElementById(
            "fallbackLoginButton"
        );


    if (printButton) {

        printButton.onclick =
            function() {

                printBallot();

            };

    }


    if (loginButton) {

        loginButton.onclick =
            function() {

                clearStudentSession();

                window.location.href =
                    "index.html";

            };

    }

}


// ======================================================
// PRINT BALLOT
// ======================================================

function printBallot() {

    const savedReceipt =
        sessionStorage.getItem(
            "lastVoteReceipt"
        );


    if (!savedReceipt) {

        alert(
            "The ballot information could not be found."
        );

        return;

    }


    let vote;


    try {

        vote =
            JSON.parse(
                savedReceipt
            );

    }

    catch (error) {

        alert(
            "Unable to prepare the ballot for printing."
        );

        console.error(
            error
        );

        return;

    }


    const submittedDate =
        new Date(
            vote.dateSubmitted
        );


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=800,height=900"
        );


    if (!printWindow) {

        alert(
            "Your browser blocked the print window. Please allow pop-ups for this website."
        );

        return;

    }


    printWindow.document.open();


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                College Voting System - Ballot Receipt
            </title>

            <style>

                * {
                    box-sizing:border-box;
                }

                body {
                    margin:0;
                    padding:30px;
                    font-family:
                        "Segoe UI",
                        Arial,
                        sans-serif;
                    background:#ffffff;
                    color:#222;
                }

                .receipt {
                    max-width:650px;
                    margin:0 auto;
                    border:2px solid #1f5d42;
                    border-radius:12px;
                    padding:30px;
                }

                .header {
                    text-align:center;
                    border-bottom:2px solid #1f5d42;
                    padding-bottom:20px;
                    margin-bottom:20px;
                }

                .header h1 {
                    margin:0 0 5px;
                    color:#1f5d42;
                    font-size:26px;
                }

                .header h2 {
                    margin:0;
                    font-size:18px;
                    font-weight:normal;
                }

                .success {
                    text-align:center;
                    margin:20px 0;
                }

                .success-icon {
                    font-size:45px;
                    color:#1f5d42;
                }

                .success h3 {
                    color:#1f5d42;
                    margin:5px 0;
                }

                .student-info {
                    background:#f4f8f5;
                    border-radius:8px;
                    padding:15px;
                    margin-bottom:20px;
                }

                .student-row {
                    display:flex;
                    justify-content:space-between;
                    gap:20px;
                    padding:6px 0;
                }

                .label {
                    font-weight:bold;
                }

                .selections {
                    margin-top:20px;
                }

                .selections h3 {
                    color:#1f5d42;
                    border-bottom:1px solid #ddd;
                    padding-bottom:8px;
                }

                .selection {
                    display:flex;
                    justify-content:space-between;
                    padding:12px;
                    margin:8px 0;
                    background:#f8faf8;
                    border:1px solid #ddd;
                    border-radius:6px;
                }

                .position {
                    font-weight:bold;
                }

                .candidate {
                    text-align:right;
                }

                .footer {
                    margin-top:25px;
                    padding-top:15px;
                    border-top:1px solid #ddd;
                    text-align:center;
                    font-size:12px;
                    color:#666;
                }

                .notice {
                    margin-top:15px;
                    padding:12px;
                    border-radius:6px;
                    background:#fff8e1;
                    border:1px solid #e0c56e;
                    font-size:12px;
                    text-align:center;
                }

                @media print {

                    body {
                        padding:0;
                    }

                    .receipt {
                        border:2px solid #000;
                        max-width:none;
                    }

                }

            </style>

        </head>

        <body>

            <div class="receipt">

                <div class="header">

                    <h1>
                        COLLEGE VOTING SYSTEM
                    </h1>

                    <h2>
                        Official Ballot Receipt
                    </h2>

                </div>


                <div class="success">

                    <div class="success-icon">
                        ✓
                    </div>

                    <h3>
                        VOTE SUBMITTED SUCCESSFULLY
                    </h3>

                    <p>
                        Your vote has been recorded.
                    </p>

                </div>


                <div class="student-info">

                    <div class="student-row">

                        <span class="label">
                            Student Name
                        </span>

                        <span>
                            ${escapeHTML(
                                vote.studentName
                            )}
                        </span>

                    </div>


                    <div class="student-row">

                        <span class="label">
                            Student ID
                        </span>

                        <span>
                            ${escapeHTML(
                                vote.studentID
                            )}
                        </span>

                    </div>


                    <div class="student-row">

                        <span class="label">
                            Program
                        </span>

                        <span>
                            ${escapeHTML(
                                vote.program || ""
                            )}
                        </span>

                    </div>


                    <div class="student-row">

                        <span class="label">
                            Year Level
                        </span>

                        <span>
                            ${escapeHTML(
                                vote.yearLevel || ""
                            )}
                        </span>

                    </div>


                    <div class="student-row">

                        <span class="label">
                            Date Submitted
                        </span>

                        <span>
                            ${escapeHTML(
                                submittedDate.toLocaleString()
                            )}
                        </span>

                    </div>

                </div>


                <div class="selections">

                    <h3>
                        Your Selections
                    </h3>


                    <div class="selection">

                        <span class="position">
                            President
                        </span>

                        <span class="candidate">
                            ${escapeHTML(
                                vote.president
                            )}
                        </span>

                    </div>


                    <div class="selection">

                        <span class="position">
                            Vice President
                        </span>

                        <span class="candidate">
                            ${escapeHTML(
                                vote.vicePresident
                            )}
                        </span>

                    </div>


                    <div class="selection">

                        <span class="position">
                            Secretary
                        </span>

                        <span class="candidate">
                            ${escapeHTML(
                                vote.secretary
                            )}
                        </span>

                    </div>

                </div>


                <div class="notice">

                    This receipt confirms that your
                    vote was successfully recorded.
                    Keep this receipt for your records.

                </div>


                <div class="footer">

                    College Voting System<br>

                    Official Student Voting Portal

                </div>

            </div>

            <script>

                window.onload = function() {

                    setTimeout(
                        function() {

                            window.print();

                        },
                        500
                    );

                };

            <\/script>

        </body>

        </html>

    `);


    printWindow.document.close();

}


// ======================================================
// SUBMIT VOTE
// ======================================================

function submitVote() {

    // --------------------------------------------------
    // CHECK VOTING AVAILABILITY
    // --------------------------------------------------

    if (!canStudentVote()) {

        alert(
            "The voting period is currently closed. Your vote was not submitted."
        );

        updateElectionStatus();

        return;

    }


    // --------------------------------------------------
    // CHECK CURRENT STUDENT
    // --------------------------------------------------

    if (!currentStudent) {

        loadStudentInformation();

    }


    if (!currentStudent) {

        alert(
            "Student information could not be found."
        );

        window.location.href =
            "index.html";

        return;

    }


    // --------------------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------------------

    if (
        hasStudentVoted(
            currentStudent.studentID
        )
    ) {

        alert(
            "You have already submitted your vote."
        );

        clearStudentSession();

        window.location.href =
            "index.html";

        return;

    }


    // --------------------------------------------------
    // CHECK ALL POSITIONS
    // --------------------------------------------------

    if (
        !selectedCandidates.president ||
        !selectedCandidates.vicePresident ||
        !selectedCandidates.secretary
    ) {

        alert(
            "Please complete all positions before submitting your vote."
        );

        return;

    }


    // --------------------------------------------------
    // FINAL CONFIRMATION
    // --------------------------------------------------

    const confirmationMessage =

        "PLEASE CONFIRM YOUR VOTE\n\n" +

        "President:\n" +
        selectedCandidates.president +
        "\n\n" +

        "Vice President:\n" +
        selectedCandidates.vicePresident +
        "\n\n" +

        "Secretary:\n" +
        selectedCandidates.secretary +
        "\n\n" +

        "--------------------------------\n" +

        "Once submitted, your vote cannot be changed.\n\n" +

        "Do you want to submit your vote?";


    const confirmation =
        confirm(
            confirmationMessage
        );


    if (!confirmation) {

        return;

    }


    // --------------------------------------------------
    // CHECK ELECTION AGAIN
    // --------------------------------------------------

    if (!canStudentVote()) {

        alert(
            "The voting period has closed. Your vote was not submitted."
        );

        updateElectionStatus();

        return;

    }


    // --------------------------------------------------
    // CHECK DUPLICATE AGAIN
    // --------------------------------------------------

    if (
        hasStudentVoted(
            currentStudent.studentID
        )
    ) {

        alert(
            "Your vote has already been recorded."
        );

        clearStudentSession();

        window.location.href =
            "index.html";

        return;

    }


    // --------------------------------------------------
    // GET EXISTING VOTES
    // --------------------------------------------------

    const votes =
        getVotes();


    // --------------------------------------------------
    // CREATE VOTE
    // --------------------------------------------------

    const newVote = {

        studentID:
            currentStudent.studentID,

        studentName:
            currentStudent.studentName,

        program:
            currentStudent.program,

        yearLevel:
            currentStudent.yearLevel,

        president:
            selectedCandidates.president,

        vicePresident:
            selectedCandidates.vicePresident,

        secretary:
            selectedCandidates.secretary,

        dateSubmitted:
            new Date().toISOString()

    };


    // --------------------------------------------------
    // SAVE VOTE
    // --------------------------------------------------

    votes.push(
        newVote
    );


    localStorage.setItem(
        "votes",
        JSON.stringify(
            votes
        )
    );


    // --------------------------------------------------
    // MARK STUDENT AS VOTED
    // --------------------------------------------------

    markStudentAsVoted(
        currentStudent.studentID
    );


    // --------------------------------------------------
    // SAVE RECEIPT BEFORE CLEARING SESSION
    // --------------------------------------------------

    saveReceiptData(
        newVote
    );


    // --------------------------------------------------
    // SHOW SUCCESS SCREEN
    // --------------------------------------------------

    showVoteSuccess(
        newVote
    );

}


// ======================================================
// STORAGE EVENT
// ======================================================

window.addEventListener(
    "storage",
    function(event) {

        // --------------------------------------------------
        // ELECTION STATUS CHANGED
        // --------------------------------------------------

        if (
            event.key ===
            "electionStatus"
        ) {

            updateElectionStatus();

            updateVotingCountdown();


            if (
                !canStudentVote()
            ) {

                showSelectionError(
                    getVotingAvailability().reason
                );

            }

        }


        // --------------------------------------------------
        // VOTING SCHEDULE CHANGED
        // --------------------------------------------------

        if (
            event.key ===
            "votingSchedule"
        ) {

            updateElectionStatus();

            updateVotingCountdown();

            showCurrentPosition();

        }


        // --------------------------------------------------
        // VOTED STUDENTS CHANGED
        // --------------------------------------------------

        if (
            event.key ===
            "votedStudents"
        ) {

            if (
                currentStudent &&
                hasStudentVoted(
                    currentStudent.studentID
                )
            ) {

                alert(
                    "Your vote has already been recorded."
                );

                clearStudentSession();

                window.location.href =
                    "index.html";

            }

        }

    }
);


// ======================================================
// PAGE INITIALIZATION
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadAdminCandidates();

        const isVotingPage =
            document.getElementById(
                "studentName"
            );


        const isLoginPage =
            document.getElementById(
                "studentLoginForm"
            );


        // --------------------------------------------------
        // VOTING PAGE
        // --------------------------------------------------

        if (isVotingPage) {

            loadStudentInformation();

            updateElectionStatus();

            showCurrentPosition();

            createVotingCountdown();

            startVotingCountdown();

        }


        // --------------------------------------------------
        // LOGIN PAGE
        // --------------------------------------------------

        if (isLoginPage) {

            // Create countdown on login too,
            // if the page contains an election status area.

            if (
                document.getElementById(
                    "electionStatus"
                )
            ) {

                createVotingCountdown();

                startVotingCountdown();

            }

        }

    }
);