// === FUNCIONES DEL TECLADO MATEMÁTICO ===
function insertMath(text) {
    const input = document.getElementById('userInput');
    input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
    input.focus();
}

function backspace() {
    const input = document.getElementById('userInput');
    const value = input.value;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end) {
        input.setRangeText('', start - 1, end);
        input.selectionStart = input.selectionEnd = start - 1;
    } else {
        input.setRangeText('', start, end);
        input.selectionStart = input.selectionEnd = start;
    }
    input.focus();
}

function clearInput() {
    document.getElementById('userInput').value = '';
    document.getElementById('userInput').focus();
}

document.getElementById('mathKeyboardToggle').addEventListener('click', () => {
    document.getElementById('mathKeyboard').classList.toggle('active');
});

document.getElementById('closeKeyboard').addEventListener('click', () => {
    document.getElementById('mathKeyboard').classList.remove('active');
});

document.addEventListener('click', (e) => {
    const keyboard = document.getElementById('mathKeyboard');
    const toggle = document.getElementById('mathKeyboardToggle');
    if (!keyboard.contains(e.target) && !toggle.contains(e.target) && keyboard.classList.contains('active')) {
        keyboard.classList.remove('active');
    }
});
