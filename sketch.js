let cubes = [];
let placeholders = [];
let selectedOption = 'letters';
let orderedItems = [];
let cubeSize = 50;
let rowLimit = 12;
let success = false;
let sounds = {};
let applauseSound;

let timer = null;
let elapsedTime = 0;
let grade = 0;
let isAttemptActive = false;

function preload() {
  for (let i = 65; i <= 90; i++) {
    let letter = String.fromCharCode(i);
    sounds[letter] = loadSound(`${letter}.mp3`);
  }
  for (let i = 0; i <= 10; i++) {
    sounds[i.toString()] = loadSound(`${i}.mp3`);
  }
  applauseSound = loadSound('applause.mp3');
}

function setup() {
  let canvas = createCanvas(800, 400);
  canvas.parent('p5-container');
  noStroke();

  setupGame();

  select('#letters').mousePressed(() => {
    selectedOption = 'letters';
    setupGame();
  });

  select('#numbers').mousePressed(() => {
    selectedOption = 'numbers';
    setupGame();
  });

  select('#randomize').mousePressed(() => {
    if (isAttemptActive) {
      randomizeCubes();
    }
  });


// Tooltip setup
const attemptButton = select('#attempt');
const tooltip = select('#tooltip');

attemptButton.mouseOver(() => {
  tooltip.html(`
    <strong>Grading Instructions:</strong><br>
    <em>Letters:</em> Complete within:
    <ul>
      <li>0-30s: 100%</li>
      <li>31-60s: 90%</li>
      <li>61-90s: 80%</li>
      <li>91-120s: 70%</li>
      <li>121-180s: 60%</li>
      <li>181-240s: 50%</li>
      <li>241-300s: 40%</li>
      <li>301-360s: 30%</li>
      <li>361+ seconds: 10%</li>
    </ul>
    <em>Numbers:</em> Slightly stricter intervals for faster completion.
  `);
     // Position tooltip to the right of the button
     const btnBounds = attemptButton.elt.getBoundingClientRect();
     tooltip.position(btnBounds.right + 10, btnBounds.top + window.scrollY);
     tooltip.show();
});

attemptButton.mouseOut(() => {
  tooltip.hide();
});

  select('#attempt').mousePressed(() => {
    if (timer) {
      resetGame();
    } else {
      startGame();
    }
  });

  select('#back').mousePressed(() => {
    success = false;
    select('#congratulations').addClass('hidden');
    setupGame();
  });
}

function startGame() {
  resetGame();
  timer = setInterval(() => {
    elapsedTime++;
    updateStopwatch();
  }, 1000);
  isAttemptActive = true;
  select('#attempt').html('Attempt Again');
}

function resetGame() {
  clearInterval(timer);
  timer = null;
  elapsedTime = 0;
  isAttemptActive = false;
  updateStopwatch();
  select('#grade-container').addClass('hidden');
  setupGame();
}

function updateStopwatch() {
  let minutes = floor(elapsedTime / 60).toString().padStart(2, '0');
  let seconds = (elapsedTime % 60).toString().padStart(2, '0');
  select('#stopwatch').html(`${minutes}:${seconds}`);
}

function setupGame() {
  cubes = [];
  placeholders = [];
  success = false;
  select('#congratulations').addClass('hidden');

  orderedItems = selectedOption === 'letters'
    ? Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
    : Array.from({ length: 11 }, (_, i) => i.toString());

  let shuffledItems = shuffle([...orderedItems]);

  let rows = ceil(orderedItems.length / rowLimit);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < rowLimit; j++) {
      let index = i * rowLimit + j;
      if (index < orderedItems.length) {
        placeholders.push(new Placeholder(50 + j * (cubeSize + 10), 50 + i * (cubeSize + 10), orderedItems[index]));
      }
    }
  }

  for (let i = 0; i < shuffledItems.length; i++) {
    let x = random(100, width - cubeSize);
    let y = random(height / 2, height - cubeSize);
    cubes.push(new Cube(x, y, shuffledItems[i]));
  }
}

function draw() {
  background(200);

  for (let placeholder of placeholders) {
    placeholder.show();
  }

  for (let cube of cubes) {
    cube.show();
    if (cube.falling) {
      cube.y += 1.5;
      if (cube.y > cube.startY) {
        cube.y = cube.startY;
        cube.falling = false;
      }
    }
  }

  if (!success && placeholders.every(ph => ph.correct)) {
    calculateGrade();
    showCongratulations();
  }
}

function mousePressed() {
  if (!isAttemptActive) return;
  for (let cube of cubes) {
    cube.checkClicked();
  }
}

function mouseDragged() {
  if (!isAttemptActive) return;
  for (let cube of cubes) {
    if (cube.dragging) {
      cube.x = mouseX - cubeSize / 2;
      cube.y = mouseY - cubeSize / 2;
    }
  }
}

function mouseReleased() {
  if (!isAttemptActive) return;
  for (let cube of cubes) {
    if (cube.dragging) {
      cube.dragging = false;
      let matched = false;

      for (let placeholder of placeholders) {
        if (placeholder.contains(cube) && placeholder.value === cube.value) {
          cube.snapTo(placeholder);
          matched = true;
          placeholder.correct = true;
        }
      }

      if (!matched) {
        cube.startFall();
      }
    }
  }
}

function calculateGrade() {
  success = true;
  clearInterval(timer);

  if (selectedOption === 'numbers') {
    if (elapsedTime <= 20) grade = 100;
    else if (elapsedTime <= 60) grade = 80;
    else if (elapsedTime <= 90) grade = 70;
    else if (elapsedTime <= 120) grade = 60;
    else if (elapsedTime <= 180) grade = 50;
    else if (elapsedTime <= 240) grade = 40;
    else if (elapsedTime <= 300) grade = 30;
    else if (elapsedTime <= 360) grade = 20;
    else grade = 10;
  } else if (selectedOption === 'letters') {
    if (elapsedTime <= 30) grade = 100;
    else if (elapsedTime <= 60) grade = 90;
    else if (elapsedTime <= 90) grade = 80;
    else if (elapsedTime <= 120) grade = 70;
    else if (elapsedTime <= 180) grade = 60;
    else if (elapsedTime <= 240) grade = 50;
    else if (elapsedTime <= 300) grade = 40;
    else if (elapsedTime <= 360) grade = 30;
    else grade = 10;
  }

  select('#grade-display').html(`Your Grade is: ${grade}%`);
  select('#grade-container').removeClass('hidden');
}

function showCongratulations() {
  applauseSound.play();
  select('#congratulations').removeClass('hidden');
}

function randomizeCubes() {
  for (let cube of cubes) {
    cube.x = random(100, width - cubeSize);
    cube.y = random(height / 2, height - cubeSize);
    cube.startX = cube.x;
    cube.startY = cube.y;
  }
}

class Placeholder {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.correct = false;
  }

  show() {
    fill(this.correct ? 'green' : 'white');
    stroke(0);
    rect(this.x, this.y, cubeSize, cubeSize, 5);
    fill(0);
    textAlign(CENTER, CENTER);
    text(this.value, this.x + cubeSize / 2, this.y + cubeSize / 2);
  }

  contains(cube) {
    return (
      cube.x + cubeSize / 2 > this.x &&
      cube.x + cubeSize / 2 < this.x + cubeSize &&
      cube.y + cubeSize / 2 > this.y &&
      cube.y + cubeSize / 2 < this.y + cubeSize
    );
  }
}

class Cube {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.startX = x;
    this.startY = y;
    this.dragging = false;
    this.falling = false;
  }

  show() {
    fill('skyblue');
    rect(this.x, this.y, cubeSize, cubeSize, 5);
    fill(0);
    textAlign(CENTER, CENTER);
    text(this.value, this.x + cubeSize / 2, this.y + cubeSize / 2);
  }

  checkClicked() {
    if (
      mouseX > this.x &&
      mouseX < this.x + cubeSize &&
      mouseY > this.y &&
      mouseY < this.y + cubeSize
    ) {
      this.dragging = true;
      if (sounds[this.value]) {
        sounds[this.value].play();
      }
    }
  }

  snapTo(placeholder) {
    this.x = placeholder.x;
    this.y = placeholder.y;
  }

  startFall() {
    this.falling = true;
  }
}
