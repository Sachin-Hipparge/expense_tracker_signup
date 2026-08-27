
const API_URL = "http://localhost:3000";

const resetPasswordForm =
    document.getElementById("resetPasswordForm");

const message =
    document.getElementById("message");


resetPasswordForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        // Check passwords

        if (password !== confirmPassword) {

            message.innerText =
                "Passwords do not match";

            return;
        }


        // Get UUID from URL

        const params =
            new URLSearchParams(
                window.location.search
            );

        const requestId =
            params.get("id");


        if (!requestId) {

            message.innerText =
                "Invalid password reset link";

            return;
        }


        try {

            const response = await fetch(
                `${API_URL}/password/resetpassword/${requestId}`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        password: password
                    })

                }
            );


            const data =
                await response.json();


            if (response.ok) {

    message.innerText = data.message;

    const loginButton =
        document.createElement("button");

    loginButton.innerText =
        "Go to Login";

    loginButton.style.display = "block";
    loginButton.style.marginTop = "10px";

    loginButton.addEventListener("click", () => {

        window.location.href =
            "login.html";

    });

    document.body.appendChild(loginButton);

} else {

    message.innerText =
        data.message;

}

        } catch (error) {

            console.log(error);

            message.innerText =
                "Could not reset password";

        }

    }
);