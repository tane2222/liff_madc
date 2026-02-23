// secretQuestion.gs

const secretQuestionSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ヒミツ質問');
//const matchingSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('マッチング中');

/**
 * [API] LIFFからヒミツの質問（2つ）を受け取り保存する関数
 * アクション名: submitSecretQuestions
 */
function registerLiffSecretQuestions(liffUserId, matchId, questions) {
  try {
    const userId = getLineIdFromLiffId(liffUserId);
    if (!userId) throw new Error("ユーザー情報の取得に失敗しました。");

    // マッチングデータを検索
    const matchDataObj = findMatchData(matchId, userId);
    if (!matchDataObj) throw new Error("有効なマッチングが見つかりません。");

    const { rowIndex, data, isUser1 } = matchDataObj;

    // 1. 質問データ(JSON)を保存
    // User1ならK列(11), User2ならL列(12)
    const targetCol = isUser1 ? 11 : 12;
    matchingSheet.getRange(rowIndex, targetCol).setValue(JSON.stringify(questions));

    // 2. 相手の状況を確認
    const otherCol = isUser1 ? 12 : 11;
    const otherUserQuestions = data[otherCol - 1]; // 配列インデックスは-1
    const otherUserId = isUser1 ? data[2] : data[1];

    if (otherUserQuestions && String(otherUserQuestions).startsWith('[')) {
      // ■ 両者完了の場合
      // ステータスを「回答入力フェーズ」に進める
      matchingSheet.getRange(rowIndex, 10).setValue('QUESTION_ANSWERING');

      // 双方に通知を送信
      sendNotificationToBoth(data[1], data[2],
        "お互いの「ヒミツの質問」が決まりました！\n相手からの質問が届いています。LIFFを開いて回答してください。",
        "質問に回答する"
      );

      return { success: true, status: "completed", message: "質問を保存しました。相手からの質問に回答してください。" };
    } else {
      // ■ 相手待ちの場合
      matchingSheet.getRange(rowIndex, 10).setValue('WAITING_PARTNER_QUESTION');

      // 相手に「早く決めてね」という通知を送る（任意）
      pushMessage(otherUserId, [{
        "type": "text",
        "text": "お相手がヒミツの質問を設定しました！\nあなたも質問を設定して、マッチングを進めましょう。",
      }]);

      return { success: true, status: "waiting", message: "質問を保存しました。お相手の設定を待っています。" };
    }

  } catch (e) {
    console.error(e);
    return { success: false, message: e.message };
  }
}

/**
 * [API] LIFFで回答画面を表示するために、相手の質問を取得する関数
 * アクション名: getPartnerQuestions
 */
function getPartnerQuestionsForLiff(liffUserId) {
  try {
    const userId = getLineIdFromLiffId(liffUserId);
    if (!userId) throw new Error("User not found");

    // 進行中のマッチング（QUESTION_ANSWERING）を検索
    // matchIdがフロントから渡されない場合も考慮し、ステータスから特定
    const activeMatch = findActiveMatchByPhase(userId, 'QUESTION_ANSWERING');
    if (!activeMatch) return { success: false, message: "回答待ちの質問はありません。" };

    const { data, isUser1 } = activeMatch;

    // 相手の質問データ(JSON)を取得
    // 自分がUser1なら、相手(User2)の質問はL列(12)
    const questionCol = isUser1 ? 12 : 11;
    const questionsJson = data[questionCol - 1];

    if (!questionsJson) return { success: false, message: "質問データが見つかりません。" };

    return {
      success: true,
      matchId: data[0],
      questions: JSON.parse(questionsJson)
    };

  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * [API] LIFFから質問への回答（2つ）を受け取り保存する関数
 * アクション名: submitQuestionAnswers
 */
function submitLiffQuestionAnswers(liffUserId, matchId, answers) {
  try {
    const userId = getLineIdFromLiffId(liffUserId);
    const matchDataObj = findMatchData(matchId, userId);
    if (!matchDataObj) throw new Error("マッチングが見つかりません。");

    const { rowIndex, data, isUser1 } = matchDataObj;

    // 1. 回答を保存
    // User1の回答: Q1->M列(13), Q2->O列(15)
    // User2の回答: Q1->N列(14), Q2->P列(16)
    // answers は ["回答1", "回答2"] の配列想定

    if (isUser1) {
      matchingSheet.getRange(rowIndex, 13).setValue(answers[0]); // M列
      matchingSheet.getRange(rowIndex, 15).setValue(answers[1]); // O列
    } else {
      matchingSheet.getRange(rowIndex, 14).setValue(answers[0]); // N列
      matchingSheet.getRange(rowIndex, 16).setValue(answers[1]); // P列
    }

    // 2. 相手の回答状況を確認
    // 自分がUser1なら、相手(User2)の回答セル(N列, P列)を確認
    const checkCol1 = isUser1 ? 14 : 13;
    const checkCol2 = isUser1 ? 16 : 15;

    const ans1 = data[checkCol1 - 1];
    const ans2 = data[checkCol2 - 1];

    if (ans1 && ans2) {
      // ■ 両者完了
      matchingSheet.getRange(rowIndex, 10).setValue('CHAT_CONFIRMATION');

      sendNotificationToBoth(data[1], data[2],
        "お互いの回答が揃いました！\n結果を確認して、チャットに進むか決めましょう。",
        "結果を確認する"
      );

      return { success: true, status: "completed", message: "回答を送信しました。結果を確認してください。" };
    } else {
      // ■ 相手待ち
      matchingSheet.getRange(rowIndex, 10).setValue('WAITING_PARTNER_ANSWER');
      return { success: true, status: "waiting", message: "回答を送信しました。お相手の回答を待っています。" };
    }

  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * [API] LIFFで結果確認画面を表示するために、お互いの質問と回答を取得する関数
 * アクション名: getMutualAnswers
 */
function getMutualAnswersForLiff(liffUserId) {
  try {
    const userId = getLineIdFromLiffId(liffUserId);
    // CHAT_CONFIRMATION または WAITING_PARTNER_ANSWER(自分が先に終わって待ってる場合も見れるようにするなら)
    // ここでは CHAT_CONFIRMATION のみ対象とします
    const activeMatch = findActiveMatchByPhase(userId, 'CHAT_CONFIRMATION');
    if (!activeMatch) return { success: false, message: "確認できる結果はありません。" };

    const { data } = activeMatch;

    // データ整形
    // K, L: 質問JSON
    // M, N: Q1回答
    // O, P: Q2回答
    const q1Json = JSON.parse(data[10] || '[]');
    const q2Json = JSON.parse(data[11] || '[]');

    return {
      success: true,
      matchId: data[0],
      user1: {
        questions: q1Json,
        answers: [data[12], data[14]] // M, O
      },
      user2: {
        questions: q2Json,
        answers: [data[13], data[15]] // N, P
      }
    };

  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * [API] LIFFからチャット開始の可否を受け取る関数
 * アクション名: submitChatConfirmation
 */
function submitLiffChatConfirmation(liffUserId, matchId, choice) {
  try {
    // choice: 'yes' or 'no'
    const userId = getLineIdFromLiffId(liffUserId);
    const matchDataObj = findMatchData(matchId, userId);
    if (!matchDataObj) throw new Error("マッチングが見つかりません。");

    const { rowIndex, data, isUser1 } = matchDataObj;

    // 1. 意思を保存 (Q列 or R列)
    const targetCol = isUser1 ? 17 : 18;
    matchingSheet.getRange(rowIndex, targetCol).setValue(choice);

    // 2. 相手の意思を確認
    const otherCol = isUser1 ? 18 : 17;
    const otherChoice = data[otherCol - 1];

    // 即時NG判定（自分がNOなら即終了）
    if (choice === 'no') {
      handleMatchFailure(data[1], data[2], rowIndex);
      return { success: true, status: "failed", message: "マッチングを終了しました。" };
    }

    if (otherChoice) {
      if (otherChoice === 'yes' && choice === 'yes') {
        // ■ マッチング成立！
        // 既存のチャット開始フローを実行
        initiateChatWithAssistantGuide(data[1], data[2], rowIndex);
        return { success: true, status: "matched", message: "チャットが開始されます！" };
      } else if (otherChoice === 'no') {
        // 相手がNGだった場合
        handleMatchFailure(data[1], data[2], rowIndex);
        return { success: true, status: "failed", message: "残念ながらマッチング不成立となりました。" };
      }
    }

    // 相手待ち
    return { success: true, status: "waiting", message: "相手の回答を待っています。" };

  } catch (e) {
    return { success: false, message: e.message };
  }
}


// --- 以下、ヘルパー関数 ---

/**
 * マッチングIDとユーザーIDから行データを特定する
 */
function findMatchData(matchId, userId) {
  const allMatches = matchingSheet.getDataRange().getValues();
  for (let i = 1; i < allMatches.length; i++) {
    if (String(allMatches[i][0]) === String(matchId)) {
      // ユーザーが含まれているか確認
      if (allMatches[i][1] === userId || allMatches[i][2] === userId) {
        return {
          rowIndex: i + 1,
          data: allMatches[i],
          isUser1: (allMatches[i][1] === userId)
        };
      }
    }
  }
  return null;
}

/**
 * ステータスからアクティブなマッチングを探す
 */
function findActiveMatchByPhase(userId, phase) {
  const allMatches = matchingSheet.getDataRange().getValues();
  for (let i = 1; i < allMatches.length; i++) {
    const match = allMatches[i];
    if ((match[1] === userId || match[2] === userId) && match[9] === phase) {
      return {
        rowIndex: i + 1,
        data: match,
        isUser1: (match[1] === userId)
      };
    }
  }
  return null;
}

/**
 * マッチング不成立処理
 */
function handleMatchFailure(user1Id, user2Id, rowIndex) {
  matchingSheet.getRange(rowIndex, 10).setValue('MATCH_FAILED');
  pushMessage(user1Id, [{ "type": "text", "text": "今回はご縁がありませんでした。またの機会をお待ちしております。" }]);
  pushMessage(user2Id, [{ "type": "text", "text": "今回はご縁がありませんでした。またの機会をお待ちしております。" }]);
}

/**
 * 双方にLIFF誘導のFlex Messageを送る
 */
function sendNotificationToBoth(user1Id, user2Id, text, buttonLabel) {
  const liffUrl = PropertiesService.getScriptProperties().getProperty('LIFF_BASE_URL'); // 知識から取得したLIFF URL

  const message = {
    "type": "flex",
    "altText": "マッチングのお知らせ",
    "contents": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": text, "wrap": true, "size": "md" }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "button",
            "style": "primary",
            "action": {
              "type": "uri",
              "label": buttonLabel,
              "uri": liffUrl
            }
          }
        ]
      }
    }
  };

  pushMessage(user1Id, [message]);
  pushMessage(user2Id, [message]);
}