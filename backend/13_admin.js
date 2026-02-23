/**
 * 管理者向けの機能をまとめたファイル
 */

/**
 * [1段階目] 日次サマリーレポートを送信する関数
 * @param {string} adminUserId - レポートの送信先となる管理者ユーザーのID
 */
function sendUserSummaryReport(adminUserId) {
  // --- 1. 昨日と今日のデータを集計 ---
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const formattedYesterday = Utilities.formatDate(yesterday, 'Asia/Tokyo', 'yyyy/MM/dd');

  const allUsersData = contact.getRange(3, 1, contact.getLastRow() - 2, contact.getLastColumn()).getValues();
  const validUsers = allUsersData.filter(user => user[ContactColumn.UserId - 1]);
  const totalUsers = validUsers.length;

  // ▼▼▼▼▼【修正箇所】表示件数を40件から20件に制限 ▼▼▼▼▼
  const limitedUsersData = validUsers.slice(0, 20);
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

  const newUsersYesterday = validUsers.filter(user => {
    const registrationDate = user[ContactColumn.NewDate - 1];
    if (registrationDate instanceof Date) {
      return Utilities.formatDate(registrationDate, 'Asia/Tokyo', 'yyyy/MM/dd') === formattedYesterday;
    }
    return registrationDate === formattedYesterday;
  }).length;
  
  const kyunLogData = kyunLogSheet.getDataRange().getValues();
  let kyunsSentYesterday = 0;
  let matchesYesterday = 0;
  const allKyuns = new Set();
  const matchedPairs = new Set();

  kyunLogData.forEach(row => { if (row[2] === '送信') { allKyuns.add(`${row[1]}->${row[7]}`); } });
  kyunLogData.forEach(row => {
    const logDate = new Date(row[5]);
    if (Utilities.formatDate(logDate, 'Asia/Tokyo', 'yyyy/MM/dd') === formattedYesterday) {
      if (row[2] === '送信') {
        kyunsSentYesterday++;
        const sender = row[1];
        const receiver = row[7];
        if (allKyuns.has(`${receiver}->${sender}`)) {
          const pair = [sender, receiver].sort().join('-');
          matchedPairs.add(pair);
        }
      }
    }
  });
  matchesYesterday = matchedPairs.size;

  // --- 2. サマリーカードのデザインを定義 ---
  const summaryBubble = {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "SITUATION REPORT",
          "weight": "bold",
          "color": "#B4B4FF",
          "size": "sm"
        },
        {
          "type": "text",
          "text": "総ユーザー数",
          "weight": "bold",
          "size": "xxl",
          "margin": "md",
          "color": "#FFFFFF"
        },
        {
          "type": "text",
          "text": `${totalUsers}人`,
          "size": "4xl",
          "color": "#FFFFFF",
          "weight": "bold",
          "align": "end"
        },
        { "type": "separator", "margin": "xxl", "color": "#5A5F88" },
        {
          "type": "box",
          "layout": "vertical", // ★★★ 横並びから縦並びに変更 ★★★
          "margin": "xxl",
          "spacing": "lg", // ★★★ 各項目間のスペースを追加 ★★★
          "contents": [
            // --- 昨日からの増減 ---
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "📈 昨日からの増減", "color": "#DFDFDF", "size": "sm", "flex": 3 },
                { "type": "text", "text": `+${newUsersYesterday}人`, "color": newUsersYesterday > 0 ? "#A2FFBD" : "#FFFFFF", "size": "lg", "weight": "bold", "align": "end", "flex": 2 }
              ]
            },
            // --- 昨日のキュン ---
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "❤️ 昨日のキュン", "color": "#DFDFDF", "size": "sm", "flex": 3 },
                { "type": "text", "text": `${kyunsSentYesterday}回`, "color": "#FFFFFF", "size": "lg", "weight": "bold", "align": "end", "flex": 2 }
              ]
            },
            // --- 昨日のマッチング ---
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "🤝 昨日のマッチング", "color": "#DFDFDF", "size": "sm", "flex": 3 },
                { "type": "text", "text": `${matchesYesterday}組`, "color": "#FFFFFF", "size": "lg", "weight": "bold", "align": "end", "flex": 2 }
              ]
            }
          ]
        }
      ],
      "paddingAll": "20px",
      "background": {
        "type": "linearGradient",
        "angle": "45deg",
        "startColor": "#2E3192",
        "endColor": "#1B2961"
      }
    },
    // ▼▼▼▼▼【修正箇所】フッターに「全登録者を見る」ボタンを追加 ▼▼▼▼▼
    "footer": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "全登録者を見る",
            "data": "action=showAllUsers",
            "displayText": "全登録者を見る"
          },
          "style": "primary",
          "color": "#B4B4FF",
          "margin": "sm"
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "ユーザー編集",
            "text": "ユーザー編集"
          },
          "style": "primary",
          "color": "#B4B4FF",
          "margin": "sm"
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "メッセージを送る",
            "text": "メッセージを送る"
          },
          "style": "primary",
          "color": "#B4B4FF",
          "margin": "sm"
        }
      ],
      "backgroundColor": "#2E3192"
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
  };

  // --- 3. サマリーメッセージのみを送信 ---
  pushMessage(adminUserId, [{
    "type": "flex",
    "altText": `デイリーサマリー: 現在の登録者数 ${totalUsers}人`,
    "contents": summaryBubble
  }]);
}


/**
 * [2段階目] 全ユーザーの詳細リストをカルーセルで送信する関数
 * @param {string} adminUserId - レポートの送信先となる管理者ユーザーのID
 */
function sendAllUsersReport(adminUserId, page = 1) {
  const allUsersData = contact.getRange(3, 1, contact.getLastRow() - 2, contact.getLastColumn()).getValues();
  const validUsers = allUsersData.filter(user => user[ContactColumn.UserId - 1]);
  const totalUsers = validUsers.length;
  
  if (page === 5 && totalUsers > 80) {
    sendUserListContinuationPrompt(adminUserId);
    return;
  }

  const usersPerPage = 20;
  const startIndex = (page - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const limitedUsersData = validUsers.slice(startIndex, endIndex);

  if (limitedUsersData.length === 0) {
    pushMessage(adminUserId, [{'type': 'text', 'text': '表示するユーザーは以上です。'}]);
    return;
  }

  // --- 1枚目のカード（LINEユーザーID）のコンテンツを生成 ---
  const bubble1_body_contents = [
    { "type": "box", "layout": "horizontal", "margin": "md", "contents": [
        { "type": "text", "text": "LINEユーザーID", "size": "xs", "color": "#AAAAAA" }
    ]},
    { "type": "separator" }
  ];
  const userListComponents1 = limitedUsersData.map(user => {
    const userId = user[ContactColumn.UserId - 1] || '（取得エラー）';
    return { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": userId, "size": "xxs", "color": "#666666", "wrap": true } ] };
  });
  bubble1_body_contents.push(...userListComponents1);

  // --- 2枚目のカード（名前関連）のコンテンツを生成 ---
  const bubble2_body_contents = [
    { "type": "box", "layout": "horizontal", "margin": "md", "contents": [
        { "type": "text", "text": "LINEネーム", "flex": 3, "size": "xs", "color": "#AAAAAA" },
        { "type": "text", "text": "本名", "flex": 3, "size": "xs", "align": "center", "color": "#AAAAAA" },
        { "type": "text", "text": "ニックネーム", "flex": 3, "size": "xs", "align": "end", "color": "#AAAAAA" }
    ]},
    { "type": "separator" }
  ];
  const userListComponents2 = limitedUsersData.map(user => {
    const lineName = user[ContactColumn.LineName - 1] || '（不明）';
    const name = user[ContactColumn.Name - 1] || '（未設定）';
    const nickname = user[ContactColumn.Nickname - 1] || '（未設定）';
    return { "type": "box", "layout": "horizontal", "contents": [
        { "type": "text", "text": lineName, "flex": 3, "size": "sm", "wrap": true },
        { "type": "text", "text": name, "flex": 3, "size": "sm", "align": "center", "wrap": true },
        { "type": "text", "text": nickname, "flex": 3, "size": "sm", "align": "end", "wrap": true }
      ]
    };
  });
  bubble2_body_contents.push(...userListComponents2);

  // ▼▼▼▼▼【ここから3枚目のカードを生成するコードを追加】▼▼▼▼▼
  // --- 3枚目のカード（プロフィール情報）のコンテンツを生成 ---
  const bubble3_body_contents = [
    { "type": "box", "layout": "horizontal", "margin": "md", "contents": [
        { "type": "text", "text": "番号", "flex": 2, "size": "xs", "color": "#AAAAAA" },
        { "type": "text", "text": "性別", "flex": 1, "size": "xs", "align": "center", "color": "#AAAAAA" },
        { "type": "text", "text": "年齢", "flex": 1, "size": "xs", "align": "center", "color": "#AAAAAA" },
        { "type": "text", "text": "所属", "flex": 3, "size": "xs", "align": "end", "color": "#AAAAAA" }
    ]},
    { "type": "separator" }
  ];

  const userListComponents3 = limitedUsersData.map(user => {
    const number = user[ContactColumn.Number - 1] || '-';
    const sex = user[ContactColumn.Sex - 1] || '?';
    const age = user[ContactColumn.Age - 1] || '?';
    const job = user[ContactColumn.Job - 1] || '（未設定）';
    return {
      "type": "box", "layout": "horizontal", "contents": [
        { "type": "text", "text": String(number), "flex": 2, "size": "sm", "wrap": true },
        { "type": "text", "text": sex, "flex": 1, "size": "sm", "align": "center" },
        { "type": "text", "text": String(age), "flex": 1, "size": "sm", "align": "center" },
        { "type": "text", "text": job, "flex": 3, "size": "sm", "align": "end", "wrap": true }
      ]
    };
  });
  bubble3_body_contents.push(...userListComponents3);
  // ▲▲▲▲▲【3枚目のカード生成はここまで】▲▲▲▲▲
  
  // --- カルーセルメッセージとして組み立て ---
  const carouselBubbles = [
    { "type": "bubble", "header": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": `ID一覧 (${startIndex + 1}～${startIndex + limitedUsersData.length}人目)`, "weight": "bold", "color": "#FFFFFF", "size": "sm" } ], "backgroundColor": "#6C757D" }, "body": { "type": "box", "layout": "vertical", "spacing": "md", "contents": bubble1_body_contents } },
    { "type": "bubble", "header": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": `名前一覧 (${startIndex + 1}～${startIndex + limitedUsersData.length}人目)`, "weight": "bold", "color": "#FFFFFF", "size": "sm" } ], "backgroundColor": "#6C757D" }, "body": { "type": "box", "layout": "vertical", "spacing": "md", "contents": bubble2_body_contents } },
    // ★★★ 3枚目のバブルを追加 ★★★
    { "type": "bubble", "header": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": `プロフィール一覧 (${startIndex + 1}～${startIndex + limitedUsersData.length}人目)`, "weight": "bold", "color": "#FFFFFF", "size": "sm" } ], "backgroundColor": "#6C757D" }, "body": { "type": "box", "layout": "vertical", "spacing": "md", "contents": bubble3_body_contents } }
  ];

  // --- 「次の20件を見る」ボタンを追加 ---
  if (validUsers.length > endIndex) {
    const nextButton = { "type": "button", "action": { "type": "postback", "label": "次の20件を見る", "data": `action=showAllUsers&page=${page + 1}` }, "style": "secondary", "margin": "md" };
    // ★★★ ボタンを3枚目のカードのフッターに追加 ★★★
    carouselBubbles[2].footer = { "type": "box", "layout": "vertical", "contents": [ nextButton ] };
  }

  const carouselMessage = { "type": "flex", "altText": `全登録者リスト (${startIndex + 1}～${startIndex + limitedUsersData.length}人目)`, "contents": { "type": "carousel", "contents": carouselBubbles } };

  pushMessage(adminUserId, [carouselMessage]);
}

/**
 * 「続きを表示しますか？」という確認メッセージを送信する関数
 * @param {string} adminUserId - 送信先となる管理者ユーザーのID
 */
function sendUserListContinuationPrompt(adminUserId) {
  const promptMessage = {
    "type": "flex",
    "altText": "続きを表示しますか？",
    "contents": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "80人分のリストを表示しました。",
            "wrap": true,
            "size": "md"
          },
          {
            "type": "text",
            "text": "続きの登録者も表示しますか？",
            "wrap": true,
            "size": "md",
            "margin": "lg"
          }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "button",
            "action": {
              "type": "postback",
              "label": "はい、表示する",
              "data": "action=showAllUsers&page=5" // 5ページ目をリクエスト
            },
            "style": "primary"
          }
        ]
      }
    }
  };
  pushMessage(adminUserId, [promptMessage]);
}


/**
 * [2段階目] 全ユーザーの詳細リストをページネーション付きで送信する関数
 * @param {string} adminUserId - レポートの送信先となる管理者ユーザーのID
 * @param {number} page - 表示するページ番号
 */

function sendAllUsersReport(adminUserId, page = 1) {
  const allUsersData = contact.getRange(3, 1, contact.getLastRow() - 2, contact.getLastColumn()).getValues();
  const validUsers = allUsersData.filter(user => user[ContactColumn.UserId - 1]);
  const totalUsers = validUsers.length;
  
  if (page === 5 && totalUsers > 80) {
    sendUserListContinuationPrompt(adminUserId);
    return;
  }

  const usersPerPage = 20;
  const startIndex = (page - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const limitedUsersData = validUsers.slice(startIndex, endIndex);

  if (limitedUsersData.length === 0) {
    pushMessage(adminUserId, [{'type': 'text', 'text': '表示するユーザーは以上です。'}]);
    return;
  }

  // --- 1枚目のカード（LINEユーザーID）のコンテンツを生成 ---
  const bubble1_body_contents = [
    { "type": "box", "layout": "horizontal", "margin": "md", "contents": [
        { "type": "text", "text": "LINEユーザーID", "size": "xs", "color": "#AAAAAA" }
    ]},
    { "type": "separator" }
  ];
  const userListComponents1 = limitedUsersData.map(user => {
    const userId = user[ContactColumn.UserId - 1] || '（取得エラー）';
    return { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": userId, "size": "xxs", "color": "#666666", "wrap": true } ] };
  });
  bubble1_body_contents.push(...userListComponents1);

  // --- 2枚目のカード（名前関連）のコンテンツを生成 ---
  const bubble2_body_contents = [
    { "type": "box", "layout": "horizontal", "margin": "md", "contents": [
        { "type": "text", "text": "LINEネーム", "flex": 3, "size": "xs", "color": "#AAAAAA" },
        { "type": "text", "text": "本名", "flex": 3, "size": "xs", "align": "center", "color": "#AAAAAA" },
        { "type": "text", "text": "ニックネーム", "flex": 3, "size": "xs", "align": "end", "color": "#AAAAAA" }
    ]},
    { "type": "separator" }
  ];
  const userListComponents2 = limitedUsersData.map(user => {
    const lineName = user[ContactColumn.LineName - 1] || '（不明）';
    const name = user[ContactColumn.Name - 1] || '（未設定）';
    const nickname = user[ContactColumn.Nickname - 1] || '（未設定）';
    return { "type": "box", "layout": "horizontal", "contents": [
         // ▼▼▼ sizeを "sm" から "xxs" に変更 ▼▼▼
        { "type": "text", "text": lineName, "flex": 3, "size": "xxs", "wrap": true },
        { "type": "text", "text": name, "flex": 3, "size": "xxs", "align": "center", "wrap": true },
        { "type": "text", "text": nickname, "flex": 3, "size": "xxs", "align": "end", "wrap": true }
      ]
    };
  });
  bubble2_body_contents.push(...userListComponents2);

  // ▼▼▼▼▼【ここから3枚目のカードを生成するコードを追加】▼▼▼▼▼
  // --- 3枚目のカード（プロフィール情報）のコンテンツを生成 ---
  const bubble3_body_contents = [
    { "type": "box", "layout": "horizontal", "margin": "md", "contents": [
        { "type": "text", "text": "番号", "flex": 2, "size": "xs", "color": "#AAAAAA" },
        { "type": "text", "text": "性別", "flex": 1, "size": "xs", "align": "center", "color": "#AAAAAA" },
        { "type": "text", "text": "年齢", "flex": 1, "size": "xs", "align": "center", "color": "#AAAAAA" },
        { "type": "text", "text": "所属", "flex": 3, "size": "xs", "align": "end", "color": "#AAAAAA" }
    ]},
    { "type": "separator" }
  ];

  const userListComponents3 = limitedUsersData.map(user => {
    const number = user[ContactColumn.Number - 1] || '-';
    const sex = user[ContactColumn.Sex - 1] || '?';
    const age = user[ContactColumn.Age - 1] || '?';
    const job = user[ContactColumn.Job - 1] || '（未設定）';
    return {
      "type": "box", "layout": "horizontal", "contents": [
         // ▼▼▼ sizeを "sm" から "xxs" に変更 ▼▼▼
        { "type": "text", "text": String(number), "flex": 2, "size": "xxs", "wrap": true },
        { "type": "text", "text": sex, "flex": 1, "size": "xxs", "align": "center" },
        { "type": "text", "text": String(age), "flex": 1, "size": "xxs", "align": "center" },
        { "type": "text", "text": job, "flex": 3, "size": "xxs", "align": "end", "wrap": true }
      ]
    };
  });
  bubble3_body_contents.push(...userListComponents3);
  // ▲▲▲▲▲【3枚目のカード生成はここまで】▲▲▲▲▲
  
  // --- カルーセルメッセージとして組み立て ---
  const carouselBubbles = [
    { "type": "bubble", "header": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": `ID一覧 (${startIndex + 1}～${startIndex + limitedUsersData.length}人目)`, "weight": "bold", "color": "#FFFFFF", "size": "sm" } ], "backgroundColor": "#6C757D" }, "body": { "type": "box", "layout": "vertical", "spacing": "md", "contents": bubble1_body_contents } },
    { "type": "bubble", "header": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": `名前一覧 (${startIndex + 1}～${startIndex + limitedUsersData.length}人目)`, "weight": "bold", "color": "#FFFFFF", "size": "sm" } ], "backgroundColor": "#6C757D" }, "body": { "type": "box", "layout": "vertical", "spacing": "md", "contents": bubble2_body_contents } },
    // ★★★ 3枚目のバブルを追加 ★★★
    { "type": "bubble", "header": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": `プロフィール一覧 (${startIndex + 1}～${startIndex + limitedUsersData.length}人目)`, "weight": "bold", "color": "#FFFFFF", "size": "sm" } ], "backgroundColor": "#6C757D" }, "body": { "type": "box", "layout": "vertical", "spacing": "md", "contents": bubble3_body_contents } }
  ];

  // --- 「次の20件を見る」ボタンを追加 ---
  if (validUsers.length > endIndex) {
    const nextButton = { "type": "button", "action": { "type": "postback", "label": "次の20件を見る", "data": `action=showAllUsers&page=${page + 1}` }, "style": "secondary", "margin": "md" };
    // ★★★ ボタンを１枚目のカードのフッターに追加 ★★★
    carouselBubbles[0].footer = { "type": "box", "layout": "vertical", "contents": [ nextButton ] };
  }

  const carouselMessage = { "type": "flex", "altText": `全登録者リスト (${startIndex + 1}～${startIndex + limitedUsersData.length}人目)`, "contents": { "type": "carousel", "contents": carouselBubbles } };

  pushMessage(adminUserId, [carouselMessage]);
}

/**
 * [管理者機能] ユーザー編集プロセスを開始する関数
 * @param {string} adminUserId - 管理者ユーザーのID
 */
function startUserEditProcess(adminUserId) {
  const adminRow = findRowByUserId(adminUserId);
  if (!adminRow) return;

  // 管理者の状態を「ユーザー編集中」に設定
  const editData = { "step": "waiting_for_user_identifier" };
  contact.getRange(adminRow, ContactColumn.OngoingDiagnosis).setValue('ADMIN_EDIT');
  contact.getRange(adminRow, ContactColumn.DiagnosisData).setValue(JSON.stringify(editData));

  const message = {
    "type": "text",
    "text": "編集したいユーザーの「番号」または「ニックネーム」を正確に入力してください。\n\n編集を中止する場合は「キャンセル」と入力してください。"
  };
  pushMessage(adminUserId, [message]);
}


/**
 * [管理者機能] 入力された識別子でユーザーを検索し、編集項目選択メニューを表示する関数
 * @param {string} adminUserId - 管理者ユーザーのID
 * @param {string} identifier - 検索する番号またはニックネーム
 */
function findUserAndShowEditMenu(adminUserId, identifier) {
  const allUsersData = contact.getRange(3, 1, contact.getLastRow() - 2, contact.getLastColumn()).getValues();
  let targetUserRow = -1;
  let targetUserData = null;

  // 番号またはニックネームでユーザーを検索
  for (let i = 0; i < allUsersData.length; i++) {
    if (String(allUsersData[i][ContactColumn.Number - 1]) === identifier || allUsersData[i][ContactColumn.Nickname - 1] === identifier) {
      targetUserRow = i + 3; // 配列のインデックスを実際のスプレッドシートの行番号に変換
      targetUserData = allUsersData[i];
      break;
    }
  }

  // ユーザーが見つかった場合
  if (targetUserRow !== -1) {
    const adminRow = findRowByUserId(adminUserId);
    const targetUserId = targetUserData[ContactColumn.UserId - 1];
    const targetNickname = targetUserData[ContactColumn.Nickname - 1] || '（未設定）';

    // 管理者の状態を更新（対象ユーザーIDと次のステップを保存）
    const editData = { "step": "waiting_for_property_selection", "targetUserId": targetUserId };
    contact.getRange(adminRow, ContactColumn.DiagnosisData).setValue(JSON.stringify(editData));

    const menuMessage = {
      "type": "flex",
      "altText": `${targetNickname}さんの編集項目を選択してください。`,
      "contents": {
        "type": "bubble",
        "size": "giga",
        "header": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": `【${targetNickname}】の編集項目`, "weight": "bold", "color": "#FFFFFF", "size": "md", "wrap": true } ], "backgroundColor": "#5A5F88" },
        "body": {
          "type": "box",
          "layout": "vertical",
          "spacing": "md",
          "contents": [
            { "type": "text", "text": "編集したい項目を選んでください。", "wrap": true, "size": "sm" },
            {
              "type": "box",
              "layout": "horizontal",
              "spacing": "sm",
              "margin": "md",
              "contents": [
                { "type": "button", "action": { "type": "message", "label": "ﾆｯｸﾈｰﾑ", "text": "ニックネームを編集" }, "style": "primary", "height": "sm" },
                { "type": "button", "action": { "type": "message", "label": "性別", "text": "性別を編集" }, "style": "primary", "height": "sm" },
                { "type": "button", "action": { "type": "message", "label": "年齢", "text": "年齢を編集" }, "style": "primary", "height": "sm" }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "spacing": "sm",
              "contents": [
                { "type": "button", "action": { "type": "message", "label": "所属", "text": "所属を編集" }, "style": "primary", "height": "sm" },
                { "type": "button", "action": { "type": "message", "label": "ｽﾃｰﾀｽ", "text": "ステータスを編集" }, "style": "primary", "height": "sm" }
              ]
            },
            { "type": "button", "action": { "type": "message", "label": "キャンセル", "text": "キャンセル" }, "style": "link", "color": "#AAAAAA", "margin": "md" }
          ]
        }
      }
    };
    pushMessage(adminUserId, [menuMessage]);
  } else {
    pushMessage(adminUserId, [{ "type": "text", "text": "ユーザーが見つかりませんでした。再度、番号またはニックネームを入力してください。" }]);
  }
}


/**
 * [管理者機能] ユーザー編集プロセスを終了する関数
 * @param {string} adminUserId - 管理者ユーザーのID
 */
function cancelUserEditProcess(adminUserId) {
  const adminRow = findRowByUserId(adminUserId);
  if (!adminRow) return;

  // 管理者の状態をクリア
  contact.getRange(adminRow, ContactColumn.OngoingDiagnosis).clearContent();
  contact.getRange(adminRow, ContactColumn.DiagnosisData).clearContent();
  
  pushMessage(adminUserId, [{ "type": "text", "text": "ユーザー編集を中止しました。" }]);
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

/**
 * [管理者機能] 編集する新しい値の入力を促す関数
 * @param {string} adminUserId - 管理者ユーザーのID
 * @param {string} propertyToEdit - 編集対象のプロパティ名 (例: "Nickname")
 * @param {string} propertyDisplayName - 表示用のプロパティ名 (例: "ニックネーム")
 */
function promptForNewValue(adminUserId, propertyToEdit, propertyDisplayName) {
  const adminRow = findRowByUserId(adminUserId);
  const editDataJSON = contact.getRange(adminRow, ContactColumn.DiagnosisData).getValue();
  const editData = JSON.parse(editDataJSON || '{}');

  // 管理者の状態を更新（次のステップ、編集対象プロパティを保存）
  editData.step = 'waiting_for_new_value';
  editData.propertyToEdit = propertyToEdit;
  contact.getRange(adminRow, ContactColumn.DiagnosisData).setValue(JSON.stringify(editData));

  pushMessage(adminUserId, [{ "type": "text", "text": `新しい「${propertyDisplayName}」を入力してください。` }]);
}


/**
 * [管理者機能] ユーザーのプロパティを更新する関数
 * @param {string} adminUserId - 管理者ユーザーのID
 * @param {string} newValue - 新しい値
 */
function updateUserProperty(adminUserId, newValue) {
  const adminRow = findRowByUserId(adminUserId);
  const editDataJSON = contact.getRange(adminRow, ContactColumn.DiagnosisData).getValue();
  const editData = JSON.parse(editDataJSON || '{}');
  
  const targetUserId = editData.targetUserId;
  const propertyToEdit = editData.propertyToEdit;

  const targetUserRow = findRowByUserId(targetUserId);
  if (targetUserRow && propertyToEdit) {
    // ContactColumnオブジェクトのキー名(例: "Nickname")から、列番号を取得
    const targetColumn = ContactColumn[propertyToEdit];
    contact.getRange(targetUserRow, targetColumn).setValue(newValue);

    const targetNickname = contact.getRange(targetUserRow, ContactColumn.Nickname).getValue();
    pushMessage(adminUserId, [{ "type": "text", "text": `【${targetNickname}】の情報を更新しました。` }]);
  } else {
    pushMessage(adminUserId, [{ "type": "text", "text": "エラーが発生しました。編集を中止します。" }]);
  }
  
  // 編集プロセスを終了
  cancelUserEditProcess(adminUserId);
}


/**
 * [管理者機能] メッセージ送信プロセスを開始する関数
 * @param {string} adminUserId - 管理者ユーザーのID
 */
function startSendMessageProcess(adminUserId) {
  const adminRow = findRowByUserId(adminUserId);
  if (!adminRow) return;

  // 管理者の状態を「メッセージ送信中」に設定
  const sendData = { "step": "waiting_for_user_identifier" };
  contact.getRange(adminRow, ContactColumn.OngoingDiagnosis).setValue('ADMIN_SEND_MSG');
  contact.getRange(adminRow, ContactColumn.DiagnosisData).setValue(JSON.stringify(sendData));

  const message = {
    "type": "text",
    "text": "メッセージを送信したいユーザーの「番号」または「ニックネーム」を正確に入力してください。\n\n中止する場合は「キャンセル」と入力してください。"
  };
  pushMessage(adminUserId, [message]);
}


/**
 * [管理者機能] 送信対象ユーザーを確定し、メッセージ内容の入力を促す関数
 * @param {string} adminUserId - 管理者ユーザーのID
 * @param {string} identifier - 検索する番号またはニックネーム
 */
function askForMessageContent(adminUserId, identifier) {
  const allUsersData = contact.getRange(3, 1, contact.getLastRow() - 2, contact.getLastColumn()).getValues();
  let targetUserData = null;

  for (let i = 0; i < allUsersData.length; i++) {
    if (String(allUsersData[i][ContactColumn.Number - 1]) === identifier || allUsersData[i][ContactColumn.Nickname - 1] === identifier) {
      targetUserData = allUsersData[i];
      break;
    }
  }

  if (targetUserData) {
    const adminRow = findRowByUserId(adminUserId);
    const targetUserId = targetUserData[ContactColumn.UserId - 1];
    const targetNickname = targetUserData[ContactColumn.Nickname - 1] || '（未設定）';

    // 管理者の状態を更新（対象ユーザーIDと次のステップを保存）
    const sendData = { "step": "waiting_for_message_content", "targetUserId": targetUserId };
    contact.getRange(adminRow, ContactColumn.DiagnosisData).setValue(JSON.stringify(sendData));

    pushMessage(adminUserId, [{ "type": "text", "text": `【${targetNickname}】さんに送信するメッセージを入力してください。` }]);
  } else {
    pushMessage(adminUserId, [{ "type": "text", "text": "ユーザーが見つかりませんでした。再度、番号またはニックネームを入力してください。" }]);
  }
}


/**
 * [管理者機能] ユーザーにメッセージを送信し、管理者に完了通知を送る関数
 * @param {string} adminUserId - 管理者ユーザーのID
 * @param {string} messageContent - 送信するメッセージ内容
 */
function sendMessageToUser(adminUserId, messageContent) {
  const adminRow = findRowByUserId(adminUserId);
  const sendDataJSON = contact.getRange(adminRow, ContactColumn.DiagnosisData).getValue();
  const sendData = JSON.parse(sendDataJSON || '{}');
  const targetUserId = sendData.targetUserId;

  if (targetUserId) {
    // 対象ユーザーにメッセージを送信
    pushMessage(targetUserId, [{ "type": "text", "text": messageContent }]);
    
    // 管理者に完了通知
    const targetRow = findRowByUserId(targetUserId);
    const targetNickname = contact.getRange(targetRow, ContactColumn.Nickname).getValue();
    pushMessage(adminUserId, [{ "type": "text", "text": `【${targetNickname}】さんにメッセージを送信しました。` }]);
  } else {
    pushMessage(adminUserId, [{ "type": "text", "text": "エラーが発生しました。送信を中止します。" }]);
  }

  // プロセスを終了
  cancelUserEditProcess(adminUserId); // 既存のキャンセル関数を流用
}

// 汎用的なpushMessage関数（もしadmin.gsになければ追記）
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

