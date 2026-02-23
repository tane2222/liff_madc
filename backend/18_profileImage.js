/**
 * プロフィール画像関連の機能をまとめたファイル
 */

const PROFILE_IMAGE_FOLDER_ID = PropertiesService.getScriptProperties().getProperty('PROFILE_IMAGE_FOLDER_ID');

/**
 * [ステップ1] プロフィール画像の登録プロセスを開始する関数
 * @param {string} userId - 操作しているユーザーのID
 */
function startImageUploadProcess(userId) {
  const userRow = findRowByUserId(userId);
  if (!userRow) return;

  // ユーザーの状態を「画像アップロード待ち」に設定
  contact.getRange(userRow, ContactColumn.OngoingDiagnosis).setValue('IMAGE_UPLOAD');
  
  const message = {
    "type": "text",
    "text": "プロフィールに設定したい画像を1枚送信してください。\n\n中止する場合は「キャンセル」と入力してください。"
  };
  pushMessage(userId, [message]);
}


/**
 * [ステップ2] 送信された画像を処理し、プロフィール画像として設定する関数
 * @param {object} event - LINEのimageメッセージイベントオブジェクト
 */
function handleImageUpload(event) {
  const userId = event.source.userId;
  const messageId = event.message.id;
  const userRow = findRowByUserId(userId);
  if (!userRow) return;

  try {
    const response = UrlFetchApp.fetch('https://api-data.line.me/v2/bot/message/' + messageId + '/content', {
      'headers': { 'Authorization': 'Bearer ' + ACCESS_TOKEN },
      'method': 'get'
    });
    const imageBlob = response.getBlob();

    const folder = DriveApp.getFolderById(PROFILE_IMAGE_FOLDER_ID);
    const fileName = userId + '.jpg';

    const oldFiles = folder.getFilesByName(fileName);
    while (oldFiles.hasNext()) {
      oldFiles.next().setTrashed(true);
    }
    const file = folder.createFile(imageBlob).setName(fileName);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // ▼▼▼▼▼【ここからが修正箇所です】▼▼▼▼▼
    // 画像のURLを、埋め込みに適したサムネイル表示用のURLに変更します
    const imageUrl = 'https://drive.google.com/thumbnail?id=' + file.getId();
    // ▲▲▲▲▲【ここまでが修正箇所です】▲▲▲▲▲
    
    contact.getRange(userRow, ContactColumn.ProfileImageURL).setValue(imageUrl);

    contact.getRange(userRow, ContactColumn.OngoingDiagnosis).clearContent();
    
    pushMessage(userId, [{ "type": "text", "text": "プロフィール画像を設定しました。" }]);

  } catch (e) {
    console.error("画像のアップロード処理中にエラーが発生しました: " + e.toString());
    pushMessage(userId, [{ "type": "text", "text": "画像の登録に失敗しました。もう一度お試しください。" }]);
  }
}