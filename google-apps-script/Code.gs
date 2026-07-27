const SHEETS = {
  CITIES: "Cities",
  MUSEUMS: "Museums",
  PLAYERS: "Players",
  ROUTES: "Routes",
};

const HEADERS = {
  Cities: ["city_id", "city_ru", "city_en", "country", "active"],
  Museums: ["museum_id", "city_id", "museum_ru", "museum_en", "active"],
  Players: ["player_id", "nickname", "created_at", "status"],
  Routes: [
    "route_id",
    "completed_at",
    "player_id",
    "nickname",
    "city_id",
    "museum_id",
    "duration",
    "stages",
    "points",
    "ranking_date",
    "qualified_stages",
    "answer_count",
    "photo_count",
    "downloaded",
    "shared",
  ],
};

const SCORE = {
  STAGE: 10,
  ANSWER: 5,
  PHOTO: 10,
  DOWNLOAD: 10,
  SHARE: 20,
};

/**
 * Run once after pasting the script.
 * It adds headers to empty sheets and checks the names of existing columns.
 */
function setupMuseumAdventure() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(HEADERS).forEach(function (sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

    const requiredHeaders = HEADERS[sheetName];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, requiredHeaders.length).setFontWeight("bold");
      return;
    }

    const existingWidth = Math.max(sheet.getLastColumn(), 1);
    const actualHeaders = sheet.getRange(1, 1, 1, existingWidth).getDisplayValues()[0];
    const existingHeaders = actualHeaders.filter(function (header) {
      return String(header).trim() !== "";
    });
    const expectedExisting = requiredHeaders.slice(0, existingHeaders.length);

    if (existingHeaders.join("|") !== expectedExisting.join("|")) {
      throw new Error(
        'Проверьте заголовки листа "' +
          sheetName +
          '". Должно быть: ' +
          requiredHeaders.join(", "),
      );
    }
    if (existingHeaders.length < requiredHeaders.length) {
      const missingHeaders = requiredHeaders.slice(existingHeaders.length);
      sheet
        .getRange(1, existingHeaders.length + 1, 1, missingHeaders.length)
        .setValues([missingHeaders])
        .setFontWeight("bold");
    }
    sheet.setFrozenRows(1);
  });

  return "Museum Adventure sheets are ready";
}

/**
 * Run once. Copy the generated key from the execution log into Vercel.
 */
function generateLeaderboardApiKey() {
  const key = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  PropertiesService.getScriptProperties().setProperty("LEADERBOARD_API_KEY", key);
  console.log("LEADERBOARD_API_KEY=" + key);
  return key;
}

function doGet(event) {
  try {
    const parameters = (event && event.parameter) || {};
    assertApiKey_(parameters.apiKey);

    if (parameters.action === "locations") {
      return jsonOutput_({ ok: true, ...getLocations_() });
    }

    if (parameters.action === "leaderboard") {
      return jsonOutput_({
        ok: true,
        ...getLeaderboard_({
          period: parameters.period || "month",
          cityId: parameters.cityId || "",
          museumId: parameters.museumId || "",
          playerId: parameters.playerId || "",
        }),
      });
    }

    return jsonOutput_({ ok: false, error: "UNKNOWN_ACTION" });
  } catch (error) {
    return errorOutput_(error);
  }
}

function doPost(event) {
  try {
    const body = JSON.parse((event && event.postData && event.postData.contents) || "{}");
    assertApiKey_(body.apiKey);

    if (body.action === "saveResult") {
      return jsonOutput_({ ok: true, ...saveResult_(body) });
    }
    if (body.action === "addBonus") {
      return jsonOutput_({ ok: true, ...addBonus_(body) });
    }
    return jsonOutput_({ ok: false, error: "UNKNOWN_ACTION" });
  } catch (error) {
    return errorOutput_(error);
  }
}

function saveResult_(body) {
  const playerId = cleanId_(body.playerId, "playerId");
  const nickname = cleanNickname_(body.nickname);
  const cityName = cleanLocationName_(body.cityName, "cityName");
  const museumName = cleanLocationName_(body.museumName, "museumName");
  const duration = body.duration === "quick" ? "quick" : body.duration === "full" ? "full" : "";
  const expectedStages = duration === "quick" ? 3 : 5;
  const stages = Number(body.stages);
  const qualifiedStages = clampCount_(body.qualifiedStages, stages);
  const answerCount = clampCount_(body.answerCount, stages);
  const photoCount = clampCount_(body.photoCount, stages);

  if (!duration || stages !== expectedStages) throw new Error("INVALID_ROUTE");

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const routeSheet = spreadsheet.getSheetByName(SHEETS.ROUTES);
    const playerSheet = spreadsheet.getSheetByName(SHEETS.PLAYERS);
    const location = ensureLocation_(spreadsheet, cityName, museumName);
    const cityId = location.cityId;
    const museumId = location.museumId;
    const routes = readObjects_(routeSheet);
    const timezone = spreadsheet.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
    const now = new Date();
    const rankingDate = Utilities.formatDate(now, timezone, "yyyy-MM-dd");

    const duplicate = routes.some(function (route) {
      return (
        String(route.player_id) === playerId &&
        String(route.museum_id) === museumId &&
        normalizeDate_(route.ranking_date, timezone) === rankingDate
      );
    });

    if (duplicate) throw new Error("ALREADY_RECORDED_TODAY");

    const playerRoutes = routes.filter(function (route) {
      return String(route.player_id) === playerId;
    });
    const stagePoints = qualifiedStages * SCORE.STAGE;
    const answerPoints = answerCount * SCORE.ANSWER;
    const photoPoints = photoCount * SCORE.PHOTO;
    const points = stagePoints + answerPoints + photoPoints;

    upsertPlayer_(playerSheet, playerId, nickname, now);

    const routeId = Utilities.getUuid();
    routeSheet.appendRow([
      routeId,
      now,
      playerId,
      nickname,
      cityId,
      museumId,
      duration,
      stages,
      points,
      rankingDate,
      qualifiedStages,
      answerCount,
      photoCount,
      false,
      false,
    ]);

    SpreadsheetApp.flush();

    const allRoutes = routes.concat([
      {
        route_id: routeId,
        completed_at: now,
        player_id: playerId,
        nickname: nickname,
        city_id: cityId,
        museum_id: museumId,
        duration: duration,
        stages: stages,
        points: points,
        ranking_date: rankingDate,
        qualified_stages: qualifiedStages,
        answer_count: answerCount,
        photo_count: photoCount,
        downloaded: false,
        shared: false,
      },
    ]);

    const cityRanking = buildRanking_(allRoutes, {
      period: "month",
      cityId: cityId,
      museumId: "",
      playerId: playerId,
      timezone: timezone,
      now: now,
    });
    const museumRanking = buildRanking_(allRoutes, {
      period: "month",
      cityId: cityId,
      museumId: museumId,
      playerId: playerId,
      timezone: timezone,
      now: now,
    });
    const totalPoints = playerRoutes.reduce(function (sum, route) {
      return sum + Number(route.points || 0);
    }, 0) + points;
    const globalRanking = buildRanking_(allRoutes, {
      period: "month",
      cityId: "",
      museumId: "",
      playerId: playerId,
      timezone: timezone,
      now: now,
    });

    return {
      routeId: routeId,
      cityId: cityId,
      museumId: museumId,
      cityName: cityName,
      museumName: museumName,
      pointsEarned: points,
      totalPoints: totalPoints,
      globalRank: globalRanking.currentPlayer ? globalRanking.currentPlayer.rank : null,
      cityRank: cityRanking.currentPlayer ? cityRanking.currentPlayer.rank : null,
      museumRank: museumRanking.currentPlayer ? museumRanking.currentPlayer.rank : null,
      bonuses: {
        stages: stagePoints,
        answers: answerPoints,
        photos: photoPoints,
        download: 0,
        share: 0,
      },
    };
  } finally {
    lock.releaseLock();
  }
}

function addBonus_(body) {
  const playerId = cleanId_(body.playerId, "playerId");
  const routeId = cleanId_(body.routeId, "routeId");
  const bonusType = body.bonusType === "download" ? "download" : body.bonusType === "share" ? "share" : "";
  if (!bonusType) throw new Error("INVALID_BONUS");

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEETS.ROUTES);
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) throw new Error("ROUTE_NOT_FOUND");
    const headers = values[0].map(function (value) {
      return String(value).trim();
    });
    const indexes = {};
    headers.forEach(function (header, index) {
      indexes[header] = index;
    });
    const rowIndex = values.slice(1).findIndex(function (row) {
      return String(row[indexes.route_id]) === routeId && String(row[indexes.player_id]) === playerId;
    });
    if (rowIndex === -1) throw new Error("ROUTE_NOT_FOUND");

    const absoluteRow = rowIndex + 2;
    const flagHeader = bonusType === "download" ? "downloaded" : "shared";
    const bonus = bonusType === "download" ? SCORE.DOWNLOAD : SCORE.SHARE;
    const alreadyAwarded = isActive_(values[rowIndex + 1][indexes[flagHeader]]);
    if (!alreadyAwarded) {
      sheet.getRange(absoluteRow, indexes[flagHeader] + 1).setValue(true);
      const currentPoints = Number(values[rowIndex + 1][indexes.points] || 0);
      sheet.getRange(absoluteRow, indexes.points + 1).setValue(currentPoints + bonus);
      SpreadsheetApp.flush();
    }

    const routes = readObjects_(sheet);
    const route = routes.find(function (item) {
      return String(item.route_id) === routeId;
    });
    const now = new Date();
    const timezone = spreadsheet.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
    const globalRanking = buildRanking_(routes, {
      period: "month",
      cityId: "",
      museumId: "",
      playerId: playerId,
      timezone: timezone,
      now: now,
    });
    const cityRanking = buildRanking_(routes, {
      period: "month",
      cityId: String(route.city_id),
      museumId: "",
      playerId: playerId,
      timezone: timezone,
      now: now,
    });
    const museumRanking = buildRanking_(routes, {
      period: "month",
      cityId: String(route.city_id),
      museumId: String(route.museum_id),
      playerId: playerId,
      timezone: timezone,
      now: now,
    });
    const totalPoints = routes
      .filter(function (item) {
        return String(item.player_id) === playerId;
      })
      .reduce(function (sum, item) {
        return sum + Number(item.points || 0);
      }, 0);

    return {
      routeId: routeId,
      bonusType: bonusType,
      bonusAwarded: alreadyAwarded ? 0 : bonus,
      bonusValue: bonus,
      pointsEarned: Number(route.points || 0),
      totalPoints: totalPoints,
      globalRank: globalRanking.currentPlayer ? globalRanking.currentPlayer.rank : null,
      cityRank: cityRanking.currentPlayer ? cityRanking.currentPlayer.rank : null,
      museumRank: museumRanking.currentPlayer ? museumRanking.currentPlayer.rank : null,
    };
  } finally {
    lock.releaseLock();
  }
}

function ensureLocation_(spreadsheet, cityName, museumName) {
  const citySheet = spreadsheet.getSheetByName(SHEETS.CITIES);
  const museumSheet = spreadsheet.getSheetByName(SHEETS.MUSEUMS);
  const cities = readObjects_(citySheet);
  const museums = readObjects_(museumSheet);
  const normalizedCity = normalizeLocation_(cityName);
  const normalizedMuseum = normalizeLocation_(museumName);

  let city = cities.find(function (item) {
    return normalizeLocation_(item.city_ru) === normalizedCity || normalizeLocation_(item.city_en) === normalizedCity;
  });
  if (!city) {
    city = {
      city_id: locationId_("city", normalizedCity),
      city_ru: cityName,
      city_en: cityName,
    };
    citySheet.appendRow([city.city_id, cityName, cityName, "", true]);
  }

  let museum = museums.find(function (item) {
    return (
      String(item.city_id) === String(city.city_id) &&
      (normalizeLocation_(item.museum_ru) === normalizedMuseum ||
        normalizeLocation_(item.museum_en) === normalizedMuseum)
    );
  });
  if (!museum) {
    museum = {
      museum_id: locationId_("museum", String(city.city_id) + "|" + normalizedMuseum),
      city_id: city.city_id,
      museum_ru: museumName,
      museum_en: museumName,
    };
    museumSheet.appendRow([museum.museum_id, city.city_id, museumName, museumName, true]);
  }

  return { cityId: String(city.city_id), museumId: String(museum.museum_id) };
}

function getLocations_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const cities = readObjects_(spreadsheet.getSheetByName(SHEETS.CITIES))
    .filter(function (row) {
      return isActive_(row.active);
    })
    .map(function (row) {
      return {
        id: String(row.city_id),
        ru: String(row.city_ru),
        en: String(row.city_en),
        country: String(row.country || ""),
      };
    });

  const activeCityIds = new Set(
    cities.map(function (city) {
      return city.id;
    }),
  );

  const museums = readObjects_(spreadsheet.getSheetByName(SHEETS.MUSEUMS))
    .filter(function (row) {
      return isActive_(row.active) && activeCityIds.has(String(row.city_id));
    })
    .map(function (row) {
      return {
        id: String(row.museum_id),
        cityId: String(row.city_id),
        ru: String(row.museum_ru),
        en: String(row.museum_en),
      };
    });

  return { cities: cities, museums: museums };
}

function getLeaderboard_(filters) {
  if (filters.period !== "month" && filters.period !== "all") {
    throw new Error("INVALID_PERIOD");
  }
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const routes = readObjects_(spreadsheet.getSheetByName(SHEETS.ROUTES));

  return buildRanking_(routes, {
    period: filters.period,
    cityId: filters.cityId,
    museumId: filters.museumId,
    playerId: filters.playerId,
    timezone: spreadsheet.getSpreadsheetTimeZone() || Session.getScriptTimeZone(),
    now: new Date(),
  });
}

function buildRanking_(routes, filters) {
  const currentMonth = Utilities.formatDate(filters.now, filters.timezone, "yyyy-MM");
  const totals = new Map();

  routes.forEach(function (route) {
    if (filters.cityId && String(route.city_id) !== filters.cityId) return;
    if (filters.museumId && String(route.museum_id) !== filters.museumId) return;

    const rankingDate = normalizeDate_(route.ranking_date, filters.timezone);
    if (filters.period === "month" && rankingDate.slice(0, 7) !== currentMonth) return;

    const playerId = String(route.player_id);
    const current = totals.get(playerId) || {
      playerId: playerId,
      nickname: String(route.nickname || "Museum Explorer"),
      points: 0,
      routes: 0,
    };
    current.nickname = String(route.nickname || current.nickname);
    current.points += Number(route.points || 0);
    current.routes += 1;
    totals.set(playerId, current);
  });

  const sorted = Array.from(totals.values()).sort(function (a, b) {
    if (b.points !== a.points) return b.points - a.points;
    if (b.routes !== a.routes) return b.routes - a.routes;
    return a.nickname.localeCompare(b.nickname);
  });

  let previousPoints = null;
  let rank = 0;
  const ranked = sorted.map(function (item) {
    if (item.points !== previousPoints) rank += 1;
    previousPoints = item.points;
    return { ...item, rank: rank };
  });

  const currentPlayer = filters.playerId
    ? ranked.find(function (item) {
        return item.playerId === filters.playerId;
      }) || null
    : null;

  return {
    period: filters.period,
    cityId: filters.cityId || null,
    museumId: filters.museumId || null,
    updatedAt: new Date().toISOString(),
    entries: ranked,
    currentPlayer: currentPlayer,
  };
}

function upsertPlayer_(sheet, playerId, nickname, now) {
  const players = readObjects_(sheet);
  const index = players.findIndex(function (player) {
    return String(player.player_id) === playerId;
  });

  if (index === -1) {
    sheet.appendRow([playerId, nickname, now, "active"]);
    return;
  }

  const rowNumber = index + 2;
  sheet.getRange(rowNumber, 2).setValue(nickname);
}

function readObjects_(sheet) {
  if (!sheet) throw new Error("MISSING_SHEET");
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(function (value) {
    return String(value).trim();
  });

  return values.slice(1).filter(function (row) {
    return row.some(function (value) {
      return value !== "";
    });
  }).map(function (row) {
    return headers.reduce(function (object, header, index) {
      object[header] = row[index];
      return object;
    }, {});
  });
}

function assertApiKey_(providedKey) {
  const expectedKey = PropertiesService.getScriptProperties().getProperty("LEADERBOARD_API_KEY");
  if (!expectedKey) {
    throw new Error("API_KEY_NOT_CONFIGURED");
  }
  if (!providedKey || providedKey !== expectedKey) throw new Error("UNAUTHORIZED");
}

function cleanId_(value, fieldName) {
  const cleaned = String(value || "").trim();
  if (!/^[a-zA-Z0-9_-]{2,80}$/.test(cleaned)) throw new Error("INVALID_" + fieldName.toUpperCase());
  return cleaned;
}

function cleanNickname_(value) {
  const nickname = String(value || "").trim().replace(/\s+/g, " ");
  if (nickname.length < 2 || nickname.length > 24) throw new Error("INVALID_NICKNAME");
  if (!/^[\p{L}\p{N} _.-]+$/u.test(nickname)) throw new Error("INVALID_NICKNAME");
  return nickname;
}

function cleanLocationName_(value, fieldName) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) throw new Error("INVALID_" + fieldName.toUpperCase());
  return name;
}

function clampCount_(value, maximum) {
  const count = Math.floor(Number(value));
  if (!Number.isFinite(count) || count < 0) return 0;
  return Math.min(count, maximum);
}

function normalizeLocation_(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function locationId_(prefix, value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8,
  );
  const hex = digest
    .map(function (byte) {
      const normalized = byte < 0 ? byte + 256 : byte;
      return ("0" + normalized.toString(16)).slice(-2);
    })
    .join("");
  return prefix + "_" + hex.slice(0, 16);
}

function normalizeDate_(value, timezone) {
  if (value instanceof Date) return Utilities.formatDate(value, timezone, "yyyy-MM-dd");
  const text = String(value || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function isActive_(value) {
  return value === true || String(value).toLowerCase() === "true" || String(value) === "1";
}

function errorOutput_(error) {
  const message = error && error.message ? error.message : "UNKNOWN_ERROR";
  return jsonOutput_({ ok: false, error: message });
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
