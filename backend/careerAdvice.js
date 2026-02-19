/**
 * AIによる恋愛キャリアアドバイス機能をまとめたファイル
 */

/**
 * [ステップ1] 恋愛キャリア診断の【要約版】を生成し、Flex Messageで送信するメイン関数
 * @param {string} userId - アドバイスを要求したユーザーのID
 */
function handleLoveCareerAdvice(userId) {
  const userRow = findRowByUserId(userId);
  if (!userRow) return;

  const scores = {
    "素直さ": contact.getRange(userRow, ContactColumn.Honest).getValue() || 0,
    "想像力": contact.getRange(userRow, ContactColumn.Imagin).getValue() || 0,
    "論理思考": contact.getRange(userRow, ContactColumn.Logic).getValue() || 0,
    "独占欲": contact.getRange(userRow, ContactColumn.Possessive).getValue() || 0,
    "競争心": contact.getRange(userRow, ContactColumn.Battle).getValue() || 0,
    "愛情": contact.getRange(userRow, ContactColumn.Love).getValue() || 0,
  };

  // スコアから直接【要約版】を生成するようAIに指示
  const summaryPrompt = createSummaryPromptFromScores(scores);
  const summaryText = getGptReplyForAdvice(summaryPrompt);

  if (summaryText) {
    const strength = summaryText.match(/### 強み\n([\s\S]*?)\n###/)?.[1].trim() || "分析中...";
    const weakness = summaryText.match(/### 弱み\n([\s\S]*?)\n###/)?.[1].trim() || "分析中...";
    const advice = summaryText.match(/### アドバイス\n([\s\S]*)/)?.[1].trim() || "分析中...";

    const adviceFlexMessage = {
      "type": "flex",
      "altText": "あなたの恋愛キャリア診断結果",
      "contents": {
        "type": "bubble",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "LOVE CAREER ADVICE",
              "weight": "bold",
              "color": "#A9A9FF",
              "size": "sm"
            },
            {
              "type": "text",
              "text": "あなたの恋愛傾向分析",
              "weight": "bold",
              "size": "xl",
              "margin": "md",
              "color": "#FFFFFF"
            },
            { "type": "separator", "margin": "xxl", "color": "#5A5F88" },
            {
              "type": "box",
              "layout": "vertical",
              "margin": "xxl",
              "spacing": "lg",
              "contents": [
                // --- 強み ---
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    { "type": "text", "text": "✨ あなたの強み", "color": "#DFDFDF", "size": "md", "weight": "bold" },
                    { "type": "text", "text": strength, "color": "#FFFFFF", "size": "sm", "wrap": true, "margin": "md" }
                  ]
                },
                // --- 弱み ---
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    { "type": "text", "text": "😥 乗り越えるべき課題", "color": "#DFDFDF", "size": "md", "weight": "bold" },
                    { "type": "text", "text": weakness, "color": "#FFFFFF", "size": "sm", "wrap": true, "margin": "md" }
                  ]
                },
                // --- アドバイス ---
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    { "type": "text", "text": "💡 ワンポイントアドバイス", "color": "#DFDFDF", "size": "md", "weight": "bold" },
                    { "type": "text", "text": advice, "color": "#FFFFFF", "size": "sm", "wrap": true, "margin": "md" }
                  ]
                }
              ]
            }
          ],
          "paddingAll": "20px",
          "background": { "type": "linearGradient", "angle": "45deg", "startColor": "#483D8B", "endColor": "#191970" }
        }
      }
    };
    adviceFlexMessage.contents.footer = {
      "type": "box", "layout": "vertical", 
      "contents": [
        { "type": "button", 
        "action": { 
          "type": "postback", 
          "label": "詳しく確認する", 
          "data": "action=showFullAdvice",
          "displayText": "詳しく確認する"        
           }, "style": "primary", "color": "#A9A9FF", "margin": "sm" }
      ], "backgroundColor": "#483D8B"
    };

    pushMessage(userId, [adviceFlexMessage]);
  } else {
    pushMessage(userId, [{ "type": "text", "text": "AIからのアドバイスの生成に失敗しました。しばらくしてからもう一度お試しください。" }]);
  }
}


/**
 * [ステップ2] 「詳しく確認」ボタンが押された際に、【詳細版】を送信（なければ生成）する関数
 * @param {string} userId - 送信先のユーザーID
 */
function sendFullCareerAdvice(userId) {
  const adviceDataSheet =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('キャリア診断データ');
  const allAdviceData = adviceDataSheet.getDataRange().getValues();

  // 1. まず、ユーザーIDに対応する「行」を検索します
  let targetRowIndex = -1;
  let fullAdviceText = null;

  for (let i = 1; i < allAdviceData.length; i++) { // 1行目はヘッダーなのでスキップ
    if (allAdviceData[i][0] === userId) {
      targetRowIndex = i + 1; // 実際のシート上の行番号
      fullAdviceText = allAdviceData[i][1]; // B列の診断結果
      break;
    }
  }

  // 2. 診断結果が「すでにあれば」、それを送信して処理を終了します
  if (fullAdviceText) {
    pushMessage(userId, [{ "type": "text", "text": fullAdviceText }]);
    return;
  }

  // 3. 診断結果が「なければ」、この場でAIに生成させます
  const userRow = findRowByUserId(userId);
  if (!userRow) {
    pushMessage(userId, [{ "type": "text", "text": "ユーザー情報が見つかりませんでした。" }]);
    return;
  }
  const scores = {
    "素直さ": contact.getRange(userRow, ContactColumn.Honest).getValue() || 0,
    "想像力": contact.getRange(userRow, ContactColumn.Imagin).getValue() || 0,
    "論理思考": contact.getRange(userRow, ContactColumn.Logic).getValue() || 0,
    "独占欲": contact.getRange(userRow, ContactColumn.Possessive).getValue() || 0,
    "競争心": contact.getRange(userRow, ContactColumn.Battle).getValue() || 0,
    "愛情": contact.getRange(userRow, ContactColumn.Love).getValue() || 0,
  };
  const fullPrompt = createFullAdvicePrompt(scores);
  const newAdviceText = getGptReplyForAdvice(fullPrompt);

  // 4. 生成した診断結果を保存します
  if (newAdviceText) {
    // もし「全キャリア診断生成」などで先にユーザーIDのみの行が作られていた場合は更新、なければ新規追加
    if (targetRowIndex !== -1) {
      // 既存の行（ただしB列は空）があれば、B列のセルを更新
      adviceDataSheet.getRange(targetRowIndex, 2).setValue(newAdviceText);
    } else {
      // 既存の行がなければ、新しい行として追加
      adviceDataSheet.appendRow([userId, newAdviceText]);
    }
    // 生成したての診断結果を送信
    pushMessage(userId, [{ "type": "text", "text": newAdviceText }]);
  } else {
    pushMessage(userId, [{ "type": "text", "text": "詳細な診断結果の生成に失敗しました。" }]);
  }
  // ▲▲▲▲▲【ここまでが修正箇所です】▲▲▲▲▲
}


/**
 * スコアから【要約版】の指示文を作成する関数
 */
function createSummaryPromptFromScores(scores) {
  const prompt = `
あなたはプロの恋愛コンサルタントです。以下の診断結果を持つユーザーの恋愛キャリアについて、要点をまとめてください。
# 診断結果
- 素直さ: ${scores["素直さ"]}点, 想像力: ${scores["想像力"]}点, 論理思考: ${scores["論理思考"]}点
- 独占欲: ${scores["独占欲"]}点, 競争心: ${scores["競争心"]}点, 愛情: ${scores["愛情"]}点
# 指示
診断結果を元に、このユーザーの強み、弱み、そして今後のアドバイスを、それぞれ【80文字以内】で簡潔にまとめてください。
以下の形式で必ず回答してください。他の文章は一切含めないでください。
### 強み
(ここに強みを記述)
### 弱み
(ここに弱みを記述)
### アドバイス
(ここにアドバイスを記述)
`;
  return prompt;
}


/**
 * スコアから【詳細版】の指示文を作成する関数
 */
function createFullAdvicePrompt(scores) {
  const prompt = `
あなたはプロの恋愛コンサルタントです。以下の診断結果を持つユーザーの恋愛キャリアについて、強み、弱み、そして今後のアドバイスを具体的に教えてください。
# 診断結果
- 素直さ: ${scores["素直さ"]}点, 想像力: ${scores["想像力"]}点, 論理思考: ${scores["論理思考"]}点
- 独占欲: ${scores["独占欲"]}点, 競争心: ${scores["競争心"]}点, 愛情: ${scores["愛情"]}点
# 指示
診断結果を元に、このユーザーがどのような恋愛をしやすいか、どのような相手と相性が良いか、そしてより良い恋愛関係を築くためにどのような点を意識すべきかを、優しく、しかし的確に分析してください。
回答は、ユーザーに直接語りかけるような、親しみやすい口調でお願いします。
`;
  return prompt;
}

/**
 * 恋愛キャリアアドバイス専用のGPT API呼び出し関数
 * (この関数に変更はありません)
 */
function getGptReplyForAdvice(prompt) {
  const headers = {
    'Authorization': `Bearer ${PropertiesService.getScriptProperties().getProperty('OpenAI_key')}`,
    'Content-type': 'application/json',
  };

  const payload = {
    'model': 'gpt-4o-mini', // 使用するモデル
    'max_tokens': 1024,
    'temperature': 0.7, // 少し創造的な回答を許容
    'messages': [
      { 'role': 'system', 'content': 'あなたはプロの恋愛コンサルタントです。' },
      { 'role': 'user', 'content': prompt }
    ]
  };

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      'headers': headers,
      'method': 'post',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    });

    const result = JSON.parse(response.getContentText());
    if (result.choices && result.choices[0].message) {
      return result.choices[0].message.content.trim();
    } else {
      console.error("GPT APIからの応答が不正です: " + response.getContentText());
      return null;
    }
  } catch (e) {
    console.error("GPT APIの呼び出し中にエラーが発生しました: " + e.toString());
    return null;
  }
}

/**
 * [管理者向け] 全ユーザーの恋愛キャリア診断を生成し、シートに保存する関数
 */
function generateAllCareerAdvices() {
  const adviceDataSheet =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('キャリア診断データ');
  const allUsers = contact.getRange(3, 1, contact.getLastRow() - 2, contact.getLastColumn()).getValues();
  const processedUserIds = new Set(adviceDataSheet.getRange('A:A').getValues().flat());

  // 未処理のユーザーのみを対象にする
  const unprocessedUsers = allUsers.filter(user => {
    const userId = user[ContactColumn.UserId - 1];
    return userId && !processedUserIds.has(userId);
  });

  if (unprocessedUsers.length === 0) {
    Browser.msgBox('全ユーザーのキャリア診断データは生成済みです。');
    return;
  }

  // 処理を実行
  unprocessedUsers.forEach(user => {
    const userId = user[ContactColumn.UserId - 1];
    const userRow = findRowByUserId(userId);

    const scores = {
      "素直さ": user[ContactColumn.Honest - 1] || 0,
      "想像力": user[ContactColumn.Imagin - 1] || 0,
      "論理思考": user[ContactColumn.Logic - 1] || 0,
      "独占欲": user[ContactColumn.Possessive - 1] || 0,
      "競争心": user[ContactColumn.Battle - 1] || 0,
      "愛情": user[ContactColumn.Love - 1] || 0,
    };

    // AIへの指示文を作成
    const prompt = createAdvicePrompt(scores);
    // AIからアドバイスを取得
    const adviceText = getGptReplyForAdvice(prompt);

    if (adviceText) {
      // 「キャリア診断データ」シートに保存
      adviceDataSheet.appendRow([userId, adviceText]);
      // 「コンタクト」シートのフラグを更新
      contact.getRange(userRow, 25).setValue('済'); // Y列 = 25列目
    }
    
    // APIの連続呼び出し制限を避けるために少し待機
    Utilities.sleep(1000); 
  });

  Browser.msgBox(`${unprocessedUsers.length}人分のキャリア診断データを生成しました。`);
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
