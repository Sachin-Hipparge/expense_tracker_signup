const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


async function categorizeExpense(description) {

    const prompt = `
        Categorize this expense into exactly one of these categories:

        Food
        Petrol
        Salary
        Shopping
        Travel
        Other

        Expense description:
        ${description}

        Return ONLY the category name.
        Do not return any explanation.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
    });

    return response.text.trim();
}


module.exports = {
    categorizeExpense
};