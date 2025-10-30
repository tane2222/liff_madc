
   // ★★★ GASのWebアプリURLとLIFF IDをここに設定 ★★★
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwyKAZqLjwcc_Z_8ZLinHOhaGFcUPd9n_Asjf52oYbVpX3Kj3XYTT5cTiyO3luxiHGL3Q/exec";
const LIFF_ID = "2008378264-4O97qRYQ";

// DOMが読み込まれたら、ページロジックを実行
window.addEventListener('DOMContentLoaded', () => {
    
    // GASのAPIを呼び出すためのヘルパー関数
    async function callGasApi(action, payload) {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ source: 'liff_app', action: action, ...payload })
        });
        if (!response.ok) throw new Error('APIサーバーとの通信に失敗しました。');
        return response.json();
    }
    
    // --- ページ管理 ---
    const pages = document.querySelectorAll('.page');
    function showPage(pageId) {
        pages.forEach(page => {
            page.style.display = (page.id === pageId) ? 'block' : 'none';
        });
    }

    // --- ページ遷移のイベントリスナー ---
    document.getElementById('go-to-swipe-page').addEventListener('click', (e) => { e.preventDefault(); loadNewUserListPage(); showPage('user-swipe-page'); });
    document.getElementById('go-to-grid-page').addEventListener('click', (e) => { e.preventDefault(); loadUserListPage(); showPage('user-grid-page'); });
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', (e) => { e.preventDefault(); showPage(e.currentTarget.getAttribute('data-target') || 'my-page'); });
    });
    
    // --- データ表示関連 ---
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
        } else {
            showError(data);
        }
    }

    function showError(error) {
        document.getElementById("loader-wrapper").classList.add('is-hidden');
        document.getElementById("app").style.display = "none";
        document.getElementById("error-message").innerText = error.message || "エラーが発生しました。";
        document.getElementById("sync-button-container").style.display = "block";
    }

    // --- 各ページのデータ読み込み ---
    async function loadUserListPage() {
        const container = document.getElementById('user-grid-container');
        container.innerHTML = '<p>ユーザーを読み込んでいます...</p>';
        try {
            const result = await callGasApi('getUsersForLiff', { liffUserId: liff.getContext().userId });
            if (result.success) {
                container.innerHTML = '';
                if (result.users.length === 0) {
                    container.innerHTML = '<p>表示できるユーザーがいません。</p>';
                    return;
                }
                result.users.forEach(user => {
                    const userCard = `
                        <div class="user-card">
                            <img src="${user.profileImageUrl || 'https://placehold.jp/150x150.png?text=?'}" alt="${user.nickname}">
                            <div class="user-info">
                                <span class="user-name">${user.nickname || 'ななしさん'}</span>
                                <span class="user-details">${user.age || '?'}歳・${user.job || '未設定'}</span>
                            </div>
                        </div>
                    `;
                    container.innerHTML += userCard;
                });
            } else { container.innerHTML = `<p>エラー: ${result.message}</p>`; }
        } catch (error) { container.innerHTML = `<p>エラー: ${error.message}</p>`; }
    }

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

    function initSwipe() {
        const nopeButton = document.getElementById('nope-button');
        const likeButton = document.getElementById('like-button');
        function swipe(direction) {
            const topCard = swipeDeck.querySelector('.swipe-card:last-child');
            if (!topCard) return;
            topCard.style.transform = `translateX(${direction * 100}vw) rotate(${direction * 30}deg)`;
            setTimeout(() => { topCard.remove(); }, 400);
        }
        nopeButton.addEventListener('click', () => swipe(-1));
        likeButton.addEventListener('click', () => swipe(1));
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
    
    // ★★★ メイン処理を実行 ★★★
    main();
});

// --- アカウント連携の処理 (グローバルスコープに配置) ---
async function syncAccount() {
    const GAS_API_URL = "【あなたのGAS WebアプリのURLをここに貼り付け】"; // こちらにも設定

    document.getElementById("sync-button").innerText = "連携処理中...";
    document.getElementById("sync-button").disabled = true;

    try {
        const liffUserId = liff.getContext().userId;
        const nonce = Math.random().toString(36).substring(2);
        
        const result = await (await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ source: 'liff_app', action: 'storeLiffIdWithNonce', liffUserId: liffUserId, nonce: nonce })
        })).json();

        if (result.success) {
            await liff.sendMessages([{ type: 'text', text: `/sync ${nonce}` }]);
            liff.closeWindow();
        } else {
            alert('連携処理に失敗しました: ' + result.message);
            document.getElementById("sync-button").innerText = "アカウントを連携する";
            document.getElementById("sync-button").disabled = false;
        }
    } catch (error) {
        alert('エラー: ' + error.message);
        document.getElementById("sync-button").innerText = "アカウントを連携する";
        document.getElementById("sync-button").disabled = false;
    }
}
