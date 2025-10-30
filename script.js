window.addEventListener('DOMContentLoaded', () => {
    // ★★★ GASのWebアプリURLとLIFF IDをここに設定 ★★★
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwyKAZqLjwcc_Z_8ZLinHOhaGFcUPd9n_Asjf52oYbVpX3Kj3XYTT5cTiyO3luxiHGL3Q/exec";
    const LIFF_ID = "2008378264-4O97qRYQ";
    
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
    document.getElementById('go-to-new-users').addEventListener('click', (e) => {
        e.preventDefault();
        loadNewUserListPage();
        showPage('new-user-list-page');
    });
    document.getElementById('go-to-old-users').addEventListener('click', (e) => {
        e.preventDefault();
        loadUserListPage();
        showPage('user-list-page');
    });
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = e.currentTarget.getAttribute('data-target');
            showPage(targetPage || 'my-page');
        });
    });
    
    // --- データ表示関連 ---
    function showProfile(data) {
        if (data.success) {
            document.getElementById("nickname").innerText = data.nickname || '未設定';
            document.getElementById("profile-image").src = data.profileImageUrl;
            document.getElementById("kyun-points").innerText = data.totalKyun;
            const progressPercent = Math.round((data.diagnosisProgress / 6) * 100);
            document.getElementById("diagnosis-progress").innerText = `${progressPercent}%`;
            
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
        const container = document.getElementById('user-list-container');
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
            } else {
                container.innerHTML = `<p>エラー: ${result.message}</p>`;
            }
        } catch (error) {
            container.innerHTML = `<p>エラー: ${error.message}</p>`;
        }
    }

    let swipeDeck;
    let allCards;

    async function loadNewUserListPage() {
        swipeDeck = document.getElementById('swipe-deck');
        swipeDeck.innerHTML = '<p>ユーザーを探しています...</p>';
        try {
            const result = await callGasApi('getUsersForLiff', { liffUserId: liff.getContext().userId });
            if (result.success && result.users.length > 0) {
                swipeDeck.innerHTML = '';
                result.users.forEach(user => {
                    const card = document.createElement('div');
                    card.classList.add('swipe-card');
                    card.innerHTML = `
                        <div class="swipe-badge like-badge">LIKE</div>
                        <div class="swipe-badge nope-badge">NOPE</div>
                        <img src="${user.profileImageUrl}" alt="${user.nickname}">
                        <div class="card-info">
                            <h3>${user.nickname || 'ななしさん'}</h3>
                            <p>${user.age || '?'}歳・${user.job || '未設定'}</p>
                        </div>`;
                    swipeDeck.appendChild(card);
                });
                initSwipe();
            } else {
                swipeDeck.innerHTML = '<p>表示できるユーザーがいません。</p>';
            }
        } catch (error) {
            swipeDeck.innerHTML = `<p>エラー: ${error.message}</p>`;
        }
    }

    function initSwipe() {
        allCards = swipeDeck.querySelectorAll('.swipe-card');
        allCards.forEach(card => {
            let isDragging = false;
            let startX = 0, startY = 0;

            function onDragStart(e) {
                isDragging = true;
                startX = e.pageX || e.touches[0].pageX;
                startY = e.pageY || e.touches[0].pageY;
                card.style.transition = 'none';
            }
            function onDragMove(e) {
                if (!isDragging) return;
                const currentX = e.pageX || e.touches[0].pageX;
                const diffX = currentX - startX;
                const rotate = diffX * 0.1;
                card.style.transform = `translateX(${diffX}px) rotate(${rotate}deg)`;
                if (diffX > 0) {
                    card.querySelector('.like-badge').style.opacity = diffX / 100;
                } else {
                    card.querySelector('.nope-badge').style.opacity = -diffX / 100;
                }
            }
            function onDragEnd(e) {
                if (!isDragging) return;
                isDragging = false;
                const diffX = (e.pageX || e.changedTouches[0].pageX) - startX;
                card.style.transition = 'transform 0.3s ease';
                if (Math.abs(diffX) > 100) {
                    const flyOutDirection = diffX > 0 ? 1 : -1;
                    card.style.transform = `translateX(${flyOutDirection * 500}px) rotate(${flyOutDirection * 20}deg)`;
                    setTimeout(() => card.remove(), 300);
                } else {
                    card.style.transform = '';
                }
                card.querySelector('.like-badge').style.opacity = 0;
                card.querySelector('.nope-badge').style.opacity = 0;
            }

            card.addEventListener('mousedown', onDragStart);
            card.addEventListener('mousemove', onDragMove);
            card.addEventListener('mouseup', onDragEnd);
            card.addEventListener('mouseleave', onDragEnd);
            card.addEventListener('touchstart', onDragStart);
            card.addEventListener('touchmove', onDragMove);
            card.addEventListener('touchend', onDragEnd);
        });
    }
    
    // --- LIFFアプリのメイン処理 ---
    async function main() {
        try {
            await liff.init({ liffId: LIFF_ID });
            if (!liff.isLoggedIn()) {
                liff.login();
                return;
            }
            showPage('my-page');
            const liffUserId = liff.getContext().userId;
            const profileData = await callGasApi('getMyProfileData', { liffUserId: liffUserId });
            showProfile(profileData);
        } catch (error) {
            showError(error);
        }
    }
    
    // ★★★ メイン処理を実行 ★★★
    main();
});


// --- アカウント連携の処理 (グローバルスコープに配置) ---
async function syncAccount() {
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
