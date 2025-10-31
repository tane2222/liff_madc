
document.addEventListener('DOMContentLoaded', () => {
    // LIFFの初期化
    initializeLiff();
});

async function initializeLiff() {
    try {
        await liff.init({
            liffId: "2008378264-4O97qRYQ" // <-- ここをあなたのLIFF IDに書き換えてください
        });

        if (!liff.isLoggedIn()) {
            // まだLINEにログインしていなければ、ログインを要求
            // liff.login();
            console.log("LIFF initialized. Not logged in.");
        } else {
            // ログイン済みの場合
            console.log("LIFF initialized. Logged in.");
            // ユーザープロフィールを取得
            // const profile = await liff.getProfile();
            // console.log(profile.displayName, profile.userId);
        }

    } catch (error) {
        console.error("LIFF initialization failed:", error);
    }
}

// ここに、カードのスワイプ処理や「More」ボタンのクリック処理などを追加していきます。
