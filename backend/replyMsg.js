
const col = "A";//※これを消す場合は、必ずpushMSGのcolの//を復活させること
 const last_row_replylist = Math.max.apply(null, replylist.getRange("A:A").getValues().map((row, idx) => row[0] !== '' ? idx + 1 : 0));//A列の最終行取得
//const last_row_replylist = replylist.getLastRow();


function replyFMT(p,rowIndex,reply_token) {

  const url = "https://api.line.me/v2/bot/message/reply";
  const headers = {
    "Content-Type" : "application/json; charset=UTF-8",
    'Authorization': 'Bearer ' + ACCESS_TOKEN,
  };
  
   let textFMT = replylist.getRange(p, RlistColumn.Text).getValue();//「返信MSG集」テキストのセルの位置
   let s_name = contact.getRange(rowIndex, ContactColumn.Name).getValue(); 
   let text = Object.entries({s_name}).reduce((s, e) => s.replaceAll(...e), textFMT)

   let alttext = replylist.getRange(p, RlistColumn.AltText).getValue();//「返信MSG集」altTextのセルの位置
   let flexFMT = replylist.getRange(p, RlistColumn.Json).getValue();//「返信MSG集」フレックスメッセージのセルの位置
   
   let r_name = '"'+ contact.getRange(rowIndex, ContactColumn.Name).getValue() + '"';    
   let n_name = '"' + contact.getRange(rowIndex, ContactColumn.Nickname).getValue() + '"';
   let job = '"' + contact.getRange(rowIndex, ContactColumn.Job).getValue() + '"';
   let year = '"' + contact.getRange(rowIndex, ContactColumn.Age).getValue() + '"';
   let sex = '"' + contact.getRange(rowIndex, ContactColumn.Sex).getValue() + '"';
   let number = '"' + contact.getRange(rowIndex, ContactColumn.Number).getValue() + '"';

   let theme = replylist.getRange(p, RlistColumn.Theme).getValue();
   
   let honestS = '"' + contact.getRange(rowIndex, ContactColumn.Honest).getValue() + '％"';
   let honestN = '"' + contact.getRange(rowIndex, ContactColumn.Honest).getValue() + '%"';
   let imaginS = '"' + contact.getRange(rowIndex, ContactColumn.Imagin).getValue() + '％"' ;
   let imaginN = '"' + contact.getRange(rowIndex, ContactColumn.Imagin).getValue() + '%"' ;
   let logicS = '"' + contact.getRange(rowIndex, ContactColumn.Logic).getValue() + '％"';
   let logicN = '"' + contact.getRange(rowIndex, ContactColumn.Logic).getValue() + '%"';
   let possessiveS = '"' + contact.getRange(rowIndex, ContactColumn.Possessive).getValue() + '％"';
   let possessiveN = '"' + contact.getRange(rowIndex, ContactColumn.Possessive).getValue() + '%"';
   let battleS = '"' + contact.getRange(rowIndex, ContactColumn.Battle).getValue() + '％"';
   let battleN = '"' + contact.getRange(rowIndex, ContactColumn.Battle).getValue() + '%"';
   let loveS = '"' + contact.getRange(rowIndex, ContactColumn.Love).getValue() + '％"';
   let loveN = '"' + contact.getRange(rowIndex, ContactColumn.Love).getValue() + '%"';
   let free1 = '"' + contact.getRange(rowIndex, ContactColumn.Free1).getValue() + '"';
   let flex = Object.entries({r_name, n_name, year, job, sex, number, theme, honestS, honestN, imaginS, imaginN, logicS, logicN, possessiveS, possessiveN, battleS, battleN, loveS, loveN, free1}).reduce((s, e) => s.replace(...e), flexFMT)
   flex = flex.replace(/[\u0000-\u0019]+/g, "");

  
  //フレックスメッセージに変数が入る場合（返信MSG集のtheme列に文字が入っている場合）　
  if (replylist.getRange(p, RlistColumn.Theme).getValue() != '') {
   if (replylist.getRange(p, RlistColumn.Text).getValue() != '') {//テキスト・フレックスのセルに入っている場合
   let messages =  [
      {
        'type':'text',
        'text':text,
      },
      {
        'type': 'flex',
        'altText': alttext,
        'contents':JSON.parse(flex),
      },
    ];
   let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify({
      'replyToken': reply_token,
      'messages': messages
    }),
   };
   UrlFetchApp.fetch(url, options);
   }
   else {//フレックスのみセルに入っている場合
   let messages = [
    {
      'type': 'flex',
      'altText': alttext,
      'contents':JSON.parse(flex),
    }
    ];
   let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify({
      'replyToken': reply_token,
      'messages': messages
    }),
   };
   UrlFetchApp.fetch(url, options);
   
   }
  }

  //変数を持たないフレックスメッセージが入る場合（返信MSG集のフレックスメッセージ（JSON）列にjsonが入っている場合）　
  else if (replylist.getRange(p, RlistColumn.Json).getValue() != '') {
   if (replylist.getRange(p, RlistColumn.Text).getValue() != '') {//テキスト・フレックスのセルに入っている場合
   let  messages = [
      {
        'type':'text',
        'text':text,
      },
      {
        'type': 'flex',
        'altText': alttext,
        'contents':JSON.parse(flexFMT),
      },
    ];
   let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify({
      'replyToken': reply_token,
      'messages': messages
    }),
   };
   UrlFetchApp.fetch(url, options);
   }
   else {//フレックスのみセルに入っている場合
   let  messages = [
      {
        'type': 'flex',
        'altText': alttext,
        'contents':JSON.parse(flexFMT),
      }
    ];
   let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify({
      'replyToken': reply_token,
      'messages': messages
    }),
   };
   UrlFetchApp.fetch(url, options);
   }
  }
  
  //フレックスメッセージが入らない場合（テキストのみの場合）　
  else {
  let  messages = [
      {
        'type':'text',
        'text':text,
      },
    ];
   let options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify({
      'replyToken': reply_token,
      'messages': messages
    }),
   };
   UrlFetchApp.fetch(url, options);
  }
  }//replyFMTここまで

