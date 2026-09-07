function doGet(e) {
  var fromMonth = (e && e.parameter && e.parameter.from_month) || "Aug-2026";
  var toMonth = (e && e.parameter && e.parameter.to_month) || "Aug-2026";
  var fyYear = (e && e.parameter && e.parameter.fy_year) || "2026-2027";
  return handleFetch(fromMonth, toMonth, fyYear);
}

function doPost(e) {
  var fromMonth = "Aug-2026";
  var toMonth = "Aug-2026";
  var fyYear = "2026-2027";
  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      if (data.from_month) fromMonth = data.from_month.trim();
      if (data.to_month) toMonth = data.to_month.trim();
      if (data.fy_year) fyYear = data.fy_year;
    } catch(err) {}
  }
  return handleFetch(fromMonth, toMonth, fyYear);
}

function handleFetch(fromMonth, toMonth, fyYear) {
  var logs = [];
  try {
    var CBO_USER = "6958BANWARI";
    var CBO_PASS = "6958";
    logs.push("Target Month: " + fromMonth);

    function updateCookies(resp, existingCookies) {
      var allHeaders = resp.getAllHeaders();
      var jar = {};
      if (existingCookies) {
        existingCookies.split(';').forEach(function(c) {
          var p = c.trim().split('=');
          if (p[0]) jar[p[0]] = p.slice(1).join('=');
        });
      }
      for (var k in allHeaders) {
        if (k.toLowerCase() === 'set-cookie') {
          var raw = allHeaders[k];
          var list = Array.isArray(raw) ? raw : [raw];
          list.forEach(function(cookieStr) {
            var first = cookieStr.split(';')[0];
            var parts = first.split('=');
            if (parts[0]) jar[parts[0].trim()] = parts.slice(1).join('=').trim();
          });
        }
      }
      var out = [];
      for (var key in jar) {
        out.push(key + '=' + jar[key]);
      }
      return out.join('; ');
    }

    // 1. GET Login Page
    var loginUrl = "https://dios.myreporting.net/Login.aspx";
    var r1 = UrlFetchApp.fetch(loginUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      muteHttpExceptions: true
    });
    var cookieStr = updateCookies(r1, "");
    var htmlLogin = r1.getContentText();

    var vs = htmlLogin.match(/name="__VIEWSTATE"[^>]*value="([^"]*)"/i);
    var vsg = htmlLogin.match(/name="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"/i);
    var ev = htmlLogin.match(/name="__EVENTVALIDATION"[^>]*value="([^"]*)"/i);

    // 2. POST Login
    var loginParams = {
      "__VIEWSTATE": vs ? vs[1] : "",
      "__VIEWSTATEGENERATOR": vsg ? vsg[1] : "",
      "__EVENTVALIDATION": ev ? ev[1] : "",
      "txtUserName": CBO_USER,
      "txtPassword": CBO_PASS,
      "btnLogin": "Login"
    };

    var loginBody = Object.keys(loginParams).map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(loginParams[k]);
    }).join('&');

    var r2 = UrlFetchApp.fetch(loginUrl, {
      method: "post",
      payload: loginBody,
      headers: { 
        "Cookie": cookieStr, 
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0" 
      },
      followRedirects: false,
      muteHttpExceptions: true
    });
    cookieStr = updateCookies(r2, cookieStr);
    logs.push("Auth Status: " + r2.getResponseCode());

    // 3. Open Report Page
    var reportUrl = "https://dios.myreporting.net/RPT/PerformanceReview.aspx?format=Primary%20Sales&wise=P&DOC_TYPE=SS&RPT_HEADER=Monthly%20Sales-Summary&CBOYN=Y&FY_YEAR=" + fyYear + "&COMPANY_CODE=DIOS&PA_ID=6958&DESIG_ID=1&DESIG=BE&PA_NAME=BANWARI%20LAL%20MEENA&HEAD_QTR=UDAIPUR&DIVISION_NAME=DIOS%20GROUP&FMCGYN=N&MENU_STYLE=NONE&ACTION_FROM=ANDROID&LOGIN_PA_ID=6958&LOGIN_COMPANY_ID=1";

    var r3 = UrlFetchApp.fetch(reportUrl, {
      headers: { "Cookie": cookieStr, "User-Agent": "Mozilla/5.0" },
      muteHttpExceptions: true
    });
    cookieStr = updateCookies(r3, cookieStr);

    var monthMap = {"JAN":"01","FEB":"02","MAR":"03","APR":"04","MAY":"05","JUN":"06","JUL":"07","AUG":"08","SEP":"09","OCT":"10","NOV":"11","DEC":"12"};
    var mParts = fromMonth.split('-');
    var mNum = monthMap[mParts[0].toUpperCase()] || "08";
    var mYear = mParts[1] || "2026";
    var dateVal = mNum + "/01/" + mYear;

    // 4. Call GETDATAGRID
    var gridPayload = {
      'LOGIN_PA_ID': '6958',
      'GROUPON': 'null',
      'WISE': 'null',
      'FMONTH': dateVal,
      'TMONTH': dateVal,
      'COLUMN': 'PRI_QTY,PRI_VAL',
      'DATEYN': '0',
      'GROUPFILTER': '0',
      'WISEFILTER': '0',
      'TARGET_ID': '0',
      'LRTYPE': 'V',
      'SPL_ID': '0',
      'STATE_ID': '0',
      'HQ_ID': '0',
      'ITEM_ID': '0',
      'ITEMG_ID': '0',
      'ITEM_HR': '0',
      'GROUP_COULUMN': '',
      'STK_ID': '0',
      'ITEM_STATUS': '1',
      'QTRWISE_TOTALYN': '0',
      'HORIZONTALYN': '0',
      'BILLYN': '0',
      'ITEM_HR_ZERO': '0',
      'STK_STATUS_P': '0',
      'STK_STATUS_S': '0',
      'SALE_SHARE': 'H',
      'iLYSALE_ON_CYTEAM': '1',
      'sADD_COL': '',
      'iPRI_PERIOD': '0',
      'iROUDATA': '0',
      'iOUTST_PERIOD': '0',
      'ITEMG_ID_2': '0',
      'ITEMG_ID_3': '0',
      'iOUTST_BALANCE': '0',
      'COMPANY_ID': '0',
      'CRM_HQ_GROUP_ID': '0',
      'ITEMG_ID_4': '0',
      'PARTY_GROUP': '0'
    };

    var r4 = UrlFetchApp.fetch("https://dios.myreporting.net/RPT/PerformanceReview.aspx/GETDATAGRID", {
      method: "post",
      payload: JSON.stringify(gridPayload),
      headers: {
        "Cookie": cookieStr,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": reportUrl
      },
      muteHttpExceptions: true
    });
    cookieStr = updateCookies(r4, cookieStr);
    logs.push("GETDATAGRID Status: " + r4.getResponseCode());

    // 5. Call GETGROUPEDBYDATAGRID_1
    var drillPayload = {
      'GROUPCOLUMN': 'ITEM_NAME'
    };

    var r5 = UrlFetchApp.fetch("https://dios.myreporting.net/RPT/PerformanceReview.aspx/GETGROUPEDBYDATAGRID_1", {
      method: "post",
      payload: JSON.stringify(drillPayload),
      headers: {
        "Cookie": cookieStr,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": reportUrl
      },
      muteHttpExceptions: true
    });
    logs.push("GETGROUPEDBYDATAGRID_1 Status: " + r5.getResponseCode());

    var items = [];
    var rawD = JSON.parse(r5.getContentText()).d;
    if (rawD) {
      var tableObj = JSON.parse(rawD);
      var rows = tableObj.Table || [];
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var pName = row.ITEM_NAME || row.Product || row.ITEM_DESC || "";
        var qtyKey = "Primary_Qty_" + mParts[0].toUpperCase();
        var valKey = "Primary_Value_" + mParts[0].toUpperCase();
        var qty = row[qtyKey] || row.Primary_Qty || row.PRI_QTY || 0;
        var val = row[valKey] || row.Primary_Value || row.PRI_VAL || 0;
        if (pName) {
          items.push({ name: pName, qty: Number(qty), value: Number(val) });
        }
      }
    }

    var totalQty = 0;
    var totalVal = 0;
    for (var j = 0; j < items.length; j++) {
      totalQty += items[j].qty;
      totalVal += items[j].value;
    }

    logs.push("Extracted " + items.length + " products. Total: " + totalQty);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      from_month: fromMonth,
      to_month: toMonth,
      count: items.length,
      total_qty: totalQty,
      total_value: totalVal,
      items: items,
      logs: logs
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logs.push("ERROR: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString(),
      logs: logs
    })).setMimeType(ContentService.MimeType.JSON);
  }
}