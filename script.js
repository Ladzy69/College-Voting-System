const loginForm = document.getElementById("studentLoginForm");

const studentIDInput = document.getElementById("studentID");

const errorMessage = document.getElementById("errorMessage");

const continueButton = document.getElementById("continueButton");


loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const studentID = studentIDInput.value.trim();


    // Clear previous error
    errorMessage.textContent = "";


    // Check empty input
    if (studentID === "") {

        errorMessage.textContent =
            "Please enter your Student ID.";

        studentIDInput.focus();

        return;
    }


    // Temporary prototype validation
    // We will replace this with Access database verification later.

    if (studentID.length < 4) {

        errorMessage.textContent =
            "Please enter a valid Student ID.";

        studentIDInput.focus();

        return;
    }


    // Prevent double clicking
    continueButton.disabled = true;

    continueButton.textContent = "Checking...";


    // Temporary delay to simulate database checking
    setTimeout(function () {

        sessionStorage.setItem(
            "studentID",
            studentID
        );


        // Go to student verification page
        window.location.href =
            "student-verification.html";

    }, 700);

});