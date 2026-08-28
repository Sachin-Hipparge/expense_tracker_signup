
const API_URL = "http://13.200.243.68:3000";
const token = localStorage.getItem("token");
let allExpenses = [];



let currentPage = 1;
let expensesPerPage =
    Number(localStorage.getItem("expensesPerPage")) || 10;

    const expensesPerPageSelect =
    document.getElementById("expensesPerPage");

expensesPerPageSelect.value =
    expensesPerPage;

const previousButton =
    document.getElementById("previousButton");

const nextButton =
    document.getElementById("nextButton");

const pageNumber =
    document.getElementById("pageNumber");

    previousButton.addEventListener(
    "click",
    previousPage
);

nextButton.addEventListener(
    "click",
    nextPage
);

document
    .getElementById("expensesPerPage")
    .addEventListener(
        "change",
        changeExpensesPerPage
    );

    // changes expenseper page

    function changeExpensesPerPage() {

    const select =
        document.getElementById("expensesPerPage");

    expensesPerPage =
        Number(select.value);

    localStorage.setItem(
        "expensesPerPage",
        expensesPerPage
    );

    currentPage = 1;

    displayExpenses();
}

const downloadReportButton =
    document.getElementById("downloadReportButton");

async function checkPremiumStatus() {

    try {

        const response = await fetch(
            `${API_URL}/user/premium-status`,
            {
                method: "GET",

                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

       const data = await response.json();



        if (response.ok && data.isPremium) {

            document.getElementById("premiumMessage").innerText =
                "You are a premium user now";

            document.getElementById("leaderboardButton").style.display =
                "block";

              downloadReportButton.disabled = false;

        }

    } catch (error) {

        console.log("Premium check error:", error);

    }

}

const cashfree = Cashfree({
    mode: "sandbox"
});


// ==================== BUY PREMIUM ====================

document
    .getElementById("premiumButton")
    .addEventListener("click", buyPremium);


async function buyPremium() {

    try {

        const response = await fetch(
            `${API_URL}/purchase/purchase-premium`,
            {
                method: "GET",

                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            document.getElementById("paymentMessage").innerText =
                data.message;

            return;
        }


        const paymentSessionId =
            data.paymentSessionId;

        const orderId =
            data.orderId;


        // Open Cashfree payment popup

        cashfree.checkout({

            paymentSessionId: paymentSessionId,

            redirectTarget: "_modal"

        }).then(async (result) => {

            console.log(result);


            // Verify payment with backend

            const verifyResponse = await fetch(
                `${API_URL}/purchase/verify-payment/${orderId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization": "Bearer " + token
                    }
                }
            );


            const verifyData =
                await verifyResponse.json();


            document.getElementById("paymentMessage").innerText =
                verifyData.message;


            if (verifyData.isPremium) {

                document.getElementById("premiumButton").style.display =
                    "none";

            }

        });


    } catch (error) {

        console.log(error);

        document.getElementById("paymentMessage").innerText =
            "Payment could not be started";

    }

}
// ==================== CHECK LOGIN ====================

if (!token) {

    window.location.href = "login.html";

}


// ==================== FORM ====================

const expenseForm =
    document.getElementById("expenseForm");


expenseForm.addEventListener(
    "submit",
    addExpense
);


// ==================== ADD EXPENSE ====================

async function addExpense(event) {

    event.preventDefault();


    const amount =
    document.getElementById("amount").value;

const description =
    document.getElementById("description").value;

const note =
    document.getElementById("note").value;

const expenseDetails = {

    amount: amount,

    description: description,

    note: note

};


    try {

        const response = await fetch(
            `${API_URL}/expense/add`,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Bearer " + token

                },

                body:
                    JSON.stringify(expenseDetails)

            }
        );


        const data = await response.json();


        document.getElementById("message").innerText =
            data.message;


        if (response.ok) {

            expenseForm.reset();

            getExpenses();

        }


    } catch (error) {

        document.getElementById("message").innerText =
            "Error: " + error.message;

    }

}


// ==================== GET EXPENSES ====================

async function getExpenses() {

    try {

        const response = await fetch(
            `${API_URL}/expense/all`,
            {

                method: "GET",

                headers: {

                    "Authorization":
                        "Bearer " + token

                }

            }
        );


        const data = await response.json();
        allExpenses = Array.isArray(data) ? data : [];


        if (!response.ok) {

            document.getElementById("message").innerText =
                data.message;

            return;

        }


        displayExpenses();


    } catch (error) {

        document.getElementById("message").innerText =
            "Error: " + error.message;

    }

}

// ==================== DISPLAY EXPENSES ====================

function displayExpenses() {

    const expenseList =
        document.getElementById("expenseList");

    expenseList.innerHTML = "";


    const startIndex =
        (currentPage - 1) * expensesPerPage;

    const endIndex =
        startIndex + expensesPerPage;


    const expensesToDisplay =
        allExpenses.slice(
            startIndex,
            endIndex
        );


    expensesToDisplay.forEach(expense => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${expense.id}</td>

            <td>${expense.amount}</td>

            <td>${expense.description}</td>

            <td>${expense.note || ""}</td>

            <td>${expense.category}</td>

            <td>

                <button
                    onclick="deleteExpense(${expense.id})">

                    Delete

                </button>

            </td>

        `;


        expenseList.appendChild(row);

    });


    updatePagination();

}
// ==================== UPDATE PAGINATION ====================

function updatePagination() {

    const totalPages =
    Math.max(
        1,
        Math.ceil(
            allExpenses.length / expensesPerPage
        )
    );


    pageNumber.innerText =
        `Page ${currentPage} of ${totalPages}`;


    previousButton.disabled =
        currentPage === 1;


    nextButton.disabled =
        currentPage === totalPages;

}

// ==================== NEXT PAGE ====================

function nextPage() {

    const totalPages =
        Math.ceil(
            allExpenses.length / expensesPerPage
        );


    if (currentPage < totalPages) {

        currentPage++;

        displayExpenses();

    }

}


// ==================== PREVIOUS PAGE ====================

function previousPage() {

    if (currentPage > 1) {

        currentPage--;

        displayExpenses();

    }

}

// ==================== DELETE EXPENSE ====================

async function deleteExpense(id) {

    try {

        const response = await fetch(
            `${API_URL}/expense/delete/${id}`,
            {

                method: "DELETE",

                headers: {

                    "Authorization":
                        "Bearer " + token

                }

            }
        );


        const data = await response.json();


        document.getElementById("message").innerText =
            data.message;


        if (response.ok) {

            getExpenses();

        }


    } catch (error) {

        document.getElementById("message").innerText =
            "Error: " + error.message;

    }

}


// ==================== LOGOUT ====================

document
    .getElementById("logoutButton")
    .addEventListener("click", logout);


function logout() {

    localStorage.removeItem("token");

    window.location.href =
        "login.html";

}


// ==================== LOAD EXPENSES ====================

getExpenses();
checkPremiumStatus();

document
    .getElementById("leaderboardButton")
    .addEventListener("click", showLeaderboard);


async function showLeaderboard() {

    try {

        const response = await fetch(
            `${API_URL}/leaderboard`,
            {
                method: "GET",

                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            document.getElementById("leaderboard").innerText =
                data.message;

            return;
        }

        const leaderboard =
            document.getElementById("leaderboard");

        leaderboard.innerHTML = "<h2>Leaderboard</h2>";

        data.forEach((user, index) => {

            const row = document.createElement("p");

            row.innerText =
                `${index + 1}. ${user.name} - ₹${user.totalExpense}`;

            leaderboard.appendChild(row);

        });

    } catch (error) {

        console.log(error);

        document.getElementById("leaderboard").innerText =
            "Could not load leaderboard";

    }

}

document
    .getElementById("dailyReportButton")
    .addEventListener("click", () => {
        showReport("daily");
    });

document
    .getElementById("weeklyReportButton")
    .addEventListener("click", () => {
        showReport("weekly");
    });

document
    .getElementById("monthlyReportButton")
    .addEventListener("click", () => {
        showReport("monthly");
    });

    function showReport(type) {
        console.log("All expenses:", allExpenses);
console.log("Today:", new Date().toString());

    const today = new Date();

    let filteredExpenses = [];

    if (type === "daily") {

    filteredExpenses = allExpenses.filter(expense => {

        const expenseDate =
            new Date(expense.createdAt);

            console.log(
    "Expense date:",
    new Date(expense.createdAt).toString()
);

        return (
            expenseDate.toDateString() ===
            today.toDateString()
        );

    });

}


    if (type === "weekly") {

        const sevenDaysAgo = new Date();

        sevenDaysAgo.setDate(
            today.getDate() - 7
        );

        filteredExpenses = allExpenses.filter(expense => {

            const expenseDate =
                new Date(expense.createdAt);

            return expenseDate >= sevenDaysAgo;

        });

    }


    if (type === "monthly") {

        filteredExpenses = allExpenses.filter(expense => {

            const expenseDate =
                new Date(expense.createdAt);

            return (
                expenseDate.getMonth() === today.getMonth() &&
                expenseDate.getFullYear() === today.getFullYear()
            );

        });

    }


    displayReport(filteredExpenses, type);

}

function displayReport(expenses, type) {

    const report =
        document.getElementById("report");

    report.innerHTML = "";


    const heading =
        document.createElement("h3");

    heading.innerText =
        type.charAt(0).toUpperCase() +
        type.slice(1) +
        " Expense Report";

    report.appendChild(heading);


    if (expenses.length === 0) {

        const message =
            document.createElement("p");

        message.innerText =
            "No expenses found for this period.";

        report.appendChild(message);

        return;
    }


    let total = 0;


    expenses.forEach(expense => {

        total += Number(expense.amount);


        const item =
            document.createElement("p");

        item.innerText =
            `${expense.description} - ₹${expense.amount} - ${expense.category}`;

        report.appendChild(item);

    });


    const totalElement =
        document.createElement("h3");

    totalElement.innerText =
        `Total Expense: ₹${total}`;

    report.appendChild(totalElement);

}

downloadReportButton.addEventListener(
    "click",
    downloadReport
);


// download report

function downloadReport() {

    if (!allExpenses.length) {

        alert("No expenses available to download");

        return;
    }

    let csvContent =
        "ID,Amount,Description,Category,Date\n";

    allExpenses.forEach(expense => {

        csvContent +=
            `${expense.id},` +
            `${expense.amount},` +
            `"${expense.description}",` +
            `${expense.category},` +
            `${expense.createdAt}\n`;

    });

    const blob = new Blob(
        [csvContent],
        { type: "text/csv" }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "expense-report.csv";

    link.click();

    URL.revokeObjectURL(url);
}