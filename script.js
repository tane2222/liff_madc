document.addEventListener('DOMContentLoaded', () => {
    // LIFFの初期化
    initializeLiff();

    // Swiperの初期化
    initializeSwiper();
});

// LIFF初期化 (変更なし)
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
 * Swiper.js を初期化する関数
 * (古いinitializeSwipe関数は完全に削除します)
 */
function initializeSwiper() {
    // "Swing" ではなく、"Swiper" クラスを使用しま-す
    const swiper = new Swiper('.swiper', {
        // カードがめくれるエフェクトを有効にする
        effect: 'cards',

        // スワイプ時にマウスカーソルを掴む形にする
        grabCursor: true,

        // カードエフェクトの詳細設定
        cardsEffect: {
            rotate: true,
            perSlideRotate: 2,
            perSlideOffset: 8,
            slideShadows: true,
        },

        // 無限にループさせる
        loop: true,
    });
}
