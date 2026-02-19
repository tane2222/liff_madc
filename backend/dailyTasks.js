/**
 * 毎日定時に実行されるタスクを管理します。
 */

// 毎日送信する診断のリストと、それに対応するFlex Messageを定義します。
/**
const DAILY_DIAGNOSES = [
  {
    column: ContactColumn.Imagin, // 宇宙診断（想像力）
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/2.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "宇宙診断" }, "color": "#585757" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Honest, // ゼロスーツダイブ（素直さ）
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/3.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "ゼロスーツダイブ" }, "color": "#EF7C45" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Logic, // ミステリーワールド（論理思考）
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/4.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "ミステリーワールド" }, "color": "#73755f" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Possessive, // 支配する世界（独占欲）
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/5.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "支配する世界" }, "color": "#4AD7FE" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Battle, // 闘争（競争心）
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/6.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "闘争" }, "color": "#DD4E38" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Love, // ガチャガチャと恋（愛情）
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/7.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "action", "text": "ガチャガチャと恋" }, "color": "#28ACE2" } ], "flex": 0 } }
  }
];
*/
/**
 * 登録完了ユーザーに未実施の診断を毎日送信する関数
 */
/**
function sendDailyDiagnosis() {
  const allUsersData = contact.getRange(3, 1, contact.getLastRow() - 2, contact.getLastColumn()).getValues();

  // 全ユーザーをループ
  allUsersData.forEach(userData => {
    const userId = userData[ContactColumn.UserId - 1];
    const userStep = userData[ContactColumn.Step - 1];

    // 登録が完了しているユーザーかチェック
    if (userStep === UserStep.COMPLETE) {
      const uncompletedDiagnoses = [];

      // 未実施の診断をリストアップ
      DAILY_DIAGNOSES.forEach(diag => {
        const score = userData[diag.column - 1];
        if (score === 0 || score === null || score === '') {
          uncompletedDiagnoses.push(diag.flexMessage);
        }
      });

      // 未実施の診断が1つ以上あれば、その中からランダムで1つ送信
      if (uncompletedDiagnoses.length > 0) {
        const randomIndex = Math.floor(Math.random() * uncompletedDiagnoses.length);
        const selectedDiagnosisBubble = uncompletedDiagnoses[randomIndex];

        const message = {
          type: 'flex',
          altText: '新しい診断が届きました！',
          contents: selectedDiagnosisBubble
        };
        
        // 汎用的なpushMessage関数を使って送信
        pushMessage(userId, [message]);
      }
    }
  });
}
*/

// ▼▼▼▼▼ 以下の関数を追記してください ▼▼▼▼▼

/**
 * 毎日実行し、有効期限が近いキュンポイントをユーザーに通知する関数
 */
function sendKyunExpiryNotifications() {
  const sheet = SPREADSHEET.getSheetByName('キュン所持履歴');
  const allHistory = sheet.getDataRange().getValues();
  const now = new Date();
  
  const notifications = {}; // { userId: { '7': totalPoints, '3': totalPoints, '1': totalPoints } }

  // 1. 全ユーザーの失効予定ポイントを集計
  for (let i = 1; i < allHistory.length; i++) { // 1行目はヘッダー
    const userId = allHistory[i][0];
    const points = allHistory[i][1];
    const expiryDate = new Date(allHistory[i][3]);

    // ポイントが残っており、かつ有効期限が切れていないものをチェック
    if (points > 0 && expiryDate > now) {
      const diffTime = expiryDate.getTime() - now.getTime();
      // 残り日数を計算（例: 1.5日後は2日後として切り上げ）
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 残り日数が7日、3日、1日のいずれかの場合に集計
      if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
        if (!notifications[userId]) {
          notifications[userId] = {};
        }
        notifications[userId][diffDays] = (notifications[userId][diffDays] || 0) + points;
      }
    }
  }

  // 2. 通知対象のユーザーにメッセージを送信
  for (const userId in notifications) {
    const userData = notifications[userId];
    const detailTexts = [];

    // 通知メッセージを作成
    if (userData[7]) {
      detailTexts.push(`・7日後に${userData[7]}キュンが失効します`);
    }
    if (userData[3]) {
      detailTexts.push(`・3日後に${userData[3]}キュンが失効します`);
    }
    if (userData[1]) {
      detailTexts.push(`・1日後に${userData[1]}キュンが失効します`);
    }
    
    if (detailTexts.length > 0) {
      const messageText = `まもなく失効するキュンポイントのお知らせです。\n\n${detailTexts.join('\n')}`;
      const message = {
        type: 'text',
        text: messageText
      };
      pushMessage(userId, [message]);
    }
  }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


/**
 * 毎日実行し、有効期限が切れたキュンポイントをログから削除する関数
 */
function expireKyunPoints() {
  const sheet = SPREADSHEET.getSheetByName('キュンログ');
  const allLog = sheet.getDataRange().getValues();
  const now = new Date();
  const rowsToDelete = [];

  for (let i = 1; i < allLog.length; i++) {
    const type = allLog[i][2];
    if (type === '獲得') {
      const expiryDate = new Date(allLog[i][6]);
      if (expiryDate < now) {
        rowsToDelete.push(i + 1);
      }
    }
  }

  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    sheet.deleteRow(rowsToDelete[i]);
  }
}

/**
 * 毎日実行し、有効期限が近いキュンポイントをユーザーに通知する関数
 */
function sendKyunExpiryNotifications() {
  const sheet = SPREADSHEET.getSheetByName('キュンログ');
  const allLog = sheet.getDataRange().getValues();
  const now = new Date();
  const notifications = {};

  for (let i = 1; i < allLog.length; i++) {
    const userId = allLog[i][1];
    const type = allLog[i][2];
    
    // ▼▼▼▼▼【ここからが修正箇所です】▼▼▼▼▼
    // シートから読み取った「残りポイント」を強制的に数値に変換します
    const remainingPoints = parseInt(allLog[i][4], 10) || 0;
    // ▲▲▲▲▲【ここまでが修正箇所です】▲▲▲▲▲

    const expiryDate = new Date(allLog[i][6]);

    if (type === '獲得' && remainingPoints > 0 && expiryDate > now) {
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
        if (!notifications[userId]) {
          notifications[userId] = {};
        }
        notifications[userId][diffDays] = (notifications[userId][diffDays] || 0) + remainingPoints;
      }
    }
  }

 //  通知対象のユーザーにメッセージを送信
  for (const userId in notifications) {
    const userData = notifications[userId];
    const detailTexts = [];

    // 通知メッセージを作成
    if (userData[7]) {
      detailTexts.push(`・7日後に${userData[7]}キュンが失効します`);
    }
    if (userData[3]) {
      detailTexts.push(`・3日後に${userData[3]}キュンが失効します`);
    }
    if (userData[1]) {
      detailTexts.push(`・1日後に${userData[1]}キュンが失効します`);
    }
    
    if (detailTexts.length > 0) {
      const messageText = `まもなく失効するキュンポイントのお知らせです。\n\n${detailTexts.join('\n')}`;
      const message = {
        type: 'text',
        text: messageText
      };
      pushMessage(userId, [message]);
    }
  }
}
