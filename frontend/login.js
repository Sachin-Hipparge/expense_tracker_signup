const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", login);


async function login(event) {

    event.preventDefault();


    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;


    const loginDetails = {

        email: email,

        password: password

    };


    try {

        const response = await fetch(
            "http://localhost:3000/user/login",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(loginDetails)

            }
        );


        const data = await response.json();


        if (response.ok) {

            // Store JWT token

            localStorage.setItem(
                "token",
                data.token
            );


            // Open expense page

            window.location.href =
                "expense.html";

        } else {

            document.getElementById("message").innerText =
                data.message;

        }


    } catch (error) {

        document.getElementById("message").innerText =
            "Error: " + error.message;

    }

}