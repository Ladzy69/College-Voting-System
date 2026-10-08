// ======================================================
// ADMIN LOGIN
// ======================================================


// ======================================================
// ADMIN ACCOUNT
// ======================================================

// Temporary account for prototype testing

const adminAccount = {

    username: "admin",

    password: "admin123"

};


// ======================================================
// LOGIN FORM
// ======================================================

const adminLoginForm =
    document.getElementById("adminLoginForm");


// ======================================================
// ERROR MESSAGE
// ======================================================

const adminErrorMessage =
    document.getElementById("adminErrorMessage");


// ======================================================
// LOGIN
// ======================================================

adminLoginForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        // Get input values

        const username =
            document
                .getElementById("adminUsername")
                .value
                .trim();

        const password =
            document
                .getElementById("adminPassword")
                .value;


        // Clear previous error

        adminErrorMessage.textContent = "";


        // ==================================================
        // EMPTY FIELD VALIDATION
        // ==================================================

        if (username === "" || password === "") {

            adminErrorMessage.textContent =
                "Please enter your username and password.";

            return;

        }


        // ==================================================
        // CHECK LOGIN
        // ==================================================

        if (
            username === adminAccount.username &&
            password === adminAccount.password
        ) {

            // Save admin login status

            sessionStorage.setItem(
                "adminLoggedIn",
                "true"
            );


            // Open dashboard

            window.location.href =
                "admin-dashboard.html";

        }

        else {

            // Invalid credentials

            adminErrorMessage.textContent =
                "Invalid username or password.";

        }

    }
);