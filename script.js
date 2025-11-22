// ★★★ GASのWebアプリURLとLIFF IDをここに設定 ★★★★
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwyKAZqLjwcc_Z_8ZLinHOhaGFcUPd9n_Asjf52oYbVpX3Kj3XYTT5cTiyO3luxiHGL3Q/exec";
const LIFF_ID = "2008378264-4O97qRYQ";

// ▼▼▼ グローバルヘルパー関数 (どこからでも呼べるように外に出しました) ▼▼▼

// ページ切り替え関数
function showPage(pageId) {
    // ページ要素を都度取得して切り替え
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = (page.id === pageId) ? 'block' : 'none';
    });
    // スクロールを一番上に戻す
    window.scrollTo(0, 0);
}

// 裏側でデータを送信する共通関数 (Fire-and-forget)
function sendDataBackground(action, payload) {
    if (!liff.isLoggedIn()) {
        console.error("LIFF is not logged in");
        return;
    }
    const liffUserId = liff.getContext().userId;
    
    const bodyData = {
        source: 'liff_app',
        action: action,
        liffUserId: liffUserId,
        ...payload
    };

    // 完了を待たずに送信 (catchだけしておく)
    fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyData)
    }).then(response => {
        console.log(`${action} sent successfully`);
    }).catch(error => {
        console.error(`${action} failed`, error);
    });
}

// ▼▼▼ 各ステップのアクション関数 (HTMLのonclickから呼ばれるもの) ▼▼▼

// Step 1: 性別選択 (即時遷移)
function selectGender(gender) {
    showPage('name-input-page'); // 次へ
    sendDataBackground('registerUserGender', { gender: gender }); // 送信
}

// Step 2: 本名入力 (即時遷移)
function submitName() {
    const nameInput = document.getElementById("user-name-input");
    const name = nameInput.value.trim();

    if (!name) { alert("お名前を入力してください。"); return; }

    showPage('nickname-input-page'); // 次へ
    sendDataBackground('registerUserName', { name: name }); // 送信
}

// Step 3: ニックネーム入力 (即時遷移)
function submitNickname() {
    const input = document.getElementById("user-nickname-input");
    const nickname = input.value.trim();

    if (!nickname) { alert("ニックネームを入力してください。"); return; }

    showPage('employee-id-input-page'); // 次へ
    sendDataBackground('registerUserNickname', { nickname: nickname }); // 送信
}

// Step 4: 従業員番号入力 (即時遷移)
function submitEmployeeId() {
    const input = document.getElementById("user-employee-id-input");
    const employeeId = input.value.trim();

    if (!employeeId) { alert("従業員番号を入力してください。"); return; }
    if (!/^[a-zA-Z0-9]+$/.test(employeeId)) { alert("従業員番号は半角英数字のみで入力してください。"); return; }

    showPage('age-input-page'); // 次へ
    sendDataBackground('registerUserEmployeeId', { employeeId: employeeId }); // 送信
}

// Step 5: 年齢入力 (即時遷移)
function submitAge() {
    const input = document.getElementById("user-age-input");
    const age = input.value.trim();

    if (!age) { alert("年齢を入力してください。"); return; }
    if (!/^[0-9]{1,3}$/.test(age)) { alert("年齢は半角数字で入力してください。"); return; }

    showPage('department-input-page'); // 次へ
    sendDataBackground('registerUserAge', { age: age }); // 送信
}

// Step 6: 所属選択 (ここだけは完了を待つ)
async function submitDepartment(selectedDept) {
    if (!selectedDept) { alert("所属領域を選択してください。"); return; }
    
    if (!confirm(`「${selectedDept}」で登録しますか？`)) { return; }

    // ローディング表示
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
                department: selectedDept 
            })
        });
        const result = await response.json();
        
        if (result.success) {
            alert("登録が完了しました！");
            location.reload(); // マイページへ
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}

// --- アカウント連携の処理 (グローバルに配置) ---
async function syncAccount() {
    const syncButton = document.getElementById("sync-button");
    const errorMessage = document.getElementById("error-message");
    
    syncButton.innerText = "連携処理中...";
    syncButton.disabled = true;
    
    try {
        const liffUserId = liff.getContext().userId;
        const nonce = Math.random().toString(36).substring(2);

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
            await liff.sendMessages([{ type: 'text', text: `/sync ${nonce}` }]);
            errorMessage.innerText = "連携メッセージを送信しました。ボットが「連携完了」と返信したら、アプリを再読み込みします。";
            errorMessage.style.color = "#28a745"; 
            syncButton.style.display = 'none'; 

            setTimeout(() => { location.reload(); }, 4000);
        } else {
            errorMessage.innerText = '連携処理に失敗しました: ' + result.message;
            syncButton.innerText = "アカウントを連携する";
            syncButton.disabled = false;
        }
    } catch (error) {
        errorMessage.innerText = 'エラー: ' + error.message;
        syncButton.innerText = "アカウントを連携する";
        syncButton.disabled = false;
    }
}


// ▼▼▼ メイン処理 (DOM読み込み後) ▼▼▼
window.addEventListener('DOMContentLoaded', () => {
    
    // --- 内部ヘルパー関数 ---
    async function callGasApi(action, payload) {
        const response = await fetch(GAS_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ source: 'liff_app', action: action, ...payload }) });
        if (!response.ok) throw new Error('APIサーバーとの通信に失敗しました。');
        return response.json();
    }

    // --- ページ遷移 (フッター等) ---
    function goToSwipePage(e) {
        if (e) e.preventDefault();
        loadNewUserListPage(); 
        showPage('user-swipe-page'); 
    }
    const btnSwipeHome = document.getElementById('go-to-swipe-from-home');
    if(btnSwipeHome) btnSwipeHome.addEventListener('click', goToSwipePage);

    const btnSwipeSwipe = document.getElementById('go-to-swipe-from-swipe');
    if(btnSwipeSwipe) btnSwipeSwipe.addEventListener('click', goToSwipePage);

    function goToHomePage(e) {
        if (e) e.preventDefault();
        showPage('my-page'); 
    }
    const btnHomeSwipe = document.getElementById('go-to-home-from-swipe');
    if(btnHomeSwipe) btnHomeSwipe.addEventListener('click', goToHomePage);
    
    const btnHomeHome = document.getElementById('go-to-home-from-home');
    if(btnHomeHome) btnHomeHome.addEventListener('click', (e) => { e.preventDefault(); });

    const btnMypageHome = document.getElementById('go-to-mypage-from-home');
    if(btnMypageHome) btnMypageHome.addEventListener('click', goToHomePage);

    const btnMypageSwipe = document.getElementById('go-to-mypage-from-swipe');
    if(btnMypageSwipe) btnMypageSwipe.addEventListener('click', goToHomePage);

    // ダミーボタン
    function showNotImplemented(e) {
        e.preventDefault();
        alert('この機能は現在準備中です。');
    }
    const btnMaeeHome = document.getElementById('go-to-maee-from-home');
    if(btnMaeeHome) btnMaeeHome.addEventListener('click', showNotImplemented);
    const btnMaeeSwipe = document.getElementById('go-to-maee-from-swipe');
    if(btnMaeeSwipe) btnMaeeSwipe.addEventListener('click', showNotImplemented);
    
    const btnMsgHome = document.getElementById('go-to-messages-from-home');
    if(btnMsgHome) btnMsgHome.addEventListener('click', showNotImplemented);
    const btnMsgSwipe = document.getElementById('go-to-messages-from-swipe');
    if(btnMsgSwipe) btnMsgSwipe.addEventListener('click', showNotImplemented);

    // 戻るボタン
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const targetPage = e.currentTarget.getAttribute('data-target') || 'my-page';
            showPage(targetPage); 
        });
    });

    // --- データ表示ロジック ---
    function showProfile(data) {
        if (data.success) {
            document.getElementById("app").style.display = 'block';
            document.getElementById("loader-wrapper").classList.add('is-hidden');
            
            // ステップ分岐
            if (data.step === "follow-1") {
                showPage('gender-selection-page');
            } else if (data.step === "S-2") {
                showPage('name-input-page');
            } else if (data.step === "S-3") {
                showPage('nickname-input-page');
            } else if (data.step === "S-4") {
                showPage('employee-id-input-page');
            } else if (data.step === "S-5") {
                showPage('age-input-page');
            } else if (data.step === "S-6") {
                showPage('department-input-page');
            } else {
                // 完了済み -> マイページへ
                document.getElementById("nickname").innerText = data.nickname || '未設定';
                document.getElementById("user-details").innerText = `${data.age || '--'}歳・${data.job || '未設定'}`;
                document.getElementById("profile-image").src = data.profileImageUrl;
                document.getElementById("kyun-points").innerText = data.totalKyun;
                const progressPercent = Math.round((data.diagnosisProgress / 6) * 100);
                document.getElementById("diagnosis-progress").innerText = `${progressPercent}%`;

                document.getElementById("app").style.display = 'block';
                document.getElementById("loader-wrapper").classList.add('is-hidden');
                showPage('my-page');
            } 
        } else {
            showError(data);
        }
    }

    function showError(error, liffUserId = '不明') {
        document.getElementById("loader-wrapper").classList.add('is-hidden');
        document.getElementById("app").style.display = "none";
        
        const errorMessageText = error.message || "原因不明のエラーが発生しました。";
        
        alert("GASからの応答:\n" + errorMessageText + "\n\n" + "送信したLIFF ID:\n" + liffUserId);

        document.getElementById("error-message").innerHTML = `${errorMessageText}<br><span style="font-size: 10px; color: #888;">(デバッグ情報: ${liffUserId})</span>`;
        document.getElementById("sync-button-container").style.display = "block";
    }

    // --- スワイプ画面ロジック ---
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
                                    <img src="${user.profileImageUrl || 'https://picsum.photos/400/500'}" alt="${user.nickname}">
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
        if (swiperInstance) { swiperInstance.destroy(true, true); }
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

    // --- メイン実行 ---
    async function main() {
        let liffUserId = 'ID取得前';
        try {
            await liff.init({ liffId: LIFF_ID });
            if (!liff.isLoggedIn()) { liff.login(); return; }

            const profile = await liff.getProfile();
            liffUserId = profile.userId; 

            if (!liffUserId) { throw new Error("LINEユーザーIDが取得できませんでした。"); }

            const profileData = await callGasApi('getMyProfileData', { liffUserId: liffUserId });
            
            if (profileData.success) {
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
