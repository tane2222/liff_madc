document.addEventListener('DOMContentLoaded', () => {
    // LIFFの初期化
    initializeLiff();

    // スワイプ機能の初期化
    initializeSwipe();
});

// LIFF初期化
async function initializeLiff() {
    try {
        await liff.init({
            liffId: "2008378264-4O97qRYQ" // <-- ここをあなたのLIFF IDに書き換えてください
        });

        if (!liff.isLoggedIn()) {
            console.log("LIFF initialized. Not logged in.");
        } else {
            console.log("LIFF initialized. Logged in.");
        }

    } catch (error) {
        console.error("LIFF initialization failed:", error);
    }
}

// スワイプ機能の初期化
function initializeSwipe() {
    // Swingライブラリがロードされているか安全確認
    if (typeof Swing === 'undefined') {
        console.error('Swing.js is not loaded!');
        return;
    }

    const stackElement = document.querySelector('.card-stack');
    const stack = Swing.Stack({
        throwOutConfidence: (xOffset, yOffset, element) => {
            return Math.min(Math.abs(xOffset) / (element.offsetWidth / 2.5), 1);
        },
        rotation: (xOffset, yOffset, element, confidence) => {
            const rotationDegree = (xOffset / element.offsetWidth) * 15;
            return rotationDegree * confidence;
        }
    });

    const cardElements = Array.from(stackElement.querySelectorAll('.profile-card'));
    cardElements.reverse().forEach(cardElement => {
        stack.createCard(cardElement);
    });

    stack.on('throwout', (event) => {
        console.log(`Card ${event.target.dataset.cardId} was thrown out to the ${event.throwDirection === Swing.Direction.LEFT ? 'left' : 'right'}`);
        
        setTimeout(() => {
            event.target.remove();
        }, 300);
    });
}
