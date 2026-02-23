const mlist = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('プッシュMSG集');
 const MlistColumn = { Num: 1, Content: 2, Text: 3, Flex: 4, AltText: 5, Json: 6, Null: 7, Theme: 8, Detail: 9, Datetime: 10, Item: 11, Place: 12, Free1: 13, Free2: 14, Point: 15 };
 //const col = "A";//リマインドと共通
 const last_row_mlist = Math.max.apply(null, mlist.getRange("A:A").getValues().map((row, idx) => row[0] !== '' ? idx + 1 : 0));//A列の最終行取得
//const last_row_mlist = mlist.getLastRow();

//var url_richmenu = 'https://api.line.me/v2/bot/richmenu';
var url_user = 'https://api.line.me/v2/bot/user';

/*** リッチメニューの設定関数* **/
function setRichmenu(to,richmenuId) {
  let url = url_user + '/' + to + '/richmenu/' + richmenuId;
  let headers = {
    'Authorization': 'Bearer ' + ACCESS_TOKEN,
  };
  let options = {
    'method': 'post',
    'headers': headers,
  };
  let json = UrlFetchApp.fetch(url, options);
  json = JSON.parse(json);
  return json;
}

const Y00_RICHMENU = PropertiesService.getScriptProperties().getProperty('Y00_RICHMENU')
const Y01_dc_RICHMENU = PropertiesService.getScriptProperties().getProperty('Y01_dc_RICHMENU')
const Y01_dh_RICHMENU = PropertiesService.getScriptProperties().getProperty('Y01_dh_RICHMENU')
const Y01_dr_RICHMENU = PropertiesService.getScriptProperties().getProperty('Y01_dr_RICHMENU')
const Y02_RICHMENU = PropertiesService.getScriptProperties().getProperty('Y02_RICHMENU')
const Y03_RICHMENU = PropertiesService.getScriptProperties().getProperty('Y03_RICHMENU')
const Y04_RICHMENU = PropertiesService.getScriptProperties().getProperty('Y04_RICHMENU')
const Y05_RICHMENU = PropertiesService.getScriptProperties().getProperty('Y05_RICHMENU')
const Y06_RICHMENU = PropertiesService.getScriptProperties().getProperty('Y06_RICHMENU')

/**リッチメニューの設定関数ここまで * **/

function get_row(key, col ,mlist){
 let array = get_array(mlist,col);
 let row0 = array.indexOf(key) + 1;
 return row0;
}

function get_array(mlist,col) {
  let range = mlist.getRange(col + "1:" + col + last_row_mlist)
  let values = range.getValues();
  let array = [];
  for(var i = 0; i < values.length; i++){
    array.push(values[i][0]);
  }
  return array;
}

//ループ処理送信する関数
function pushMsg() {

for (let i = last_row; i >= 2; i--) {
if (contact.getRange(i, 1).getValue() != '') {
  
 const push_column = contact.getRange(i, ContactColumn.Push).getValue();//ステータス（対応中、案内送信済み、等）

 if (push_column == '送信予定'){//「案内送信」
    let lineid = contact.getRange(i, 1).getValues()
    const to = JSON.parse(JSON.stringify(...lineid[0]))
    console.log(to);
    const rowIndex = findRowByUserId(to);
    
    const userJob = contact.getRange(rowIndex, ContactColumn.Job).getValue();// ユーザーのジョブを取得
    //const userStage = contact.getRange(rowIndex, ContactColumn.Stage).getValue();// ユーザーのステージを取得
    const userMsg = contact.getRange(rowIndex, ContactColumn.Msg).getValue();// ユーザーの送信内容を取得（フリー等）

//全体
  //フリー1
  if(userMsg === UserMsg.Free1){ //「フリー1」
   let key = "pf1";//「プッシュMSG集」の、フリー1に該当する識別番号
   let p = get_row(key, col ,mlist);
   pushFMT(p,rowIndex,to) 
   }
  //フリー2
  else if(userMsg === UserMsg.Free2){ //「フリー2」
   let key = "pf2";//「プッシュMSG集」の、フリー2に該当する識別番号
   let p = get_row(key, col ,mlist);
   pushFMT(p,rowIndex,to) 
   }
  //
  else if(userMsg === UserMsg.Tour){ //
   let key = "p0r1";
   let p = get_row(key, col ,mlist);
   pushFMT(p,rowIndex,to) 
   }
  else if(userMsg === UserMsg.Tour2){ //「見学確定」
   let key = "p0r2";
   let p = get_row(key, col ,mlist);
   pushFMT(p,rowIndex,to) 
   }
//全体ここまで

}//全「案内送信」ここまで
 }
 }
}//function pushMsgここまで


function pushFMT(p,rowIndex,to) {

  const url = "https://api.line.me/v2/bot/message/push";
  const headers = {
    "Content-Type" : "application/json; charset=UTF-8",
    'Authorization': 'Bearer ' + ACCESS_TOKEN,
  };
  
   let textFMT = mlist.getRange(p, MlistColumn.Text).getValue();//「プッシュMSG集」テキストのセルの位置
   let s_name = contact.getRange(rowIndex, ContactColumn.Name).getValue();
   let text = Object.entries({s_name}).reduce((s, e) => s.replaceAll(...e), textFMT)

   let alttext = mlist.getRange(p, MlistColumn.AltText).getValue();//「プッシュMSG集」altTextのセルの位置

   let flexFMT = mlist.getRange(p, MlistColumn.Json).getValue();//「プッシュMSG集」フレックスメッセージのセルの位置
   let theme = mlist.getRange(p, MlistColumn.Theme).getValue();
   let detail = '"' + mlist.getRange(p, MlistColumn.Detail).getValue() + '"';
   let item = '"' + mlist.getRange(p, MlistColumn.Item).getValue() + '"';
   let place = '"' + mlist.getRange(p, MlistColumn.Place).getValue() + '"';
   let free1 = '"' + mlist.getRange(p, MlistColumn.Free1).getValue() + '"';
   let free2 = '"' + mlist.getRange(p, MlistColumn.Free2).getValue() + '"';
   let point =  mlist.getRange(p, MlistColumn.Point).getValue();
   let flex = Object.entries({s_name, theme, detail, item, place, free1, free2, point}).reduce((s, e) => s.replace(...e), flexFMT)
   flex = flex.replace(/[\u0000-\u0019]+/g, "");

  //toにメッセージを送信するユーザーIDを指定
  //フレックスメッセージに変数が入る場合（プッシュMSG集のtheme列に文字が入っている場合）　
  if (mlist.getRange(p, MlistColumn.Theme).getValue() != '') {
   if (mlist.getRange(p, MlistColumn.Text).getValue() != '') {//テキスト・フレックスのセルに入っている場合
   let postData = {
    "to" : to,
    "messages" : [
      {
        'type':'text',
        'text':text,
      },
      {
        'type': 'flex',
        'altText': alttext,
        'contents':JSON.parse(flex),
      },
    ]
   };
   let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
   };
   UrlFetchApp.fetch(url, options);

   }
   else {//フレックスのみセルに入っている場合
   let postData = {
    "to" : to,
    "messages" : [
      {
        'type': 'flex',
        'altText': alttext,
        'contents':JSON.parse(flex),
      }
    ]
   };
   let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
   };
   UrlFetchApp.fetch(url, options);
   }
  }

  //変数を持たないフレックスメッセージが入る場合（プッシュMSG集のフレックスメッセージ（JSON）列にjsonが入っている場合）　
  else if (mlist.getRange(p, MlistColumn.Json).getValue() != '') {
   if (mlist.getRange(p, MlistColumn.Text).getValue() != '') {//テキスト・フレックスのセルに入っている場合
   let postData = {
    "to" : to,
    "messages" : [
      {
        'type':'text',
        'text':text,
      },
      {
        'type': 'flex',
        'altText': alttext,
        'contents':JSON.parse(flexFMT),
      },
    ]
   };
   let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
   };
   UrlFetchApp.fetch(url, options);
   }
   else {//フレックスのみセルに入っている場合
   let postData = {
    "to" : to,
    "messages" : [
      {
        'type': 'flex',
        'altText': alttext,
        'contents':JSON.parse(flexFMT),
      }
    ]
   };
   let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
   };
   UrlFetchApp.fetch(url, options);
   }
  }
  
  //フレックスメッセージが入らない場合（テキストのみの場合）　
  else {
  let postData = {
    "to" : to,
    "messages" : [
      {
        'type':'text',
        'text':text,
      },
    ]
  };

  let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
  };
   UrlFetchApp.fetch(url, options);
  }
   contact.getRange(rowIndex, ContactColumn.Push).setValue(UserPush.Finish);
   contact.getRange(rowIndex, ContactColumn.Level).setValue(level);
  }//pushFMTここまで


  