const adviceDataSheet =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('キャリア診断データ');
/**
 * AIマッチングを実行し、結果をユーザーに送信するメイン関数
 * @param {string} userId - マッチングを要求したユーザーのID
 */
function handleAiMatching(userId) {
  const userRow = findRowByUserId(userId);
  // ユーザー自身が見つからない、または無効な行番号の場合は処理を中断
  if (!userRow || userRow < 1) return;

  const allAdviceData = adviceDataSheet.getDataRange().getValues();
  const myAdviceRow = allAdviceData.find(row => row[0] === userId);

  if (!myAdviceRow) {
    pushMessage(userId, [{ type: 'text', text: 'AIマッチングの準備ができていません。先に「恋愛キャリア診断」をお試しください。' }]);
    return;
  }
  const myAdvice = myAdviceRow[1];

  const mySex = contact.getRange(userRow, ContactColumn.Sex).getValue();
  const candidates = allAdviceData.filter(row => {
    const candidateId = row[0];
    // 自分自身や、IDが空のデータは除外
    if (!candidateId || candidateId === userId) return false;
    
    const candidateRow = findRowByUserId(candidateId);
    
    // ▼▼▼▼▼【ここからが重要な修正箇所です】▼▼▼▼▼
    // 候補者の行番号が null または 1未満 の無効な値でないか、より厳密にチェックします
    if (!candidateRow || candidateRow < 1) {
      return false; 
    }
    // ▲▲▲▲▲【ここまでが重要な修正箇所です】▲▲▲▲▲

    const candidateSex = contact.getRange(candidateRow, ContactColumn.Sex).getValue();
    // 性別が設定されており、かつ異性であることもチェック
    return candidateSex && (candidateSex !== mySex);
  });

  if (candidates.length === 0) {
    pushMessage(userId, [{ type: 'text', text: '紹介できるお相手が見つかりませんでした。' }]);
    return;
  }

  // AIに送信するプロンプトを作成
  const prompt = createAiMatchingPrompt(myAdvice, candidates);
  
  // GPT APIを呼び出してマッチング結果を取得
  const aiResultText = getGptReplyForAdvice(prompt); // careerAdvice.gsの関数を流用

  if (!aiResultText || !aiResultText.includes('推奨ユーザーID:')) {
    pushMessage(userId, [{ type: 'text', text: 'AIによるマッチングに失敗しました。もう一度お試しください。' }]);
    return;
  }

  // AIの回答からIDと理由を抽出
  const targetUserId = aiResultText.match(/推奨ユーザーID:\s*(.*)/)[1].trim();
  const reason = aiResultText.split('---')[1].trim();
  
  // demomini_jsonを作成して送信
  const targetUserRowData = contact.getRange(findRowByUserId(targetUserId), 1, 1, contact.getLastColumn()).getValues()[0];
  const miniProfileTemplate = JSON.stringify(demomini_json);
  const populatedJson = populateProfileTemplate(miniProfileTemplate, targetUserRowData);
  const flexMessage = { type: 'flex', altText: '相性の良い方が見つかりました！', contents: JSON.parse(populatedJson) };

  pushMessage(userId, [flexMessage, { type: 'text', text: reason }]);
}


/**
 * AIマッチング用のプロンプトを作成する関数
 * @param {string} myAdvice - 自分の診断結果
 * @param {Array} candidates - 候補者の診断結果リスト [ [userId, advice], ... ]
 * @returns {string} - GPTに送信するプロンプト
 */
function createAiMatchingPrompt(myAdvice, candidates) {
  const candidateProfiles = candidates.map(c => `ユーザーID: ${c[0]}\n診断結果: ${c[1]}\n`).join('\n---\n');
  const prompt = `
あなたは優秀なマッチングAIです。以下のユーザー（あなた）に最も相性の良い相手を、候補者リストの中から1人だけ選んでください。

# あなたのプロフィール
${myAdvice}

# 候補者リスト
${candidateProfiles}

# 指示
1.  「あなたのプロフィール」と「候補者リスト」全員の性格や価値観を深く理解してください。
2.  候補者の中から、あなたと最も相性が良いと判断した相手を**1人だけ**選んでください。
3.  以下の形式で必ず回答してください。他の文章は一切含めないでください。

推奨ユーザーID: (選んだ相手のユーザーID)
---
(あなたがこの相手を選んだ理由を、本人に語りかけるように親しみやすい口調で記述)
`;
  return prompt;
}