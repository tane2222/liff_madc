document.addEventListener('DOMContentLoaded', () => {
    // LIFFの初期化
    initializeLiff();

    // スワイプ機能の初期化
    initializeSwipe();
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


// スワイプ機能の初期化
function initializeSwipe() {
    const stackElement = document.querySelector('.card-stack');
    
    // Swingのstackインスタンスを作成
    const stack = Swing.Stack({
        // カードが一定以上スワイプされたらstackから離れる
        throwOutConfidence: (xOffset, yOffset, element) => {
            return Math.min(Math.abs(xOffset) / (element.offsetWidth / 2), 1);
        },
        // スワイプ中にカードを回転させる
        rotation: (xOffset, yOffset, element, confidence) => {
            return (xOffset / element.offsetWidth) * 15 * confidence;
        }
    });

    // HTMLにあるカード要素を取得
    const cards = Array.from(stackElement.querySelectorAll('.profile-card')).reverse();

    // 各カードをSwingのstackに追加
    cards.forEach(cardElement => {
        stack.createCard(cardElement);
    });

    // カードがスワイプアウトされた時のイベント
    stack.on('throwout', (event) => {
        console.log(`Card ${event.target.dataset.cardId} was thrown out to the ${event.throwDirection === Swing.Direction.LEFT ? 'left' : 'right'}`);
        
        // アニメーションが終わってからDOMから削除
        setTimeout(() => {
            event.target.remove();
            
            // TODO: ここで新しいカードをGASから取得してstackに追加する処理を将来的に実装
            // addNewCard(); 
        }, 300); // 0.3秒 (CSSのtransitionと合わせる)
    });

    // カードがスワイプアウトされずに元の位置に戻った時のイベント
    stack.on('throwin', () => {
        // console.log('Card thrown back in');
    });
}
