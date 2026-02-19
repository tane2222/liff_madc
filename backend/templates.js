const demomini_json = {
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "box",
        "layout": "horizontal",
        "alignItems": "center",
        "spacing": "md",
        "contents": [
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "image",
                "url": "https://tanes.jp/wp-content/uploads/2025/06/rogo_word-e1750771977225.png",
                "size": "full",
                "aspectMode": "cover"
              }
            ],
            "width": "72px",
            "height": "72px",
            "cornerRadius": "100px"
          },
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "%%NICKNAME%%",
                "weight": "bold",
                "size": "xl",
                "color": "#333333"
              },
              {
                "type": "text",
                "text": "%%AGE%%歳・%%JOB%%",
                "size": "sm",
                "color": "#999999"
              }
            ]
          }
        ],
        "offsetBottom": "xs"
      }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "vertical",
    "spacing": "sm",
    "contents": [
      {
        "type": "button",
        "action": {
          "type": "postback",
          "label": "詳しく見る",
          "data": "action=showProfile&targetUserId=%%USERID%%",
          "displayText": "%%NICKNAME%%さんのプロフィールを見る"
        },
        "style": "link",
        "height": "sm",
        "color": "#5B94E5"
      }
    ],
    "flex": 0
  }
}

const demo_json = {
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "box",
        "layout": "horizontal",
        "alignItems": "center",
        "spacing": "md",
        "contents": [
          { "type": "box", "layout": "vertical", "contents": [ { "type": "image", "url": "https://tanes.jp/wp-content/uploads/2025/06/rogo_word-e1750771977225.png", "size": "full", "aspectMode": "cover" } ], "width": "72px", "height": "72px", "cornerRadius": "100px" },
          { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": "%%NICKNAME%%", "weight": "bold", "size": "xl", "color": "#333333" }, { "type": "text", "text": "%%AGE%%歳・%%JOB%%", "size": "sm", "color": "#999999" } ] }
        ],
        "offsetBottom": "xs"
      },
      { "type": "box", "layout": "vertical", "margin": "lg", "spacing": "sm", "contents": [ { "type": "text", "text": "%%FREE1%%", "wrap": true, "color": "#666666", "size": "sm" } ] },
      {
        "type": "box",
        "layout": "vertical",
        "margin": "xxl",
        "spacing": "sm",
        "contents": [
          // --- 素直さ ---
          { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": "素直さ", "size": "sm", "color": "#555555", "flex": 0 }, { "type": "text", "text": "%%HONEST%%%", "size": "sm", "color": "#111111", "align": "end" } ] },
          { "type": "box", "layout": "vertical", "backgroundColor": "#F0F0F0", "height": "6px", "cornerRadius": "md", "contents": [ { "type": "box", "layout": "vertical", "backgroundColor": "#DE4D41", "width": "%%HONEST%%%", "height": "6px", "cornerRadius": "md", "contents": [] } ] },
          // --- 想像力 ---
          { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": "想像力", "size": "sm", "color": "#555555", "flex": 0 }, { "type": "text", "text": "%%IMAGIN%%%", "size": "sm", "color": "#111111", "align": "end" } ] },
          { "type": "box", "layout": "vertical", "backgroundColor": "#F0F0F0", "height": "6px", "cornerRadius": "md", "contents": [ { "type": "box", "layout": "vertical", "backgroundColor": "#DE4D41", "width": "%%IMAGIN%%%", "height": "6px", "cornerRadius": "md", "contents": [] } ] },
          // --- 論理思考 ---
          { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": "論理思考", "size": "sm", "color": "#555555", "flex": 0 }, { "type": "text", "text": "%%LOGIC%%%", "size": "sm", "color": "#111111", "align": "end" } ] },
          { "type": "box", "layout": "vertical", "backgroundColor": "#F0F0F0", "height": "6px", "cornerRadius": "md", "contents": [ { "type": "box", "layout": "vertical", "backgroundColor": "#DE4D41", "width": "%%LOGIC%%%", "height": "6px", "cornerRadius": "md", "contents": [] } ] },
          // --- 独占欲 ---
          { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": "独占欲", "size": "sm", "color": "#555555", "flex": 0 }, { "type": "text", "text": "%%POSSESSIVE%%%", "size": "sm", "color": "#111111", "align": "end" } ] },
          { "type": "box", "layout": "vertical", "backgroundColor": "#F0F0F0", "height": "6px", "cornerRadius": "md", "contents": [ { "type": "box", "layout": "vertical", "backgroundColor": "#DE4D41", "width": "%%POSSESSIVE%%%", "height": "6px", "cornerRadius": "md", "contents": [] } ] },
          // --- 競争心 ---
          { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": "競争心", "size": "sm", "color": "#555555", "flex": 0 }, { "type": "text", "text": "%%BATTLE%%%", "size": "sm", "color": "#111111", "align": "end" } ] },
          { "type": "box", "layout": "vertical", "backgroundColor": "#F0F0F0", "height": "6px", "cornerRadius": "md", "contents": [ { "type": "box", "layout": "vertical", "backgroundColor": "#DE4D41", "width": "%%BATTLE%%%", "height": "6px", "cornerRadius": "md", "contents": [] } ] },
          // --- 愛情 ---
          { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": "愛情", "size": "sm", "color": "#555555", "flex": 0 }, { "type": "text", "text": "%%LOVE%%%", "size": "sm", "color": "#111111", "align": "end" } ] },
          { "type": "box", "layout": "vertical", "backgroundColor": "#F0F0F0", "height": "6px", "cornerRadius": "md", "contents": [ { "type": "box", "layout": "vertical", "backgroundColor": "#DE4D41", "width": "%%LOVE%%%", "height": "6px", "cornerRadius": "md", "contents": [] } ] }
        ]
      }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "vertical",
    "spacing": "sm",
    "contents": [
      { "type": "separator" },
      {
        "type": "button",
        "action": {
          "type": "postback",
          "label": "キュンを送る",
          "data": "action=sendKyun&targetUserId=%%USERID%%",
          "displayText": "%%NICKNAME%%さんにキュンを送る"
        },
        "style": "primary",
        "height": "sm",
        "color": "#FF69B4" // ボタンの色をピンクに
      }
    ]
  }
}

// JSONのプレースホルダーを実際の値に置き換えたものを上記変数に設定してください。
// 例：
// demo_json.body.contents[0].contents[1].contents[0].text = "%%NICKNAME%%";