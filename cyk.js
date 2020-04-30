//передвється массив і зміннна, повертається індекс першого входження елементу в масиві, або -1
function arrayIndexOf(a, e) {
   if (a != null) {
     for (var i = 0; i < a.length; ++i) {
       if (a[i] == e)
        return i;
      }
   }
  return -1;
}

//з'єднує/зливає два масиви
function mergeArrays(a, b) {
  for (var i = 0; i < b.length; ++i) {
    if (arrayIndexOf(a, b[i]) == -1) {
      a.push(b[i]);
      }
    }
}

//функція-клас розпізнавання граматики
function Grammar(grammar) {
  this.terminalRules = new Array();
  this.nonTerminalRules = new Array();
      
  var checkRule = /^(\w+)\s*->\s*(\w+)(?:\s+(\w+))?\s*\.?$/;
  grammar = grammar.split(/\r?\n/);
      
  for (var i = 0; i < grammar.length; ++i) {
    var r = grammar[i];
    if (r.length == 0)
      continue;
      var a = checkRule.exec(r);
      if (a == null){
        alert("Правило введено некоректно: " + r);
        location.reload();
      }
        
      if (a[3]) {
        var newRule = new Array(a[1].trim(), a[2].trim(), a[3].trim());
        this.nonTerminalRules.push(newRule);
        if (this.s == null)
          this.s = new String(a[1]);
      }
      else
      {
        var newRule = new Array(a[1].trim(), a[2].trim());
        this.terminalRules.push(newRule);
      }
    }
    
    //повертає початковий символ граматики
    this.startSymbol = function() { return this.s;}
    
  //функція, яка перевіряє чи належить s правилам
  this.terminalRulesProcess = function(s) {
   var res = new Array();
   for (var i = 0; i < this.terminalRules.length; ++i) {
     var r = this.terminalRules[i];
     if (r[1] == s)
      res.push(r[0]);
    }
    return res;
  }
   
  this.nonTerminalRulesProcess = function(s, t) {
    var res = new Array();
    for (var i = 0; i < this.nonTerminalRules.length; ++i) {
      var r = this.nonTerminalRules[i];
      if (r[1] == s && r[2] == t)
        res.push(r[0]);
    }
    return res;
  }
      
  return this;
}
   
//розбиває речення ня масив слів    
function splitSentence(sentence) {
  var s = sentence.split(/\s+/);
  return s;
}


//основна функція, яка ревлізує алгоритм та його візуалізацію   
function cky() {
  grammar = document.getElementById('txt').value;
  sentence = document.getElementById('sent').value;
  $("#sent").prop('disabled', true);
  $("#txt").prop('disabled', true);
  $("#id1").prop('disabled', true);
  $("#id2").prop('disabled', true);

  G = new Grammar(grammar);
  S = splitSentence(sentence);
  N = S.length;

  //глобально створюємо таблицю
  chart = new Array(N);

  //створюємо двовимірний масив/таблицю значень
  for (var i = 0; i < chart.length; i++)
   chart[i] = new Array(N - (i));

  //початок алгоритму
  for (var j = 0; j < chart[0].length; j++)
    chart[0][j] = G.terminalRulesProcess(S[j]);

  paintChart();
      
  for (var i = 1; i < N; ++i) {
    for (var j = 0; j < N - i; ++j) {
      var temp = chart[i][j];

      setTimeout(paint, timer, i, j, "blue");
      timer += sleep;

      for (var k = i - 1; k >= 0; --k) {
        var t1 = chart[k][j];
        var t2 = chart[i - k - 1][j + k + 1];

        setTimeout(paintPair, timer, k, j, i-k-1, j+k+1, "gray");
        timer += sleep;
            
        if (t1 != null && t2 != null) {
          for (var q = 0; q < t1.length; ++q) {
            var temp1 = t1[q];
            for (var p = 0; p < t2.length; ++p) {
              var temp2 = t2[p];
              var res = G.nonTerminalRulesProcess(temp1, temp2);
              if (res == 0 || res.length == 0)
                continue;
              if (temp == null) {
                temp = new Array();
                chart[i][j] = temp;

                setTimeout(paint, timer, i, j, "green");
                setTimeout(fillCell, timer, i, j);
                timer += sleep;
                setTimeout(cleanPair, timer, k, j, i-k-1, j+k+1);

              }
              mergeArrays(temp, res);
            }
          }
        }

        setTimeout(cleanPair, timer, k, j, i-k-1, j+k+1);
      }

      clean(i, j);
      setTimeout(clean, timer, i, j);
    }
  }

  var accepted = arrayIndexOf(chart[N - 1][0], G.startSymbol());
  if(accepted==-1){
	document.getElementById("res").innerHTML+='"FALSE" - рядок не належить мові граматики!';
  }
  else{
    document.getElementById("res").innerHTML+='"TRUE" - рядок належить мові граматики!';
  }
  return accepted;
}

///////////////////////////////////////////////////////////////

var timer = 0; 
var sleep = 500;

//замовнюємо комірку значеннями
function fillCell(row, col) {
  getCell(row, col).html(chart[row][col]);
}

//створюємо таблицю
function paintChart() {
  var html;
  var tdwidth = 100 / S.length;
  var tdheight = (100 / S.length) - 2;
  
  //динамічно створюємо таблицю по рядках
  for (var i = chart.length - 1; i > -1; i--){
    html += "<tr>";
    //динамічно створюємо кожну комірку
    for (var j = 0; j < chart[i].length; j++){
      html += "<td style=\"width:" + tdwidth + "%; height:" + tdheight + "%\" class=\"bordered " + i + "-" + j + "\">";
      html += "</td>";
    }

    html += "</tr>";
  }
  //заповнюємо нижчній ряд словами речення 
  for (var k = 0; k < S.length; k++) {
      html += "<td class=\"words\">" + S[k] + "</td>";

      setTimeout(fillCell, timer, 0, k);
      setTimeout(paint, timer, 0, k, "blue");
      timer += sleep;
      setTimeout(clean, timer, 0, k);
  }

  $('.chart').append(html);
}

function getCell(row, col) {
  return $("." + row + "-" + col);
}

function paint(row, col, color) {
  clean(row, col);
  getCell(row, col).addClass(color);
}

function clean(row, col) {
  getCell(row, col).removeClass("blue green gray");
}

function paintPair(lrow, lcol, rrow, rcol, color) {
  paint(lrow, lcol, color);
  paint(rrow, rcol, color);
}

function cleanPair(lrow, lcol, rrow, rcol) {
  clean(lrow, lcol);
  clean(rrow, rcol);
}
///////////////////////////////////////////////////////