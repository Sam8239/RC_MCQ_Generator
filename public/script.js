// Loader Starts
const loader = document.getElementsByClassName("loader-div")[0];
const data_loader = document.getElementById("data-loader");

window.addEventListener("load", () => {
    loader.style.display = "none"; // Hide the loader
    loader.style.setProperty("display", "none", "important"); // Apply !important to the display property
});

// Loader Ends

// Functions Starts
// Reset the bg color of all options
const reset_bg_color = (mcqList) => {
    const options = mcqList.querySelectorAll(".options div label");
    options.forEach(option => {
        option.style.backgroundColor = "";
    });
}

// Handles MCQs Validation
function handleValidationResult(result) {
    let correctAnswers = 0;

    for (const [questionIndex, isValid] of Object.entries(result)) {
        const selectedOption = document.querySelector(`input[name="mcq-${questionIndex}"]:checked`);

        if (selectedOption && selectedOption.parentElement) {
            const optionLabel = selectedOption.parentElement;
            if (isValid) {
                correctAnswers++;
                optionLabel.style.backgroundColor = 'lightgreen';
            } else {
                optionLabel.style.backgroundColor = 'red';
            }
        }
    }
    return correctAnswers
}

// Calculate statistics based on user input
function calculateStatistics(mcqs, submittedAnswers, correctAnswers) {
    const totalQuestions = mcqs.questions.length;
    const attemptedQuestions = Object.keys(submittedAnswers).length;
    const unattemptedQuestions = totalQuestions - attemptedQuestions;

    return {
        totalQuestions,
        unattemptedQuestions,
        attemptedQuestions,
        correctAnswers
    };
}

// Update the UI with the calculated statistics
function updateStatisticsUI({ unattemptedQuestions = 0, correctAnswers = 0, attemptedQuestions = 0, totalQuestions = 0 } = {}) {
    document.getElementById('unattempted').textContent = `Unattempted: ${unattemptedQuestions}`;
    document.getElementById('correct').textContent = `Correct: ${correctAnswers}`;
    document.getElementById('attempted').textContent = `Attempted: ${attemptedQuestions}`;
    document.getElementById('total').textContent = `Total: ${totalQuestions}`;
}

// Celebration Animation
function showCelebration() {
    const celebrationElement = document.getElementById('celebration-animation');
    celebrationElement.classList.remove('d-none');
    setTimeout(() => {
        celebrationElement.classList.add('d-none');
    }, 3000); // Adjust the time as needed
}


// Timer Starts
let timerInterval;
let seconds = 0;
let minutes = 0;
const timerElement = document.getElementById('timer');

// Start timer function
function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        updateTimerElement();
    }, 1000);
}

// Stop timer function
function stopTimer() {
    clearInterval(timerInterval);
}

// Update timer display function
function updateTimerElement() {
    timerElement.textContent = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

// Timer Ends

// Function to reset stats and timer
const resetStatsAndTimer = () => {
    // Reset timer to 00:00
    timerElement.textContent = '00:00';

    // Reset stats except for the total
    document.getElementById('unattempted').textContent = "Unattempted: 0";
    document.getElementById('correct').textContent = "Correct: 0";
    document.getElementById('attempted').textContent = "Attempted: 0";
};

// Functions Ends

// Handles Generate MCQ's Button
document.getElementById('generate-btn').addEventListener('click', () => {
    const rcText = document.getElementById('rc-text').value.trim();
    const no_of_questions = document.getElementById('numQuestions').value;
    data_loader.style.display = "flex";
    data_loader.style.setProperty("display", "flex", "important");
    const mcqList = document.getElementById('mcq-list');

    mcqList.innerHTML = ''; // Clear previous MCQs

    if (rcText) {
        fetch('/generate-mcq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rcText, no_of_questions })
        })
            .then(response => response.json())
            .then(data => {
                data_loader.style.display = "none";
                data_loader.style.setProperty("display", "none", "important");

                // Generates MCQS Dynamically
                data.mcqs.questions.forEach((question, index) => {
                    const mcqItem = document.createElement('li');

                    // Create a div for the question with class "questions"
                    const questionDiv = document.createElement('div');
                    questionDiv.classList.add('questions');
                    questionDiv.textContent = `${index + 1}. ${question}`;
                    mcqItem.appendChild(questionDiv);

                    const startIndex = index * 4;
                    const endIndex = startIndex + 4;
                    const options = data.mcqs.options.slice(startIndex, endIndex);

                    // Create a div for options with class "options"
                    const optionsDiv = document.createElement('div');
                    optionsDiv.classList.add('options');

                    options.forEach((option, optionIndex) => {
                        const optionElem = document.createElement('div');
                        const labelElem = document.createElement('label'); // Create a label element
                        labelElem.style.display = 'block'; // Make the label a block element to occupy the entire row
                        const inputElem = document.createElement('input');
                        inputElem.type = 'radio';
                        inputElem.name = `mcq-${index}`; // Assign unique name for each MCQ
                        inputElem.value = option;
                        labelElem.appendChild(inputElem); // Append radio button to label
                        labelElem.appendChild(document.createTextNode(option)); // Append option text to label
                        optionElem.appendChild(labelElem); // Append label to div
                        optionsDiv.appendChild(optionElem);
                    });

                    mcqItem.appendChild(optionsDiv); // Append options div to mcqItem
                    mcqList.appendChild(mcqItem);
                });

                startButton.disabled = false;

                updateStatisticsUI({ totalQuestions: data.mcqs.questions.length })

                // Reset Button
                const resetBtn = document.createElement('button');
                resetBtn.textContent = 'Reset';
                resetBtn.setAttribute('id', 'reset-btn');

                // Handles Reset Button
                resetBtn.addEventListener('click', () => {
                    // Reset all radio buttons in the MCQ list
                    const radioButtons = mcqList.querySelectorAll('input[type="radio"]');
                    radioButtons.forEach(radioButton => {
                        radioButton.checked = false;
                    });

                    reset_bg_color(mcqList)
                    resetStatsAndTimer()
                })

                mcqList.appendChild(resetBtn);

                // Submit Button
                const submitBtn = document.createElement('button');
                submitBtn.textContent = 'Submit';
                submitBtn.setAttribute('id', 'submit-btn');

                // Handles Submit MCQS Button
                submitBtn.addEventListener('click', () => {
                    reset_bg_color(mcqList)
                    const selectedAnswers = {};
                    data.mcqs.questions.forEach((question, index) => {
                        const selectedOption = document.querySelector(`input[name="mcq-${index}"]:checked`);
                        if (selectedOption) {
                            selectedAnswers[index] = selectedOption.value;
                        }
                    });

                    // Send answers to the server for validation
                    fetch('/submit-mcq', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ selectedAnswers })
                    })
                        .then(response => response.json())
                        .then(result => {
                            const correctAnswers = handleValidationResult(result);
                            const statistics = calculateStatistics(data.mcqs, selectedAnswers, correctAnswers)
                            updateStatisticsUI(statistics)

                            // If all the answers are correct
                            if (correctAnswers === data.mcqs.questions.length) {
                                showCelebration()
                                stopTimer();
                                startButton.disabled = false;
                            }
                        })
                        .catch(error => console.error('Error:', error));
                });

                mcqList.appendChild(submitBtn);
            })
            .catch(error => {
                console.error('Error fetching MCQs:', error);
                data_loader.style.display = "none"; // Hide the loader in case of error
            })
    } else {
        data_loader.style.display = "none";
        alert('Please enter some text for the reading comprehension.');
    }
});


// Handle Start button
const startButton = document.getElementById('start-button');
startButton.addEventListener('click', () => {
    startTimer();
    startButton.disabled = true; // Disable the button after clicking
});

// Number of Questions Slider 
const numQuestionsSlider = document.getElementById('numQuestions');
const selectedValue = document.getElementById('selectedValue');

// Display initial value
selectedValue.textContent = numQuestionsSlider.value;

// Update value when slider is changed
numQuestionsSlider.addEventListener('input', function () {
    selectedValue.textContent = this.value;
});
