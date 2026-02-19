// ▼▼▼▼▼ ここから新しいコードを追加 ▼▼▼▼▼

/**
 * 指定されたユーザーのプロフィール情報をFlex Messageテンプレートに埋め込みます。
 * @param {string} jsonTemplateString - プレースホルダーを含むJSONテンプレートの文字列。
 * @param {Array} targetUserRowData - プロフィールを埋め込む対象ユーザーの行データ。
 * @returns {string} - ユーザー情報が埋め込まれたJSON文字列。
 */
function populateProfileTemplate(jsonTemplateString, targetUserRowData) {
  let populatedJson = jsonTemplateString;
  const placeholders = {
    '%%USERID%%': targetUserRowData[ContactColumn.UserId - 1],
    '%%NICKNAME%%': targetUserRowData[ContactColumn.Nickname - 1] || '未設定',
    '%%AGE%%': targetUserRowData[ContactColumn.Age - 1] || '？',
    '%%JOB%%': targetUserRowData[ContactColumn.Job - 1] || '未設定',
    '%%FREE1%%': targetUserRowData[ContactColumn.Free1 - 1] || '自己紹介がありません',
    '%%HONEST%%': targetUserRowData[ContactColumn.Honest - 1] || '0',
    '%%IMAGIN%%': targetUserRowData[ContactColumn.Imagin - 1] || '0',
    '%%LOGIC%%': targetUserRowData[ContactColumn.Logic - 1] || '0',
    '%%POSSESSIVE%%': targetUserRowData[ContactColumn.Possessive - 1] || '0',
    '%%BATTLE%%': targetUserRowData[ContactColumn.Battle - 1] || '0',
    '%%LOVE%%': targetUserRowData[ContactColumn.Love - 1] || '0'
  };

  for (const key in placeholders) {
    populatedJson = populatedJson.replaceAll(key, placeholders[key]);
  }
  return populatedJson;
}

/**
 * 異性のユーザーカードをカルーセル形式で送信します。
 * @param {string} requesterUserId - リクエストしたユーザーのID。
 */
function sendMatchingCarousel(requesterUserId) {
  const requesterRowIndex = findRowByUserId(requesterUserId);
  const requesterSex = contact.getRange(requesterRowIndex, ContactColumn.Sex).getValue();

  const allUsersData = contact.getRange(3, 1, contact.getLastRow() - 2, contact.getLastColumn()).getValues();

  // 自分以外の異性を抽出
  const oppositeSexUsers = allUsersData.filter(user => 
    user[ContactColumn.UserId - 1] !== requesterUserId && 
    user[ContactColumn.Sex - 1] && 
    user[ContactColumn.Sex - 1] !== requesterSex
  );

  if (oppositeSexUsers.length === 0) {
    pushMessage(requesterUserId, [{'type': 'text', 'text': '紹介できるお相手が見つかりませんでした。'}]);
    return;
  }

  // ユーザーリストをシャッフル
  for (let i = oppositeSexUsers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [oppositeSexUsers[i], oppositeSexUsers[j]] = [oppositeSexUsers[j], oppositeSexUsers[i]];
  }

  // 最大5件に絞る
  const selectedUsers = oppositeSexUsers.slice(0, 5);

// ▼▼▼▼▼ ここからが修正箇所です ▼▼▼▼▼

// 1. カード背景用のパステルカラーのリストを定義
  const pastelColors = [
    '#FFD1D1', // パステルレッド
    '#FFE8D1', // パステルオレンジ
    '#D1FFD7', // パステルグリーン
    '#D1E8FF', // パステルブルー
    '#E8D1FF'  // パステルパープル
  ];

  const miniProfileTemplate = JSON.stringify(demomini_json);

  // 2. カードを生成する際に、順番に背景色を設定
  const flexBubbles = selectedUsers.map((userData, index) => {
    const populatedJson = populateProfileTemplate(miniProfileTemplate, userData);
    const bubble = JSON.parse(populatedJson);

    // bubble（カード全体）のbody部分に背景色を設定
    // index % pastelColors.length で、ユーザーが5人以上いても色が循環するようにします
    bubble.body.backgroundColor = pastelColors[index % pastelColors.length];
    
    return bubble;
  });

  // ▲▲▲▲▲ ここまでが修正箇所です ▲▲▲▲▲


  const carouselMessage = {
    type: 'flex',
    altText: 'お相手のプロフィールが届きました。',
    contents: {
      type: 'carousel',
      contents: flexBubbles
    }
  };

  pushMessage(requesterUserId, [carouselMessage]);
}

/**
 * 特定のユーザーの詳細プロフィールを送信します。
 * @param {string} requesterUserId - リクエストしたユーザーのID。
 * @param {string} targetUserId - 詳細プロフィールの対象ユーザーID。
 */
function sendFullProfile(requesterUserId, targetUserId) {
  const targetRowIndex = findRowByUserId(targetUserId);
  if (!targetRowIndex) return;

  const targetUserData = contact.getRange(targetRowIndex, 1, 1, contact.getLastColumn()).getValues()[0];
  const fullProfileTemplate = JSON.stringify(demo_json);
  const populatedJson = populateProfileTemplate(fullProfileTemplate, targetUserData);
  
  const fullProfileMessage = {
    type: 'flex',
    altText: 'お相手の詳細プロフィールです。',
    contents: JSON.parse(populatedJson)
  };
  
  pushMessage(requesterUserId, [fullProfileMessage]);
}

// 汎用的なメッセージ送信関数 (pushMsg.gsにもあるが念のため)
function pushMessage(userId, messages) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'to': userId,
      'messages': messages,
    }),
  });
}


// ▲▲▲▲▲ ここまで新しいコードを追加 ▲▲▲▲▲


// 以下は既存の matchingPartner 関数（変更なし）
function matchingPartner() {
  for (let i = last_row; i >= 2; i--) {
if (contact.getRange(i, 1).getValue() != '') {
  
 const status_column = contact.getRange(i, ContactColumn.Status).getValue();//ステータス（OK、NG、等）
 

 if (status_column == 'OK'){//「OK」
    let lineid = contact.getRange(i, 1).getValues()
    const to = JSON.parse(JSON.stringify(...lineid[0]))
    //console.log(to);
    const rowIndex = findRowByUserId(to);
    
    const userSex = contact.getRange(rowIndex, ContactColumn.Sex).getValue();// ユーザーの性別を取得（）
    const userName = contact.getRange(rowIndex, ContactColumn.Name).getValue();// ユーザーの性別を取得（）
   
    var pair_name = '';
    var count = 0;
    var ary = contact.getDataRange().getValues();//記入のある行＆列をすべて取得。しかし、空白マスも含まれるため、母数を正確に集計するためには違う記述が必要の可能性あり
    ary.shift();   //先頭の行（列も？）を削除する関数
    
    for(var j = ary.length - 1; j >= 0; j--){
        var random_row = Math.floor(Math.random() * j + 1);
        var tmp = ary[j];
        ary[j] = ary[random_row];
        ary[random_row] = tmp;
      }
    if(ary.length % 2 == 0){//人数が偶数の時
      //pair_name += ary[count][2] + ' - ' + ary[count+1][2];
      //pair_name += ary[count][2] 
      count += 2;

      //while(ary.length != count){
       //pair_name += '\n' + ary[count][2] + ' - ' + ary[count+1][2];
       //pair_name += ary[count][2] 
       //count += 2;
      //}
    
     if(userSex === UserSex.Men){ //「男」
      if(ary[count][5] == '女'){//「OK」
      pair_name += ary[count][2] 
      }
      else if(ary[count][5] == '男'){//「OK」
      continue;
      }
      let macth = pair_name
      contact.getRange(rowIndex, ContactColumn.Match).setValue(macth);
      }
     
     else if(userSex === UserSex.Women){ //「女」
      if(ary[count][5] == '男'){//「OK」
      pair_name += ary[count][2] 
      }
      else if(ary[count][5] == '女'){//「OK」
      continue;
      }
      let macth = pair_name
      contact.getRange(rowIndex, ContactColumn.Match).setValue(macth);
      }
     
    }
    else if(ary.length % 2 == 1){//人数が奇数の時
      pair_name += ary[count][2]
      //while(ary.length != count + 1){
       //pair_name += ary[count][2] + ' - ' + ary[count+1][2] + '\n';
       //pair_name += ary[count][2]
       //count += 2;
      //}
      //pair_name += ary[count][2] + ' - ' + 'free';

     if(userSex === UserSex.Men){ //「男」
      if(ary[count][5] == '女'){//「OK」
      pair_name += ary[count][2] 
      }
      else if(ary[count][5] == '男'){//「OK」
      continue;
      }
      let macth = pair_name
      contact.getRange(rowIndex, ContactColumn.Match).setValue(macth);
      }
     
     else if(userSex === UserSex.Women){ //「女」
      if(ary[count][5] == '男'){//「OK」
      pair_name += ary[count][2] 
      }
      else if(ary[count][5] == '女'){//「OK」
      continue;
      }
      let macth = pair_name
      contact.getRange(rowIndex, ContactColumn.Match).setValue(macth);
      }
    }
    //contact.deleteRows(2, last_row-1);
    
    console.log(pair_name);
  

//全
  

//全ここまで

}//全「」ここまで
 }
 }
}//function matchingここまで

