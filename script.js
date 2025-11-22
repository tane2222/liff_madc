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
    
    // 連携画面の「ログイン (マイページへ)」ボタンの処理
     // document.getElementById('show-my-page-button').addEventListener('click', (e) => {
         // e.preventDefault();
         // document.getElementById("sync-button-container").style.display = "none";
         // document.getElementById("app").style.display = "block";
         // showPage('my-page');
        // ※注意: ここで main() を再実行するか、必要なデータをロードする必要があるかもしれません
     // });
    
    // --- データ表示 ---
    // ▼▼▼ 理想UIに合わせて showProfile を修正 ▼▼▼
    function showProfile(data) {
        if (data.success) {
            document.getElementById("app").style.display = 'block';
            document.getElementById("loader-wrapper").classList.add('is-hidden');
            
           // ▼▼▼ ステップによる分岐を追加 ▼▼▼
            if (data.step === "follow-1") {
                showPage('gender-selection-page');// 初回登録 Step 1: 性別選択へ
                } else if (data.step === "S-2") {
                showPage('name-input-page');// Step 2: 本名入力へ
                } else if (data.step === "S-3") {
                showPage('nickname-input-page');   // Step 3 (今回追加)
                } else if (data.step === "S-4") {
                showPage('employee-id-input-page'); // Step 4 (今回追加)
                } else if (data.step === "S-5") {
                showPage('age-input-page');         // Step 5 (今回追加)
                else if (data.step === "S-6") {
                showPage('department-input-page');  // Step 6 (Final)
            } else {
            // 完了済み -> マイページへ
            document.getElementById("nickname").innerText = data.nickname || '未設定';
            
            // 理想UIの「28歳・〇〇」を更新 (GASから age, job が返される前提)
            document.getElementById("user-details").innerText = `${data.age || '--'}歳・${data.job || '未設定'}`;
            
            document.getElementById("profile-image").src = data.profileImageUrl;
            document.getElementById("kyun-points").innerText = data.totalKyun;
            const progressPercent = Math.round((data.diagnosisProgress / 6) * 100);
            document.getElementById("diagnosis-progress").innerText = `${progressPercent}%`;

            
            // ★★★ アプリ本体を表示する処理 ★★★
            document.getElementById("app").style.display = 'block';
            
            // ( .container は無くなったため、ローディング解除処理を変更 )
            // document.getElementById("container").classList.remove('is-loading');
            // document.getElementById("container").classList.add('is-loaded');
            document.getElementById("loader-wrapper").classList.add('is-hidden');

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
    
// --- LIFFアプリのメイン処理 (変更なし) ---
async function main() {
        let liffUserId = 'ID取得前';
        try {
            await liff.init({ liffId: LIFF_ID });
            if (!liff.isLoggedIn()) { liff.login(); return; }

            const profile = await liff.getProfile();
            liffUserId = profile.userId; 

            if (!liffUserId) {
                throw new Error("LINEユーザーIDが取得できませんでした。LIFFの権限を許可してください。");
            }

            const profileData = await callGasApi('getMyProfileData', { liffUserId: liffUserId });
            
            if (profileData.success) {
                showPage('my-page'); 
                showProfile(profileData);
            } else {
                showError(profileData, liffUserId);
            }
        } catch (error) { 
            showError(error, liffUserId); 
        }
    }
    main();
});


// --- 性別選択処理 (Step 1)---
async function selectGender(gender) {
    document.getElementById("loader-wrapper").classList.remove('is-hidden'); // ローディング表示
    
    const liffUserId = liff.getContext().userId;
    
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ source: 'liff_app', action: 'registerUserGender', liffUserId: liffUserId, gender: gender })
        });
        const result = await response.json();
        
        if (result.success) {
            //alert("登録しました！");
            location.reload(); // 再読み込みしてマイページへ
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}

// ▼▼▼▼▼ 本名登録処理 (Step 2) ▼▼▼▼▼
async function submitName() {
    const nameInput = document.getElementById("user-name-input");
    const name = nameInput.value.trim();

    if (!name) {
        alert("お名前を入力してください。");
        return;
    }

    document.getElementById("loader-wrapper").classList.remove('is-hidden');
    
    const liffUserId = liff.getContext().userId;
    
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ source: 'liff_app', action: 'registerUserName', liffUserId: liffUserId, name: name })
        });
        const result = await response.json();
        
        if (result.success) {
            location.reload(); // リロードして次のステップへ
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}

// ▼▼▼▼▼ ニックネーム登録処理 (Step 3) ▼▼▼▼▼
async function submitNickname() {
    const input = document.getElementById("user-nickname-input");
    const nickname = input.value.trim();

    if (!nickname) {
        alert("ニックネームを入力してください。");
        return;
    }

    document.getElementById("loader-wrapper").classList.remove('is-hidden');
    
    const liffUserId = liff.getContext().userId;
    
    try {
        // グローバルの GAS_API_URL を使用
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                source: 'liff_app', 
                action: 'registerUserNickname', // アクション指定
                liffUserId: liffUserId, 
                nickname: nickname 
            })
        });
        const result = await response.json();
        
        if (result.success) {
            location.reload(); // リロードしてマイページ(complete状態)を表示
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}
// ▼▼▼▼▼ 従業員番号登録処理 (Step 4) ▼▼▼▼▼
async function submitEmployeeId() {
    const input = document.getElementById("user-employee-id-input");
    const employeeId = input.value.trim();

    if (!employeeId) {
        alert("従業員番号を入力してください。");
        return;
    }

    // 半角英数字チェック (正規表現)
    if (!/^[a-zA-Z0-9]+$/.test(employeeId)) {
        alert("従業員番号は半角英数字のみで入力してください。");
        return;
    }

    document.getElementById("loader-wrapper").classList.remove('is-hidden');
    
    const liffUserId = liff.getContext().userId;
    
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                source: 'liff_app', 
                action: 'registerUserEmployeeId', 
                liffUserId: liffUserId, 
                employeeId: employeeId 
            })
        });
        const result = await response.json();
        
        if (result.success) {
            location.reload(); // 次のステップ(S-5)へ
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
// ▼▼▼▼▼ 年齢登録処理 (Step 5) ▼▼▼▼▼
async function submitAge() {
    const input = document.getElementById("user-age-input");
    // 全角数字を半角に変換する処理を入れると親切ですが、まずはシンプルな実装で
    const age = input.value.trim();

    if (!age) {
        alert("年齢を入力してください。");
        return;
    }

    // 数値チェック (正規表現: 1〜3桁の数字)
    if (!/^[0-9]{1,3}$/.test(age)) {
        alert("年齢は半角数字で入力してください。");
        return;
    }

    document.getElementById("loader-wrapper").classList.remove('is-hidden');
    
    const liffUserId = liff.getContext().userId;
    
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                source: 'liff_app', 
                action: 'registerUserAge', 
                liffUserId: liffUserId, 
                age: age 
            })
        });
        const result = await response.json();
        
        if (result.success) {
            location.reload(); // 次のステップ(S-6)へ
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
// ▼▼▼▼▼ 所属登録処理 (Step 6 - Final) ▼▼▼▼▼
async function submitDepartment() {
    const input = document.getElementById("user-department-input");
    const department = input.value;

    if (!department) {
        alert("所属領域を選択してください。");
        return;
    }

    document.getElementById("loader-wrapper").classList.remove('is-hidden');
    
    const liffUserId = liff.getContext().userId;
    
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                source: 'liff_app', 
                action: 'registerUserDepartment', 
                liffUserId: liffUserId, 
                department: department 
            })
        });
        const result = await response.json();
        
        if (result.success) {
            // 登録完了！
            alert("登録が完了しました！");
            location.reload(); // リロードすると complete 状態と判定されマイページへ
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// --- アカウント連携の処理 ---
async function syncAccount() {
    // 1. GASのURLと操作するDOM要素を取得
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
