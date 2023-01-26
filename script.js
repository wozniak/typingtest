const buffer = document.getElementById("wordBuffer");
const statusline = document.getElementById("statusline");
const amount = document.getElementById("amount");
const textBox = document.getElementById("textBox");
const timeRadio = document.getElementById("timeRadio");
const counter = document.getElementById("counter");

function updateCounter() {
    if (timeRadio.checked) 
        counter.innerText = " seconds";
    else
        counter.innerText = " words";
}

// loads the list of words
var words = [];
(async function load() {
    const text = await fetch("words.txt").then(r => r.text());
    // split the raw text by line
    words = text.split('\r\n')
})();

const TEST_TIME = 0;
const TEST_WORDS = 1;

var state = {
    timer: 0.,
    test: [],
    cur_word: 0,
    isRunning: false,
    waitingForStart: false,
    testType: TEST_WORDS,
    testDuration: 0
};

// counts the timer if it is running
setInterval(() => {
    if (state.isRunning && !state.waitingForStart) {
        state.timer += 0.01;
        renderStatusLine();
    }
}, 10);

function randomWords(count) {
    var ret = [];
    for (var i = 0; i < count; i++) {
        ret.push(words[Math.floor(Math.random() * words.length)]);
    }
    return ret;
}

function newTest() {
    state.cur_word = 0;
    state.test = [];
    state.timer = 0.;
    state.isRunning = true;
    state.waitingForStart = true;
    state.cur_wpm = 0;
    textBox.disabled = false;
    textBox.value = "";
    if (timeRadio.checked) {
        // start out with a small buffer and dynamically add more words as we
        // go on
        state.testType = TEST_TIME;
        state.testDuration = parseInt(amount.value);
        state.test = randomWords(4);
    } else {
        state.testType = TEST_WORDS;
        state.test = randomWords(parseInt(amount.value));
    }
    render();
}

function renderStatusLine() {
    var wpm = (state.cur_word / state.timer) * 60;
    var line = "";
    if (state.testType == TEST_TIME) {
        line += `${state.cur_word} words `;
    } else {
        line += `${state.cur_word}/${state.test.length} `;
    }
    line += `in ${state.timer.toFixed(0)} seconds (${wpm.toFixed(0)} wpm)`;
    statusline.innerText = line;
}

// span helper thing
function span(classname, content) {
    return `<span class="${classname}">${content}</span>`;
}

function render(done) {
    renderStatusLine();
    var innerHTML = "";
    state.test.forEach((word, index) => {
        if (index < state.cur_word) {
            innerHTML += span("correct", word) + " ";
        } else if (index > state.cur_word) {
            innerHTML += span("untyped", word) + " ";
        } else {
            // the word currently being typed
            let entered = textBox.value;
            word.split('').forEach((ch, i) => {
                if (entered.length <= i) { // untyped
                    innerHTML += span("", ch);
                } else if (ch == entered[i]) {
                    innerHTML += span("correct", ch);
                } else {
                    innerHTML += span("wrong", ch);
                }
            });
            innerHTML += " ";
        }
    });
    buffer.innerHTML = innerHTML;
    if (done) {
        textBox.placeholder = "";
        textBox.disabled = true;
    } else {
        textBox.placeholder = state.test[state.cur_word];
    }
}

function testIsOver() {
    return (state.testType == TEST_TIME && state.timer >= state.testDuration) ||
           (state.testType == TEST_WORDS && state.test.length == state.cur_word);
}

function keyPress() {
    var entered = textBox.value;

    if (state.waitingForStart) state.waitingForStart = false;
    if (entered.toLowerCase() == state.test[state.cur_word].toLowerCase() + " ") {
        state.cur_word += 1;
        textBox.value = "";
    }
    if (testIsOver()) {
        state.isRunning = false;
        render(true);
        return;
    }
    if (state.testType == TEST_TIME && state.test.length - state.cur_word < 3) {
        state.test = state.test.concat(randomWords(1));
    }
    render(false);
}