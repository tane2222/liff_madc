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
  // ▼▼▼▼▼ フッターナビゲーションの処理 ▼▼▼▼▼
    
    // 1. 「さがす」ページへ (ホーム画面 / スワイプ画面 両方から)
    function goToSwipePage(e) {
        if (e) e.preventDefault();
        loadNewUserListPage(); // ユーザー一覧を読み込む
        showPage('user-swipe-page'); // ページ切り替え
        
        // (オプション) フッターのアクティブ状態を更新
        // ( script.js で行うより、HTML側でデフォルトで active にしておき、
        //   遷移時のみ showPage と連動させる方が確実かもしれません )
    }
    document.getElementById('go-to-swipe-from-home').addEventListener('click', goToSwipePage);
    // (スワイプ画面で「さがす」を押してもリロードするように)
    document.getElementById('go-to-swipe-from-swipe').addEventListener('click', goToSwipePage);


    // 2. 「ホーム」ページへ (スワイプ画面から)
    function goToHomePage(e) {
        if (e) e.preventDefault();
        showPage('my-page'); // マイページ表示
        
        // (オプション) フッターのアクティブ状態を更新
    }
    document.getElementById('go-to-home-from-swipe').addEventListener('click', goToHomePage);
    // (ホーム画面で「ホーム」を押してもリロードはしない、またはデータ再読み込み)
    document.getElementById('go-to-home-from-home').addEventListener('click', (e) => {
        e.preventDefault(); 
        // (必要なら main() を再実行してデータ更新)
    });
    
    // 3. 「マイページ」へ (両方から)
    // ( ※ 現在の仕様では「ホーム」＝「マイページ」なので、goToHomePage と同じ動作 )
    document.getElementById('go-to-mypage-from-home').addEventListener('click', goToHomePage);
    document.getElementById('go-to-mypage-from-swipe').addEventListener('click', goToHomePage);

    // 4. その他のダミーボタン (押してもアラートを出すだけ)
    function showNotImplemented(e) {
        e.preventDefault();
        alert('この機能は現在準備中です。');
    }
    document.getElementById('go-to-maee-from-home').addEventListener('click', showNotImplemented);
    document.getElementById('go-to-maee-from-swipe').addEventListener('click', showNotImplemented);
    document.getElementById('go-to-messages-from-home').addEventListener('click', showNotImplemented);
    document.getElementById('go-to-messages-from-swipe').addEventListener('click', showNotImplemented);


    // --- 既存の戻るボタン (フッターと動作を合わせる) ---
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const targetPage = e.currentTarget.getAttribute('data-target') || 'my-page';
            showPage(targetPage); 
            // (フッターナビのアクティブ状態も「ホーム」に戻す処理)
        });
    });
    // ▲▲▲▲▲ フッターナビゲーションの処理ここまで ▲▲▲▲▲
    
  );
    
    // --- データ表示 ---
    // ▼▼▼ 理想UIに合わせて showProfile を修正 ▼▼▼
    function showProfile(data) {
        if (data.success) {
        　// --- 登録ステップに応じて表示するページを振り分け ---
            if (data.step === 'Complete') {
            document.getElementById("nickname").innerText = data.nickname || '未設定';
            // 理想UIの「28歳・〇〇」を更新 (GASから age, job が返される前提)
            document.getElementById("user-details").innerText = `${data.age || '--'}歳・${data.job || '未設定'}`;
            document.getElementById("profile-image").src = data.profileImageUrl;
            document.getElementById("kyun-points").innerText = data.totalKyun;
            const progressPercent = Math.round((data.diagnosisProgress / 6) * 100);
            document.getElementById("diagnosis-progress").innerText = `${progressPercent}%`;

            showPage('my-page'); // マイページを表示
            
            // ★★★ アプリ本体を表示する処理 ★★★
            document.getElementById("app").style.display = 'block'; 
            // ( .container は無くなったため、ローディング解除処理を変更 )
            // document.getElementById("container").classList.remove('is-loading');
            // document.getElementById("container").classList.add('is-loaded');
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        　} else if (data.step === 'follow-1') {
                // 【B】新規登録ユーザー (STEP_1)
                showPage('sex-selection-page'); // 性別選択ページを表示
                document.getElementById("app").style.display = 'block';
                document.getElementById("loader-wrapper").classList.add('is-hidden');

            } else {
                // (今後、STEP_2, STEP_3 などがここに追加される)
                showPage('sex-selection-page'); // とりあえず性別選択に戻す
            }
        } else {
            showError(data);
        }
    }
    // ▲▲▲▲▲ showProfile の修正ここまで ▲▲▲▲▲

    function showError(error, liffUserId = '不明') {
        document.getElementById("loader-wrapper").classList.add('is-hidden');
        document.getElementById("app").style.display = "none";
        
        const errorMessageText = error.message || "原因不明のエラーが発生しました。";
        
        // ★★★ 強制アラート表示 ★★★
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
    // --- 旧ユーザー一覧読み込み (変更なし) ---
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

// --- 新しいカードスワイプUIのロジック (変更なし) ---
    let swiperInstance = null;
    async function loadNewUserListPage() {
        const swipeDeck = document.getElementById('swipe-deck');
        swipeDeck.innerHTML = '<p>ユーザーを探しています...</p>';
        try {
            const result = await callGasApi('getUsersForLiff', { liffUserId: liff.getContext().userId });
            if (result.success && result.users.length > 0) {
                swipeDeck.innerHTML = '';
                result.users.forEach(user => {
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
            loop: false,
            cardsEffect: {
                rotate: true,
                perSlideRotate: 2,
                perSlideOffset: 8,
                slideShadows: true,
            },
        });
    }

// ▼▼▼▼▼ 以下の関数を追記 ▼▼▼▼▼
    // --- 新規登録ステップの処理 ---
    async function submitSex(sexChoice) { // sexChoiceは 'men' または 'women'
        try {
            document.getElementById("loader-wrapper").classList.remove('is-hidden'); // ローディング表示
            const result = await callGasApi('handleRegistrationStep', {
                liffUserId: liff.getContext().userId,
                stepData: {
                    step: 'STEP_1',
                    value: sexChoice
                }
            });

            if (result.success) {
                // 成功したら、次のステップ（例: 年齢入力ページ）に遷移
                // alert('性別を登録しました！次のステップに進みます。');
                // location.reload(); // または次の登録ページを表示
                
                // ここでは仮に、GASから返された次のステップを表示（まだ作っていないのでアラート）
                alert('性別を登録しました！次のステップは ' + result.nextStep + ' です。');
                document.getElementById("loader-wrapper").classList.add('is-hidden');

            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert('登録に失敗しました: ' + error.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    }

    document.getElementById('select-men').addEventListener('click', () => submitSex('men'));
    document.getElementById('select-women').addEventListener('click', () => submitSex('women'));
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    
// --- LIFFアプリのメイン処理 (変更なし) ---
// --- LIFFアプリのメイン処理 ---
    async function main() {
        try {
            await liff.init({ liffId: LIFF_ID });
            if (!liff.isLoggedIn()) { liff.login(); return; }
            // ★★★ showPage('my-page')を削除 ★★★
            const liffUserId = liff.getContext().userId;
            const profileData = await callGasApi('getMyProfileData', { liffUserId: liffUserId });
            showProfile(profileData); // 振り分けはshowProfileに任せる
        } catch (error) { showError(error); }
    }
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
