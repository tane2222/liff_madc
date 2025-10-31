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
            // カードの半分を超えたらスワイプアウトとみなす
            return Math.min(Math.abs(xOffset) / (element.offsetWidth / 2.5), 1);
        },
        // スワイプ中にカードを回転させる
        rotation: (xOffset, yOffset, element, confidence) => {
            const rotationDegree = (xOffset / element.offsetWidth) * 15; // 中央からの距離に応じて回転
            return rotationDegree * confidence;
        }
    });

    // HTMLにあるカード要素を取得し、Zオーダーに合わせて逆順に追加
    // HTMLでは下にあるものが手前になるので、Swing.jsでは逆順にcreateCardする
    const cardElements = Array.from(stackElement.querySelectorAll('.profile-card'));

    // DOMの順序が z-index と逆なので、配列を反転させてからSwingに渡す
    cardElements.reverse().forEach(cardElement => {
        stack.createCard(cardElement);
    });

    // カードがスワイプアウトされた時のイベント
    stack.on('throwout', (event) => {
        console.log(`Card ${event.target.dataset.cardId} was thrown out to the ${event.throwDirection === Swing.Direction.LEFT ? 'left' : 'right'}`);
        
        // アニメーションが終わってからDOMから削除
        setTimeout(() => {
            event.target.remove();
            
            // カード削除後、残りのカードのスタイルを再適用する関数を呼び出す
            updateCardStackStyles();

            // TODO: ここで新しいカードをGASから取得してstackに追加する処理を将来的に実装
            // addNewCard(stack); // stackインスタンスを渡す
        }, 300); // 0.3秒 (CSSのtransitionと合わせる)
    });

    // カードがスワイプアウトされずに元の位置に戻った時のイベント
    stack.on('throwin', () => {
        // console.log('Card thrown back in');
        updateCardStackStyles(); // 元に戻った時もスタイルを更新
    });

    // 初期ロード時にカードスタックのスタイルを適用
    updateCardStackStyles();
}

// カードの重なりスタイルを動的に更新する関数
function updateCardStackStyles() {
    const cardElements = document.querySelectorAll('.card-stack .profile-card');
    const numCards = cardElements.length;

    // スタイルをリセット
    cardElements.forEach(card => {
        card.style.transform = '';
        card.style.zIndex = '';
        card.style.opacity = '';
        card.style.transition = 'transform 0.3s ease, opacity 0.3s ease'; // アニメーションを有効に
    });

    // 最新のカードから順にスタイルを適用 (一番上のカードが配列の最後になる)
    for (let i = 0; i < numCards; i++) {
        const card = cardElements[numCards - 1 - i]; // 後ろからi番目のカードを取得 (CSSのnth-last-childと合わせる)
        
        if (card) {
            // スタイルを動的に適用
            if (i === 0) { // 最前面のカード
                card.style.zIndex = 3;
                card.style.opacity = 1;
                card.style.transform = 'translate(-50%, -55%)';
            } else if (i === 1) { // 2番目のカード
                card.style.zIndex = 2;
                card.style.opacity = 1;
                card.style.transform = 'translate(-50%, -50%) scale(0.97) translateY(10px)';
            } else if (i === 2) { // 3番目のカード
                card.style.zIndex = 1;
                card.style.opacity = 0.8;
                card.style.transform = 'translate(-50%, -45%) scale(0.94) translateY(20px)';
            } else { // それ以降のカード (見えないが配置はする)
                card.style.zIndex = 0;
                card.style.opacity = 0;
                card.style.transform = 'translate(-50%, -40%) scale(0.9)';
            }
        }
    }
}


// TODO: GASから新しいカードデータを取得して追加する関数 (仮)
// function addNewCard(stackInstance) {
//     // 実際にはGASからfetchでデータを取得
//     const newCardData = {
//         id: Math.floor(Math.random() * 1000),
//         image: `https://picsum.photos/400/500?random=${Math.random()}`,
//         name: 'New Mom',
//         age: 30,
//         location: 'New City',
//         kids_age: ['1 m.', '4 y.'],
//         interests: ['fas fa-star', 'fas fa-heart']
//     };

//     const newCardElement = createCardElement(newCardData);
//     document.querySelector('.card-stack').appendChild(newCardElement);
    
//     // Swingに新しいカードとして認識させる
//     const newSwingCard = stackInstance.createCard(newCardElement);
//     // スタイルを再適用して、新しいカードが最前面に来るようにする
//     updateCardStackStyles();
// }

// function createCardElement(data) {
//     const card = document.createElement('div');
//     card.classList.add('profile-card');
//     card.dataset.cardId = data.id;

//     card.innerHTML = `
//         <div class="profile-image">
//             <img src="${data.image}" alt="Profile Picture">
//             <div class="age-tags">
//                 ${data.kids_age.map(age => `<span>${age}</span>`).join('')}
//             </div>
//             <button class="more-btn">More</button>
//         </div>
//         <div class="profile-info">
//             <h2>${data.name}, ${data.age}</h2>
//             <p><i class="fas fa-map-marker-alt"></i> ${data.location}</p>
//         </div>
//         <div class="interest-icons">
//             ${data.interests.map(icon => `<div class="icon-circle"><i class="${icon}"></i></div>`).join('')}
//         </div>
//     `;
//     return card;
// }
