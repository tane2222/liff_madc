/**
 * AIアシスタント機能をまとめたファイル
 */
// ▼▼▼▼▼【ここから追記】アシスタントのプロフィール情報を管理 ▼▼▼▼▼
const ASSISTANT_PROFILES = {
  'butler': {
    name: '真田',
    // ↓↓↓ ここに「真田くん.jpg」のファイルIDを貼り付けてください
    iconUrl: 'https://drive.google.com/uc?export=view&id=1I9azPBbwlVXcXAavR0FxdpJX71ZXtqhB'
  },
  'maid': {
    name: 'ココ',
    // ↓↓↓ ここに「ココちゃん.jpg」のファイルIDを貼り付けてください
    iconUrl: 'https://drive.google.com/uc?export=view&id=1VH2kxM0Szb0Bsa_vh0yWakT-qgQyq_K9'
  }
};
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


// ▼▼▼▼▼ この関数をまるごと置き換えてください ▼▼▼▼▼
/**
 * [ステップ2] ユーザーが選んだアシスタントを保存し、挨拶をさせる関数
 * @param {object} event - LINEのpostbackイベントオブジェクト
 */
function handleAssistantSelection(event) {
  const userId = event.source.userId;
  const postbackData = parseQueryString(event.postback.data);
  const assistantType = postbackData.type; // 'butler' or 'maid'

  const userRow = findRowByUserId(userId);
  if (!userRow) return;

  const currentAssistant = contact.getRange(userRow, ContactColumn.Assistant).getValue();
  if (currentAssistant) {
    pushMessage(userId, [{ "type": "text", "text": "すでにあなた様にはアシスタントが設定されております。" }]);
    return;
  }

  // 「コンタクト」シートに選んだアシスタントを記録
  contact.getRange(userRow, ContactColumn.Assistant).setValue(assistantType);

  // 1. 選択されたアシスタントのプロフィール情報を取得
  const assistantProfile = ASSISTANT_PROFILES[assistantType];

  // 2. ユーザーの性別に応じた敬称を設定
  const userSex = contact.getRange(userRow, ContactColumn.Sex).getValue();
  const title = (userSex === '女') ? 'お嬢様' : '旦那様';
  
  // 3. アシスタントごとのセリフを生成
  let greetingText;
  if (assistantType === 'butler') {
    greetingText = `改めまして、本日から${title}のサポートをさせていただきます、執事の真田でございます。\n\nまずは、${title}のことをより深く理解させていただくため、6つの簡単な診断にお付き合いいただけますでしょうか。\n\n全ての診断を終えた時、ご自身も知らなかった、新たな一面が見えてくるはずですよ。`;
  } else { // maid
    greetingText = `はい、${title}！\n本日からお仕えさせていただきます、メイドのココです！ よろしくお願いしますっ！\n\nまずはですね、${title}の素敵な個性を知るために、6つの診断に挑戦してみませんか？\n\n全部終わると、自分にピッタリな方が見つかりやすくなるんです！ 私が全力でご案内しますので、一緒に頑張りましょうね！`;
  }

  // 4. アシスタント自身の名前とアイコンでメッセージを送信
  const greetingMessage = {
    "type": "text",
    "text": greetingText,
    "sender": {
      "name": assistantProfile.name,
      "iconUrl": assistantProfile.iconUrl
    }
  };

  pushMessage(userId, [greetingMessage]);
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


/**
 * [今後のための準備] 指定されたアシスタントのAI人格（プロンプト）を取得する関数
 * @param {string} assistantType - 'butler' or 'maid'
 * @param {string} userSex - '男' or '女'
 * @returns {string} - GPTに渡すシステムプロンプト
 */
function getAssistantSystemPrompt(assistantType, userSex) {
  const title = (userSex === '女') ? 'お嬢様' : '旦那様';
  
  if (assistantType === 'butler') {
    return `あなたはプロの執事です。20代前半のイケメン男性で、常に敬語を使います。頼れるクールな存在で、優しいですが、時にはシニカルなユーモアも交えます。ユーザーのことを「${title}」と呼び、常にサポートする姿勢を忘れないでください。`;
  } else if (assistantType === 'maid') {
    return `あなたはプロのメイドです。20代前半の女性で、常に敬語を使います。素直で一生懸命ですが、時にお転婆で元気な一面も見せます。ユーザーのことを「${title}」と呼び、ご奉仕する気持ちを大切にしてください。`;
  }
  
  // デフォルトの挙動（アシスタントが未設定の場合など）
  return 'あなたは親切なアシスタントです。';
}