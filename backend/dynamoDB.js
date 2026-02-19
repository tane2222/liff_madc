const region = 'ap-northeast-1'// リージョンを選択 us-east-2 ap-northeast-3

const DYNAMODB_ACCESS_KEY = PropertiesService.getScriptProperties().getProperty('DYNAMODB_ACCESS_KEY')
const DYNAMODB_SECRET_ACCESS_KEY = PropertiesService.getScriptProperties().getProperty('DYNAMODB_SECRET_ACCESS_KEY')
AWS.init(DYNAMODB_ACCESS_KEY, DYNAMODB_SECRET_ACCESS_KEY)

const TABLE_MAIN = PropertiesService.getScriptProperties().getProperty('TABLE_MAIN')

//コンタクト(メイン)のアップデート
function updateDB_contact_Main() {
    
    for (let i = last_row; i >= 3; i--) {
      if (contact.getRange(i, 1).getValue() != '') {
      const id_1 = contact.getRange(i, 1).getValues()
      //const id_2 = contact.getRange(i, 2).getValues()
      //const id_3 = contact.getRange(i, 3).getValues()
      const id_4 = contact.getRange(i, 4).getValues()
      //const id_5 = contact.getRange(i, 5).getValues()
      const id_6 = contact.getRange(i, 6).getValues()
      const id_15 = contact.getRange(i, 15).getValues()
      const id_16 = contact.getRange(i, 16).getValues()
      const id_17 = contact.getRange(i, 17).getValues()
      const id_18 = contact.getRange(i, 18).getValues()
      const id_19 = contact.getRange(i, 19).getValues()
      const id_20 = contact.getRange(i, 20).getValues()
      const id_21 = contact.getRange(i, 21).getValues()
      
  
      const Id_1 = JSON.parse(JSON.stringify(...id_1[0]))
      //const Id_2 = JSON.parse(JSON.stringify(...id_2[0]))
      //const Id_3 = JSON.parse(JSON.stringify(...id_3[0]))
      const Id_4 = JSON.parse(JSON.stringify(...id_4[0]))
      //const Id_5 = JSON.parse(JSON.stringify(...id_5[0]))
      const Id_6 = JSON.parse(JSON.stringify(...id_6[0]))
      const Id_15 = JSON.parse(JSON.stringify(...id_15[0]))
      const Id_16 = JSON.parse(JSON.stringify(...id_16[0]))
      const Id_17 = JSON.parse(JSON.stringify(...id_17[0]))
      const Id_18 = JSON.parse(JSON.stringify(...id_18[0]))
      const Id_19 = JSON.parse(JSON.stringify(...id_19[0]))
      const Id_20 = JSON.parse(JSON.stringify(...id_20[0]))
      const Id_21 = JSON.parse(JSON.stringify(...id_21[0]))
      console.log(Id_4);
      
      const item = {
        userid: {S: Id_1},
        //a0_linename: {S: Id_2},
        //a0_name: {S: Id_3},
        oニックネーム: {S: Id_4},
        o性別: {S: Id_6},
        素直さ: {S: Id_15 +"点"},
        想像力: {S: Id_16 +"点"},
        論理思考: {S: Id_17 +"点"},
        独占欲: {S: Id_18 +"点"},
        競争心: {S: Id_19 +"点"},
        愛情: {S: Id_20 +"点"},
        コメント: {S: Id_21},
      }
      const res = AWS.request(
        'dynamodb',
        region,
        'DynamoDB_20120810.UpdateItem',
        {},
        'POST',
        { 
          TableName: TABLE_MAIN,
          Item: item,
          Key: {
            'userid': item.userid
          },
          ExpressionAttributeNames: {
            '#a0_n': 'oニックネーム',
            '#a0_s': 'o性別',
            '#a1_1': '素直さ',
            '#a1_2': '想像力',
            '#a1_3': '論理思考',
            '#a1_4': '独占欲',
            '#a1_5': '競争心',
            '#a1_6': '愛情',
            '#a1_f': 'コメント',
          },
          ExpressionAttributeValues: {
            ':newA0_n': item.oニックネーム,
            ':newA0_s': item.o性別,
            ':newA1_1': item.素直さ,
            ':newA1_2': item.想像力,
            ':newA1_3': item.論理思考,
            ':newA1_4': item.独占欲,
            ':newA1_5': item.競争心,
            ':newA1_6': item.愛情,
            ':newA1_f': item.コメント,
          },
          UpdateExpression: 'SET #a0_n = :newA0_n, #a0_s = :newA0_s, #a1_1 = :newA1_1, #a1_2 = :newA1_2, #a1_3 = :newA1_3, #a1_4 = :newA1_4, #a1_5 = :newA1_5, #a1_6 = :newA1_6, #a1_f = :newA1_f' //この列の最後に「,」を入れると400エラー出るので注意
        },
        { 'Content-Type': 'application/x-amz-json-1.0' },
      )     
  const code = res.getResponseCode()
  const text = res.getContentText()
  if (code < 200 || code >= 300) throw Error(`AWS.request failed: ${code} - ${text}`)
  Logger.log(`OK: ${TABLE_MAIN} - ${JSON.stringify(item)}`)
  
   }
  } 
}

 /**
*/
