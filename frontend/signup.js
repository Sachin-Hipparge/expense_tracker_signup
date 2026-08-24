const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", signup);


async function signup(event) {

    event.preventDefault();


    const name =
        document.getElementById("name").value;

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;


    const userDetails = {

        name: name,

        email: email,

        password: password

    };


    try {

        const response = await fetch(
            "http://localhost:3000/user/signup",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(userDetails)

            }
        );


        const data = await response.json();


        document.getElementById("message").innerText =
            data.message;


        if (response.ok) {

            signupForm.reset();

        }


    } catch (error) {

        document.getElementById("message").innerText =
            "Error: " + error.message;

    }

}