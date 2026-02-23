/**
 * 毎日送信する診断のリストと、それに対応するFlex Message定義
 * ※ dailyTasks.gs から移動・統合し、nameプロパティを追加しました
 */
const DAILY_DIAGNOSES = [
  {
    column: ContactColumn.Imagin, 
    name: "宇宙診断", // アシスタントが発言するために追加
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/2.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "宇宙診断" }, "color": "#585757" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Honest, 
    name: "ゼロスーツダイブ",
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/3.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "ゼロスーツダイブ" }, "color": "#EF7C45" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Logic, 
    name: "ミステリーワールド",
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/4.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "ミステリーワールド" }, "color": "#73755f" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Possessive, 
    name: "支配する世界",
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/5.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "支配する世界" }, "color": "#4AD7FE" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Battle, 
    name: "闘争",
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/6.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "開始する", "text": "闘争" }, "color": "#DD4E38" } ], "flex": 0 } }
  },
  {
    column: ContactColumn.Love, 
    name: "ガチャガチャと恋",
    flexMessage: { "type": "bubble", "hero": { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/05/7.png", "size": "full", "aspectRatio": "16:9", "aspectMode": "cover" }, "footer": { "type": "box", "layout": "vertical", "contents": [ { "type": "button", "style": "primary", "height": "md", "action": { "type": "message", "label": "action", "text": "ガチャガチャと恋" }, "color": "#28ACE2" } ], "flex": 0 } }
  }
];

/**
 * 【定期実行用】全ユーザーの状況をチェックし、AIアシスタントから提案メッセージを送る関数
 * ※ この関数をGASのトリガーで「毎日 1回（例: 20時）」などに設定します
 */
function runDailyAssistantCheck() {
  const lastRow = contact.getLastRow();
  // ヘッダー行を除いて2行目からループ
  for (let i = 2; i <= lastRow; i++) {
    const userId = contact.getRange(i, ContactColumn.UserId).getValue();
    const assistantType = contact.getRange(i, ContactColumn.Assistant).getValue(); // 'butler' or 'maid'
    const status = contact.getRange(i, ContactColumn.Status).getValue();
    const step = contact.getRange(i, ContactColumn.Step).getValue();
    
    // ユーザーIDがない、または登録完了していない(COMPLETEでない)場合はスキップ
    if (!userId || step !== UserStep.COMPLETE) continue;

    // --- 優先度1: 慰めメッセージ（失恋・マッチング不成立） ---
    // ※今回は実装省略、必要に応じて追加

    // --- 優先度2: プロフィール写真の登録提案 ---
    const photoUrl = contact.getRange(i, ContactColumn.ProfileImageURL).getValue();
    if (!photoUrl) {
      sendPhotoAdvice(userId, assistantType);
      continue; // 写真提案を送ったら診断提案は翌日に回す（通知過多を防ぐ）
    }

    // --- 優先度3: 未実施の診断提案 (ここを修正) ---
    // まだ「0」の診断を探して、オブジェクトごと取得
    const missingDiagnosisData = findMissingDiagnosis(i);
    if (missingDiagnosisData) {
      sendDiagnosisProposal(userId, assistantType, missingDiagnosisData);
    }
  }
}

/**
 * 未実施の診断（値が0のもの）を探して、DAILY_DIAGNOSESの該当オブジェクトを返す
 * ※ランダム性を持たせるためシャッフルして検索
 */
function findMissingDiagnosis(rowIndex) {
  // 配列をシャッフル（毎回違う未実施診断を提案するため）
  const shuffledDiagnoses = shuffleArray([...DAILY_DIAGNOSES]);

  for (let diag of shuffledDiagnoses) {
    const score = contact.getRange(rowIndex, diag.column).getValue();
    if (score == 0 || score === "") {
      return diag; // データ全体（name, flexMessage含む）を返す
    }
  }
  return null; // 全部完了している場合
}

/**
 * プロフィール写真登録のアドバイス送信
 */
function sendPhotoAdvice(userId, assistantType) {
  let text = "";
  const sender = getSenderInfo(assistantType);

  if (assistantType === 'maid') {
    text = `ご主人様！大変です！\nまだプロフィール写真が登録されてないみたいです💦\n\nお写真がないと、せっかくの魅力が伝わらないですよ〜！\n私に素敵な1枚、送ってくれませんか？📷✨`;
  } else {
    text = `申し上げます。\nプロフィール用のお写真がまだ登録されていないようでございます。\n\nお相手様に安心感を持っていただくためにも、お写真の登録を強くお勧めいたします。\nこのトークルームに画像を送信していただければ、私が設定いたします。`;
  }

  // テキストメッセージ1通のみ送信
  const messageObj = [{ type: 'text', text: text }];
  pushMessageWithSender(userId, messageObj, sender);
}

/**
 * 未実施診断の提案送信（テキスト + FlexMessage）
 * ★ここを修正して統合しました
 */
function sendDiagnosisProposal(userId, assistantType, diagnosisData) {
  let text = "";
  const sender = getSenderInfo(assistantType);
  const diagName = diagnosisData.name;

  if (assistantType === 'maid') {
    text = `ねえねえ、ご主人様！\nまだ『${diagName}』やってないみたいだよ？\n\nこれやるとマッチング率アップするらしいし、今すぐやってみようよ！\n下のカードを押してみてね♪`;
  } else {
    text = `ご提案がございます。\nまだ『${diagName}』が未実施のようでございます。\n\n詳細なデータがございますと、より精度の高いマッチングが可能となります。\nお時間のある際に、こちらのカードから実施をお願いいたします。`;
  }

  // 1通目: アシスタントのコメント
  const msg1 = {
    type: 'text',
    text: text
  };

  // 2通目: 診断開始用FlexMessage
  const msg2 = {
    type: 'flex',
    altText: `${diagName}のお誘い`,
    contents: diagnosisData.flexMessage
  };

  // 2つまとめて送信
  pushMessageWithSender(userId, [msg1, msg2], sender);
}

/**
 * アシスタントごとの送信者情報（アイコン・名前）を取得
 */
function getSenderInfo(assistantType) {
  if (assistantType === 'maid') {
    return { name: "メイド ココ", iconUrl: "https://drive.google.com/uc?export=view&id=1VH2kxM0Szb0Bsa_vh0yWakT-qgQyq_K9" };
  } else {
    // デフォルトは執事
    return { name: "執事 真田", iconUrl: "https://drive.google.com/uc?export=view&id=1I9azPBbwlVXcXAavR0FxdpJX71ZXtqhB" };
  }
}

/**
 * アイコン・名前付きでプッシュメッセージを送る内部関数
 * ★引数 messages を配列として受け取れるように修正しました
 */
function pushMessageWithSender(userId, messages, senderInfo) {
  const url = 'https://api.line.me/v2/bot/message/push';
  
  // 各メッセージにsender情報を付与する
  const messagesWithSender = messages.map(msg => {
    // senderプロパティを追加（既存のプロパティはそのまま）
    return { ...msg, sender: { name: senderInfo.name, iconUrl: senderInfo.iconUrl } };
  });

  const payload = {
    'to': userId,
    'messages': messagesWithSender
  };

  try {
    UrlFetchApp.fetch(url, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + ACCESS_TOKEN,
      },
      'method': 'post',
      'payload': JSON.stringify(payload),
    });
  } catch(e) {
    console.error("Error sending push message:", e);
  }
}

/**
 * 配列をランダムにシャッフルするヘルパー関数
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 【定期実行用】前日のマッチング不成立（片方がトーク開始しなかった）ユーザーを慰める関数
 * ※ 毎日午前10時などに実行
 */
function runConsolationCheck() {
  const lastRow = contact.getLastRow();
  const now = new Date();

  for (let i = 2; i <= lastRow; i++) {
    const status = contact.getRange(i, ContactColumn.Status).getValue();
    const lastUpdate = new Date(contact.getRange(i, ContactColumn.NewDate).getValue()); 
    const userId = contact.getRange(i, ContactColumn.UserId).getValue();
    const assistantType = contact.getRange(i, ContactColumn.Assistant).getValue();

    if (status === 'Pending_Talk' && (now - lastUpdate) > 24 * 60 * 60 * 1000) {
      
      let message = "";
      const sender = getSenderInfo(assistantType);

      if (assistantType === 'maid') {
        message = `ご主人様...元気出して！\n今回はタイミングが合わなかっただけだよ！\n\nご主人様の良さは私が一番わかってるもん！\n次は絶対素敵な人見つかるよ！私がついてるからね！🍬`;
      } else {
        message = `この度は残念でございましたが、どうか気を落とされませぬよう。\n\n良縁とは巡り合わせでございます。\n旦那様の魅力は私が一番存じておりますゆえ、必ずや相応しい方が現れると信じております。\n今日は少しゆっくり休みましょう。`;
      }
      
      const msgObj = [{ type: 'text', text: message }];
      pushMessageWithSender(userId, msgObj, sender);
      
      contact.getRange(i, ContactColumn.Status).setValue('Match_Failed'); 
    }
  }
}