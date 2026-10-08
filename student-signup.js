/* =========================================================
   COLLEGE VOTING SYSTEM
   STUDENT SIGN UP
   =========================================================

   Stores registered students in:
   localStorage -> registeredStudents

   Required information:
   - Student ID: exactly 8 digits
   - Full Name
   - Program
   - Year Level
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE KEY
   ========================================================= */

const REGISTERED_STUDENTS_KEY = "registeredStudents";


/* =========================================================
   GET REGISTERED STUDENTS
   ========================================================= */

function getRegisteredStudents() {

    const savedStudents =
        localStorage.getItem(
            REGISTERED_STUDENTS_KEY
        );

    if (!savedStudents) {
        return [];
    }

    try {

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


/* =========================================================
   SAVE REGISTERED STUDENTS
   ========================================================= */

function saveRegisteredStudents(students) {

    localStorage.setItem(
        REGISTERED_STUDENTS_KEY,
        JSON.stringify(students)
    );

}


/* =========================================================
   VALIDATE STUDENT ID
   ========================================================= */

function normalizeStudentID(value) {

    return String(
        value || ""
    )
        .replace(/\D/g, "")
        .slice(0, 8);

}


function isValidStudentID(studentID) {

    return /^\d{8}$/.test(
        studentID
    );

}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showSignupMessage(
    message,
    isSuccess
) {

    const messageElement =
        document.getElementById(
            "signupMessage"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent =
        message;

    if (isSuccess) {

        messageElement.style.color =
            "#1f5d42";

    }
    else {

        messageElement.style.color =
            "#b42318";

    }

}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const form =
            document.getElementById(
                "studentSignupForm"
            );

        const studentIDInput =
            document.getElementById(
                "signupStudentID"
            );

        if (!form || !studentIDInput) {
            return;
        }


        /* -----------------------------------------------
           STUDENT ID INPUT
        ------------------------------------------------ */

        studentIDInput.addEventListener(
            "input",
            function () {

                studentIDInput.value =
                    normalizeStudentID(
                        studentIDInput.value
                    );

            }
        );


        /* -----------------------------------------------
           FORM SUBMISSION
        ------------------------------------------------ */

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                registerStudent();

            }
        );

    }
);


/* =========================================================
   REGISTER STUDENT
   ========================================================= */

function registerStudent() {

    const studentIDInput =
        document.getElementById(
            "signupStudentID"
        );

    const studentNameInput =
        document.getElementById(
            "signupStudentName"
        );

    const programInput =
        document.getElementById(
            "signupProgram"
        );

    const yearLevelInput =
        document.getElementById(
            "signupYearLevel"
        );

    if (
        !studentIDInput ||
        !studentNameInput ||
        !programInput ||
        !yearLevelInput
    ) {

        showSignupMessage(
            "The registration form could not be loaded.",
            false
        );

        return;

    }


    /* -----------------------------------------------
       GET VALUES
    ------------------------------------------------ */

    const studentID =
        normalizeStudentID(
            studentIDInput.value
        );

    const studentName =
        studentNameInput.value.trim();

    const program =
        programInput.value.trim();

    const yearLevel =
        yearLevelInput.value.trim();


    /* -----------------------------------------------
       VALIDATE STUDENT ID
    ------------------------------------------------ */

    if (!isValidStudentID(studentID)) {

        showSignupMessage(
            "Student ID must contain exactly 8 digits.",
            false
        );

        studentIDInput.focus();

        return;

    }


    /* -----------------------------------------------
       VALIDATE NAME
    ------------------------------------------------ */

    if (studentName.length < 2) {

        showSignupMessage(
            "Please enter your complete full name.",
            false
        );

        studentNameInput.focus();

        return;

    }


    /* -----------------------------------------------
       VALIDATE PROGRAM
    ------------------------------------------------ */

    if (!program) {

        showSignupMessage(
            "Please enter your program.",
            false
        );

        programInput.focus();

        return;

    }


    /* -----------------------------------------------
       VALIDATE YEAR LEVEL
    ------------------------------------------------ */

    if (!yearLevel) {

        showSignupMessage(
            "Please enter your year level.",
            false
        );

        yearLevelInput.focus();

        return;

    }


    /* -----------------------------------------------
       GET EXISTING STUDENTS
    ------------------------------------------------ */

    const students =
        getRegisteredStudents();


    /* -----------------------------------------------
       DUPLICATE STUDENT ID CHECK
    ------------------------------------------------ */

    const existingStudent =
        students.find(
            function (student) {

                return (
                    String(
                        student.studentID || ""
                    ).trim() ===
                    studentID
                );

            }
        );

    if (existingStudent) {

        showSignupMessage(
            "This Student ID is already registered. Please return to the login page.",
            false
        );

        studentIDInput.focus();

        return;

    }


    /* -----------------------------------------------
       CREATE STUDENT RECORD
    ------------------------------------------------ */

    const newStudent = {

        studentID:
            studentID,

        name:
            studentName,

        studentName:
            studentName,

        program:
            program,

        yearLevel:
            yearLevel,

        hasVoted:
            false,

        registrationDate:
            new Date().toISOString()

    };


    /* -----------------------------------------------
       SAVE STUDENT
    ------------------------------------------------ */

    students.push(
        newStudent
    );

    saveRegisteredStudents(
        students
    );


    /* -----------------------------------------------
       SAVE CURRENT STUDENT ID
       FOR CONVENIENCE AFTER SIGN UP
    ------------------------------------------------ */

    sessionStorage.setItem(
        "registeredStudentID",
        studentID
    );

    sessionStorage.setItem(
        "registeredStudentName",
        studentName
    );

    sessionStorage.setItem(
        "registeredStudentProgram",
        program
    );

    sessionStorage.setItem(
        "registeredStudentYearLevel",
        yearLevel
    );


    /* -----------------------------------------------
       SUCCESS MESSAGE
    ------------------------------------------------ */

    showSignupMessage(
        "Registration successful. Redirecting to login...",
        true
    );


    /* -----------------------------------------------
       RETURN TO LOGIN
    ------------------------------------------------ */

    setTimeout(
        function () {

            window.location.href =
                "index.html";

        },
        700
    );

}
