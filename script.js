document.addEventListener('DOMContentLoaded', () => {
    // LIFFの初期化
    initializeLiff();

    // Swingライブラリが読み込まれるのを待ってからスワイプ機能を初期化
    waitForSwing();
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

/**
 * Swingライブラリがロードされるのを待つ関数
 */
function waitForSwing(maxRetries = 50) { // 最大5秒待つ (50 * 100ms)
    if (typeof Swing !== 'undefined') {
        // Swingが定義されていれば、スワイプ初期化を実行
        console.log("Swing.js is loaded. Initializing swipe.");
        initializeSwipe();
    } else if (maxRetries > 0) {
        // まだ定義されていなければ、100ms待って再試行
        console.log("Waiting for Swing.js to load...");
        setTimeout(() => waitForSwing(maxRetries - 1), 100);
    } else {
        // タイムアウトした場合
        console.error("Failed to load Swing.js after 5 seconds.");
    }
}

// スワイプ機能の初期化
function initializeSwipe() {
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
        console.log(`Card ${event.target.dataset.cardId} was thrown out.`);
        setTimeout(() => {
            event.target.remove();
        }, 300);
    });
}
