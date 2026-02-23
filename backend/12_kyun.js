const kyunLogSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('キュンログ');

/**
 * ユーザーの現在の有効キュンポイント残高を計算する関数
 * @param {string} userId - 対象のユーザーID
 * @returns {number} - 合計ポイント数
 */
function getTotalKyunPoints(userId) {
  const allLog = kyunLogSheet.getDataRange().getValues();
  const now = new Date();
  let totalPoints = 0;

  for (let i = 1; i < allLog.length; i++) {
    const logUserId = allLog[i][1];
    if (logUserId === userId) {
      const type = allLog[i][2];
      const points = parseInt(allLog[i][3], 10) || 0; // D列: ポイント数
      const remainingPoints = parseInt(allLog[i][4], 10) || 0; // E列: 残りポイント
      const expiryDate = new Date(allLog[i][6]); // G列: 有効期限

      if (type === '獲得' && expiryDate > now && remainingPoints > 0) {
        totalPoints += remainingPoints;
      }
    }
  }
  return totalPoints;
}

/**
 * ユーザーにキュンポイントを付与し、ログに記録する関数
 */
function grantKyunPoints(userId, points, validityDays) {
  const grantDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(grantDate.getDate() + validityDays);
  const recordId = Utilities.getUuid();
  const pointsAsString = "'" + points;
  kyunLogSheet.appendRow([recordId, userId, '獲得', pointsAsString, pointsAsString, grantDate, expiryDate, '']);
}

/**
 * 「キュンを送る」アクションを処理するメイン関数
 * @param {string} senderId - キュンを送ったユーザーのID
 * @param {string} receiverId - キュンを受け取ったユーザーのID
 */
function handleKyunAction(senderId, receiverId) {
  // ★★★ 追加: 相手がボットかどうかの判定 ★★★
  // ボットのIDは "LINE_BOT_" で始まると仮定（MAIN.gsの生成ルールに合わせる）
  if (receiverId && receiverId.startsWith('LINE_BOT_')) {
    // --- ボットへのキュン送信処理（即マッチング） ---

    // 1. ログ記録（相手IDはボットIDのまま）
    const recordId = Utilities.getUuid();
    kyunLogSheet.appendRow([recordId, senderId, '送信', "'-1", '', new Date(), '', receiverId]);
    SpreadsheetApp.flush();

    // 2. 自分への通知
    // ボットから即レスが来たように見せる
    const botName = "AIパートナー"; // 必要ならIDから名前を復元するロジックを追加
    const textMessage = {
      "type": "text",
      "text": `あ、キュンありがとう！\n私も${botName}だよ！よろしくね！\n(※これはAIとのチュートリアルマッチングです)`
    };
    pushMessage(senderId, [textMessage]);

    // 3. マッチング成立として True を返す
    // フロントエンド側でアニメーションが始まります
    return { isMatch: true, matchId: 'BOT_MATCH_' + Utilities.getUuid() };
  }

  const currentPoints = getTotalKyunPoints(senderId);
  // ▼▼▼ 修正：初期値をオブジェクトに変更 ▼▼▼
  let result = { isMatch: false, matchId: null };

  // 1. 残りポイントが3以下の場合、確認メッセージを送信
  if (currentPoints > 0 && currentPoints <= 3) {
    const senderRow = findRowByUserId(senderId);
    if (!senderRow) return false;

    // 管理者の状態を「キュン確認中」に設定
    const kyunData = { "step": "waiting_for_kyun_confirm", "targetUserId": receiverId };
    contact.getRange(senderRow, ContactColumn.OngoingDiagnosis).setValue('KYUN_CONFIRM');
    contact.getRange(senderRow, ContactColumn.DiagnosisData).setValue(JSON.stringify(kyunData));

    const confirmationMessage = {
      "type": "text",
      "text": `キュンは残り${currentPoints}ポイントです。本当に送りますか？`,
      "quickReply": {
        "items": [
          { "type": "action", "action": { "type": "message", "label": "はい、送る", "text": "はい、送る" } },
          { "type": "action", "action": { "type": "message", "label": "やめる", "text": "やめる" } }
        ]
      }
    };
    pushMessage(senderId, [confirmationMessage]);
    return { isMatch: false, matchId: null };

    // 2. 残りポイントが3より多い場合
  } else if (currentPoints > 3) {
    // ▼▼▼ 修正：実行結果（オブジェクト）をそのまま受け取る ▼▼▼
    result = executeSendKyun(senderId, receiverId);
  } else {
    pushMessage(senderId, [{ "type": "text", "text": 'キュンポイントが不足しています。' }]);
  }

  return result; // ★結果を返す
}

/**
 * [確認後] 実際にキュンを送信する処理を実行する関数
 */
function handleConfirmAndSendKyun(senderId) {
  const senderRow = findRowByUserId(senderId);
  if (!senderRow) return;

  const kyunDataJSON = contact.getRange(senderRow, ContactColumn.DiagnosisData).getValue();
  const kyunData = JSON.parse(kyunDataJSON || '{}');
  const receiverId = kyunData.targetUserId;

  if (receiverId) {
    executeSendKyun(senderId, receiverId);
  }

  // 状態をクリア
  cancelKyunProcess(senderId);
}

/**
 * キュン送信の確認プロセスを中断する関数
 */
function cancelKyunProcess(senderId) {
  const senderRow = findRowByUserId(senderId);
  if (!senderRow) return;
  contact.getRange(senderRow, ContactColumn.OngoingDiagnosis).clearContent();
  contact.getRange(senderRow, ContactColumn.DiagnosisData).clearContent();
  pushMessage(senderId, [{ "type": "text", "text": "キャンセルしました。" }]);
}


/**
 * キュン送信のコアロジックを実行する関数
 * @param {string} senderId - 送信者のID
 * @param {string} receiverId - 受信者のID
 */
function executeSendKyun(senderId, receiverId) {
  // ▼▼▼ 修正：初期値をオブジェクトに変更 ▼▼▼
  let result = { isMatch: false, matchId: null };


  if (consumeKyunPoint(senderId)) {
    const recordId = Utilities.getUuid();

    // ログ書き込み
    kyunLogSheet.appendRow([recordId, senderId, '送信', "'-1", '', new Date(), '', receiverId]);

    // ★★★ 重要修正: 書き込みを即座に確定させる ★★★
    SpreadsheetApp.flush();
    // これがないと、直後の checkForMutualKyun で今書き込んだデータが読み取れない場合があります

    // 相手への通知
    const senderRow = findRowByUserId(senderId);
    const senderNickname = contact.getRange(senderRow, ContactColumn.Nickname).getValue() || 'ある方';
    const senderRowData = contact.getRange(senderRow, 1, 1, contact.getLastColumn()).getValues()[0];
    const notificationText = `${senderNickname}さんからキュンが届きました！`;
    const textMessage = { "type": "text", "text": notificationText };
    const miniProfileTemplate = JSON.stringify(demomini_json);
    const populatedJson = populateProfileTemplate(miniProfileTemplate, senderRowData);
    const flexMessage = { "type": "flex", "altText": notificationText, "contents": JSON.parse(populatedJson) };
    pushMessage(receiverId, [textMessage, flexMessage]);

    // 自分に通知
    sendKyunPointStatusMessage(senderId);

    // 相互マッチングチェック
    if (checkForMutualKyun(senderId, receiverId)) {
      result.isMatch = true; // ★成立フラグON

      // 通知などは行うが、LIFF画面制御はJS側でやるのでここでは通知URL送信等は補助的なものになります
      const senderLiffId = contact.getRange(senderRow, ContactColumn.LiffUserId).getValue();
      const receiverRow = findRowByUserId(receiverId);
      const receiverLiffId = contact.getRange(receiverRow, ContactColumn.LiffUserId).getValue();

      if (receiverLiffId) sendMatchSuccessNotification(senderId, receiverLiffId);
      if (senderLiffId) sendMatchSuccessNotification(receiverId, senderLiffId);

      // ▼▼▼ 修正：startSecretQuestionPhase の戻り値(ID)を受け取って result に入れる ▼▼▼
      const newMatchId = startSecretQuestionPhase(senderId, receiverId);
      result.matchId = newMatchId;
    }
  } else {
    pushMessage(senderId, [{ "type": "text", "text": 'エラーによりキュンを消費できませんでした。' }]);
  }

  return result;
}

/**
 * ユーザーのキュンポイントを1消費する関数 (FIFO方式)
 */
function consumeKyunPoint(userId) {
  const allLog = kyunLogSheet.getDataRange().getValues();
  const now = new Date();
  let oldestValidPointRowIndex = -1;
  let oldestDate = null;

  for (let i = 1; i < allLog.length; i++) {
    const rowData = allLog[i];
    if (rowData[1] === userId && rowData[2] === '獲得' && parseInt(rowData[4], 10) > 0) {
      const expiryDate = new Date(rowData[6]);
      if (expiryDate > now) {
        const grantDate = new Date(rowData[5]);
        if (oldestDate === null || grantDate < oldestDate) {
          oldestDate = grantDate;
          oldestValidPointRowIndex = i + 1;
        }
      }
    }
  }

  if (oldestValidPointRowIndex !== -1) {
    const remainingPointsCell = kyunLogSheet.getRange(oldestValidPointRowIndex, 5); // E列: 残りポイント
    const currentPoints = parseInt(remainingPointsCell.getValue(), 10) || 0;
    remainingPointsCell.setValue(currentPoints - 1);
    return true;
  }
  return false;
}


/**
 * 2人が相互にキュンを送り合っているかチェックする関数
 */
function checkForMutualKyun(userId1, userId2) {
  const allLog = kyunLogSheet.getDataRange().getValues();
  let user1ToUser2 = false;
  let user2ToUser1 = false;

  for (let i = 1; i < allLog.length; i++) {
    const sender = allLog[i][1];
    const type = allLog[i][2];
    const receiver = allLog[i][7];
    if (type === '送信') {
      if (sender === userId1 && receiver === userId2) { user1ToUser2 = true; }
      if (sender === userId2 && receiver === userId1) { user2ToUser1 = true; }
    }
  }
  return user1ToUser2 && user2ToUser1;
}

/**
 * 指定されたユーザーの現在のキュンポイント状況を集計する関数
 */
function getKyunPointStatus(userId) {
  const allLog = kyunLogSheet.getDataRange().getValues();
  const now = new Date();
  let totalPoints = 0;
  const expiryGroups = {};

  for (let i = 1; i < allLog.length; i++) {
    const rowData = allLog[i];
    if (rowData[1] === userId && rowData[2] === '獲得') {
      const expiryDate = new Date(rowData[6]);
      const remainingPoints = parseInt(rowData[4], 10) || 0;

      if (expiryDate > now && remainingPoints > 0) {
        totalPoints += remainingPoints;
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const key = `${diffDays}日後`;
        expiryGroups[key] = (expiryGroups[key] || 0) + remainingPoints;
      }
    }
  }

  const detailTexts = Object.keys(expiryGroups).sort((a, b) => parseInt(a) - parseInt(b)).map(key => {
    return `・${key}に${expiryGroups[key]}キュンが失効`;
  });

  return { total: totalPoints, details: detailTexts };
}


/**
 * キュンポイントの状況を知らせるFlex Messageを送信する関数
 */
function sendKyunPointStatusMessage(userId) {
  const status = getKyunPointStatus(userId);
  const expiryDetailsText = status.details.slice(0, 3).join('\\n') || '失効予定のキュンはありません';

  const flexMessage = {
    "type": "flex",
    "altText": "キュンポイント残高のお知らせ",
    "contents": {
      "type": "bubble",
      "header": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": "キュンポイント残高", "color": "#FFFFFF", "weight": "bold", "size": "lg" }
        ],
        "backgroundColor": "#FF69B4",
        "paddingAll": "lg"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "spacing": "md",
        "contents": [
          { "type": "text", "text": "現在の保有キュン", "size": "sm", "color": "#AAAAAA" },
          {
            "type": "box",
            "layout": "baseline",
            "contents": [
              { "type": "text", "text": String(status.total), "size": "4xl", "weight": "bold", "color": "#333333", "align": "center" },
              { "type": "text", "text": "キュン", "size": "md", "color": "#333333", "margin": "md", "flex": 0 }
            ]
          },
          { "type": "separator", "margin": "lg" },
          { "type": "text", "text": "有効期限", "size": "sm", "color": "#AAAAAA", "margin": "lg" },
          { "type": "text", "text": expiryDetailsText, "wrap": true, "size": "sm", "color": "#555555" }
        ]
      }
    }
  };

  pushMessage(userId, [flexMessage]);
}

// ▼▼▼ マッチング成立通知を送信する関数 ▼▼▼
function sendMatchSuccessNotification(userLineId, partnerLiffId) {
  // あなたのLIFF URL
  const LIFF_BASE_URL = PropertiesService.getScriptProperties().getProperty('LIFF_BASE_URL');

  const matchUrl = `${LIFF_BASE_URL}?mode=match_success&partnerLiffId=${partnerLiffId}`;

  const message = [
    {
      "type": "flex",
      "altText": "キュン★キュン成立！！",
      "contents": {
        "type": "bubble",
        "hero": {
          "type": "image",
          "url": "https://tanes.jp/wp-content/uploads/2025/11/kyun-image.png",
          "size": "full",
          "aspectRatio": "20:13",
          "aspectMode": "cover"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "text", "text": "キュン★キュン成立！", "weight": "bold", "size": "xl", "color": "#EC027E", "align": "center" },
            { "type": "text", "text": "お互いの想いが通じ合いました！\nさっそく確認してみましょう！", "size": "sm", "color": "#666666", "wrap": true, "align": "center", "margin": "md" }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "button", "style": "primary", "color": "#EC027E", "action": { "type": "uri", "label": "演出を見る", "uri": matchUrl } }
          ]
        }
      }
    }
  ];

  pushMessage(userLineId, message);
}