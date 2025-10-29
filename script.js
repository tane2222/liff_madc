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

    // 成功時にプロフィールを表示する関数
    function showProfile(data) {
        if (data.success) {
            document.getElementById("nickname").innerText = data.nickname || '未設定';
            if (data.profileImageUrl) {
                document.getElementById("profile-image").src = data.profileImageUrl;
            }
            document.getElementById("kyun-points").innerText = data.totalKyun;
            const progressPercent = Math.round((data.diagnosisProgress / 6) * 100);
            document.getElementById("diagnosis-progress").innerText = `${progressPercent}%`;

            // ローディングを解除し、アニメーションを開始
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

    // LIFFアプリのメイン処理
    async function main() {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }
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