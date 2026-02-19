const matchingSheet =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('マッチング中');

/**
 * [新機能] マッチング成立を各ユーザーのアシスタントに通知させ、チャット開始を促す関数
 * @param {string} userId1 - ユーザー1のID
 * @param {string} userId2 - ユーザー2のID
 */


function initiateChatWithAssistantGuide(userId1, userId2, matchRowIndex) {
  const matchDate = new Date();
  
  const expiryDate = new Date(matchDate);
  expiryDate.setDate(expiryDate.getDate() + 4);
  expiryDate.setHours(0, 0, 0, 0);

  // 渡された行番号を使って、既存の行を更新します
  matchingSheet.getRange(matchRowIndex, 4).setValue(matchDate); // D列: マッチング成立日時
  matchingSheet.getRange(matchRowIndex, 5).setValue(expiryDate); // E列: チャット期限
  matchingSheet.getRange(matchRowIndex, 10).setValue('CHATTING'); // J列: フェーズ

  // --- それぞれのユーザーにアシスタントからの通知を送る ---
  notifyUserOfMatch(userId1, userId2);
  notifyUserOfMatch(userId2, userId1);
}

/**
 * [新機能] アシスタントがユーザーにマッチング成立とチャットの開始を案内するヘルパー関数
 */
function notifyUserOfMatch(targetUserId, partnerId) {
  const targetUserRow = findRowByUserId(targetUserId);
  if (!targetUserRow) return;

  const assistantType = contact.getRange(targetUserRow, ContactColumn.Assistant).getValue();
  const assistantProfile = ASSISTANT_PROFILES[assistantType] || { name: '運営事務局', iconUrl: '' }; // 未設定の場合の予備

  const partnerRow = findRowByUserId(partnerId);
  if (!partnerRow) return;
  const partnerNickname = contact.getRange(partnerRow, ContactColumn.Nickname).getValue();

  const messageText = `${partnerNickname}様とのマッチングが成立いたしました。\nこれよりチャットを開始いたしますね。`;
  const assistantMessage = {
    "type": "text",
    "text": messageText,
    "sender": {
      "name": assistantProfile.name,
      "iconUrl": assistantProfile.iconUrl
    }
  };
  pushMessage(targetUserId, [assistantMessage]);

  // 続けてチャット相手選択リストを送信
  Utilities.sleep(1500); // アシスタントのメッセージを読んでから表示されるように少し待つ
  sendChatPartnerList(targetUserId);
}


/**
 * チャットメッセージを相手に転送する関数（新機能追加）
 */
function relayChatMessage(senderId, receiverId, messageText) {
  const senderRow = findRowByUserId(senderId);
  const senderNickname = contact.getRange(senderRow, ContactColumn.Nickname).getValue();
  const receiverRow = findRowByUserId(receiverId);
  const receiverChatPartner = contact.getRange(receiverRow, ContactColumn.ChatPartner).getValue();

  // ★★★ 受信者が送信者との集中チャットモードでない場合 ★★★
  if (receiverChatPartner !== senderId) {
    const promptMessage = {
      "type": "flex", "altText": `${senderNickname}さんからメッセージです`, "contents": {
        "type": "bubble",
        "header": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": `${senderNickname}さんからメッセージ`, "color": "#FFFFFF", "weight": "bold" } ], "backgroundColor": "#6C757D" },
        "body": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": messageText, "wrap": true, "size": "sm" } ] },
        "footer": { "type": "box", "layout": "vertical", "spacing": "sm", "contents": [
            { "type": "button", "action": { "type": "message", "label": "返信する（チャット開始）", "text": `/talk ${senderNickname}` }, "style": "primary" },
            { "type": "button", "action": { "type": "postback", "label": "あとで確認", "data": "action=ignore" } }
        ]}
      }
    };
    pushMessage(receiverId, [promptMessage]);
  } else {
    // ★★★ 集中チャットモード中の場合は通常通りメッセージを転送 ★★★
    const senderIconUrl = contact.getRange(senderRow, ContactColumn.ProfileImageURL).getValue();
    const senderInfo = { "name": senderNickname };
    if (senderIconUrl) { senderInfo.iconUrl = senderIconUrl; }
    const message = { "type": "text", "text": messageText, "sender": senderInfo };
    pushMessage(receiverId, [message]);
  }
}


/**
 * [コマンド用] 指定されたユーザーの、現在チャット可能な相手リストを取得する関数
 * @param {string} userId - 確認するユーザーのID
 * @returns {Array} - チャット可能な相手の { nickname, userId } オブジェクトの配列
 */
function getActiveChatPartners(userId) {
  const allMatches = matchingSheet.getDataRange().getValues();
  const now = new Date();
  const partners = [];

  for (let i = 1; i < allMatches.length; i++) {
    const match = allMatches[i];
    const expiryDate = new Date(match[4]);

    if (expiryDate > now) {
      let partnerId = null;
      if (match[1] === userId) partnerId = match[2];
      if (match[2] === userId) partnerId = match[1];
      
      if (partnerId) {
        const partnerRow = findRowByUserId(partnerId);
        if (partnerRow) {
          const partnerNickname = contact.getRange(partnerRow, ContactColumn.Nickname).getValue();
          partners.push({ nickname: partnerNickname, userId: partnerId });
        }
      }
    }
  }
  return partners;
}


/**
 * [コマンド用] チャット可能な相手の一覧をFlex Messageで送信する関数
 * @param {string} userId - 送信先のユーザーID
 */
function sendChatPartnerList(userId) {
  const partners = getActiveChatPartners(userId);
  if (partners.length === 0) {
    pushMessage(userId, [{ "type": "text", "text": "現在チャット可能なお相手はいません。" }]);
    return;
  }

  const buttons = partners.map(p => ({
    "type": "button",
    "action": { "type": "message", "label": p.nickname, "text": `/talk ${p.nickname}` },
    "style": "primary",
    "height": "sm"
  }));

  const listMessage = {
    "type": "flex", "altText": "チャット相手を選択", "contents": {
      "type": "bubble",
      "body": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": "誰と話しますか？", "weight": "bold", "size": "md" } ] },
      "footer": { "type": "box", "layout": "vertical", "spacing": "sm", "contents": buttons }
    }
  };
  pushMessage(userId, [listMessage]);
}


/**
 * [コマンド用] 集中チャットモードの相手を設定する関数
 * @param {string} userId - 操作しているユーザーID
 * @param {string} targetNickname - 相手のニックネーム
 */
function setChatFocus(userId, targetNickname) {
  const partners = getActiveChatPartners(userId);
  const target = partners.find(p => p.nickname === targetNickname);

  if (target) {
    const userRow = findRowByUserId(userId);
    contact.getRange(userRow, ContactColumn.ChatPartner).setValue(target.userId);
    pushMessage(userId, [{ "type": "text", "text": `【${targetNickname}】さんとの集中チャットモードを開始しました。\n終了するには「/end」と入力してください。` }]);
  } else {
    pushMessage(userId, [{ "type": "text", "text": `「${targetNickname}」さんは現在チャット可能な相手ではありません。` }]);
  }
}


/**
 * [コマンド用] 集中チャットモードを終了する関数
 * @param {string} userId - 操作しているユーザーID
 */
function clearChatFocus(userId) {
  const userRow = findRowByUserId(userId);
  contact.getRange(userRow, ContactColumn.ChatPartner).clearContent();
  pushMessage(userId, [{ "type": "text", "text": "集中チャットモードを終了しました。" }]);
}