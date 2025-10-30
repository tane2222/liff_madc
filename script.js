
   // ★★★ GASのWebアプリURLとLIFF IDをここに設定 ★★★
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
            document.getElementById("app").style.display = 'block';
            document.getElementById("container").classList.remove('is-loading');
            document.getElementById("container").classList.add('is-loaded');
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        } else { showError(data); }
    }
    function showError(error) {
        document.getElementById("loader-wrapper").classList.add('is-hidden');
        document.getElementById("app").style.display = "none";
        document.getElementById("error-message").innerText = error.message || "エラーが発生しました。";
        document.getElementById("sync-button-container").style.display = "block";
    }

    // --- 旧ユーザー一覧読み込み ---
    async function loadUserListPage() { /* ... 変更なし ... */ }

    // --- 新しいカードスワイプUIのロジック ---
    let swipeDeck;
    async function loadNewUserListPage() {
        swipeDeck = document.getElementById('swipe-deck');
        swipeDeck.innerHTML = '<p style="color: white;">ユーザーを探しています...</p>';
        try {
            const result = await callGasApi('getUsersForLiff', { liffUserId: liff.getContext().userId });
            if (result.success && result.users.length > 0) {
                swipeDeck.innerHTML = '';
                result.users.reverse().forEach(user => {
                    const card = document.createElement('div');
                    card.classList.add('swipe-card');
                    card.style.backgroundImage = `url(${user.profileImageUrl || 'https://placehold.jp/400x600/333/ccc?text=No+Image'})`;
                    card.innerHTML = `<div class="card-info-overlay"><h3>${user.nickname || 'ななしさん'}</h3><p>${user.age || '?'}歳・${user.job || '未設定'}</p></div>`;
                    swipeDeck.appendChild(card);
                });
                initSwipe();
            } else { swipeDeck.innerHTML = '<p style="color: white;">表示できるユーザーがいません。</p>'; }
        } catch (error) { swipeDeck.innerHTML = `<p style="color: red;">エラー: ${error.message}</p>`; }
    }

    // ★★★ スワイプロジックを完全な形で実装 ★★★
    function initSwipe() {
        const nopeButton = document.getElementById('nope-button');
        const likeButton = document.getElementById('like-button');

        function swipe(direction) {
            const topCard = swipeDeck.querySelector('.swipe-card:last-child');
            if (!topCard) return;
            const flyOutDirection = direction; // -1 for nope, 1 for like
            topCard.style.transform = `translateX(${flyOutDirection * 100}vw) rotate(${flyOutDirection * 30}deg)`;
            topCard.style.opacity = 0;
            setTimeout(() => { topCard.remove(); }, 400);
        }

        nopeButton.addEventListener('click', () => swipe(-1));
        likeButton.addEventListener('click', () => swipe(1));
        
        swipeDeck.querySelectorAll('.swipe-card').forEach(card => {
            let isDragging = false, startX = 0;
            function onDragStart(e) {
                isDragging = true;
                startX = e.pageX || e.touches[0].pageX;
                card.style.transition = 'none';
            }
            function onDragMove(e) {
                if (!isDragging) return;
                e.preventDefault();
                const currentX = e.pageX || e.touches[0].pageX;
                const diffX = currentX - startX;
                const rotate = diffX * 0.1;
                card.style.transform = `translateX(${diffX}px) rotate(${rotate}deg)`;
            }
            function onDragEnd(e) {
                if (!isDragging) return;
                isDragging = false;
                const diffX = (e.pageX || e.changedTouches[0].pageX) - startX;
                card.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
                if (Math.abs(diffX) > 80) { // 80px以上スワイプしたらカードを飛ばす
                    swipe(diffX > 0 ? 1 : -1);
                } else {
                    card.style.transform = ''; // 距離が足りなければ元の位置に戻す
                }
            }
            card.addEventListener('mousedown', onDragStart);
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);
            card.addEventListener('touchstart', onDragStart);
            document.addEventListener('touchmove', onDragMove, { passive: false });
            document.addEventListener('touchend', onDragEnd);
        });
    }
    
    // --- LIFFアプリのメイン処理 ---
    async function main() {
        try {
            await liff.init({ liffId: LIFF_ID });
            if (!liff.isLoggedIn()) { liff.login(); return; }
            showPage('my-page');
            const liffUserId = liff.getContext().userId;
            const profileData = await callGasApi('getMyProfileData', { liffUserId: liffUserId });
            showProfile(profileData);
        } catch (error) { showError(error); }
    }
    main();
});

// --- アカウント連携の処理 ---
async function syncAccount() {
    const GAS_API_URL = "【あなたのGAS WebアプリのURLをここに貼り付け】";
    document.getElementById("sync-button").innerText = "連携処理中...";
    document.getElementById("sync-button").disabled = true;
    try {
        const liffUserId = liff.getContext().userId;
        const nonce = Math.random().toString(36).substring(2);
        const result = await (await fetch(GAS_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ source: 'liff_app', action: 'storeLiffIdWithNonce', liffUserId: liffUserId, nonce: nonce }) })).json();
        if (result.success) {
            await liff.sendMessages([{ type: 'text', text: `/sync ${nonce}` }]);
            liff.closeWindow();
        } else {
            alert('連携処理に失敗しました: ' + result.message);
            document.getElementById("sync-button").disabled = false;
        }
    } catch (error) {
        alert('エラー: ' + error.message);
        document.getElementById("sync-button").disabled = false;
    }
}
