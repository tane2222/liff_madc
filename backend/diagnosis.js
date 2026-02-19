/**
 * diagnosis.gs (汎用診断エンジン版)
 * 複数の診断を管理・実行します。
 */

// ▼▼▼▼▼【重要】ここから新しい診断の設定を追加します ▼▼▼▼▼
const DiagnosisSettings = {
  '宇宙診断': {
    triggerKeyword: '宇宙診断',
    sheetName: '宇宙診断',
    resultColumn: ContactColumn.Imagin, // 結果を保存する「コンタクト」シートの列
    resultMessage: (score) => `あなたの想像力は【${score}点】です！` // 診断ごとの結果メッセージ
  },
  'ゼロスーツダイブ': {
    triggerKeyword: 'ゼロスーツダイブ',
    sheetName: 'ゼロスーツ',
    resultColumn: ContactColumn.Logic, // 例として論理思考の列に保存
    resultMessage: (score) => `あなたの素直さは【${score}点】です！`
  },
  'ミステリーワールド': {
    triggerKeyword: 'ミステリーワールド',
    sheetName: 'ミステリー',
    resultColumn: ContactColumn.Logic, // 例として論理思考の列に保存
    resultMessage: (score) => `あなたの論理思考力は【${score}点】です！`
  },
  '支配する世界': {
    triggerKeyword: '支配する世界',
    sheetName: '支配する世界',
    resultColumn: ContactColumn.Logic, // 例として論理思考の列に保存
    resultMessage: (score) => `あなたの支配力は【${score}点】です！`
  },
  '闘争': {
    triggerKeyword: '闘争',
    sheetName: '闘争',
    resultColumn: ContactColumn.Logic, // 例として論理思考の列に保存
    resultMessage: (score) => `あなたの闘争心は【${score}点】です！`
  },
  'ガチャガチャと恋': {
    triggerKeyword: 'ガチャガチャと恋',
    sheetName: 'ガチャ恋',
    resultColumn: ContactColumn.Logic, // 例として論理思考の列に保存
    resultMessage: (score) => `あなたの愛情は【${score}点】です！`
  },
  // --- 新しい診断を追加する場合は、ここに追記 ---
  // '新しい診断名': {
  //   triggerKeyword: '開始キーワード',
  //   sheetName: '診断シート名',
  //   resultColumn: ContactColumn.Honest, // 結果を保存する列
  //   resultMessage: (score) => `カスタムメッセージ【${score}点】`
  // },
};
// ▲▲▲▲▲ 新しい診断はここに設定を追加するだけでOK ▲▲▲▲▲


/**
 * ユーザーからのメッセージに応じて、適切な診断を開始または進行させます。
 * @param {object} event - LINE Webhookイベントオブジェクト
 * @returns {boolean} - 診断関連の処理が行われた場合は true, それ以外は false
 */
function handleDiagnosisFlow(event) {
  const user_id = event.source.userId;
  const userMessage = event.message.text;
  const userRow = findRowByUserId(user_id);
  const ongoingDiagnosis = contact.getRange(userRow, ContactColumn.OngoingDiagnosis).getValue();

  // 1. 新しい診断の開始をチェック
  for (const diagnosisName in DiagnosisSettings) {
    if (userMessage === DiagnosisSettings[diagnosisName].triggerKeyword) {
      startDiagnosis(user_id, diagnosisName);
      return true; // 診断処理を行ったので true を返す
    }
  }

  // 2. 進行中の診断があるかチェック
  if (ongoingDiagnosis) {
    const diagnosisData = JSON.parse(contact.getRange(userRow, ContactColumn.DiagnosisData).getValue() || '{}');
    const currentStepId = diagnosisData.step;

    // 「次に進む」でコメントを進める
    if (userMessage === '次に進む' && currentStepId && currentStepId.startsWith('c')) {
      loading(user_id);
      proceedToNextStep(user_id, ongoingDiagnosis);
      return true;
    }
  }

  return false; // 診断関連の処理は行われなかった
}

/**
 * 新しい診断を開始する関数
 */
function startDiagnosis(user_id, diagnosisName) {
  const userRow = findRowByUserId(user_id);
  const settings = DiagnosisSettings[diagnosisName];
  const diagnosisSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(settings.sheetName);
  const firstStepId = diagnosisSheet.getRange('A2').getValue();

  // 診断データを初期化
  const initialData = { step: firstStepId, score: 0 };
  contact.getRange(userRow, ContactColumn.OngoingDiagnosis).setValue(diagnosisName);
  contact.getRange(userRow, ContactColumn.DiagnosisData).setValue(JSON.stringify(initialData));

  sendNextDiagnosisStep(user_id, diagnosisName, firstStepId);
}

/**
 * 次の診断ステップを送信する汎用関数
 */
function sendNextDiagnosisStep(user_id, diagnosisName, stepId) {

  if (stepId === 'END') {
    finalizeDiagnosis(user_id, diagnosisName);
    return;
  }
  const settings = DiagnosisSettings[diagnosisName];
  const diagnosisSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(settings.sheetName);
  const allSteps = diagnosisSheet.getRange('A2:N' + diagnosisSheet.getLastRow()).getValues();
  const stepData = allSteps.find(row => row[0] === stepId);

  if (!stepData) {
    finalizeDiagnosis(user_id);
    return;
  }

  let message;
  const quickReply = { // 全てのコメントタイプに共通のクイックリプライ
    items: [ { type: "action", action: { type: "message", label: "次に進む", text: "次に進む" } } ]
  };

  // ステップの種類（コメントか質問か）で処理を分岐
  if (stepId.startsWith('c')) {
    // --- コメントの場合 ---
    const messageType = stepData[9] || 'text'; // J列、空欄なら'text'
    const altText = stepData[1]; // B列は代替テキストとして利用

    switch (messageType) {
      case 'flex':
        const jsonContent = stepData[10]; // K列
        if (jsonContent) {
          message = { type: 'flex', altText: altText, contents: JSON.parse(jsonContent), quickReply: quickReply };
        }
        break;
      
      case 'video':
        const videoUrl = stepData[11]; // L列
        const previewUrl = stepData[12]; // M列
        if (videoUrl && previewUrl) {
          message = { type: 'video', originalContentUrl: videoUrl, previewImageUrl: previewUrl, quickReply: quickReply };
        }
        break;

      case 'audio':
        const audioUrl = stepData[11]; // L列
        const duration = stepData[13]; // N列
        if (audioUrl && duration) {
          message = { type: 'audio', originalContentUrl: audioUrl, duration: duration, quickReply: quickReply };
        }
        break;

      case 'text':
      default:
        const commentText = stepData[1]; // B列
        message = { type: 'text', text: commentText, quickReply: quickReply };
        break;
    }

  } else if (stepId.startsWith('d')) {
    // --- 質問の場合 ---
    const questionText = stepData[1];
    const choices = [];
    for (let i = 2; i < 8; i += 2) {
      if (stepData[i]) {
        choices.push({
          type: "button",
          action: {
            type: "postback",
            label: stepData[i],
            // 【修正箇所】postbackデータに、どの診断かを識別する情報を追加
            data: `action=answerDiagnosis&diagnosis=${diagnosisName}&question=${stepId}&choiceIndex=${(i/2)-1}`,
            displayText: stepData[i]
          },
          style: "primary",
          height: "sm"
        });
      }
    }
    message = {
      type: "flex",
      altText: "診断の質問です",
      contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: questionText,
            wrap: true,
            weight: "bold",
            size: "md"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: choices
      }
    }
    };
  }

  if (message) {
    const messages = [message];
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      'headers': { 'Content-Type': 'application/json; charset=UTF-8', 'Authorization': 'Bearer ' + ACCESS_TOKEN },
      'method': 'post',
      'payload': JSON.stringify({ 'to': user_id, 'messages': messages }),
    });
  }
}


/**
 * 質問への回答(postback)を処理する汎用関数
 */
function handleDiagnosisAnswer(event) {
  const user_id = event.source.userId;
  loading(user_id);

  const postbackData = parseQueryString(event.postback.data);
  const diagnosisName = postbackData.diagnosis;
  const questionId = postbackData.question;
  const choiceIndex = parseInt(postbackData.choiceIndex, 10);
  
  const settings = DiagnosisSettings[diagnosisName];
  if (!settings) {
    console.error("不明な診断への回答です: " + diagnosisName);
    return; // 不明な診断の場合は処理を中断
  }
  
  const diagnosisSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(settings.sheetName);
  const questions = diagnosisSheet.getRange('A2:I' + diagnosisSheet.getLastRow()).getValues();
  const questionData = questions.find(row => row[0] === questionId);
  if (!questionData) return;

  // 中間メッセージがあれば送信する
  const interimMessageText = questionData[8];
  if (interimMessageText) {
    Utilities.sleep(500);
    const interimMessage = { type: "text", text: interimMessageText };
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      'headers': { 'Content-Type': 'application/json; charset=UTF-8', 'Authorization': 'Bearer ' + ACCESS_TOKEN },
      'method': 'post',
      'payload': JSON.stringify({ 'to': user_id, 'messages': [interimMessage] }),
    });
  }

  // ▼▼▼▼▼【ここからが重要な修正箇所です】▼▼▼▼▼

  // 1. 点数を確実に数値として取得します
  const points = parseInt(questionData[3 + (choiceIndex * 2)] || 0, 10);
  
  const userRow = findRowByUserId(user_id);
  // ユーザーが見つからない場合はエラーを記録して処理を中断
  if (!userRow) {
    console.error("ユーザーが見つかりません: " + user_id);
    return;
  }

  // 2. 診断データを安全に読み込み、スコアを更新します
  const diagnosisDataJSON = contact.getRange(userRow, ContactColumn.DiagnosisData).getValue();
  // データが空、または壊れている場合に備えて、デフォルト値を設定
  const diagnosisData = JSON.parse(diagnosisDataJSON || '{"score":0, "step":""}');
  
  // scoreプロパティが存在しない、または数値でない場合に初期化
  if (typeof diagnosisData.score !== 'number') {
    diagnosisData.score = 0;
  }
  diagnosisData.score += points;

  // 3. 更新したデータを書き戻します
  contact.getRange(userRow, ContactColumn.DiagnosisData).setValue(JSON.stringify(diagnosisData));

  // ▲▲▲▲▲【ここまでが重要な修正箇所です】▲▲▲▲▲

  // 次のステップへ進む
  proceedToNextStep(user_id, diagnosisName);
}


/**
 * 次のステップへ進める汎用関数
 */
function proceedToNextStep(user_id, diagnosisName) {
  
  const settings = DiagnosisSettings[diagnosisName];
  const diagnosisSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(settings.sheetName);

  const userRow = findRowByUserId(user_id);
  const diagnosisDataJSON = contact.getRange(userRow, ContactColumn.DiagnosisData).getValue();
  const diagnosisData = JSON.parse(diagnosisDataJSON || '{}');
  const currentStepId = diagnosisData.step;

  const allSteps = diagnosisSheet.getRange('A2:A' + diagnosisSheet.getLastRow()).getValues().flat();
  const currentStepIndex = allSteps.indexOf(currentStepId);
  
  if (currentStepIndex === -1 || currentStepIndex + 1 >= allSteps.length) {
    finalizeDiagnosis(user_id, diagnosisName);
    return;
  }

  const nextStepId = allSteps[currentStepIndex + 1];
  
  // 診断データを更新
  diagnosisData.step = nextStepId;
  contact.getRange(userRow, ContactColumn.DiagnosisData).setValue(JSON.stringify(diagnosisData));
  
  // 少し待ってから次のステップを送信
  Utilities.sleep(1000);
  sendNextDiagnosisStep(user_id, diagnosisName, nextStepId);

}


/**
 * 診断を完了させる汎用関数
 */
function finalizeDiagnosis(user_id, diagnosisName) {
    const userRow = findRowByUserId(user_id);
    const settings = DiagnosisSettings[diagnosisName];

    // ▼▼▼▼▼【ここからが修正箇所です】▼▼▼▼▼
    // どの診断シートかをここで定義します
    const diagnosisSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(settings.sheetName);
    
    const diagnosisDataJSON = contact.getRange(userRow, ContactColumn.DiagnosisData).getValue();
    const diagnosisData = JSON.parse(diagnosisDataJSON || '{}');
    const rawScore = diagnosisData.score;

    // 最大可能スコアを計算
    const allData = diagnosisSheet.getRange('D2:H' + (diagnosisSheet.getLastRow() - 1)).getValues();
    // ▲▲▲▲▲【ここまでが修正箇所です】▲▲▲▲▲

    let maxPossibleScore = 0;
    allData.forEach(row => {
        const scores = [row[0], row[2], row[4]].filter(s => typeof s === 'number');
        if (scores.length > 0) {
            maxPossibleScore += Math.max(...scores);
        }
    });

    const finalScore = (maxPossibleScore > 0) ? Math.round((rawScore / maxPossibleScore) * 100) : 0;
    
    // 設定に基づいて結果を正しい列に保存
    contact.getRange(userRow, settings.resultColumn).setValue(finalScore);

    // 進行中データをクリア
    contact.getRange(userRow, ContactColumn.OngoingDiagnosis).clearContent();
    contact.getRange(userRow, ContactColumn.DiagnosisData).clearContent();
 
    // 設定に基づいた結果メッセージを送信
    const resultMessageText = settings.resultMessage(finalScore);
    const resultMessage = { 
      type: "text", 
      text: `診断お疲れ様でした！\n\n${resultMessageText}` 
    };
  
    const messages = [resultMessage];

    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
        'headers': {
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' + ACCESS_TOKEN,
        },
        'method': 'post',
        'payload': JSON.stringify({ 'to': user_id, 'messages': messages }),
    });
}

// parseQueryString は変更なし

function parseQueryString(queryString) {
  if (!queryString) return {};
  const params = {};
  const pairs = queryString.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    if (pair[0]) {
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
  }
  return params;
}