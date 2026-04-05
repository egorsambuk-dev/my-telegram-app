// ============================================
// The Knot'S — Синхронизация таблицы с GitHub
// Вставить в Google Apps Script
// ============================================

// ⚠️ ЗАПОЛНИ ЭТИ ТРИ ПОЛЯ:
const GITHUB_TOKEN = 'ВАШ_GITHUB_TOKEN';        // Personal Access Token с GitHub
const GITHUB_REPO  = 'egorsambuk-dev/my-telegram-app';
const GITHUB_FILE  = 'catalog.json';             // путь к файлу в репо

// ============================================
// Главная функция — запускается кнопкой
// ============================================
function syncToGitHub() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows  = sheet.getDataRange().getValues();

  // Первая строка — заголовки, пропускаем
  const headers = rows[0];
  const items   = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Пропускаем пустые строки
    if (!row[0] || !row[1]) continue;

    items.push({
      id:          String(row[0]).trim(),
      name:        String(row[1]).trim(),
      type:        String(row[2]).trim().toLowerCase(),
      stone:       String(row[3]).trim(),
      price:       Number(row[4]) || 0,
      audience:    String(row[5]).trim(),
      description: String(row[6]).trim(),
      inStock:     String(row[7]).trim().toLowerCase() !== 'нет',
      isNew:       String(row[8]).trim().toLowerCase() === 'да',
      photo:       String(row[9]).trim() || '',
    });
  }

  const json    = JSON.stringify(items, null, 2);
  const encoded = Utilities.base64Encode(Utilities.newBlob(json).getBytes());

  // Получаем текущий SHA файла (нужен для обновления)
  const sha = getCurrentSha();

  const payload = {
    message: 'Обновление каталога из Google Таблицы',
    content:  encoded,
  };
  if (sha) payload.sha = sha;

  const options = {
    method:  'PUT',
    headers: {
      Authorization:  'token ' + GITHUB_TOKEN,
      'Content-Type': 'application/json',
      'User-Agent':   'TheKnotsApp',
    },
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const url      = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
  const response = UrlFetchApp.fetch(url, options);
  const code     = response.getResponseCode();

  if (code === 200 || code === 201) {
    SpreadsheetApp.getUi().alert('✅ Каталог успешно обновлён!\n\nТовары: ' + items.length);
  } else {
    SpreadsheetApp.getUi().alert('❌ Ошибка: ' + response.getContentText());
  }
}

function getCurrentSha() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
  const options = {
    method: 'GET',
    headers: {
      Authorization: 'token ' + GITHUB_TOKEN,
      'User-Agent':  'TheKnotsApp',
    },
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    return JSON.parse(response.getContentText()).sha;
  }
  return null;
}

// Добавляет кнопку "Обновить каталог" в меню таблицы
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧵 The Knot\'S')
    .addItem('Обновить каталог в Mini App', 'syncToGitHub')
    .addToUi();
}
