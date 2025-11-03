// ★★★ GASのWebアプリURLとLIFF IDをここに設定 ★★★★
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwyKAZqLjwcc_Z_8ZLinHOhaGFcUPd9n_Asjf52oYbVpX3Kj3XYTT5cTiyO3luxiHGL3Q/exec";
const LIFF_ID = "2008378264-4O97qRYQ";

// DOMが読み込まれたら、ページロジックを実行
window.addEventListener('DOMContentLoaded', () => {
    
    // --- ヘルパー関数 ---
    async function callGasApi(action, payload) {
        const response = await fetch(GAS_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ source: 'liff_app', action: action, ...payload }) });
        if (!response.ok) throw new Error('APIサーバーとの通信に失敗しました。');
        return response.json();
    }
    
    // --- ページ管理 ---
    const pages = document.querySelectorAll('.page');
    function showPage(pageId) { pages.forEach(page => { page.style.display = (page.id === pageId) ? 'block' : 'none'; }); }

    // --- ページ遷移 ---
    document.getElementById('go-to-swipe-page').addEventListener('click', (e) => { e.preventDefault(); loadNewUserListPage(); showPage('user-swipe-page'); });
    document.getElementById('go-to-grid-page').addEventListener('click', (e) => { e.preventDefault(); loadUserListPage(); showPage('user-grid-page'); });
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', (e) => { e.preventDefault(); showPage(e.currentTarget.getAttribute('data-target') || 'my-page'); });
    });
    
    // --- データ表示 ---
    function showProfile(data) {
        if (data.success) {
            document.getElementById("nickname").innerText = data.nickname || '未設定';
            document.getElementById("profile-image").src = data.profileImageUrl;
            document.getElementById("kyun-points").innerText = data.totalKyun;
            const progressPercent = Math.round((data.diagnosisProgress / 6) * 100);
            document.getElementById("diagnosis-progress").innerText = `${progressPercent}%`;
            
            // ★★★ アプリ本体を表示する処理を追加 ★★★
            document.getElementById("app").style.display = 'block';
            
            document.getElementById("container").classList.remove('is-loading');
            document.getElementById("container").classList.add('is-loaded');
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        } else {
            // ★★★ 修正点 ★★★
            // showErrorに、liffUserIdも渡せるようにする（main関数側で対応）
            showError(data);
        }
    }
    // ▼▼▼▼▼ この関数を丸ごと置き換えてください ▼▼▼▼▼
    function showError(error, liffUserId = '不明') {
        document.getElementById("loader-wrapper").classList.add('is-hidden');
        document.getElementById("app").style.display = "none";
        
        const errorMessageText = error.message || "原因不明のエラーが発生しました。";
        
        // ★★★ 強制アラート表示 ★★★
        // ここにGASからのエラーメッセージと、JSが送信したIDが表示されます
        alert(
            "GASからの応答:\n" + errorMessageText + "\n\n" +
            "送信したLIFF ID:\n" + liffUserId
        );

        // ページにもエラーを表示
        document.getElementById("error-message").innerHTML = `
            ${errorMessageText}
            <br>
            <span style="font-size: 10px; color: #888;">(デバッグ情報: ${liffUserId})</span>
        `;
        
        document.getElementById("sync-button-container").style.display = "block";
    }
    // --- 旧ユーザー一覧読み込み ---
    async function loadUserListPage() {
        const container = document.getElementById('user-grid-container');
        container.innerHTML = '<p>ユーザーを読み込んでいます...</p>';
        try {
            const result = await callGasApi('getUsersForLiff', { liffUserId: liff.getContext().userId });
            if (result.success) {
                container.innerHTML = '';
                if (result.users.length === 0) { container.innerHTML = '<p>表示できるユーザーがいません。</p>'; return; }
                result.users.forEach(user => {
                    const userCard = `<div class="user-card"><img src="${user.profileImageUrl || 'https://placehold.jp/150x150.png?text=?'}" alt="${user.nickname}"><div class="user-info"><span class="user-name">${user.nickname || 'ななしさん'}</span><span class="user-details">${user.age || '?'}歳・${user.job || '未設定'}</span></div></div>`;
                    container.innerHTML += userCard;
                });
            } else { container.innerHTML = `<p>エラー: ${result.message}</p>`; }
        } catch (error) { container.innerHTML = `<p>エラー: ${error.message}</p>`; }
    }

// --- 新しいカードスワイプUIのロジック ---
    let swiperInstance = null;
    async function loadNewUserListPage() {
        const swipeDeck = document.getElementById('swipe-deck');
        swipeDeck.innerHTML = '<p>ユーザーを探しています...</p>';
        try {
            const result = await callGasApi('getUsersForLiff', { liffUserId: liff.getContext().userId });
            if (result.success && result.users.length > 0) {
                swipeDeck.innerHTML = '';
                result.users.forEach(user => {
                    
                    // ▼▼▼▼▼ ここからが修正点 ▼▼▼▼▼
                    // カードのHTML構造を「理想のUI」レイアウトに変更します
                    const cardSlide = `
                        <div class="swiper-slide">
                            <div class="profile-card">
                                <div class="profile-image">
                                    <img src="${user.profileImageUrl || 'https.picsum.photos/400/500'}" alt="${user.nickname}">
                                    
                                    <div class="age-tags">
                                        <span>8 m.</span>
                                        <span>2 y.</span>
                                    </div>
                                    <button class="more-btn">More</button>
                                </div>
                                
                                <div class="profile-info">
                                    <h2>${user.nickname || 'ななしさん'}, ${user.age || '?'}</h2>
                                    <p><i class="fas fa-briefcase"></i> ${user.job || '未設定'}</p>
                                </div>
                                
                                <div class="interest-icons">
                                    <div class="icon-circle"><i class="fas fa-baby"></i></div>
                                    <div class="icon-circle"><i class="fas fa-wine-glass-alt"></i></div>
                                    <div class="icon-circle"><i class="fas fa-camera"></i></div>
                                    <div class="icon-circle"><i class="fas fa-futbol"></i></div>
                                </div>
                            </div>
                        </div>`;
                    // ▲▲▲▲▲ ここまでが修正点 ▲▲▲▲▲
                        
                    swipeDeck.innerHTML += cardSlide;
                });
                initializeSwiper();
            } else { swipeDeck.innerHTML = '<p>表示できるユーザーがいません。</p>'; }
        } catch (error) { swipeDeck.innerHTML = `<p style="color: red;">エラー: ${error.message}</p>`; }
    }

    function initializeSwiper() {
        if (swiperInstance) {
            swiperInstance.destroy(true, true);
        }
        swiperInstance = new Swiper('.swiper', {
            effect: 'cards',
            grabCursor: true,
            loop: false, // マッチングアプリなのでループはfalseのままにします
            cardsEffect: {
                rotate: true,
                perSlideRotate: 2,
                perSlideOffset: 8,
                slideShadows: true,
            },
        });
    }
    
// --- LIFFアプリのメイン処理 ---
    // ▼▼▼▼▼ この関数を丸ごと置き換えてください ▼▼▼▼▼
// LIFF (client-side JS)

// (ファイル前半の ... liff.init() ... までは変更なし)

        // ----------------------------------------------------
        // メイン処理 (DOMContentLoaded内)
        // ----------------------------------------------------
        async function main() {
            showLoader("読み込み中...");
            try {
                await liff.init({ liffId: LIFF_ID });
                if (!liff.isLoggedIn()) {
                    liff.login();
                    return;
                }

                showLoader("認証情報を確認中...");
                const liffUserId = liff.getContext().userId;
                const status = await callGasApi('checkLiffUser', { liffUserId: liffUserId });

                if (status.isLinked) {
                    // 認証OK
                    showLoader("プロフィール読込中...");
                    await loadMyProfile(status.profile); // マイページ情報を読み込む

                    // ▼▼▼▼▼【ここが修正点です】▼▼▼▼▼
                    // (修正前) スワイプページを先に表示していた
                    // showPage('user-swipe-page');
                    
                    // (修正後) マイページを先に表示する
                    showPage('my-page');
                    // ▲▲▲▲▲【ここまでが修正点です】▲▲▲▲▲

                    // スワイプページ用のデータ読み込みは裏側で実行しておく
                    // (※もしマイページ表示を優先し、スワイプページの読み込みを遅らせたい場合は、
                    //    loadNewUserListPage() の呼び出しを「スワイプページへ移動するボタン」の
                    //    クリックイベント内に移動することも可能です)
                    
                } else {
                    // MADC未連携
                    showSyncButton(status.message);
                }

            } catch (error) {
                console.error(error);
                // (参考) 過去のバージョンではここで連携エラーを処理していました
                // 現在は checkLiffUser がエラーを返さない設計のため、
                // 基本的に showSyncButton が呼び出されます。
                showErrorPage("エラーが発生しました: " + error.message);
            } finally {
                hideLoader();
            }
        }

// (ファイル後半の ... main(); ... 以降は変更なし)
    // ▲▲▲▲▲ この main 関数を置き換えてください ▲▲▲▲▲
    main();
});
// --- (これ以降の syncAccount 関数などは変更ありません) ---


// --- アカウント連携の処理 ---
async function syncAccount() {
    // 1. GASのURLと操作するDOM要素を取得
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwyKAZqLjwcc_Z_8ZLinHOhaGFcUPd9n_Asjf52oYbVpX3Kj3XYTT5cTiyO3luxiHGL3Q/exec";
    const syncButton = document.getElementById("sync-button");
    const errorMessage = document.getElementById("error-message");
    
    // 2. ボタンを「処理中」に変更
    syncButton.innerText = "連携処理中...";
    syncButton.disabled = true;
    
    try {
        const liffUserId = liff.getContext().userId;
        const nonce = Math.random().toString(36).substring(2);

        // 3. GASにNonce（合言葉）を保存するよう依頼
        const result = await (await fetch(GAS_API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
            body: JSON.stringify({ 
                source: 'liff_app', 
                action: 'storeLiffIdWithNonce', 
                liffUserId: liffUserId, 
                nonce: nonce 
            }) 
        })).json();

        if (result.success) {
            // 4. トーク画面に同期メッセージを送信
            await liff.sendMessages([{ type: 'text', text: `/sync ${nonce}` }]);
            
            // 5. 【重要】画面内でフィードバックを出す
            errorMessage.innerText = "連携メッセージを送信しました。ボットが「連携完了」と返信したら、アプリを再読み込みします。";
            errorMessage.style.color = "#28a745"; // メッセージを成功色（緑）に変更
            syncButton.style.display = 'none'; // ボタンを非表示にする

            // 6. 【重要】ボット側の処理時間（4秒）待ってから、LIFFをリロード
            setTimeout(() => {
                location.reload();
            }, 4000); // 4秒 (4000ms)

        } else {
            // 連携失敗時
            errorMessage.innerText = '連携処理に失敗しました: ' + result.message;
            syncButton.innerText = "アカウントを連携する";
            syncButton.disabled = false;
        }
    } catch (error) {
        // エラー発生時
        errorMessage.innerText = 'エラー: ' + error.message;
        syncButton.innerText = "アカウントを連携する";
        syncButton.disabled = false;
    }
}
