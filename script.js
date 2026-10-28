
const $ = id => document.getElementById(id);

const game = $("game");
const startButton = $("startButton");
const player = $("player");
const sceneArea = $("scene");
const overlay = $("overlay");

const clues = {
  train: {
    name: "The Stopped Mail Train",
    chapter: 0,
    x: 34,
    y: 57,
    title: "The Train Was Stopped",
    text: "On 8 August 1963, a gang stopped a Royal Mail train travelling from Glasgow towards London. They interfered with railway signals and forced the train to stop near Bridego Bridge in Buckinghamshire. The robbers escaped with about £2.6 million — an enormous sum at the time.",
    fact: "The robbery became one of Britain's most famous crimes."
  },
  signal: {
    name: "The Railway Signal",
    chapter: 0,
    x: 78,
    y: 55,
    title: "A Dangerous Deception",
    text: "The gang tampered with the railway signal, using a covering to make it show a red light. The driver stopped the train, believing there was danger ahead. This gave the robbers an opportunity to take control.",
    fact: "The signal was central to the plan."
  },
  board: {
    name: "The Farmhouse Hideout",
    chapter: 1,
    x: 52,
    y: 59,
    title: "Leatherslade Farm",
    text: "After the robbery, the gang hid at Leatherslade Farm in Buckinghamshire. The isolated farmhouse gave them somewhere to regroup and divide the stolen money. But the hideout would become an important part of the investigation.",
    fact: "Police later discovered the farmhouse."
  },
  prints: {
    name: "Fingerprints",
    chapter: 1,
    x: 68,
    y: 53,
    title: "A Careless Mistake",
    text: "The gang left fingerprints and other evidence at the farmhouse. Investigators examined objects left behind, including items associated with the robbers. Evidence like this helped police connect people to the crime.",
    fact: "Physical evidence helped identify suspects."
  },
  notes: {
    name: "The Investigators' Notes",
    chapter: 1,
    x: 35,
    y: 65,
    title: "Following the Evidence",
    text: "Investigators collected witness statements, examined the hideout and followed leads. Solving a crime of this size required connecting many separate pieces of information rather than relying on a single clue.",
    fact: "Investigations often depend on several clues working together."
  },
  news: {
    name: "Newspaper Coverage",
    chapter: 2,
    x: 30,
    y: 53,
    title: "A National Sensation",
    text: "News of the robbery spread across Britain. The huge amount stolen, the planning involved and the investigation captured public attention. Newspapers followed the case as police worked to identify those responsible.",
    fact: "The crime received enormous public attention."
  },
  suspect: {
    name: "The Suspects",
    chapter: 2,
    x: 69,
    y: 60,
    title: "The Investigation Closes In",
    text: "Police traced evidence back to members of the gang. Several robbers were arrested, tried and convicted. Ronnie Biggs became one of the best-known figures connected to the robbery, although he later escaped from prison.",
    fact: "Biggs escaped prison in 1965 and lived abroad for decades."
  }
};

const chapters = [
  {
    title: "The Railway",
    label: "CHAPTER 01",
    location: "BRIDEGO BRIDGE",
    scene: "railway",
    story: "It is the early morning of 8 August 1963. A Royal Mail train has been stopped in the darkness. Walk around the railway, inspect the signal and investigate the train.",
    required: ["train", "signal"]
  },
  {
    title: "The Hideout",
    label: "CHAPTER 02",
    location: "LEATHERSLADE FARM",
    scene: "farm",
    story: "The robbers have fled. Investigators search the farmhouse where the gang gathered after the robbery. Look carefully: evidence has been left behind.",
    required: ["board", "prints", "notes"]
  },
  {
    title: "The Investigation",
    label: "CHAPTER 03",
    location: "POLICE CASE ROOM",
    scene: "board",
    story: "The clues are coming together. Read the news coverage and investigate the suspects. Your job is to understand how the case unfolded.",
    required: ["news", "suspect"]
  }
];

let chapterIndex = 0;
let collected = new Set();
let discovered = new Set();
let journalEntries = [];
let quizIndex = 0;
let quizScore = 0;
let selectedAnswer = null;
let answered = false;
let playerX = 12;
let playerY = 22;
let lastTime = 0;
let facing = 1;

const quizQuestions = [
  {
    question: "On what date did the Great Train Robbery take place?",
    options: ["8 August 1963", "8 August 1973", "12 October 1960"],
    answer: 0,
    explanation: "The robbery took place on 8 August 1963."
  },
  {
    question: "Where did the gang hide after the robbery?",
    options: ["Buckingham Palace", "Leatherslade Farm", "A London museum"],
    answer: 1,
    explanation: "The gang used Leatherslade Farm as a hideout."
  },
  {
    question: "Why were fingerprints important to the investigation?",
    options: [
      "They showed how much money was stolen",
      "They helped police connect suspects to evidence",
      "They revealed the train's destination"
    ],
    answer: 1,
    explanation: "Fingerprints helped investigators identify people connected to the crime."
  }
];

function startGame() {
  startButton.closest(".intro").hidden = true;
  game.hidden = false;
  chapterIndex = 0;
  collected.clear();
  discovered.clear();
  journalEntries = [];
  playerX = 12;
  playerY = 22;
  render();
}

startButton.addEventListener("click", startGame);

function render() {
  const chapter = chapters[chapterIndex];

  $("chapterLabel").textContent = chapter.label;
  $("sceneTitle").textContent = chapter.title;
  $("locationTag").textContent = chapter.location;
  $("story").textContent = chapter.story;

  $("railwayScene").hidden = chapter.scene !== "railway";
  $("farmScene").hidden = chapter.scene !== "farm";
  $("boardScene").hidden = chapter.scene !== "board";

  $("backButton").disabled = chapterIndex === 0;
  $("backButton").style.opacity = chapterIndex === 0 ? ".35" : "1";

  $("nextButton").textContent =
    chapterIndex === chapters.length - 1
      ? "SOLVE THE CASE →"
      : "NEXT LOCATION →";

  $("hotspots").innerHTML = "";

  Object.entries(clues).forEach(([id, clue]) => {
    if (clue.chapter !== chapterIndex) return;

    const button = document.createElement("button");
    button.className = "hotspot";
    button.type = "button";
    button.style.left = clue.x + "%";
    button.style.top = clue.y + "%";
    button.textContent = collected.has(id) ? "✓" : "+";
    button.title = clue.name;
    button.setAttribute("aria-label", clue.name);

    if (collected.has(id)) {
      button.style.opacity = ".5";
      button.style.animation = "none";
    }

    button.addEventListener("click", () => investigate(id));
    $("hotspots").appendChild(button);
  });

  updateEvidence();
  drawPlayer();

  $("sceneMessage").textContent =
    chapter.required.every(id => collected.has(id))
      ? "All clues found. Continue when ready."
      : "Explore the scene and find the evidence.";
}

function updateEvidence() {
  const list = $("evidenceList");
  list.innerHTML = "";

  if (collected.size === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-evidence";
    empty.textContent = "No evidence collected yet.";
    list.appendChild(empty);
  } else {
    collected.forEach(id => {
      const item = document.createElement("li");
      item.textContent = clues[id].name;
      list.appendChild(item);
    });
  }

  $("evidenceCount").textContent = collected.size;
  $("journalText").textContent = journalEntries.length
    ? journalEntries[journalEntries.length - 1]
    : "Your investigation has not started.";
}

function investigate(id) {
  const clue = clues[id];

  if (collected.has(id)) {
    showModal(
      "ALREADY DOCUMENTED",
      clue.title,
      `<p>You have already collected this clue.</p><p>${clue.fact}</p>`,
      [{ label: "CLOSE", action: closeModal, primary: true }]
    );
    return;
  }

  discovered.add(id);

  showModal(
    "EVIDENCE FOUND",
    clue.title,
    `<p>${clue.text}</p><p><strong>CASE NOTE:</strong> ${clue.fact}</p>`,
    [{
      label: "ADD TO EVIDENCE BAG",
      primary: true,
      action: () => {
        collected.add(id);
        journalEntries.push(clue.name + ": " + clue.fact);
        closeModal();
        render();
      }
    }]
  );
}

function showModal(eyebrow, title, body, actions) {
  $("modalEyebrow").textContent = eyebrow;
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = body;
  $("modalActions").innerHTML = "";

  actions.forEach(item => {
    const button = document.createElement("button");
    button.className = item.primary ? "primary-button" : "secondary-button";
    button.textContent = item.label;
    button.disabled = Boolean(item.disabled);
    button.addEventListener("click", item.action);
    $("modalActions").appendChild(button);
  });

  overlay.hidden = false;
}

function closeModal() {
  overlay.hidden = true;
}

$("closeModal").addEventListener("click", closeModal);

overlay.addEventListener("click", event => {
  if (event.target === overlay) closeModal();
});

$("backButton").addEventListener("click", () => {
  if (chapterIndex > 0) {
    chapterIndex--;
    playerX = 12;
    playerY = 22;
    render();
  }
});

$("nextButton").addEventListener("click", () => {
  const chapter = chapters[chapterIndex];
  const missing = chapter.required.filter(id => !collected.has(id));

  if (missing.length) {
    showModal(
      "INVESTIGATION INCOMPLETE",
      "There is still evidence to find.",
      `<p>You have collected ${chapter.required.length - missing.length} of ${chapter.required.length} clues in this location.</p><p>Explore the scene and investigate the remaining evidence before moving on.</p>`,
      [{ label: "RETURN TO THE SCENE", action: closeModal, primary: true }]
    );
    return;
  }

  if (chapterIndex < chapters.length - 1) {
    chapterIndex++;
    playerX = 12;
    playerY = 22;
    render();
  } else {
    startQuiz();
  }
});

/* Keyboard movement */
const heldKeys = new Set();

document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  const movementKeys = [
    "arrowup", "arrowdown", "arrowleft", "arrowright",
    "w", "a", "s", "d"
  ];

  if (movementKeys.includes(key) && !game.hidden && overlay.hidden) {
    event.preventDefault();
    heldKeys.add(key);
  }

  if (key === "e" && !game.hidden && overlay.hidden) {
    investigateNearby();
  }

  if (key === "escape" && !overlay.hidden) {
    closeModal();
  }
});

document.addEventListener("keyup", event => {
  heldKeys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => heldKeys.clear());

function drawPlayer() {
  player.style.left = playerX + "%";
  player.style.bottom = playerY + "%";
  player.style.transform = facing === -1
    ? "translateX(-50%) scaleX(-1)"
    : "translateX(-50%)";
}

function movePlayer(time) {
  if (!lastTime) lastTime = time;

  const delta = Math.min((time - lastTime) / 16.67, 2);
  lastTime = time;

  const speed = 0.48 * delta;
  let dx = 0;
  let dy = 0;

  if (heldKeys.has("arrowleft") || heldKeys.has("a")) dx--;
  if (heldKeys.has("arrowright") || heldKeys.has("d")) dx++;
  if (heldKeys.has("arrowup") || heldKeys.has("w")) dy++;
  if (heldKeys.has("arrowdown") || heldKeys.has("s")) dy--;

  const moving = dx !== 0 || dy !== 0;
  player.classList.toggle("walking", moving);

  if (moving && !game.hidden && overlay.hidden) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;

    playerX = Math.max(4, Math.min(96, playerX + dx * speed));
    playerY = Math.max(14, Math.min(78, playerY + dy * speed));

    if (dx !== 0) facing = dx > 0 ? 1 : -1;

    drawPlayer();
  }

  requestAnimationFrame(movePlayer);
}

requestAnimationFrame(movePlayer);

function investigateNearby() {
  const chapter = chapters[chapterIndex];
  let closestId = null;
  let closestDistance = Infinity;

  chapter.required.forEach(id => {
    if (collected.has(id)) return;

    const clue = clues[id];
    const distance = Math.hypot(
      clue.x - playerX,
      clue.y - playerY
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestId = id;
    }
  });

  if (closestId && closestDistance < 19) {
    investigate(closestId);
  } else {
    $("sceneMessage").textContent =
      "Move closer to a glowing clue, then press E.";
  }
}

/* Final quiz */
function startQuiz() {
  quizIndex = 0;
  quizScore = 0;
  selectedAnswer = null;
  answered = false;
  showQuestion();
}

function showQuestion() {
  const question = quizQuestions[quizIndex];

  $("modalEyebrow").textContent =
    `FINAL REPORT · QUESTION ${quizIndex + 1} OF ${quizQuestions.length}`;

  $("modalTitle").textContent = question.question;

  let html = "";
  question.options.forEach((option, index) => {
    html += `<button class="quiz-option" data-answer="${index}">${option}</button>`;
  });

  $("modalBody").innerHTML = html;

  $("modalBody").querySelectorAll(".quiz-option").forEach(button => {
    button.addEventListener("click", () => {
      if (answered) return;

      selectedAnswer = Number(button.dataset.answer);

      $("modalBody").querySelectorAll(".quiz-option").forEach(option => {
        option.classList.remove("selected");
      });

      button.classList.add("selected");
    });
  });

  $("modalActions").innerHTML = "";

  const submit = document.createElement("button");
  submit.className = "primary-button";
  submit.textContent = "CHECK ANSWER →";

  submit.addEventListener("click", () => {
    if (!answered && selectedAnswer === null) return;

    if (!answered) {
      answered = true;

      const options = $("modalBody").querySelectorAll(".quiz-option");
      options.forEach((option, index) => {
        option.disabled = true;

        if (index === question.answer) {
          option.classList.add("correct");
        } else if (index === selectedAnswer) {
          option.classList.add("wrong");
        }
      });

      if (selectedAnswer === question.answer) quizScore++;

      const feedback = document.createElement("p");
      feedback.textContent =
        (selectedAnswer === question.answer ? "Correct! " : "Not quite. ") +
        question.explanation;
      $("modalBody").appendChild(feedback);

      submit.textContent =
        quizIndex === quizQuestions.length - 1
          ? "SEE FINAL REPORT →"
          : "NEXT QUESTION →";

      return;
    }

    quizIndex++;

    if (quizIndex < quizQuestions.length) {
      selectedAnswer = null;
      answered = false;
      showQuestion();
    } else {
      showResults();
    }
  });

  $("modalActions").appendChild(submit);
  overlay.hidden = false;
}

function showResults() {
  const perfect = quizScore === quizQuestions.length;

  showModal(
    "CASE CLOSED",
    perfect ? "Excellent detective work." : "Investigation complete.",
    `<p>You scored <strong>${quizScore} out of ${quizQuestions.length}</strong> on the final report.</p>
    <p>You collected ${collected.size} of 7 clues while investigating the Great Train Robbery of 1963.</p>
    <p>${perfect
      ? "You connected the evidence and answered every question correctly."
      : "Review the clues and try again to improve your score."}</p>
    <p><strong>Historical note:</strong> This game is an educational interpretation of real events. The robbery occurred on 8 August 1963, and the gang stole approximately £2.6 million.</p>`,
    [
      {
        label: "PLAY AGAIN",
        primary: true,
        action: () => {
          closeModal();
          game.hidden = true;
          $("startButton").closest(".intro").hidden = false;
          heldKeys.clear();
          player.classList.remove("walking");
        }
      }
    ]
  );
}
