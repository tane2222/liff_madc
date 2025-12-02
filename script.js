// ★★★ GASのWebアプリURLとLIFF IDをここに設定 ★★★★
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwyKAZqLjwcc_Z_8ZLinHOhaGFcUPd9n_Asjf52oYbVpX3Kj3XYTT5cTiyO3luxiHGL3Q/exec";
const LIFF_ID = "2008378264-4O97qRYQ";

let currentUser = null; // グローバル変数として定義

// ▼▼▼ ステップ定義（順番管理用） ▼▼▼
const REGISTRATION_STEPS = [
    'gender-selection-page',   // Step 1
    'name-input-page',         // Step 2
    'nickname-input-page',     // Step 3
    'employee-id-input-page',  // Step 4
    'age-input-page',          // Step 5
    'department-input-page'    // Step 6
];

// ▼▼▼ 戻るボタンの処理関数 (新規追加) ▼▼▼
function goBackStep() {
    // 現在表示されているページIDを探す
    const currentPageId = REGISTRATION_STEPS.find(id => {
        const el = document.getElementById(id);
        return el && el.style.display === 'block';
    });

    if (!currentPageId) return;

    // 現在のインデックスを取得
    const currentIndex = REGISTRATION_STEPS.indexOf(currentPageId);

    // 最初のページ(0)でなければ、一つ前のページに戻る
    if (currentIndex > 0) {
        const prevPageId = REGISTRATION_STEPS[currentIndex - 1];
        showPage(prevPageId);
    }
}

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

    // ★★★ プログレスバーとロゴの表示制御 ★★★
    updateRegistrationHeader(pageId);
}

// ▼▼▼ サイドメニュー開閉ロジック (新規追加) ▼▼▼
function toggleSideMenu() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    
    // クラスの付け外しで表示/非表示を切り替え
    menu.classList.toggle('is-active');
    overlay.classList.toggle('is-active');
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼ 新規追加: ヘッダー更新ロジック ▼▼▼
function updateRegistrationHeader(pageId) {
    const header = document.getElementById('registration-header');
    const stepNumElem = document.getElementById('current-step-num');
    const barFillElem = document.getElementById('progress-bar-fill');
    const backBtn = document.getElementById('reg-back-btn'); // ボタン要素取得
    
    // ステップごとの設定
    const steps = {
        'gender-selection-page':  { num: 1, percent: 16 },
        'name-input-page':        { num: 2, percent: 33 },
        'nickname-input-page':    { num: 3, percent: 50 },
        'employee-id-input-page': { num: 4, percent: 66 },
        'age-input-page':         { num: 5, percent: 83 },
        'department-input-page':  { num: 6, percent: 100 }
    };

    if (steps[pageId]) {
        // --- 登録画面の場合 ---
        header.style.display = 'block';
        stepNumElem.innerText = steps[pageId].num;
        barFillElem.style.width = steps[pageId].percent + '%';

        // ★★★ 戻るボタンの表示制御 ★★★
        if (steps[pageId].num === 1) {
            // Step 1 (性別選択) では戻るボタンを隠す
            backBtn.style.display = 'none';
        } else {
            // Step 2以降は表示する
            backBtn.style.display = 'block';
        }

    } else {
        // --- それ以外の画面の場合 ---
        header.style.display = 'none';
    }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼ キュン詳細モーダル制御 (新規追加) ▼▼▼
function openKyunDetailModal() {
    const modal = document.getElementById('kyun-detail-modal');
    
    // 現在表示されているポイント数を取得してモーダルに反映（見た目の同期）
    const currentPointsElem = document.getElementById('kyun-points');
    const modalTotalElem = document.getElementById('modal-kyun-total');
    
    // 要素が存在する場合のみ値をコピー
    if (currentPointsElem && modalTotalElem) {
        modalTotalElem.innerText = currentPointsElem.innerText;
    }

    // クラスを付与して表示
    modal.classList.add('is-open');
}

function closeKyunDetailModal() {
    const modal = document.getElementById('kyun-detail-modal');
    modal.classList.remove('is-open');
}

// モーダルの背景（黒い部分）をタップしても閉じるようにする
window.addEventListener('click', function(e) {
    const modal = document.getElementById('kyun-detail-modal');
    if (e.target === modal) {
        closeKyunDetailModal();
    }
});
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ... (既存のコード) ...

// ▼▼▼ 診断チャートモーダル制御（GASデータ連動版） ▼▼▼
let myRadarChart = null; // チャートインスタンス

function openDiagnosisModal() {
    const modal = document.getElementById('diagnosis-modal');
    modal.classList.add('is-open');

    const ctx = document.getElementById('radarChart').getContext('2d');

    // 既にチャートがある場合は破棄（再描画のため）
    if (myRadarChart) {
        myRadarChart.destroy();
    }

    // --- ラベル定義 ---
    const labels = ['素直さ', '想像力', '論理思考', '独占欲', '競争心', '愛情'];
    
    // --- データ設定 ---
    let dataValues = [0, 0, 0, 0, 0, 0]; // デフォルトは全て0

    // currentUser（ログインユーザー情報）から各スコアを取得して配列化
    if (typeof currentUser !== 'undefined' && currentUser) {
        // main.gs の getMyProfileData が返すプロパティ名とマッピング
        dataValues = [
            Number(currentUser.honest) || 0,      // 素直さ
            Number(currentUser.imagin) || 0,      // 想像力
            Number(currentUser.logic) || 0,       // 論理思考
            Number(currentUser.possessive) || 0,  // 独占欲
            Number(currentUser.battle) || 0,      // 競争心
            Number(currentUser.love) || 0         // 愛情
        ];
    }

    // 未完了（0の項目）があるかチェック
    const hasIncomplete = dataValues.some(val => val === 0);
    const alertBox = document.getElementById('diagnosis-alert');
    
    if(alertBox) {
        alertBox.style.display = hasIncomplete ? 'flex' : 'none';
        if(hasIncomplete) {
            // 未完了の項目名を抽出して表示
            const incompleteItems = labels.filter((_, i) => dataValues[i] === 0);
            const itemText = incompleteItems.join('・');
            alertBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> 未診断：${itemText}<br>診断を続けましょう！`;
        }
    }

    // チャート作成
    myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'あなたのステータス',
                data: dataValues,
                backgroundColor: 'rgba(246, 23, 140, 0.2)', // ピンク背景
                borderColor: 'rgba(246, 23, 140, 1)',       // ピンク線
                borderWidth: 2,
                pointBackgroundColor: 'rgba(246, 23, 140, 1)',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100, // 最大値（診断ロジックに合わせて調整してください）
                    ticks: { stepSize: 20, display: false },
                    pointLabels: {
                        font: { size: 12, family: "'Helvetica Neue', 'Arial', sans-serif" },
                        color: '#666'
                    },
                    grid: { color: '#eee' },
                    angleLines: { color: '#eee' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function closeDiagnosisModal() {
    const modal = document.getElementById('diagnosis-modal');
    modal.classList.remove('is-open');
}

// モーダル背景クリックで閉じる
window.addEventListener('click', function(e) {
    const modal = document.getElementById('diagnosis-modal');
    if (e.target === modal) {
        closeDiagnosisModal();
    }
});
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

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
    if (!confirm(`「${gender}」で間違いないですか？`)) { return; }
    
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
           // リロードせず、案内ページを表示
            document.getElementById("loader-wrapper").classList.add('is-hidden');
            showPage('onboarding-page');
            // 案内ページ用のSwiperを初期化
            initOnboardingSwiper();
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

// ▼▼▼ 【新規追加】案内ページ用 Swiper のロジック ▼▼▼
let onboardingSwiperInstance = null;

function initOnboardingSwiper() {
    const nextBtn = document.getElementById('onboarding-next-btn');
    
    // 既にインスタンスがあれば破棄（再表示時用）
    if (onboardingSwiperInstance) { onboardingSwiperInstance.destroy(true, true); }

    onboardingSwiperInstance = new Swiper('.onboarding-swiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        pagination: {
            el: '.onboarding-pagination',
            clickable: true,
        },
        on: {
            // スライドが変わった時の処理
            slideChange: function () {
                // 最後のスライドかどうかでボタンのテキストを変える
                if (this.isEnd) {
                    nextBtn.innerText = "始める";
                } else {
                    nextBtn.innerText = "次へ";
                }
            }
        }
    });

    // ボタンクリック時の処理を設定（重複登録を防ぐため一旦解除してから）
    nextBtn.onclick = null; 
    nextBtn.onclick = function() {
        if (onboardingSwiperInstance.isEnd) {
            // 最後のスライドでボタンを押したら、アシスタント選択画面へ遷移
            showPage('assistant-selection-page');
        } else {
            // それ以外は次のスライドへ
            onboardingSwiperInstance.slideNext();
        }
    };
    
    // 初期状態のボタンテキスト設定
    nextBtn.innerText = (onboardingSwiperInstance.isEnd) ? "始める" : "次へ";
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼ アシスタント選択送信処理 (新規追加) ▼▼▼
async function submitAssistant(type) {
    const assistantName = (type === 'butler') ? '執事 真田くん' : 'メイド ココちゃん';
    
    if (!confirm(`「${assistantName}」を選択しますか？\n（LINEに挨拶メッセージが届きます）`)) {
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
                action: 'registerUserAssistant', 
                liffUserId: liffUserId, 
                assistantType: type 
            })
        });
        const result = await response.json();
        
        if (result.success) {
            // 完了したらリロードしてマイページへ
            // (GAS側でLINEプッシュ通知も送信済み)
            alert("設定しました！\nLINEのトークルームに挨拶が届いています。");
            location.reload(); 
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

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

    // ▼▼▼ 修正: 中央の「さがす」ボタン用の処理を追加 ▼▼▼
    //const btnCenterSearchHome = document.getElementById('go-to-swipe-from-home-center');
    //if(btnCenterSearchHome) {
        //btnCenterSearchHome.addEventListener('click', goToSwipePage);
    //}
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
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

    //const btnMypageHome = document.getElementById('go-to-mypage-from-home');
    //if(btnMypageHome) btnMypageHome.addEventListener('click', goToHomePage);

    //const btnMypageSwipe = document.getElementById('go-to-mypage-from-swipe');
    //if(btnMypageSwipe) btnMypageSwipe.addEventListener('click', goToHomePage);

    // ダミーボタン
    function showNotImplemented(e) {
        e.preventDefault();
        alert('この機能は現在準備中です。');
    }
    const btnDgsHome = document.getElementById('go-to-diagnosis-from-home');
    if(btnDgsHome) btnMaeeHome.addEventListener('click', showNotImplemented);
    const btnDgsSwipe = document.getElementById('go-to-diagnosis-from-swipe');
    if(btnDgsSwipe) btnMaeeSwipe.addEventListener('click', showNotImplemented);
    
    const btnMsgHome = document.getElementById('go-to-messages-from-home');
    if(btnMsgHome) btnMsgHome.addEventListener('click', showNotImplemented);
    const btnMsgSwipe = document.getElementById('go-to-messages-from-swipe');
    if(btnMsgSwipe) btnMsgSwipe.addEventListener('click', showNotImplemented);

    const btnAstHome = document.getElementById('go-to-assistant-from-home');
    if(btnAstHome) btnMsgHome.addEventListener('click', showNotImplemented);
    const btnAstSwipe = document.getElementById('go-to-assistant-from-swipe');
    if(btnAstSwipe) btnMsgSwipe.addEventListener('click', showNotImplemented);


    // 戻るボタン
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const targetPage = e.currentTarget.getAttribute('data-target') || 'my-page';
            showPage(targetPage); 
        });
    });

    // ▼▼▼ 表示切り替えボタン（スワイプ → グリッド）の処理 ▼▼▼
    const btnSwitchToGrid = document.getElementById('switch-to-grid-view');
    if (btnSwitchToGrid) {
        btnSwitchToGrid.addEventListener('click', (e) => {
            e.preventDefault();
            // グリッドページ（旧ユーザー画面）を表示
            // ※ user-grid-page というIDのdivが存在し、データをロードする関数がある前提です
            showPage('user-grid-page'); 
            
            // もしグリッドページ用のデータロードが必要ならここで呼び出します
            // loadUserGridPage(); 
        });
    }

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
                
                const profileImgElem = document.getElementById("profile-image");
                profileImgElem.src = data.profileImageUrl || 'https://placehold.jp/150x150.png'; // 画像がない場合のフォールバック

                document.getElementById("kyun-points").innerText = data.totalKyun;
                const progressPercent = Math.round((data.diagnosisProgress / 6) * 100);
                document.getElementById("diagnosis-progress").innerText = `${progressPercent}%`;
                
                // ▼▼▼ 【修正】プロフィール画像登録促進エリアの表示制御 ▼▼▼
                const promoSection = document.getElementById('photo-upload-promo');
                const currentImgUrl = data.profileImageUrl || "";
                 // 画像が未設定、または placehold.jp などのデフォルト画像の場合に表示
                // ※正規表現でチェック
                const defaultImageUrls = [
                    'https://drive.google.com/thumbnail?id=12DqJms_8Fr8BTYzCaGlFFW82Nmf3B4Q0',
                    'https://drive.google.com/thumbnail?id=1_4VVriM9WPIj6j8nKyQhE9HJ6hl_QsX8',
                    'https://placehold.jp/150x150.png?text=?'
                ];

                const isDefault = !currentImgUrl || 
                                  defaultImageUrls.includes(currentImgUrl) || 
                                  currentImgUrl.includes('placehold.jp');
                
                if (isDefault) {
                     promoSection.style.display = 'block';
                } else {
                     promoSection.style.display = 'none';
                }
                // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

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
                // ランダムな場所を生成（デモ用）
                const locations = ['東京', '神奈川', '大阪', '北海道'];
                const randomLoc = locations[Math.floor(Math.random() * locations.length)];

                // カードのHTMLテンプレート（モデル画像風デザイン）
                const cardSlide = `
                    <div class="swiper-slide">
                        <div class="profile-card">
                            <div class="profile-image">
                                <img src="${user.profileImageUrl || 'https://picsum.photos/400/500'}" alt="${user.nickname}">
                                
                                <div class="age-tags">
                                    <span><i class="fas fa-leaf"></i> 本日入会</span>
                                </div>

                                <button class="more-btn">
                                    <i class="fas fa-heart"></i> いいね!
                                </button>
                            </div>

                            <div class="profile-info">
                                <div class="name-row">
                                    <h2>${user.nickname || 'No Name'}</h2>
                                    <span class="age-text">${user.age || '20'}歳</span>
                                    <span class="location-text">${randomLoc}</span>
                                </div>

                                <div class="status-row">
                                    <span class="status-dot"></span>
                                    <span>オンライン</span>
                                </div>

                                <p class="bio-text">
                                    ${user.job ? user.job + 'をしています。' : ''}
                                    休日はカフェ巡りをしたり、映画を見たりして過ごすのが好きです☕️
                                </p>
                            </div>

                            <div class="interest-icons">
                                <span class="common-points-label">共通点 5個</span>
                                <div class="icon-circle"><i class="fas fa-camera"></i></div>
                                <div class="icon-circle"><i class="fas fa-utensils"></i></div>
                                <div class="icon-circle"><i class="fas fa-plane"></i></div>
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
            
            // showProfile内で画像チェックなども行うように修正済み
            if (profileData.success) {
                // ★★★ ここでデータをグローバル変数に保存します！ ★★★
                currentUser = profileData;
                
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
