const express = require('express');
require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

// Gemini API Configuration
const geminiAPIKey = process.env.API_KEY; // Replace with your Gemini API key
const genAI = new GoogleGenerativeAI(geminiAPIKey);
const MODEL_NAME = "gemini-1.0-pro";

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

let generatedMCQs = {}; // Define a variable to store generated MCQs and correct answers

app.post('/generate-mcq', async (req, res) => {
    const rcText = req.body.rcText;
    try {
        // Generate MCQs along with correct answers
        generatedMCQs = await generateMCQs(rcText);
        res.json({ mcqs: generatedMCQs.mcqs }); // Return only the MCQs to the client
    } catch (error) {
        console.error('Error generating MCQs:', error);
        res.status(500).json({ error: 'Failed to generate MCQs' });
    }
});

app.post('/submit-mcq', (req, res) => {
    const submittedAnswers = req.body.selectedAnswers;
    const correctAnswers = generatedMCQs.answers.map(answer => answer.trim()); // 

    const validationResult = {};

    for (const [questionIndex, answer] of Object.entries(submittedAnswers)) {
        // Compare submitted answer with correct answer
        validationResult[questionIndex] = correctAnswers[questionIndex] === answer;
    }

    res.json(validationResult);
});

app.get('/privacy_policy', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'privacy_policy.html');
    res.sendFile(filePath);
});

app.get('/terms_of_service', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'terms_of_service.html');
    res.sendFile(filePath);
});

//Functions
// Generate MCQS using Gemini API
async function generateMCQs(rcText) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
        temperature: 0,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
    };

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
    ];

    const parts = [
        { text: `${rcText} This is a reading comprehension passage, based on this create cat exam-level multiple-choice questions with options. Following the MCQs, also provide the answers separately with correct options with full option, ensuring that the answers are not directly provided after each question. Also Each question should have only one correct answer` },
    ];

    const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
        safetySettings,
    });

    const response = result.response.text();
    const mcqs = extractMCQs(response)
    return mcqs
}

// Extract MCQS from Gemini Api Response
function extractMCQs(responseText) {
    const mcqRegex = /^\d+\.\s+(.*)\n\((.)\)\s(.*)/gmi;
    const answerRegex = /^\d+\.\s+\((.)\)(.+)/gmi;
    const optionRegex = /^\(([a-zA-Z])\)\s([^(\n)]+)/gmi;

    let questions = [];
    let options = [];
    let answers = [];

    let match;
    while ((match = mcqRegex.exec(responseText)) !== null) {
        questions.push(match[1]);
    }

    while ((match = answerRegex.exec(responseText)) !== null) {
        answers.push(match[2]);
    }

    while ((match = optionRegex.exec(responseText)) !== null) {
        options.push(match[2]);
    }

    return { mcqs: { questions, options }, answers };
}


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
