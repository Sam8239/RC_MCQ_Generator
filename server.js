import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

let generatedMCQs = {};

app.post('/generate-mcq', async (req, res) => {
    const rcText = req.body.rcText;
    const no_of_questions = req.body.no_of_questions;

    try {
        // Generate MCQs along with correct answers
        generatedMCQs = await generateMCQs(rcText, no_of_questions);
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
async function generateMCQs(rcText, no_of_questions) {
    const chatModel = new ChatGoogleGenerativeAI({
        modelName: "gemini-1.0-pro",
        temperature: 0
    });

    const outputParser = new StringOutputParser();

    const prompt = PromptTemplate.fromTemplate(
        "{rcText} This is a reading comprehension passage, based on this create {no_of_questions} cat exam-level multiple-choice questions with options. Following the MCQs, also provide the answers separately with correct options with full option, ensuring that the answers are not directly provided after each question. Also Each question should have only one correct answer"
    );

    const chain = prompt.pipe(chatModel).pipe(outputParser);
    const response = await chain.invoke({
        rcText: rcText,
        no_of_questions: no_of_questions
    });
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
