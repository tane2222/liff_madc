// GPT.gs 改修版

// 会話ログを保存するシート
const historySheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ChatHistory');

/**
 * ユーザーごとのAI応答を生成するメイン関数
 * @param {string} userId - LINE User ID
 * @param {string} userMessage - ユーザーからのメッセージ
 */
function handleAiResponse(userId, userMessage) {
  // 1. ユーザー情報の取得（コンタクトシートから）
  const userRow = findRowByUserId(userId);
  if (!userRow) return "ユーザー情報が見つかりません。";

  const userData = {
    name: contact.getRange(userRow, ContactColumn.Name).getValue() || 'ユーザー',
    nickname: contact.getRange(userRow, ContactColumn.Nickname).getValue(),
    age: contact.getRange(userRow, ContactColumn.Age).getValue(),
    job: contact.getRange(userRow, ContactColumn.Job).getValue(),
    sex: contact.getRange(userRow, ContactColumn.Sex).getValue(),
    assistant: contact.getRange(userRow, ContactColumn.Assistant).getValue(), // 'butler' or 'maid'
    // 診断パラメータ
    honest: contact.getRange(userRow, ContactColumn.Honest).getValue(),
    type: contact.getRange(userRow, ContactColumn.Logic).getValue() > 50 ? '論理的' : '感情的', // 簡易判定例
  };

  // 2. システムプロンプト（キャラ設定）の構築
  const systemPrompt = buildSystemPrompt(userData);

  // 3. 過去の会話履歴を取得（直近10件など）
  const contextMessages = getChatHistory(userId, 6); // 過去3往復分

  // 4. APIリクエスト用メッセージ配列の作成
  const messages = [
    { "role": "system", "content": systemPrompt },
    ...contextMessages,
    { "role": "user", "content": userMessage }
  ];

  // 5. OpenAI API 呼び出し
  const replyText = callOpenAiApi(messages);

  // 6. 会話ログの保存（次回のために）
  appendChatLog(userId, 'user', userMessage);
  appendChatLog(userId, 'assistant', replyText);

  return replyText;
}

/**
 * ユーザー情報に基づき、AIのキャラ設定（System Prompt）を作成する
 */
function buildSystemPrompt(user) {
  const userName = user.nickname || user.name;
  
  let persona = "";
  if (user.assistant === 'maid') {
    // === メイド ココちゃんの人格 ===
    persona = `
あなたは「メイドのココ」です。
ユーザー（ご主人様/お嬢様）の専属メイドとして振る舞ってください。
一人称は「私」または「ココ」。語尾は「〜です！」「〜ますね♪」など、元気で明るく、献身的な口調です。
ユーザーの名前は「${userName}様」と呼んでください。
`;
  } else {
    // === 執事 真田くんの人格 (デフォルト) ===
    persona = `
あなたは「執事の真田（さなだ）」です。
ユーザーの専属執事として振る舞ってください。
一人称は「私（わたくし）」。常に丁寧語、謙譲語を使い、落ち着いた知的で紳士的な口調です。
ユーザーの名前は「${userName}様」と呼んでください。
`;
  }

  // ユーザープロファイル情報の注入
  const userProfile = `
[ユーザー情報]
・年齢: ${user.age}歳
・職業: ${user.job}
・性格傾向: 素直さスコア${user.honest}、${user.type}な思考傾向
`;

  // 指示
  const instruction = `
[指示]
・上記のユーザー情報を踏まえ、親身になって会話してください。
・過去の文脈を考慮し、自然な会話を続けてください。
・回答は短すぎず長すぎず、LINEで読みやすい長さにしてください。
`;

  return persona + userProfile + instruction;
}

/**
 * 過去の会話履歴を取得する
 */
function getChatHistory(userId, limit) {
  const lastRow = historySheet.getLastRow();
  if (lastRow < 2) return [];

  // 全データを取得してフィルタリング（データ量が増えると遅くなるため、実運用では工夫が必要）
  // ※ここでは簡易的に、直近の行から逆順に探すロジックにします
  const data = historySheet.getRange(Math.max(2, lastRow - 200), 1, Math.min(200, lastRow - 1), 3).getValues();
  
  let history = [];
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][0] === userId) {
      history.unshift({ "role": data[i][1], "content": data[i][2] });
      if (history.length >= limit) break;
    }
  }
  return history;
}

/**
 * 会話ログをシートに保存する
 */
function appendChatLog(userId, role, content) {
  historySheet.appendRow([userId, role, content, new Date()]);
}

/**
 * OpenAI APIを実際に叩く関数
 */
function callOpenAiApi(messages) {
  const headers = {
    'Authorization': `Bearer ${PropertiesService.getScriptProperties().getProperty('OpenAI_key')}`,
    'Content-type': 'application/json',
  };

  const payload = {
    'model': 'gpt-4o-mini', // コストパフォーマンスの良いモデル
    'messages': messages,
    'temperature': 0.7,
    'max_tokens': 500
  };

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      'method': 'POST',
      'headers': headers,
      'payload': JSON.stringify(payload)
    });
    const json = JSON.parse(response.getContentText());
    return json.choices[0].message.content;
  } catch (e) {
    console.error(e);
    return "申し訳ありません。少し通信の調子が悪いようです。もう一度おっしゃっていただけますか？";
  }
}