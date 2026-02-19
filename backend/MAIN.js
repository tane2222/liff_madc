function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('【ここを押して起動！！】')
    .addItem('メッセージ送信 -->>' , 'pushMsg')
    .addItem('マッチング -->>' , 'matchingPartner')
    .addItem('【管理者用】全キャリア診断を生成' , 'generateAllCareerAdvices')
    .addToUi();
}

// LINE DevelopersのChannel Access TokenはPropertiesServiceに格納（GASの「プロジェクトの設定」の一番下にあり）
const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN')

const ContactColumn = { UserId: 1, LineName: 2, Name: 3, Nickname: 4, Number: 5, Sex: 6, Age: 7, Job: 8, Step: 9, Msg: 10, Push: 11, Status: 12, Match: 13, NewDate: 14,
Honest: 15,Imagin: 16,Logic: 17,Possessive: 18,Battle: 19,Love: 20,Free1: 21,OngoingDiagnosis: 23, DiagnosisData: 24,CareerAdviceDone: 25 , Assistant: 26,ChatPartner: 27,
ProfileImageURL: 28, LiffUserId: 29};
const UserStep = { STEP_1: "follow-1",STEP_2:"S-2",STEP_3:"S-3",STEP_4:"S-4",STEP_5:"S-5",STEP_6:"S-6",COMPLETE:"Complete",};
const UserSex = { Men: "男", Women:"女" };
const UserJob = { A01: "採用領域", A02: "住宅領域", A03: "飲食領域", A04: "美容領域", A05: "結婚領域", A06: "その他", MASTA: "管理者" };
const UserMsg = {Free1:"フリー1", Free2:"フリー2",Tour:"テスト",Tour2:"テスト2",};
const UserPush = {Start:"送信予定", Finish:"送信済み",};

const UserStatus = { Ok: "OK", Ng:"NG" };

// ★★★ 管理者のLINE User ID を定数定義 ★★★
const ADMIN_USER_ID = "U7c1dce9de17d79f1bab98b9ad1604722";

let yobi =  ["日","月","火","水","木","金","土"]

//返信MSG集シート
const RlistColumn = { Num: 1, Content: 2, Text: 3, Flex: 4, AltText: 5, Json: 6, Null: 7, Theme: 8, Detail: 9, Datetime: 10, Item: 11, Place: 12, Free1: 13, Free2: 14, Point: 15 };



// Spreadsheetのシート名はPropertiesServiceに格納（GASの「プロジェクトの設定」の一番下にあり）
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
//const contact = sheet.getSheetByName('コンタクト');
const contact =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('コンタクト');
const replylist =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('返信MSG集');

const oklist =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('OK一覧');

const last_row = contact.getLastRow();//コンタクトの最終行。他gsファイルでも使用


//AI系の変数
const chatSheet =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('chat');
let chatLastRow = chatSheet.getLastRow();
let chatRange = chatSheet.getRange(2, 1, chatLastRow, 2);

const systemSheet =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('system');
const systemLastRow = systemSheet.getLastRow();
const systemWatchwordRange = systemSheet.getRange(2, 1, systemLastRow - 1, 1);
const systemContentRange = systemSheet.getRange(2, 2, systemLastRow - 1, 1);

const tempSheet =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('temperature');
const tempRange = tempSheet.getRange(1, 1);

const aiSheet =SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ai');
const aiRange = aiSheet.getRange(1, 1);
//AI系の変数ここまで

function doPost(e) {
  // --- 1. POSTリクエストの内容を解析 ---
  const request = JSON.parse(e.postData.contents);
  // --- 2. LIFFアプリからのAPIリクエストか、LINEのWebhookかを判断 ---
  if (request.source === 'liff_app') {
    // ★★★ LIFFアプリからのリクエストの場合 ★★★
    let responseData = {};
    
    if (request.action === 'getMyProfileData') {
      responseData = getMyProfileData(request.liffUserId);
    } 
       // ▼▼▼▼▼【ここからが修正箇所です】▼▼▼▼▼
    else if (request.action === 'getUsersForLiff') {
      responseData = getUsersForLiff(request.liffUserId); // 新しい案内板を追加
    }
    // ▲▲▲▲▲【ここまでが修正箇所です】▲▲▲▲▲
    else if (request.action === 'storeLiffIdWithNonce') {
      responseData = storeLiffIdWithNonce(request.liffUserId, request.nonce);
    }
    // ▼▼▼ 初回登録Step1の処理 ▼▼▼
    else if (request.action === 'registerUserGender') {
      responseData = registerUserGender(request.liffUserId, request.gender);
    }
    // ▼▼▼ 初回登録Step2の処理 ▼▼▼
    else if (request.action === 'registerUserName') {
      responseData = registerUserName(request.liffUserId, request.name);
    }
    // ▼▼▼ 初回登録Step3の処理 ▼▼▼
    else if (request.action === 'registerUserNickname') {
      responseData = registerUserNickname(request.liffUserId, request.nickname);
    }
    // ▼▼▼ 初回登録Step4の処理 ▼▼▼
    else if (request.action === 'registerUserEmployeeId') {
      responseData = registerUserEmployeeId(request.liffUserId, request.employeeId);
    }
    // ▼▼▼ 初回登録Step5の処理 ▼▼▼
    else if (request.action === 'registerUserAge') {
      responseData = registerUserAge(request.liffUserId, request.age);
    }
    // ▼▼▼ 初回登録Step6の処理 ▼▼▼
    else if (request.action === 'registerUserDepartment') {
      responseData = registerUserDepartment(request.liffUserId, request.department);
    }
    // ▼▼▼ オンボーディング後 (アシスタント選択) ▼▼▼
    else if (request.action === 'registerUserAssistant') {
      responseData = registerUserAssistant(request.liffUserId, request.assistantType);
    }
    // ▼▼▼ 【新規追加】LIFFからのキュン送信処理（修正版） ▼▼▼
    // MAIN.gs

    // ▼▼▼ 【新規追加】LIFFからのキュン送信処理（修正版） ▼▼▼
    // ▼▼▼ 【新規追加】LIFFからのキュン送信処理（修正版） ▼▼▼
    else if (request.action === 'sendKyun') {
      const senderLineId = getLineIdFromLiffId(request.liffUserId);
      
      // ★★★ 修正: 相手がAIボットかどうかを判定し、targetLineIdを定義する ★★★
      let targetLineId = null; // ★この行が重要です

      // AIボットのLIFF IDは "BOT_" で始まる仕様
      if (request.targetLiffUserId && String(request.targetLiffUserId).startsWith('BOT_')) {
        // ボットの場合はダミーIDを作成
        targetLineId = "LINE_" + request.targetLiffUserId; 
      } else {
        // リアルユーザーの場合はスプレッドシートから検索
        targetLineId = getLineIdFromLiffId(request.targetLiffUserId);
      }

      if (senderLineId && targetLineId) {
        // 1. handleKyunActionの結果を受け取る
        // (kyun.gs の修正により、オブジェクト { isMatch: bool, matchId: string } が返ってきます)
        const result = handleKyunAction(senderLineId, targetLineId);
        
        // 結果オブジェクトから値を取り出す（存在しない場合はデフォルト値）
        const isMatch = (result && result.isMatch) ? true : false;
        const matchId = (result && result.matchId) ? result.matchId : null;
        
        // 2. スマホ側への返事(responseData)に isMatch と matchId を含める
        responseData = { 
          success: true, 
          message: "キュンを送りました！",
          isMatch: isMatch,
          matchId: matchId 
        };
      } else {
        // senderLineIdが取れない、またはリアルユーザーなのにIDが見つからない場合
        responseData = { success: false, message: "ユーザーが見つかりませんでした。" };
      }
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // ▼▼▼ LIFFからのヒミツの質問登録処理 ▼▼▼
    else if (request.action === 'submitSecretQuestions') {
      const userId = getLineIdFromLiffId(request.liffUserId);
      if (userId) {
        // secretQuestion.gs 側の関数を呼び出す
        // request.questions は [{topic: "...", text: "..."}, {topic: "...", text: "..."}] の形式
        responseData = registerLiffSecretQuestions(userId, request.matchId, request.questions);
      } else {
        responseData = { success: false, message: "ユーザーが見つかりませんでした。" };
      }
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // ▼▼▼ LIFF版 ヒミツの質問関連API ▼▼▼
    
    // 1. 質問の設定 (決定ボタン押下時)
    else if (request.action === 'submitSecretQuestions') {
      // request.questions = [{topic: "...", text: "..."}, ...]
      responseData = registerLiffSecretQuestions(request.liffUserId, request.matchId, request.questions);
    }
    
    // 2. 相手の質問を取得 (回答画面ロード時)
    else if (request.action === 'getPartnerQuestions') {
      responseData = getPartnerQuestionsForLiff(request.liffUserId);
    }
    
    // 3. 回答の送信 (回答完了時)
    else if (request.action === 'submitQuestionAnswers') {
      // request.answers = ["回答1", "回答2"]
      responseData = submitLiffQuestionAnswers(request.liffUserId, request.matchId, request.answers);
    }
    
    // 4. お互いの回答を取得 (結果確認画面ロード時)
    else if (request.action === 'getMutualAnswers') {
      responseData = getMutualAnswersForLiff(request.liffUserId);
    }
    
    // 5. チャット開始の可否 (チャットに進む/やめるボタン)
    else if (request.action === 'submitChatConfirmation') {
      // request.choice = 'yes' or 'no'
      responseData = submitLiffChatConfirmation(request.liffUserId, request.matchId, request.choice);
    }

    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // データをJSON形式で返す
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  } 
  else {

  //ポストで送られてきたJSONをパース
  const event = JSON.parse(e.postData.contents).events[0];
  const user_id = event.source.userId;
  const eventType = event.type;
  const linename = getUserProfile(user_id);

  // 送られてきたデータをlogシートに記載（現在停止）
  /**logSheet.appendRow([event]);*/
  

  let prompt = [];
  let replyMessage = '';

  let col = "A";//
  let key1 = "f1";//「フレックス」の、挨拶メッセージ（3つのカード）に該当する識別番号
  let p1 = get_row(key1, col ,replylist);
  let flexm_1 = replylist.getRange(p1, RlistColumn.Json).getValue();//「フレックス」Jsonのセルの位置
  let alttext_1 = replylist.getRange(p1, RlistColumn.AltText).getValue();//「フレックス」altTextのセルの位置

  let key2 = "f2";//「フレックス」の、挨拶メッセージ（初回登録スタート）に該当する識別番号
  let p2 = get_row(key2, col ,replylist);
  let flexm_2 = replylist.getRange(p2, RlistColumn.Json).getValue();//「フレックス」Jsonのセルの位置
  let alttext_2 = replylist.getRange(p2, RlistColumn.AltText).getValue();//「フレックス」altTextのセルの位置

 // botが友達追加された場合に起きる処理
  if (eventType == "follow") {
    var reply_token = event.replyToken;
    var messages = [
    {
      'type': 'flex',
      'altText': alttext_1,
      'contents':JSON.parse(flexm_1),
    },
    {
      'type': 'flex',
      'altText': alttext_2,
      'contents':JSON.parse(flexm_2),
    }
    ];
    sendReplyMessage(reply_token, messages);

    const today = new Date();
    // 日付を「yyyy/MM/dd」の形式にフォーマット
    const formattedDate = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy/MM/dd');
    // ユーザーを識別するために保存してあるUserIdを検索
    const rowIndex = findRowByUserId(event.source.userId)
    // N列に今日の日付を記録
    //contact.getRange(rowIndex, ContactColumn.NewDate).setValue(formattedDate);

    for (let i = last_row; i >= 2; i--) {
      if (contact.getRange(i, 1).getValue() != '') {
        /**const j = i + 1;*/
        /**contact.getRange(j, 1).setValue(user_id);*/
        /**contact.getRange(j, 2).setValue(linename);*/
        contact.appendRow([user_id,linename , , , , , , ,UserStep.STEP_1]);
        contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.STEP_1);

        contact.getRange(rowIndex, ContactColumn.Honest).setValue('0');
        contact.getRange(rowIndex, ContactColumn.Imagin).setValue('0');
        contact.getRange(rowIndex, ContactColumn.Logic).setValue('0');
        contact.getRange(rowIndex, ContactColumn.Possessive).setValue('0');
        contact.getRange(rowIndex, ContactColumn.Battle).setValue('0');
        contact.getRange(rowIndex, ContactColumn.Love).setValue('0');
        contact.getRange(rowIndex, ContactColumn.Free1).setValue('自己紹介文がありません');

        contact.getDataRange().removeDuplicates([1]);//([1])にて、A列と重複する行を削除
        break;
      }
    }
  }


 // ユーザーを識別するために保存してあるUserIdを検索
  const rowIndex = findRowByUserId(event.source.userId)
  // ユーザーのステージを取得
   // const userStage = contact.getRange(rowIndex, ContactColumn.Stage).getValue();

  // ユーザーのレベルを取得
  const userStep = contact.getRange(rowIndex, ContactColumn.Step).getValue();

  // ユーザーのジョブを取得
  const userJob = contact.getRange(rowIndex, ContactColumn.Job).getValue();
  

  if (event.type == "postback"){
    // 診断以外のpostbackデータを解析
    const postbackData = parseQueryString(event.postback.data);
    
   // ローディングアニメーションの追加
     loading(event.source.userId);

    // ★★★「キュンを送る」が押された場合の処理
    if (postbackData.action === 'sendKyun') {
      handleKyunAction(user_id, postbackData.targetUserId);
      return;
    }

    // ▼▼▼▼▼ このifブロックを追記してください ▼▼▼▼▼
    // ★★★「詳しく確認」が押された場合の処理
    if (postbackData.action === 'showFullAdvice') {
      sendFullCareerAdvice(user_id); // careerAdvice.gs の新しい関数を呼び出す
      return;
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // ★★★「詳しく見る」が押された場合の処理
    if (postbackData.action === 'showProfile') {
      sendFullProfile(user_id, postbackData.targetUserId);
      return;
    }
    
    // 診断の回答処理
    if (postbackData.action === 'answerDiagnosis') {
      handleDiagnosisAnswer(event);
      return;
    }
    // ★★★「全登録者を見る」が押された場合の処理
    if (postbackData.action === 'showAllUsers') {
      loading(user_id);
      const page = parseInt(postbackData.page, 10) || 1; // ページ番号を取得
      sendAllUsersReport(user_id, page); // ページ番号を渡す
      return;
    }
    // ★★★アシスタント選択の処理を追加
    if (postbackData.action === 'selectAssistant') {
      handleAssistantSelection(event); // assistant.gs の関数を呼び出す
      return;
    }
    // ▼▼▼▼▼ このifブロックを追記してください ▼▼▼▼▼
    // ★★★「ヒミツの質問」のトピック選択
    if (postbackData.action === 'selectTopic') {
      handleTopicSelection(event);
      return;
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    // ▼▼▼▼▼ このifブロックを追記してください ▼▼▼▼▼
    if (postbackData.action === 'confirmChat') {
      handleChatConfirmation(event);
      return;
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // ★★★「この質問に回答する」ボタンの処理を追加
    if (postbackData.action === 'promptAnswer') {
      promptForQuestionAnswer(event);
      return;
    }
    

    let p_data = event.postback.data;   

//////    // 初回登録のステップ
    if (p_data == "go")  {
       var reply_token = event.replyToken;
       let key = "step1";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
    else if (p_data == "men")  {
      contact.getRange(rowIndex, ContactColumn.Sex).setValue(UserSex.Men);
      contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.STEP_2);
    /**
       var reply_token = event.replyToken;
       var messages = [{
      'type': 'text',
      'text':"男性ですね！\n回答ありがとうございます\n【２/６】お手数をおかけしますが、ユーザー登録のため、\nお名前（フルネーム）をメッセージとして送信をお願い致します！\n\n(例)田中花子"
    }];
    sendReplyMessage(reply_token, messages);
   */
       var reply_token = event.replyToken;
       let key = "step2-m";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    } 
    else if (p_data == "women")  {
      contact.getRange(rowIndex, ContactColumn.Sex).setValue(UserSex.Women);
      contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.STEP_2);
       var reply_token = event.replyToken;
       let key = "step2-f";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    } 
    else if (p_data == "finish-name")  {
      contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.STEP_3);
       var reply_token = event.replyToken;
       let key = "step3";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
    else if (p_data == "finish-nick")  {
      contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.STEP_4);
       var reply_token = event.replyToken;
       let key = "step4";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
    else if (p_data == "finish-number")  {
      contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.STEP_5);
       var reply_token = event.replyToken;
       var reply_token = event.replyToken;
       let key = "step5";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
    else if (p_data == "finish-age")  {
      contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.STEP_6);
      
      contact.getRange(rowIndex, ContactColumn.Honest).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Imagin).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Logic).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Possessive).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Battle).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Love).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Free1).setValue('自己紹介文がありません');

       var reply_token = event.replyToken;
       let key = "step6";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }

    else if (p_data == "area01")  {
      contact.getRange(rowIndex, ContactColumn.Job).setValue(UserJob.A01);
       var reply_token = event.replyToken;
       let key = "step-regist";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }     
    else if (p_data == "area02")  {
      contact.getRange(rowIndex, ContactColumn.Job).setValue(UserJob.A02);
       var reply_token = event.replyToken;
       let key = "step-regist";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
    else if (p_data == "area03")  {
      contact.getRange(rowIndex, ContactColumn.Job).setValue(UserJob.A03);
       var reply_token = event.replyToken;
       let key = "step-regist";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
    else if (p_data == "area04")  {
      contact.getRange(rowIndex, ContactColumn.Job).setValue(UserJob.A04);
       var reply_token = event.replyToken;
       let key = "step-regist";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
    else if (p_data == "area05")  {
      contact.getRange(rowIndex, ContactColumn.Job).setValue(UserJob.A05);
       var reply_token = event.replyToken;
       let key = "step-regist";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);

    }
    else if (p_data == "area06")  {
      contact.getRange(rowIndex, ContactColumn.Job).setValue(UserJob.A06);
       var reply_token = event.replyToken;
       let key = "step-regist";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
    else if (p_data == "regist")  {
      contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.COMPLETE);
       var reply_token = event.replyToken;
       let key = "step-fin";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
     //setRichmenu(user_id,Y01_RICHMENU);

      // 登録記念として10キュンを付与（有効期限30日）
      grantKyunPoints(user_id, 10, 30);
    }
    else if (p_data == "resume")  {
       var reply_token = event.replyToken;
       let key = "step-resume";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
//////    // 初回登録のステップここまで

    else if (p_data == "search")  {
       var reply_token = event.replyToken;
       let key = "f6";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }

    else if (p_data == "search-1")  {
       var reply_token = event.replyToken;
       let key = "test1";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
     else if (p_data == "search-2")  {
       var reply_token = event.replyToken;
       let key = "test2";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
     else if (p_data == "search-3")  {
       var reply_token = event.replyToken;
       let key = "test3";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
     else if (p_data == "search-4")  {
       var reply_token = event.replyToken;
       let key = "test4";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
     else if (p_data == "search-5")  {
       var reply_token = event.replyToken;
       let key = "test5";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
     else if (p_data == "search-6")  {
       var reply_token = event.replyToken;
       let key = "test6";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }

     else if (p_data == "match")  {
       var reply_token = event.replyToken;
       var messages = [{
      'type': 'text',
      'text':"現在準備中！マッチングができるよ！こうご期待！"
    }];
    sendReplyMessage(reply_token, messages);
    sendMatchingCarousel(user_id);
      return;
    }


    else if (p_data === 'showProfile') {
      loading(user_id); // ローディングアニメーションを追加
      sendFullProfile(user_id, postbackData.targetUserId);
      return;
    }
    // 診断の回答処理
     else if (p_data == "answerDiagnosis")  {
handleDiagnosisAnswer(event);
      return;
    }

     else if (p_data == "ai_start")  {
       var reply_token = event.replyToken;
       var messages = [{
      'type': 'text',
      'text':"現在準備中！AIがあなたをアシスト！こうご期待！",
      'quickReply':{
         'items': [
              {
                "type": "action",
                "action": {
                "type": "message",
                "label": "開始する",
                "text": "AI開始"
                 }
              },
              {
                "type": "action",
                "action": {
                "type": "message",
                "label": "開始しない",
                "text": "リセット"
                 }
              },
              ]
        }
    }];
    sendReplyMessage(reply_token, messages);
    }

     else if (p_data == "profile")  {
       var reply_token = event.replyToken;
       let key = "f7";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
     else if (p_data == "regist-info")  {
       var reply_token = event.replyToken;
       let key = "f9";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }
     else if (p_data == "kyun-point")  {
      sendKyunPointStatusMessage(user_id);
      return; // ポイント表示処理はここで終了
    }
     else if (p_data == "ast-choice")  {
       var reply_token = event.replyToken;
       let key = "step-x";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }

   }//postbackここまで

  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
 //ここから"message"だよ〜〜
  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
  if (event.type == "message") {
    
    const isDiagnosisHandled = handleDiagnosisFlow(event);
    if (isDiagnosisHandled) {
      return; // 診断関連の処理が実行された場合は、ここで終了
    }
    const userMessage = event.message.text;
    const userRow = findRowByUserId(user_id);
    // ユーザーが存在しない場合は処理を中断
    if (!userRow) return;

    const ongoingProcess = contact.getRange(userRow, ContactColumn.OngoingDiagnosis).getValue();
   
   // ★★★ 画像メッセージの処理を最優先に追加 ★★★
    if (event.message.type === 'image') {
      if (ongoingProcess === 'IMAGE_UPLOAD') {
        loading(user_id);
        handleImageUpload(event);
        return;
      }
    }
    if (event.message.type === 'text') {
      const userMessage = event.message.text;

      // ★★★ LIFF連携コマンドを最優先で処理
    if (userMessage.startsWith('/sync ')) {
      const nonce = userMessage.substring(6);
      linkLiffIdToUser(user_id, nonce);
      return;
    }

      // ★★★「プロフィール画像設定」キーワードの処理を追加 ★★★
      if (userMessage === "プロフィール画像設定") {
        loading(user_id);
        startImageUploadProcess(user_id);
        return;
      }
      
      // ★★★ キャンセル処理を汎用化 ★★★
      if (userMessage === "キャンセル") {
        if (ongoingProcess === 'IMAGE_UPLOAD' || ongoingProcess === 'ADMIN_EDIT' || ongoingProcess === 'ADMIN_SEND_MSG') {
          loading(user_id);
           cancelUserEditProcess(user_id); // 既存のキャンセル関数を流用
           return;
        }
      }
    // ▼▼▼▼▼ このifブロックを追記してください ▼▼▼▼▼
    // ★★★ ヒミツの質問への回答を処理
    if (userMessage.startsWith('q1:') || userMessage.startsWith('q2:')) {
      // (ここに次のステップで実装する、回答を記録する関数呼び出しが入ります)
      loading(user_id);
       handleQuestionAnswer(user_id, userMessage); 
      return;
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
   
   // ★★★「回答待ち」状態のユーザーからのメッセージを処理
    if (ongoingProcess === 'AWAITING_ANSWER') {
      handleQuestionAnswer(user_id, userMessage);
      return;
    }

    // MAIN.gs の修正箇所（「message」イベント処理の中）

    // ... (前略: 画像アップロード処理やキャンセル処理の後) ...

    // MAIN.gs の修正箇所（AIチャット返信部分）

    // ★★★ AIチャットモードの判定 ★★★
    if (ongoingProcess === 'AI_CHAT') {
      // 「リセット」などは上で処理済みとして、それ以外の会話をAIに投げる
      if (userMessage !== "AI開始" && userMessage !== "リセット") {
        
        // ローディング表示
        loading(user_id);
        
        // GPT.gs の関数を呼び出して回答生成
        const aiReply = handleAiResponse(user_id, userMessage);
        
        // アシスタント情報を取得
        // userRow は既に定義されている前提（findRowByUserIdの結果）
        const assistantType = contact.getRange(userRow, ContactColumn.Assistant).getValue();
        
        // デフォルト（執事）の設定
        let senderName = "執事 真田";
        let iconUrl = "https://drive.google.com/uc?export=view&id=1I9azPBbwlVXcXAavR0FxdpJX71ZXtqhB";

        // メイドの場合の設定
        if (assistantType === 'maid') {
            senderName = "メイド ココ";
            iconUrl = "https://drive.google.com/uc?export=view&id=1VH2kxM0Szb0Bsa_vh0yWakT-qgQyq_K9";
        }
        
        // 返信（アイコンと名前を指定）
        sendReplyMessage(event.replyToken, [{
          'type': 'text',
          'text': aiReply,
          'sender': {
              'name': senderName,
              'iconUrl': iconUrl
          }
        }]);
        return; // ここで処理終了
      }
    }

    
  // --- 1. まずチャット関連のコマンド/メッセージを最優先で処理 ---
    const chatPartnerId = contact.getRange(userRow, ContactColumn.ChatPartner).getValue();

    // コマンド処理
    if (userMessage.startsWith('/')) {
      if (userMessage === '/list') { loading(user_id);sendChatPartnerList(user_id); return; }
      if (userMessage.startsWith('/talk ')) { loading(user_id);setChatFocus(user_id, userMessage.substring(6)); return; }
      if (userMessage === '/end') { loading(user_id);clearChatFocus(user_id); return; }
    }
    // 集中チャットモード中のメッセージ転送
    else if (chatPartnerId) {
      relayChatMessage(user_id, chatPartnerId, userMessage);
      return;
    }
    // --- 2. チャットでなければ、通常のコマンド処理を実行 ---
 
     // ローディングアニメーションの追加
     loading(event.source.userId);

    // ▼▼▼▼▼【ここから追記】▼▼▼▼▼
    // キュン送信の確認応答を処理
    if (ongoingProcess === 'KYUN_CONFIRM') {
      if (userMessage === "はい、送る") {
        handleConfirmAndSendKyun(user_id);
      } else { // 「やめる」またはその他のテキスト
        cancelKyunProcess(user_id);
      }
      return; // 他の処理を行わずに終了
    }
    // ▲▲▲▲▲【ここまで追記】▲▲▲▲▲
    
  //////////////////////////////
//管理者モード（UserStep.COMPLETEが条件）
//////////////////////////////
  // ▼▼▼特定ユーザーを強制的に管理者に設定 ▼▼▼
    if (user_id === ADMIN_USER_ID) {
   //if (userJob === UserJob.MASTA){

     const messageText = event.message.text;
     /**
    if (messageText === "管理者") {
  var reply_token = event.replyToken;
    let key = "m1";
    let p = get_row(key, col ,replylist);
    replyFMT(p,rowIndex,reply_token) ;
  }
   */
    if (messageText  === "管理者") {
      sendUserSummaryReport(user_id);
      return; // 他の処理を行わずに終了
    }

    if (messageText  === "リスタート") {
      contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.STEP_6);
      contact.getRange(rowIndex, ContactColumn.CareerAdviceDone).setValue('');
      contact.getRange(rowIndex, ContactColumn.Assistant).setValue('');
      contact.getRange(rowIndex, ContactColumn.ChatPartner).setValue('');
       var reply_token = event.replyToken;
       let key = "step-regist";
       let p = get_row(key, col ,replylist);
       replyFMT(p,rowIndex,reply_token);
    }

    if (messageText  === "リスタート0") {
      contact.getRange(rowIndex, ContactColumn.Name).setValue('');
      contact.getRange(rowIndex, ContactColumn.Nickname).setValue('');
      contact.getRange(rowIndex, ContactColumn.Number).setValue('');
      contact.getRange(rowIndex, ContactColumn.Sex).setValue('');
      contact.getRange(rowIndex, ContactColumn.Age).setValue('');
      contact.getRange(rowIndex, ContactColumn.Job).setValue('');
      contact.getRange(rowIndex, ContactColumn.Step).setValue(UserStep.STEP_1);
      contact.getRange(rowIndex, ContactColumn.Status).setValue('');
      
      contact.getRange(rowIndex, ContactColumn.Honest).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Imagin).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Logic).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Possessive).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Battle).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Love).setValue('0');
      contact.getRange(rowIndex, ContactColumn.Free1).setValue('自己紹介文がありません');

      contact.getRange(rowIndex, ContactColumn.OngoingDiagnosis).setValue('');
      contact.getRange(rowIndex, ContactColumn.DiagnosisData).setValue('');
      
      contact.getRange(rowIndex, ContactColumn.CareerAdviceDone).setValue('');
      contact.getRange(rowIndex, ContactColumn.Assistant).setValue('');
      contact.getRange(rowIndex, ContactColumn.ChatPartner).setValue('');

      contact.getRange(rowIndex, ContactColumn.LiffUserId).setValue('');
    
       var reply_token = event.replyToken;
       var messages = [{
      'type': 'text',
      'text': '写真以外情報を削除、友達追加時に戻しました',
       }];
       sendReplyMessage(reply_token, messages);
    }
    if (messageText  === "リスタート画像") {
      contact.getRange(rowIndex, ContactColumn.ProfileImageURL).setValue('');
    
       var reply_token = event.replyToken;
       var messages = [{
      'type': 'text',
      'text': '写真を削除しました',
       }];
       sendReplyMessage(reply_token, messages);
    }
    if (messageText  === "リスタート男") {
      contact.getRange(rowIndex, ContactColumn.Sex).setValue(UserSex.Men);
       var reply_token = event.replyToken;
       var messages = [{
      'type': 'text',
      'text': '性別を男性に変更しました',
       }];
       sendReplyMessage(reply_token, messages);
    }
    if (messageText  === "リスタート女") {
      contact.getRange(rowIndex, ContactColumn.Sex).setValue(UserSex.Women);
       var reply_token = event.replyToken;
       var messages = [{
      'type': 'text',
      'text': '性別を女性に変更しました',
       }];
       sendReplyMessage(reply_token, messages);
    }
    if (messageText  === "キュン補充") {
      grantKyunPoints(user_id, 10, 30);
       var reply_token = event.replyToken;
       var messages = [{
      'type': 'text',
      'text': 'キュンを10追加',
       }];
       sendReplyMessage(reply_token, messages);
    }


// 1. 新しい編集プロセスを開始
      if (messageText === "ユーザー編集") {
        startUserEditProcess(user_id);
        return;
      }
      if (messageText === "メッセージを送る") {
        startSendMessageProcess(user_id);
        return;
      }
      
      // 2. 進行中の編集プロセスがある場合の処理
      if (ongoingProcess === 'ADMIN_EDIT') {
        const editData = JSON.parse(contact.getRange(userRow, ContactColumn.DiagnosisData).getValue() || '{}');
        
        // キャンセル処理
        if (messageText === "キャンセル") {
          cancelUserEditProcess(user_id);
          return;
        }

        // ステップ1：ユーザー検索
        if (editData.step === 'waiting_for_user_identifier') {
          findUserAndShowEditMenu(user_id, messageText);
          return;
        }

        // ステップ2：編集項目の選択
        else if (editData.step === 'waiting_for_property_selection') {
          let propertyToEdit, propertyDisplayName;
          switch (messageText) {
            case "ニックネームを編集":
              propertyToEdit = "Nickname";
              propertyDisplayName = "ニックネーム";
              break;
            case "性別を編集":
              propertyToEdit = "Sex";
              propertyDisplayName = "性別";
              break;
            case "年齢を編集":
              propertyToEdit = "Age";
              propertyDisplayName = "年齢";
              break;
            case "所属を編集":
              propertyToEdit = "Job";
              propertyDisplayName = "所属";
              break;
            case "ステータスを編集":
              propertyToEdit = "Status";
              propertyDisplayName = "ステータス";
              break;
          }
          if (propertyToEdit) {
            promptForNewValue(user_id, propertyToEdit, propertyDisplayName);
          }
          return;
        }
        // ステップ3：新しい値の入力
        else if (editData.step === 'waiting_for_new_value') {
          updateUserProperty(user_id, messageText);
          return;
        }

       }
      // 3. 進行中のメッセージ送信プロセスがある場合の処理
      else if (ongoingProcess === 'ADMIN_SEND_MSG') {
        const sendData = JSON.parse(contact.getRange(userRow, ContactColumn.DiagnosisData).getValue() || '{}');
        
        if (messageText === "キャンセル") {
          cancelUserEditProcess(user_id); // 既存のキャンセル関数を流用
          return;
        }

        // ステップ1：送信対象ユーザーの指定
        if (sendData.step === 'waiting_for_user_identifier') {
          askForMessageContent(user_id, messageText);
          return;
        }

        // ステップ2：メッセージ内容の入力
        else if (sendData.step === 'waiting_for_message_content') {
          sendMessageToUser(user_id, messageText);
          return;
        }
      }
     

  }//(userJob === UserJob.MASTA)ここまで
 
//////////////////////////////
//管理者モード（UserStep.COMPLETEが条件）ここまで
//////////////////////////////

  if (userStep === UserStep.STEP_2){
        const messageText = event.message.text;
        contact.getRange(rowIndex, ContactColumn.Name).setValue(messageText);
        var reply_token = event.replyToken;
        var messages = [{
        'type': 'text',
        'text':"上記氏名の登録でお間違いない場合は、下のSTEP3に進むを押してください。\n間違いの場合、ボタンを押さずに正しい名前を再入力して下さい。",
        'quickReply':{
         'items': [
              {
                "type": "action",
                "action": {
                "type": "postback",
                "label": "STEP3に進む",
                "data": "finish-name",
                "displayText": "STEP3に進む"
                 }
              }
              ]
        }
    }];
    sendReplyMessage(reply_token, messages);
  }
  else if (userStep === UserStep.STEP_3){
        const messageText = event.message.text;
        contact.getRange(rowIndex, ContactColumn.Nickname).setValue(messageText);
        var reply_token = event.replyToken;
        var messages = [{
        'type': 'text',
        'text':"上記ニックネームの登録でお間違いない場合は、下のSTEP4に進むを押してください。\n間違いの場合、ボタンを押さずに正しい名前を再入力して下さい。",
        'quickReply':{
         'items': [
              {
                "type": "action",
                "action": {
                "type": "postback",
                "label": "STEP4に進む",
                "data": "finish-nick",
                "displayText": "STEP4に進む"
                 }
              }
              ]
        }
    }];
    sendReplyMessage(reply_token, messages);
  }
  else if (userStep === UserStep.STEP_4){
        const messageText = event.message.text;
        contact.getRange(rowIndex, ContactColumn.Number).setValue(messageText);
        var reply_token = event.replyToken;
        var messages = [{
        'type': 'text',
        'text':"上記従業員番号の登録でお間違いない場合は、下のSTEP5に進むを押してください。\n間違いの場合、ボタンを押さずに正しい番号を再入力して下さい。",
        'quickReply':{
         'items': [
              {
                "type": "action",
                "action": {
                "type": "postback",
                "label": "STEP5に進む",
                "data": "finish-number",
                "displayText": "STEP5に進む"
                 }
              }
              ]
        }
    }];
    sendReplyMessage(reply_token, messages);
  }
  else if (userStep === UserStep.STEP_5){
        const messageText = event.message.text;
        contact.getRange(rowIndex, ContactColumn.Age).setValue(messageText);
        var reply_token = event.replyToken;
        var messages = [{
        'type': 'text',
        'text':"上記年齢の登録でお間違いない場合は、下のSTEP6に進むを押してください。\n間違いの場合、ボタンを押さずに正しい年齢を再入力して下さい。",
        'quickReply':{
         'items': [
              {
                "type": "action",
                "action": {
                "type": "postback",
                "label": "STEP6に進む",
                "data": "finish-age",
                "displayText": "STEP6に進む"
                 }
              }
              ]
        }
    }];
    sendReplyMessage(reply_token, messages);
  }
  else if (userStep === UserStep.STEP_6){
    var reply_token = event.replyToken;
    let key = "step6";
    let p = get_row(key, col ,replylist);
    replyFMT(p,rowIndex,reply_token) ;
  }

  //UserStep.COMPLETE
  else if (userStep === UserStep.COMPLETE){
    const messageText = event.message.text;
   if (messageText === "開始") {
    var reply_token = event.replyToken;
    let key = "f5";
    let p = get_row(key, col ,replylist);
    replyFMT(p,rowIndex,reply_token) ;
  }

   else if (messageText === "カード") {
         var reply_token = event.replyToken;
         var messages = [{
        'type': 'text',
        'text':"ご希望を選択してください",
        'quickReply':{
         'items': [
              {
                "type": "action",
                "action": {
                "type": "postback",
                "label": "プロフィール",
                "data": "profile",
                "displayText": "プロフィール"
                 }
              },
             {
                "type": "action",
                "action": {
                "type": "postback",
                "label": "登録個人情報",
                "data": "regist-info",
                "displayText": "登録個人情報"
                 }
              },
              {
                "type": "action",
                "action": {
                "type": "postback",
                "label": "残キュン確認",
                "data": "kyun-point",
                "displayText": "残キュン確認"
                 }
              }
              ]
        }
    }];
    sendReplyMessage(reply_token, messages);;
  }

   else if (messageText === "カード例") {
    var reply_token = event.replyToken;
    let key = "f7-demo";
    let p = get_row(key, col ,replylist);
    replyFMT(p,rowIndex,reply_token) ;
  }
   else if (messageText === "ガイド") {
         var reply_token = event.replyToken;
         var messages = [{
        'type': 'text',
        'text':"ご希望を選択してください",
        'quickReply':{
         'items': [
              {
                "type": "action",
                "action": {
                "type": "message",
                "label": "マダココとは？",
                'text': 'マダココとは？'
                 }
              },
              {
                "type": "action",
                "action": {
                "type": "message",
                "label": "マダココ使い方",
                'text': 'マダココ使い方'
                 }
              },
              ]
        }
    }];
    sendReplyMessage(reply_token, messages);;
  }
   else if (messageText === "マダココとは？") {
    var reply_token = event.replyToken;
    let key = "f1";
    let p = get_row(key, col ,replylist);
    replyFMT(p,rowIndex,reply_token) ;
  }
   else if (messageText === "マダココ使い方") {
    var reply_token = event.replyToken;
    let key = "f8";
    let p = get_row(key, col ,replylist);
    replyFMT(p,rowIndex,reply_token) ;
  }
   else if (messageText === "診断") {
    var reply_token = event.replyToken;
    let key = "f5";
    let p = get_row(key, col ,replylist);
    replyFMT(p,rowIndex,reply_token) ;
  }
   else if (messageText === "キュンポイント") {
      sendKyunPointStatusMessage(user_id);
      return; // ポイント表示処理はここで終了
    }

     // ★★★「恋愛キャリア診断」が入力された場合の処理
   else if (messageText === "恋愛キャリア診断") {
      handleLoveCareerAdvice(user_id);
      return; // AIアドバイス処理はここで終了
    }
   else if (messageText === "マッチ") {
      handleAiMatching(user_id);
      return;
    }
  
   // MAIN.gs の修正箇所（「AI開始」コマンド部分）

    else if (messageText === "AI開始") {
          // 個人のステータスを変更
          contact.getRange(rowIndex, ContactColumn.OngoingDiagnosis).setValue('AI_CHAT');
          
          // 担当アシスタント情報を取得
          const assistantType = contact.getRange(rowIndex, ContactColumn.Assistant).getValue();
          
          // デフォルト（執事）の設定
          let senderName = "執事 真田";
          let iconUrl = "https://drive.google.com/uc?export=view&id=1I9azPBbwlVXcXAavR0FxdpJX71ZXtqhB"; 

          // メイドの場合の設定
          if (assistantType === 'maid') {
            senderName = "メイド ココ";
            iconUrl = "https://drive.google.com/uc?export=view&id=1VH2kxM0Szb0Bsa_vh0yWakT-qgQyq_K9";
          }
          
          var reply_token = event.replyToken;
          var messages = [{
            'type': 'text',
            'text': `${senderName}がお話し相手になります。\n終了するときは「リセット」と入力してくださいね。`,
            // ★★★ ここでアイコンと名前を指定 ★★★
            'sender': {
                'name': senderName,
                'iconUrl': iconUrl
            }
          }];
          sendReplyMessage(reply_token, messages);
    }
    else if (messageText === "リセット") {
          // ★★★ 修正: 個人のステータスをクリア ★★★
          contact.getRange(rowIndex, ContactColumn.OngoingDiagnosis).setValue('');
          
          var reply_token = event.replyToken;
          var messages = [{
            'type': 'text',
            'text':"通常モードに戻りました。",
          }];
          sendReplyMessage(reply_token, messages);
    }
  
  // チャット内容をドキュメントに保存
        // 「#保存」で保存
   else if (messageText === "#保存") {
          const data = chatRange.getValues();

          // 新しいGoogleドキュメントを作成
          const doc = DocumentApp.create('過去ログ');
          const body = doc.getBody();

          // ドキュメントにチャットを保存
          for (let i = 0; i < data.length; i++) {
            if(i >0) {
              body.appendParagraph('\n');  
            }
            const rowText = data[i].join('\t'); // タブ区切りで結合
            body.appendParagraph(rowText);
          }

          // Gemini でファイル名を生成（→ 最安のモデルを使用する）
          const fileName = getGeminiReply([{'role': 'user', 'parts': {'text': `以下の内容に20文字以内でタイトルをつけてください\n\n${data}`}}]);

          // ドキュメントに名前を付けてフォルダを移動
          const docId = doc.getId();
          const folder = DriveApp.getFolderById('1MDd-OZaa9ctbb43IYT9bqz8fV7gPq2ku'); // フォルダ ID を書き換え
          const file = DriveApp.getFileById(docId);
          file.setName(`${aiRange.getValue()}_${fileName}`) // AI名_タイトル
          file.moveTo(folder);

          sendAIMessage(event.replyToken, 'チャット内容をドキュメントに保存しました');
          return;
        }
   else if (messageText.startsWith('')){
          switch(aiRange.getValue()){
            case 'GPT':
              prompt = gptRequestText(messageText);
              replyMessage = getGptReply(prompt); // GPT で回答
              setAiMessage('assistant', replyMessage); // AI の返答をスプレッドシートに'role': 'assistant'で格納
              break;
            case 'Gemini':
              prompt = geminiRequestText(messageText);
              replyMessage = getGeminiReply(prompt); // Gemini で回答
              setAiMessage('model', replyMessage); // AI の返答をスプレッドシートに'role': 'model'で格納
              break;
            case 'Claude':
              prompt = claudeRequestText(messageText);
              replyMessage = getClaudeReply(prompt); // Claude で回答
              setAiMessage('assistant', replyMessage); // AI の返答をスプレッドシートに'role': 'assistant'で格納
              break;
            case '通常':
              //prompt = claudeRequestText(messageText);
              replyMessage = 'システム対象外のメッセージは応答できません'
              break;
            default:
              return;
          }
          sendAIMessage(event.replyToken, replyMessage);
        }


  }//UserStep.COMPLETEここまで
  
  else {
        const messageText = event.message.text;
    if (messageText != "") {
    var reply_token = event.replyToken;
    var messages = [{
      'type': 'text',
      'text': 'まだ初回登録がお済みでないようです。システム対象外のメッセージは応答できません',
    }];
    sendReplyMessage(reply_token, messages);
    }
  }
 
 }//textここまで
 }//messageここまで
 }
}//doPost関数ここまで



/**
 * LIFFアプリから呼び出されるための関数 (マイページに必要な全情報を返すように強化)
 * @param {string} liffUserId - LIFFから渡されたユーザーID
 * @returns {object} - ユーザーのプロフィール情報、またはエラー情報
 */
// (1020行目付近)
function getMyProfileData(liffUserId) {
  try {
    let userRow = -1;
    
    // ★★★ 修正 ★★★
    // A列(LINE ID)の検索(findRowByUserId)はバグの原因となるため削除。
    // LIFFから受け取った liffUserId を使い、AC列(LIFF ID)のみを検索するロジックに変更。
    // [削除] userRow = findRowByUserId(liffUserId);
    // [削除] if (userRow === -1) { 

    const lastRow = contact.getLastRow();
    
    // 1行目はヘッダーと仮定し、2行目から検索
    if (lastRow > 1) { // データが1行もない場合のエラーを防ぐ
      // AC列 (29列目) を検索
      const liffIdColumnRange = contact.getRange(2, 29, lastRow - 1, 1); 
      const allLiffIds = liffIdColumnRange.getValues().flat();
      const rowIndexInArray = allLiffIds.indexOf(liffUserId);
      
      if (rowIndexInArray !== -1) {
        // 配列のインデックスは0から始まるので、行番号に変換 (2行目から取得したので +2)
        userRow = rowIndexInArray + 2;
      }
    }
    // [削除] } // 削除した if (userRow === -1) に対応する } を削除

    // Step 3: (AC列で)見つからなかった場合、エラーを投げる
    if (userRow === -1) {
      throw new Error("MADCアカウントと連携されていません。");
    }
    
    // Step 4: 見つかった行(userRow)のデータを取得
    const userData = contact.getRange(userRow, 1, 1, contact.getLastColumn()).getValues()[0];
    const userId = userData[ContactColumn.UserId - 1]; // A列のIDを取得
    
    // --- 画像URLの決定ロジック ---
    let finalImageUrl = userData[ContactColumn.ProfileImageURL - 1];
    if (!finalImageUrl) {
      const userSex = userData[ContactColumn.Sex - 1];
      finalImageUrl = DEFAULT_IMAGES[userSex] || DEFAULT_IMAGES['unknown'];
    }

    // 診断の進捗
    const diagnosisColumns = [
      ContactColumn.Honest, ContactColumn.Imagin, ContactColumn.Logic, 
      ContactColumn.Possessive, ContactColumn.Battle, ContactColumn.Love
    ];
    let completedDiagnoses = 0;
    diagnosisColumns.forEach(col => { if (userData[col - 1] > 0) { completedDiagnoses++; } });

    return {
      success: true,
      nickname: userData[ContactColumn.Nickname - 1],
      profileImageUrl: finalImageUrl,
      totalKyun: getTotalKyunPoints(userId), // A列のIDを使ってキュンを取得
      diagnosisProgress: completedDiagnoses,
      age: userData[ContactColumn.Age - 1],// ★★★ この行を追記 ★★★
      job: userData[ContactColumn.Job - 1],// ★★★ この行を追記 ★★★
      // ▼▼▼ ステップ情報を追加 ▼▼▼
      step: userData[ContactColumn.Step - 1],

      honest: userData[ContactColumn.Honest - 1],
      imagin: userData[ContactColumn.Imagin - 1],
      logic: userData[ContactColumn.Logic - 1],
      possessive: userData[ContactColumn.Possessive - 1],
      battle: userData[ContactColumn.Battle - 1],
      love: userData[ContactColumn.Love - 1],
    };

  } catch (e) {
    return { success: false, message: e.message };
  }
}//getMyProfileDataここまで

// ▼▼▼▼▼ 以下の2つの関数を追記してください ▼▼▼▼▼

/**
 * [LIFF連携用] LIFFのユーザーIDとnonceを一時的にキャッシュに保存する関数
 * @param {string} liffUserId - LIFFから渡されたユーザーID
 * @param {string} nonce - LIFFが生成したランダムな文字列
 */
function storeLiffIdWithNonce(liffUserId, nonce) {
  try {
    CacheService.getScriptCache().put(nonce, liffUserId, 300);
    return { success: true }; // 成功したことを返す
  } catch (e) {
    return { success: false, message: e.message }; // 失敗したことを返す
  }
}


/**
 * [LIFF連携用] Botが受け取ったnonceを元に、LIFFユーザーIDをスプレッドシートに紐付ける関数
 * @param {string} botUserId - Botが認識しているユーザーID
 * @param {string} nonce - Botが受け取ったランダムな文字列
 */
function linkLiffIdToUser(botUserId, nonce) {
  const liffUserId = CacheService.getScriptCache().get(nonce);
  
  if (liffUserId) {
    const userRow = findRowByUserId(botUserId);
    if (userRow) {
      // AC列「LIFFユーザーID」にLIFFのIDを書き込む
      contact.getRange(userRow, 29).setValue(liffUserId); // AC列 = 29列目
      
      pushMessage(botUserId, [{ "type": "text", "text": "アカウント連携が完了しました！\n再度LIFFアプリを開いてください。" }]);
      CacheService.getScriptCache().remove(nonce); // 使用済みのnonceを削除
    }
  }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

/**
 * UserIdを検索（後方から）
 */
function findRowByUserId(userId) {
    const userIdListRange = contact.getRange(1, 1, contact.getLastRow()).getValues();
    // 2次元配列を1次元配列に変換
    const arrData = Array.prototype.concat.apply([], userIdListRange);
    // 1次元配列に変換した ID_data(A列)の中に、userIdが含まれているかチェック
    const index = arrData.lastIndexOf(userId);
    // +1 = 行番号を同じにしている(-1であれば該当なし)
    return index === -1 ? index : index + 1;
}


// 診断で使っている postbackデータ解析関数をMAIN.gsでも使えるように定義
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

function sendReplyMessage(reply_token, messages) {
  const urlre = 'https://api.line.me/v2/bot/message/reply';
  const res = UrlFetchApp.fetch(urlre, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      'messages': messages
    }),
  });
  return res;
}


// profileを取得してくる関数
function getUserProfile(user_id) {
  const url = 'https://api.line.me/v2/bot/profile/' + user_id;
  const userProfile = UrlFetchApp.fetch(url, {
    'headers': {
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
  })
  return JSON.parse(userProfile).displayName;
}

// ローディング機能
function loading(userId) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/chat/loading/start', {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'chatId': userId,
      'loadingSeconds': 20
    }),
  });
}

// AI の返答をスプレッドシートに格納する関数
function setAiMessage(role, replyMessage) {
  chatLastRow = chatSheet.getLastRow();
  chatSheet.getRange(chatLastRow + 1, 1, 1, 2).setValues([[role, replyMessage]]);
}

// AIメッセージを送信する関数
function sendAIMessage(replyToken, replyMessage) {
  const linePayload = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': [{
        'type': 'text',
        'text': replyMessage,
      }],
    }),
  };
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', linePayload);
}
/**
 * LIFFアプリからのリクエストを処理するAPIの入口
 * @param {object} e - GASが受け取るイベントオブジェクト
 */
function doGet(e) {
  const htmlOutput = HtmlService.createTemplateFromFile('index').evaluate();
  // LINE LIFFのiframe内で表示されることを許可するための必須設定
  htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return htmlOutput;
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ... (既存のgetMyProfileDataなどの関数はそのまま) ...

// ▼▼▼▼▼ 以下の関数を追記してください ▼▼▼▼▼
/**
 * [LIFF用] ユーザー一覧取得（リアルユーザー + AIボット混合版）
 * ルール: 合計10人を表示
 * - リアルユーザー >= 8人 : リアル8人 + AI 2人
 * - リアルユーザー < 8人  : 全リアル + 足りない分をAIで埋める
 */
function getUsersForLiff(liffUserId) {
  try {
    // 1. 自分の情報を特定
    const allLiffIds = contact.getRange(2, 29, contact.getLastRow() - 1, 1).getValues().flat();
    const rowIndexInArray = allLiffIds.indexOf(liffUserId);
    if (rowIndexInArray === -1) { throw new Error("MADCアカウントと連携されていません。"); }
    const myRow = rowIndexInArray + 2;
    const mySex = contact.getRange(myRow, ContactColumn.Sex).getValue();

    // 2. 異性のリアルユーザーを取得
    const allUsersData = contact.getRange(3, 1, contact.getLastRow() - 1, contact.getLastColumn()).getValues();
    
    // 自分以外の異性ユーザーを抽出
    let realUsers = allUsersData.filter(user => {
      // IDがあり、性別があり、自分と性別が異なり、LIFF連携済み(AC列)であること
      // ※必要に応じて「ブロックされていない」などの条件も追加
      return user[ContactColumn.UserId - 1] && 
             user[ContactColumn.Sex - 1] && 
             user[ContactColumn.Sex - 1] !== mySex &&
             user[28]; // LiffUserIdがあるか
    }).map(user => {
      // リアルユーザーのデータ整形
      let finalImageUrl = user[ContactColumn.ProfileImageURL - 1];
      if (!finalImageUrl) {
        const userSex = user[ContactColumn.Sex - 1];
        finalImageUrl = DEFAULT_IMAGES[userSex] || DEFAULT_IMAGES['unknown'];
      }
      return {
        type: 'real',
        liffUserId: user[28],
        userId: user[ContactColumn.UserId - 1], // LINE User ID (bot動作用)
        nickname: user[ContactColumn.Nickname - 1],
        age: user[ContactColumn.Age - 1],
        job: user[ContactColumn.Job - 1],
        profileImageUrl: finalImageUrl
      };
    });

    // 3. 表示するリアルユーザーの選定 (ランダム)
    realUsers = shuffleArray(realUsers); // ランダムシャッフル
    
    let displayRealUsers = [];
    let botCount = 0;

    if (realUsers.length >= 8) {
      // リアルが8人以上なら、リアル8人 + AI 2人
      displayRealUsers = realUsers.slice(0, 8);
      botCount = 2;
    } else {
      // リアルが8人未満なら、全員表示 + 残りをAIで埋めて合計10人にする
      displayRealUsers = realUsers;
      botCount = 10 - realUsers.length;
    }

    // 4. AIボットの生成
    const aiBots = generateAiBots(botCount, mySex);

    // 5. リアルとAIを結合して再度シャッフル（自然に見せるため）
    const finalUsersList = shuffleArray([...displayRealUsers, ...aiBots]);

    return { success: true, users: finalUsersList };

  } catch (e) {
    return { success: false, message: e.message };
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
 * AIボットデータを生成する関数
 * @param {number} count - 生成する人数
 * @param {string} targetSex - ユーザーの性別（これと反対の性のボットを作る）
 */
function generateAiBots(count, targetSex) {
  const bots = [];
  const botSex = (targetSex === '男' || targetSex === 'Men') ? '女' : '男';
  
  // ボット用の名前候補
  const names_F = ['アイ', 'ミライ', 'ユメ', 'リン', 'サクラ', 'AI-Chan', 'エマ'];
  const names_M = ['アトム', 'カイト', 'レン', 'タクミ', 'ハルト', 'AI-Kun', 'レオ'];
  
  // ボット用の画像 (Unsplash等のフリー素材URLや、特定のAI画像URL)
  const images_F = [
    'img/AIuser/AI-woman1.png',
    'img/AIuser/AI-woman2.png',
    'img/AIuser/AI-woman3.png'
  ];
  const images_M = [
    'img/AIuser/AI-man1.png',
    'img/AIuser/AI-man2.png',
    'img/AIuser/AI-man3.png'
  ];

  const jobs = ['HR/人材', '住まい', '結婚', '車', '教育/進路', '旅行・レジャー','飲食','ビューティー','その他',];

  const nameList = (botSex === '女') ? names_F : names_M;
  const imgList = (botSex === '女') ? images_F : images_M;

  for (let i = 0; i < count; i++) {
    // ランダムに属性を選択
    const name = nameList[Math.floor(Math.random() * nameList.length)];
    const age = Math.floor(Math.random() * (35 - 22) + 20); // 22~35歳
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const img = imgList[Math.floor(Math.random() * imgList.length)];

    bots.push({
      type: 'bot', // ★重要: フロントエンドで区別するためのフラグ
      liffUserId: `BOT_${botSex}_${i}_${new Date().getTime()}`, // ユニークなダミーID
      userId: `LINE_BOT_${i}`, // ダミーLINE ID
      nickname: `${name} (AI)`, // わかりやすく(AI)をつけるかはお好みで
      age: age,
      job: job,
      profileImageUrl: img,
      // 診断データも適当に入れる
      honest: Math.floor(Math.random() * 100),
      imagin: Math.floor(Math.random() * 100),
      logic: Math.floor(Math.random() * 100),
      possessive: Math.floor(Math.random() * 100),
      battle: Math.floor(Math.random() * 100),
      love: Math.floor(Math.random() * 100)
    });
  }
  return bots;
}


/**
 * LIFFアプリに関する設定情報を管理します。
 */

const DEFAULT_IMAGES = {
  '男': 'https://drive.google.com/thumbnail?id=12DqJms_8Fr8BTYzCaGlFFW82Nmf3B4Q0',
  '女': 'https://drive.google.com/thumbnail?id=1_4VVriM9WPIj6j8nKyQhE9HJ6hl_QsX8',
  'unknown': 'https://placehold.jp/150x150.png?text=?' // 性別不明またはその他用
};


  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
 //ここからLIFFの初回登録の関連のやつ〜
  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
  

// ▼▼▼▼▼ 以下の関数を末尾に追記してください ▼▼▼▼▼
/**
 * [LIFF用] STEP1：性別を登録し、ステップを進める関数
 */
function registerUserGender(liffUserId, gender) {
  try {
    const allLiffIdsRaw = contact.getRange(2, 29, contact.getLastRow() - 1, 1).getValues().flat();
    const allLiffIds = allLiffIdsRaw.map(id => String(id).trim());
    const rowIndexInArray = allLiffIds.indexOf(liffUserId.trim());

    if (rowIndexInArray === -1) throw new Error("ユーザーが見つかりません。");
    
    const userRow = rowIndexInArray + 2;
    
    // 性別を設定
    const sexValue = (gender === 'Men') ? UserSex.Men : UserSex.Women;
    contact.getRange(userRow, ContactColumn.Sex).setValue(sexValue);
    
    // ステップをSTEP_2に進める
    contact.getRange(userRow, ContactColumn.Step).setValue(UserStep.STEP_2);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼▼▼ 以下の関数を末尾に追記してください ▼▼▼▼▼
/**
 * [LIFF用] STEP2：本名を登録し、ステップを進める関数
 */
function registerUserName(liffUserId, name) {
  try {
    const allLiffIdsRaw = contact.getRange(2, 29, contact.getLastRow() - 1, 1).getValues().flat();
    const allLiffIds = allLiffIdsRaw.map(id => String(id).trim());
    const rowIndexInArray = allLiffIds.indexOf(liffUserId.trim());

    if (rowIndexInArray === -1) throw new Error("ユーザーが見つかりません。");
    
    const userRow = rowIndexInArray + 2;
    
    // 本名を設定
    contact.getRange(userRow, ContactColumn.Name).setValue(name);
    
    // ステップをSTEP_3に進める ("S-3")
    contact.getRange(userRow, ContactColumn.Step).setValue(UserStep.STEP_3);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

/**
 * [LIFF用] STEP3：ニックネームを登録し、Step 4へ進める関数  
 */
function registerUserNickname(liffUserId, nickname) {
  try {
    const allLiffIdsRaw = contact.getRange(2, 29, contact.getLastRow() - 1, 1).getValues().flat();
    const allLiffIds = allLiffIdsRaw.map(id => String(id).trim());
    const rowIndexInArray = allLiffIds.indexOf(liffUserId.trim());

    if (rowIndexInArray === -1) throw new Error("ユーザーが見つかりません。");
    
    const userRow = rowIndexInArray + 2;
    
    // ニックネームを設定
    // ※ContactColumn.Nickname が定義されている前提です
    contact.getRange(userRow, ContactColumn.Nickname).setValue(nickname);
    
    // ステップをSTEP_3に進める ("S-4")
    contact.getRange(userRow, ContactColumn.Step).setValue(UserStep.STEP_4);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
/**
 * [LIFF用] STEP4：従業員番号を登録し、Step 5へ進める関数
 */
function registerUserEmployeeId(liffUserId, employeeId) {
  try {
    // 行番号の特定 (修正済みのロジック)
    const allLiffIdsRaw = contact.getRange(2, 29, contact.getLastRow() - 1, 1).getValues().flat();
    const allLiffIds = allLiffIdsRaw.map(id => String(id).trim());
    const rowIndexInArray = allLiffIds.indexOf(liffUserId.trim());

    if (rowIndexInArray === -1) throw new Error("ユーザーが見つかりません。");
    
    const userRow = rowIndexInArray + 2;
    
    // 従業員番号を設定
    // ※ ContactColumn.EmployeeId が未定義の場合は、該当する列番号(数値)を入れてください
    contact.getRange(userRow, ContactColumn.Number).setValue(employeeId);
    
    // ステップをSTEP_5に進める ("S-5")
    // ※ UserStep.STEP_5 が未定義の場合は "S-5" と直接書いてください
    contact.getRange(userRow, ContactColumn.Step).setValue(UserStep.STEP_5);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
/**
 * [LIFF用] STEP5：年齢を登録し、Step 6へ進める関数
 */
function registerUserAge(liffUserId, age) {
  try {
    // 行番号の特定
    const allLiffIdsRaw = contact.getRange(2, 29, contact.getLastRow() - 1, 1).getValues().flat();
    const allLiffIds = allLiffIdsRaw.map(id => String(id).trim());
    const rowIndexInArray = allLiffIds.indexOf(liffUserId.trim());

    if (rowIndexInArray === -1) throw new Error("ユーザーが見つかりません。");
    
    const userRow = rowIndexInArray + 2;
    
    // 年齢を設定
    // ※ ContactColumn.Age が未定義の場合は、該当する列番号を入れてください
    contact.getRange(userRow, ContactColumn.Age).setValue(age);
    
    // ステップをSTEP_6に進める ("S-6")
    contact.getRange(userRow, ContactColumn.Step).setValue(UserStep.STEP_6);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
/**
 * [LIFF用] STEP6：所属領域を登録し、登録完了(complete)にする関数
 */
function registerUserDepartment(liffUserId, department) {
  try {
    // 行番号の特定
    const allLiffIdsRaw = contact.getRange(2, 29, contact.getLastRow() - 1, 1).getValues().flat();
    const allLiffIds = allLiffIdsRaw.map(id => String(id).trim());
    const rowIndexInArray = allLiffIds.indexOf(liffUserId.trim());

    if (rowIndexInArray === -1) throw new Error("ユーザーが見つかりません。");
    
    const userRow = rowIndexInArray + 2;
    
    // 所属領域を設定
    contact.getRange(userRow, ContactColumn.Job).setValue(department);
    
    // ★ここで全ての登録が完了したので "complete" に設定
    contact.getRange(userRow, ContactColumn.Step).setValue(UserStep.COMPLETE);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * [LIFF用] アシスタントを登録し、挨拶メッセージを送信する関数
 * ※ assistant.gs の設定値を使用します
 */
/**
 * [LIFF用] アシスタントを登録し、挨拶と写真登録の案内を送信する関数
 */
function registerUserAssistant(liffUserId, assistantType) {
  try {
    // 1. ユーザー行の特定
    const allLiffIdsRaw = contact.getRange(2, 29, contact.getLastRow() - 1, 1).getValues().flat();
    const allLiffIds = allLiffIdsRaw.map(id => String(id).trim());
    const rowIndexInArray = allLiffIds.indexOf(liffUserId.trim());

    if (rowIndexInArray === -1) throw new Error("ユーザーが見つかりません。");
    const userRow = rowIndexInArray + 2;

    // 2. アシスタントをシートに保存
    contact.getRange(userRow, ContactColumn.Assistant).setValue(assistantType);

    // 3. 挨拶メッセージ & 写真登録案内の生成
    const userSex = contact.getRange(userRow, ContactColumn.Sex).getValue();
    // 性別判定（保存されている値に合わせて調整してください）
    const title = (String(userSex).match(/女|women|Women/)) ? 'お嬢様' : '旦那様'; 

    let greetingText = "";
    let senderName = "";
    let iconUrl = "";

    if (assistantType === 'butler') {
      senderName = '真田くん';
      iconUrl = 'https://drive.google.com/uc?export=view&id=1I9azPBbwlVXcXAavR0FxdpJX71ZXtqhB';
      // 執事のセリフ（写真誘導版）
      greetingText = `改めまして、本日から${title}のサポートをさせていただきます、執事の真田（まだ）でございます。\n\nまずは、${title}のプロフィールを作成するため、お写真の登録をお願いしたく存じます。\n\nこのLINEのトーク画面にて、${title}の素敵な「お写真」を1枚送信していただけますでしょうか？\n私が責任を持って登録させていただきます。`;
    } else { // maid
      senderName = 'ココちゃん';
      iconUrl = 'https://drive.google.com/uc?export=view&id=1VH2kxM0Szb0Bsa_vh0yWakT-qgQyq_K9';
      // メイドのセリフ（写真誘導版）
      greetingText = `はい、${title}！\n本日からお仕えさせていただきます、メイドのココです！ よろしくお願いしますっ！\n\nまずはプロフィールを作るために、${title}のお写真を登録したいな！\n\nこのトーク画面で、とっておきの「写真」を送ってくれる？\n私がバッチリ登録しておくね！待ってるよ〜！`;
    }

    // 4. LINE Messaging API でプッシュ通知送信
    const messagePayload = [{
      "type": "text",
      "text": greetingText,
      "sender": {
        "name": senderName,
        "iconUrl": iconUrl
      }
    }];
    
    // LINE User ID に対して送信
    // ※もし liffUserId と LINEのuserId が異なる運用をしている場合は、
    // シートから ContactColumn.LineId を取得して送信先に指定してください。
    pushMessage(liffUserId, messagePayload);
    
    // ★もし profileImage.gs 側で「写真登録待ち状態」にする処理が必要な場合は、
    // ここでその関数を呼び出してください。
    // 例: setPhotoWaitStatus(liffUserId);
    startImageUploadProcess(liffUserId);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ▼▼▼ ヘルパー関数: LIFF ID (AC列) から LINE User ID (A列) を取得 (修正版) ▼▼▼
// ▼▼▼ キュンをLIFF上で送るときに追加したもの　他の関数で代用可能かも？▼▼▼
function getLineIdFromLiffId(liffId) {
  try {
    // データ範囲を特定（ヘッダー行を除くデータ部分のみ取得）
    const lastRow = contact.getLastRow();
    if (lastRow < 2) return null; // データがない場合

    // A列(LINE ID) と AC列(LIFF ID) を取得
    // A列 = 1列目, AC列 = 29列目
    const lineIdValues = contact.getRange(2, 1, lastRow - 1, 1).getValues(); 
    const liffIdValues = contact.getRange(2, 29, lastRow - 1, 1).getValues();

    const targetLiffIdString = String(liffId).trim();

    for (let i = 0; i < liffIdValues.length; i++) {
      const currentLiffId = String(liffIdValues[i][0]).trim();
      
      // 一致する行を探す
      if (currentLiffId === targetLiffIdString) {
        return lineIdValues[i][0]; // 対応するA列のLINE IDを返す
      }
    }
    
    // 見つからなかった場合ログ出力（デバッグ用）
    console.log("LINE ID not found for LIFF ID: " + liffId);
    return null;

  } catch (e) {
    console.error("Error in getLineIdFromLiffId: " + e.message);
    return null;
  }
}
