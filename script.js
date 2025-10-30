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
    
    // ▼▼▼▼▼ ここから修正・追加 ▼▼▼▼▼

    const pages = document.querySelectorAll('.page');
    function showPage(pageId) {
        pages.forEach(page => {
            page.style.display = (page.id === pageId) ? 'block' : 'none';
        });
    }

    document.getElementById('go-to-users').addEventListener('click', (e) => {
        e.preventDefault();
        loadUserListPage();
        showPage('user-list-page');
    });

    document.getElementById('back-to-mypage').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('my-page');
    });
    
    function showProfile(data) {
        if (data.success) {
            document.getElementById("nickname").innerText = data.nickname || '未設定';
            // ▼▼▼ 修正点: if文を削除し、受け取ったURLをそのまま設定 ▼▼▼
            document.getElementById("profile-image").src = data.profileImageUrl; 
            
            document.getElementById("kyun-points").innerText = data.totalKyun;
            const progressPercent = Math.round((data.diagnosisProgress / 6) * 100);
            document.getElementById("diagnosis-progress").innerText = `${progressPercent}%`;
            document.getElementById("container").classList.remove('is-loading');
            document.getElementById("container").classList.add('is-loaded');
        } else {
            showError(data);
        }
    }

     // エラー時にメッセージを表示し、連携ボタンを表示する関数
    function showError(error) {
        document.getElementById("container").style.display = "none"; // メインコンテンツを隠す
        document.getElementById("error-message").innerText = error.message || "エラーが発生しました。";
        document.getElementById("sync-button-container").style.display = "block";
    }

async function loadUserListPage() {
        const container = document.getElementById('user-list-container');
        container.innerHTML = '<p>ユーザーを読み込んでいます...</p>';

        try {
            const result = await callGasApi('getUsersForLiff', { liffUserId: liff.getContext().userId });
            if (result.success) {
                container.innerHTML = '';
                if (result.users.length === 0) { /* ... */ }
                
                result.users.forEach(user => {
                    // ▼▼▼ 修正点: if文を削除し、受け取ったURLをそのまま設定 ▼▼▼
                    const userCard = `
                        <div class="user-card">
                            <img src="${user.profileImageUrl}" alt="${user.nickname}">
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




    

    async function main() {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }
        // 最初にマイページを表示する
        showPage('my-page'); 
        const liffUserId = liff.getContext().userId;
        callGasApi('getMyProfileData', { liffUserId: liffUserId })
            .then(showProfile)
            .catch(showError);
    }
    main();
});

// 連携ボタンが押された時の処理 (グローバルスコープに配置)
async function syncAccount() {
    const GAS_API_URL = "【あなたのGAS WebアプリのURLをここに貼り付け】"; // こちらにも設定
    
    document.getElementById("sync-button").innerText = "連携処理中...";
    document.getElementById("sync-button").disabled = true;

    try {
        const liffUserId = liff.getContext().userId;
        const nonce = Math.random().toString(36).substring(2);
        
        // GAS API呼び出しをawaitで待つ
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
        }
    } catch (error) {
        alert('エラー: ' + error.message);
    }
}
