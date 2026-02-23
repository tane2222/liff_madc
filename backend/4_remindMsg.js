function cellFilling() {   
 for (let i = last_row_mlist; i >= 2; i--) {
 if (mlist.getRange(i, 1).getValue() != '') { 
   const key1 = mlist.getRange(i, MlistColumn.Num).getValue();//dx フリー日時の日程

  if (key1 == "pf2"){//「メッセージ集」の、フリーに該当する識別番号
   let p = get_row(key1, col ,mlist);
   let key2 = "rf";//「メッセージ集」の、対応するリマインド識別番号
   let r = get_row(key2, col ,mlist);
   cellFMT(p,r)
  }
  if (key1 == "p0r2"){//「メッセージ集」の、Dr：見学確定に該当する識別番号
   let p = get_row(key1, col ,mlist);
   let key2 = "r0o";//「メッセージ集」の、対応するリマインド識別番号
   let r = get_row(key2, col ,mlist);
   cellFMT(p,r)
  }
  if (key1 == "p0c"){//「メッセージ集」の、DC：会社説明会に該当する識別番号
   let p = get_row(key1, col ,mlist);
   let key2 = "r0c";//「メッセージ集」の、対応するリマインド識別番号
   let r = get_row(key2, col ,mlist);
   cellFMT(p,r)
  }
  if (key1 == "p1os"){//「メッセージ集」の、Dr/DH：1次選考に該当する識別番号
   let p = get_row(key1, col ,mlist);
   let key2 = "r1os";//「メッセージ集」の、対応するリマインド識別番号
   let r = get_row(key2, col ,mlist);
   cellFMT(p,r)
  }
  if (key1 == "p1cs"){//「メッセージ集」の、DC：1次選考に該当する識別番号
   let p = get_row(key1, col ,mlist);
   let key2 = "r1cs";//「メッセージ集」の、対応するリマインド識別番号
   let r = get_row(key2, col ,mlist);
   cellFMT(p,r)
  }
  if (key1 == "p2cs"){//「メッセージ集」の、DC：2次選考に該当する識別番号
   let p = get_row(key1, col ,mlist);
   let key2 = "r2cs";//「メッセージ集」の、対応するリマインド識別番号
   let r = get_row(key2, col ,mlist);
   cellFMT(p,r)
  }
  if (key1 == "p3cs"){//「メッセージ集」の、DC：3次選考に該当する識別番号
   let p = get_row(key1, col ,mlist);
   let key2 = "r3cs";//「メッセージ集」の、対応するリマインド識別番号
   let r = get_row(key2, col ,mlist);
   cellFMT(p,r)
  }
  if (key1 == "p4cs"){//「メッセージ集」の、DC：4次選考に該当する識別番号
   let p = get_row(key1, col ,mlist);
   let key2 = "r4cs";//「メッセージ集」の、対応するリマインド識別番号
   let r = get_row(key2, col ,mlist);
   cellFMT(p,r)
  }

  }
  }
}//cellFillingここまで

function cellFMT(p,r) {
   mlist.getRange(p, MlistColumn.Theme).setBackground('#f7ff00');//コピー元のPushメッセージのセルを黄色に
   mlist.getRange(p, MlistColumn.Detail).setBackground('#f7ff00');//コピー元のPushメッセージのセルを黄色に
   mlist.getRange(p, MlistColumn.Datetime).setBackground('#f7ff00');//コピー元のPushメッセージのセルを黄色に
   mlist.getRange(p, MlistColumn.Item).setBackground('#f7ff00');//コピー元のPushメッセージのセルを黄色に
   mlist.getRange(p, MlistColumn.Place).setBackground('#f7ff00');//コピー元のPushメッセージのセルを黄色に
   //mlist.getRange(p, MlistColumn.Free1).setBackground('#f7ff00');//コピー元のPushメッセージのセルを黄色に
   //mlist.getRange(p, MlistColumn.Free2).setBackground('#f7ff00');//コピー元のPushメッセージのセルを黄色に

   let cellTheme = mlist.getRange(p, MlistColumn.Theme).getValue();
   mlist.getRange(r, MlistColumn.Theme).setValue(cellTheme).setFontColor('#ff0000');

   let cellDetail = mlist.getRange(p, MlistColumn.Detail).getValue();
   mlist.getRange(r, MlistColumn.Detail).setValue(cellDetail).setFontColor('#ff0000');
   
   let cellDatetime = mlist.getRange(p, MlistColumn.Datetime).getValue();
   mlist.getRange(r, MlistColumn.Datetime).setValue(cellDatetime).setFontColor('#ff0000');

   let cellItem = mlist.getRange(p, MlistColumn.Item).getValue();
   mlist.getRange(r, MlistColumn.Item).setValue(cellItem).setFontColor('#ff0000');
  
   let cellPlace = mlist.getRange(p, MlistColumn.Place).getValue();
   mlist.getRange(r, MlistColumn.Place).setValue(cellPlace).setFontColor('#ff0000');

    /**let cellFree1 = mlist.getRange(p, MlistColumn.Free1).getValue();
   mlist.getRange(r, MlistColumn.Free1).setValue(cellFree1).setFontColor('#ff0000');

   let cellFree2 = mlist.getRange(p, MlistColumn.Free2).getValue();
   mlist.getRange(r, MlistColumn.Free2).setValue(cellFree2).setFontColor('#ff0000');
   **/
}

function remindMsg() {
  // 指定のシート上のデータがある範囲の表示値を表形式(正しくは二次元配列)ですべて取得
  //let table = contact.getDataRange().getDisplayValues();

  let date = new Date();            //現在時刻を取得
  date.setDate(date.getDate() +1);  //対象日付を変更（明日なら+1, 明後日なら+2, 昨日なら-1）
  let targetDate = Utilities.formatDate(date, 'JST', 'MM月dd日');   //日付書式を設定　
  console.log(targetDate);

  for (let i = last_row; i >= 2; i--) {
  if (contact.getRange(i, 1).getValue() != '') { 

   const dx_column = contact.getRange(i, ContactColumn.Dayx).getValue();//dx フリー日時の日程
   const d0_column = contact.getRange(i, ContactColumn.Day0).getValue();//d0 会社説明・見学会の日程
   const d1_column = contact.getRange(i, ContactColumn.Day1).getValue();//d1 1次選考(面接)の日程
   const d2_column = contact.getRange(i, ContactColumn.Day2).getValue();//d2 2次選考(面接)の日程
   const d3_column = contact.getRange(i, ContactColumn.Day3).getValue();//d3 3次選考(面接)の日程
   const d4_column = contact.getRange(i, ContactColumn.Day4).getValue();//d4 4次選考(面接)の日程
        
    let lineid = contact.getRange(i, 1).getValues()
    const to = JSON.parse(JSON.stringify(...lineid[0]))
    //console.log(to);
    const rowIndex = findRowByUserId(to);
    const userJob = contact.getRange(rowIndex, ContactColumn.Job).getValue();// ユーザーのジョブを取得（歯科医師、DC,等）
    const userStage = contact.getRange(rowIndex, ContactColumn.Stage).getValue();// ユーザーのステージを取得（1次選考、等）

  
   //【リマインド】dx フリー日時の日程
   if (dx_column.slice(0,6) == targetDate){  //対象列の値の0文字目から6文字分(MM月dd日)がtargetDateと同じ行があった場合のみ 
    let key = "rf";//「メッセージ集」の、リマインド：フリーに該当する識別番号
    let r = get_row(key, col ,mlist);
    let day = ContactColumn.Dayx
    let stage = userStage
    remindFMT(r,rowIndex,day,to,stage) 
 
   } //【リマインド】dx フリー日時の日程ここまで

  //【リマインド】d0 会社説明・見学会の日程
  if (d0_column.slice(0,6) == targetDate){  //対象列の値の0文字目から6文字分(MM月dd日)がtargetDateと同じ行があった場合のみ 

   //Dr/DH：d0 見学会
   if ((userJob === UserJob.Dr) || (userJob === UserJob.DH)){ //
    let key = "r0o";//「メッセージ集」の、リマインド：見学会・会社説明会に該当する識別番号
    let r = get_row(key, col ,mlist);
    let day = ContactColumn.Day0
    let stage = userStage
    remindFMT(r,rowIndex,day,to,stage)  
    
   }//Dr/DH：d0 見学会ここまで

   //DC：d0 会社説明会
   else if (userJob === UserJob.DC){ //
    let key = "p0c";//「メッセージ集」の、リマインド：見学会・会社説明会に該当する識別番号
    let r = get_row(key, col ,mlist);
    let day = ContactColumn.Day0
    let stage = userStage
    remindFMT(r,rowIndex,day,to,stage)  
   }//DC：d0 会社説明会ここまで
   } //【リマインド】d0 会社説明・見学会の日程ここまで

 
  //【リマインド】d1 1次選考(面接)の日程
   if (d1_column.slice(0,6) == targetDate){  //対象列の値の0文字目から6文字分(MM月dd日)がtargetDateと同じ行があった場合のみ 

   //Dr/DH：d1 1次選考(面接)
   if ((userJob === UserJob.Dr) || (userJob === UserJob.DH)){ //
    let key = "r1os";//「メッセージ集」の、リマインド：1次選考(面接)に該当する識別番号
    let r = get_row(key, col ,mlist);
    let day = ContactColumn.Day1
    let stage = userStage
    remindFMT(r,rowIndex,day,to,stage)  
   
   }//Dr/DH：d1 1次選考(面接)ここまで

   //DC：d1 1次選考(面接)
   if (userJob === UserJob.DC){ //
    let key = "r1cs";//「メッセージ集」の、リマインド：1次選考(面接)に該当する識別番号
    let r = get_row(key, col ,mlist);
    let day = ContactColumn.Day1
    let stage = userStage
    remindFMT(r,rowIndex,day,to,stage)  
   
   }//DC：d1 1次選考(面接)ここまで
 
   } //【リマインド】d1 1次選考(面接)の日程ここまで

  //【リマインド】d2 2次選考(面接)の日程
   if (d2_column.slice(0,6) == targetDate){  //対象列の値の0文字目から6文字分(MM月dd日)がtargetDateと同じ行があった場合のみ 
    let key = "r2cs";//「メッセージ集」の、リマインド：2次選考(面接)に該当する識別番号
    let r = get_row(key, col ,mlist);
    let day = ContactColumn.Day2
    let stage = userStage
    remindFMT(r,rowIndex,day,to,stage) 

   } //【リマインド】d2 2次選考(面接)の日程ここまで

  //【リマインド】d3 3次選考(面接)の日程
   if (d3_column.slice(0,6) == targetDate){  //対象列の値の0文字目から6文字分(MM月dd日)がtargetDateと同じ行があった場合のみ 
    let key = "r3cs";//「メッセージ集」の、リマインド：3次選考(面接)に該当する識別番号
    let r = get_row(key, col ,mlist);
    let day = ContactColumn.Day3
    let stage = userStage
    remindFMT(r,rowIndex,day,to,stage) 

   } //【リマインド】d3 3次選考(面接)の日程ここまで

  //【リマインド】d4 4次選考(面接)の日程
   if (d4_column.slice(0,6) == targetDate){  //対象列の値の0文字目から6文字分(MM月dd日)がtargetDateと同じ行があった場合のみ 
    let key = "r4cs";//「メッセージ集」の、リマインド：4次選考(面接)に該当する識別番号
    let r = get_row(key, col ,mlist);
    let day = ContactColumn.Day4
    let stage = userStage
    remindFMT(r,rowIndex,day,to,stage) 
 
   } //【リマインド】d4 4次選考(面接)の日程ここまで


}//if (contact.getRange(i, 1).getValue() != '') ここまで
}//for (let i = last_row; i >= 2; i--)ここまで
}//remindMsg()ここまで


function remindFMT(r,rowIndex,day,to,stage) {

  const url = "https://api.line.me/v2/bot/message/push";
  const headers = {
    "Content-Type" : "application/json; charset=UTF-8",
    'Authorization': 'Bearer ' + ACCESS_TOKEN,
  };
  
   let textFMT = mlist.getRange(r, MlistColumn.Text).getValue();//「メッセージ集」テキストのセルの位置
   let s_name = contact.getRange(rowIndex, ContactColumn.Name).getValue();
   let d = contact.getRange(rowIndex, day).getValue();
   let text = Object.entries({s_name}).reduce((s, e) => s.replaceAll(...e), textFMT)

   let alttext = mlist.getRange(r, MlistColumn.AltText).getValue();//「メッセージ集」altTextのセルの位置

   let flexFMT = mlist.getRange(r, MlistColumn.Json).getValue();//「メッセージ集」フレックスメッセージのセルの位置
   let theme = mlist.getRange(r, MlistColumn.Theme).getValue();
   let detail = '"' + mlist.getRange(r, MlistColumn.Detail).getValue() + '"';
   let datetime = '"' + d + mlist.getRange(r, MlistColumn.Datetime).getValue() + '"';//コンタクトの該当ステージの日時を追加
   let item = '"' + mlist.getRange(r, MlistColumn.Item).getValue() + '"';
   let place = '"' + mlist.getRange(r, MlistColumn.Place).getValue() + '"';
   //let free1 = '"' + mlist.getRange(p, MlistColumn.Free1).getValue() + '"';
   //let free2 = '"' + mlist.getRange(p, MlistColumn.Free2).getValue() + '"';
   let flex = Object.entries({s_name, theme, detail, datetime, item, place, /**free1, free2**/}).reduce((s, e) => s.replace(...e), flexFMT)
   flex = flex.replace(/[\u0000-\u0019]+/g, "");

  //toにメッセージを送信するユーザーIDを指定
   //テキストメッセージが入る場合（メッセージ集のText列に文字が入っている場合）　
  if (mlist.getRange(r, MlistColumn.Text).getValue() != '') {
  let postData = {
    "to" : to,
    "messages" : [
      {
        'type': 'flex',
        'altText': alttext,
        'contents':JSON.parse(flex),
      },
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

   //フレックスのみセルに入っている場合
  else {
  let postData = {
    "to" : to,
    "messages" : [
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
   contact.getRange(rowIndex, ContactColumn.Status).setValue(UserStatus.Finish);
   contact.getRange(rowIndex, ContactColumn.Stage).setValue(stage);

   //１度リマインドが送られると、(翌年など同じ日に)２度と同じリマインドが送られないよう、スプシの日付先頭に「*」を追加し、セルの色を変える
   let remind_done = '*' + contact.getRange(rowIndex, day).getValue() ;
   contact.getRange(rowIndex, day).setValue(remind_done).setFontColor('#FFFFFF').setBackground('#ff0000');//フォントを白。背景色を赤

  }//remindFMTここまで
  
   
 
 
