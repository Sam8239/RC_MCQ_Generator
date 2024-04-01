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
function updateStatisticsUI(statistics) {
    document.getElementById('unattempted').textContent = `Unattempted: ${statistics.unattemptedQuestions}`;
    document.getElementById('correct').textContent = `Correct: ${statistics.correctAnswers}`;
    document.getElementById('attempted').textContent = `Attempted: ${statistics.attemptedQuestions}`;
    document.getElementById('total').textContent = `Total: ${statistics.totalQuestions}`;
}

// Celebration Animation
function showCelebration() {
    const celebrationElement = document.getElementById('celebration-animation');
    celebrationElement.classList.remove('hidden');
    setTimeout(() => {
        celebrationElement.classList.add('hidden');
    }, 3000); // Adjust the time as needed
}

// Functions Ends

// Handles Generate MCQ's Button
document.getElementById('generate-btn').addEventListener('click', () => {
    const rcText = document.getElementById('rc-text').value.trim();
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
            body: JSON.stringify({ rcText })
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
                            if (correctAnswers === data.mcqs.questions.length) {
                                showCelebration()
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
