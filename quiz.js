let settings;
let startTime;

// Handle settings form submission
document.getElementById("start-container").addEventListener("submit", function(e) {
  e.preventDefault();
  var hours = parseInt(document.getElementById("hours").value);
  var minutes = parseInt(document.getElementById("minutes").value);
  var seconds = parseInt(document.getElementById("seconds").value);
  // var totalSeconds = hours * 3600 + minutes * 60 + seconds;

  const timeLimit = hours * 3600 + minutes * 60 + seconds;
  const numQuestions = parseInt(document.getElementById("num-questions").value);
  settings = { timeLimit, numQuestions };
  startQuiz();
});

let questions;
let currentQuestion = 0;
let score = 0;
let timer;
let timeLeft;
let timerInterval;

function startQuiz() {
  // Load questions from JSON file
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      questions = JSON.parse(xhr.responseText);
      questions = questions.sort(() => .5 - Math.random()).slice(0,settings.numQuestions)
      startTimer();
      showQuestion();
      showQuiz();
    }
  };
  xhr.open("GET", "sample.json", true);
  xhr.send();
}

function showQuestion() {
  console.log("Showing question:", currentQuestion);
  const questionElem = document.getElementById("question");
  questionElem.innerHTML = questions[currentQuestion].question;
  // questionElem.textContent = questions[currentQuestion].question;
  const choicesElem = document.getElementById("choices");
  choicesElem.innerHTML = "";
  questions[currentQuestion].question_choices.forEach(function(choice, index) {
    console.log("Loading choice:", choice);
    const choiceElem = document.createElement("div");
    choiceElem.classList.add("choice");
    const circleElem = document.createElement("div");
    circleElem.classList.add("circle");
    circleElem.dataset.index = index;
    circleElem.addEventListener("click", function() {
      const selected = document.querySelector(".circle.selected");
      if (selected) {
        selected.classList.remove("selected");
      }
      this.classList.add("selected");
    });
    const textElem = document.createElement("span");
    textElem.textContent = choice.answer_text;
    choiceElem.appendChild(circleElem);
    choiceElem.appendChild(textElem);
    choicesElem.appendChild(choiceElem);
  });
}

function showQuiz() {
  const startElem = document.getElementById("start-container");
  startElem.style.display = "none";
  const quizElem = document.getElementById("quiz-container");
  quizElem.style.display = "block";
  const resultElem = document.getElementById("result-container");
  resultElem.style.display = "none";
  currentQuestion = 0;
  score = 0;
  showQuestion();
  startTimer();
}

function startTimer() {
  startTime = Date.now();
  timeLeft = settings.timeLimit*1000;
  const timerContainer = document.getElementById("timer-container");
  timerContainer.style.display = "block";
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  let elapsed = Date.now() - startTime;
  let remaining = timeLeft - elapsed;
    if (remaining < 0) {
    remaining = 0;
  }
  
  let hours = Math.floor(remaining / 3600000);
  let minutes = Math.floor((remaining % 3600000) / 60000);
  let seconds = Math.floor((remaining % 60000) / 1000);

  hours = hours.toString().padStart(2, '0');
  minutes = minutes.toString().padStart(2, '0');
  seconds = seconds.toString().padStart(2, '0');

  document.getElementById("timer").textContent = `${hours}:${minutes}:${seconds}`;
  
  if (remaining === 0) {
    clearInterval(timerInterval);
    endQuiz();
  }
}

function formatTime(time) {
  let hours = Math.floor(time / 3600);
  let minutes = Math.floor((time % 3600) / 60);
  let seconds = time % 60;

  hours = hours.toString().padStart(2, '0');
  minutes = minutes.toString().padStart(2, '0');
  seconds = seconds.toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

document.getElementById("submit-btn").addEventListener("click", function() {
  const selected = document.querySelector(".circle.selected");
  if (selected) {
    const answerIndex = parseInt(selected.dataset.index);
    const correctAnswerIndex = questions[currentQuestion].index_of_correct_answer-1;
    if (answerIndex === correctAnswerIndex) {
      score++;
    }
    questions[currentQuestion].user_answer_index = answerIndex;
    currentQuestion++;
    if (currentQuestion === settings.numQuestions) {
      endQuiz();
    } else {
      showQuestion();
    }
  }
});

function endQuiz() {
  clearInterval(timer);
  const quizElem = document.getElementById("quiz-container");
  const timerElem = document.getElementById("timer-container");
  quizElem.style.display = "none";
  timerElem.style.display = "none";
  const resultElem = document.getElementById("result-container");
  resultElem.textContent = `You scored ${score} out of ${settings.numQuestions}`;
  resultElem.style.display = "block";

  
  // Show which questions the user got wrong
  const wrongQuestions = getWrongQuestions();
  if (wrongQuestions.length > 0) {
    const wrongQuestionsElem = document.createElement("div");
    wrongQuestionsElem.classList.add("wrong-questions");
    const titleElem = document.createElement("h2");
    titleElem.textContent = "Questions you got wrong:";
    wrongQuestionsElem.appendChild(titleElem);
    wrongQuestions.forEach(function(q) {
      const questionElem = document.createElement("div");
      questionElem.classList.add("question");
      const questionTextElem = document.createElement("h3");
      questionTextElem.innerHTML = q.question;
      questionElem.appendChild(questionTextElem);
      const choicesElem = document.createElement("div");
      choicesElem.classList.add("choices");
      q.question_choices.forEach(function(choice, index) {
        const choiceElem = document.createElement("div");
        choiceElem.classList.add("choice");
        const circleElem = document.createElement("div");
        circleElem.classList.add("circle");
        circleElem.dataset.index = index;
        if (index === q.index_of_correct_answer-1) {
          circleElem.classList.add("correct");
        } else if (index === q.user_answer_index) {
          circleElem.classList.add("wrong");
        }
        const textElem = document.createElement("span");
        textElem.textContent = choice.answer_text;
        choiceElem.appendChild(circleElem);
        choiceElem.appendChild(textElem);
        choicesElem.appendChild(choiceElem);
      });
      questionElem.appendChild(choicesElem);
      wrongQuestionsElem.appendChild(questionElem);
    });
    resultElem.appendChild(wrongQuestionsElem);
  }
}

function getWrongQuestions() {
  const wrongQuestions = [];
  const tempQuestions = questions.slice(0,settings.numQuestions)
  tempQuestions.forEach(function(q) {
    if (q.user_answer_index !== q.index_of_correct_answer-1) {
      wrongQuestions.push(q);
    }
  });
  return wrongQuestions;
}

