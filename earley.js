function earley() {


    function parse( words, grammar, rootRule ) {
        $("#sent").prop('disabled', true);
        $("#txt").prop('disabled', true);
        $("#id1").prop('disabled', true);
        // ініціюємо таблицю
        // (довжина таблиці == кількість слів + 1)
        chartRes = [];
        for(var i = 0; i < words.length + 1; i++) 
         chartRes[i] = [];

         chart = [];
        for(var i = 0; i < words.length + 1; i++) 
         chart[i] = [];

         // використовується для індексації станів по id
        // (потрібно для бектрекінгу)
        var idToStateMap = {};
        var id = 0;
    
        // кожен стан містить поля:
        // 1) lhs - ліва частина правила (string)
        // 2) rhs - права частина правила (array)
        // 3) dot - покажчик на підпункт правої частини правила (якщо стан повний - крапка == довжина rhs) (int)
        // 4) pos - індекс колонки таблиці, яка містить стан, з якого був отриманий даний стан (int)
        // 5) id - унікальне id стану (int)
        // 6) ref - об'єкт з полями 'dot' (int) та 'ref' (int)
        // 'dot' - індекс правої частини підправила (int)
        // 'ref' - id стану, що походить від цього підпункту (int) - використовується для бектрекінгу, щоб генерувати дерево розбору
    
        // перевірка чи вказаний стан неповний
        // якщо 'dot' вказує на кінець правої сторони правила чи ні
        function incomplete( state ) {
         return state['dot'] < state['rhs'].length;
         }
    
        // щоразу перевіряє праву частину правила, на яку вказує "dot" - термінал або нетермінал
        function expectedNonTerminal( state, grammar ) {
            var expected = state['rhs'][state['dot']];
            if( grammar[expected] ) {
                return true;
            }
            return false;
        }
    
        // оголошує newState в стовпчику таблиці (індексується конкретною позицією)
        // також - додає id до newState, та додає його до індексу: idToStateMap
        // (якщо даний стовпець вже містить цей стан - не додайте дублікат, а "злиє" "ref")
        function addToChart( newState, position ) {
            if(!newState['ref']) 
             newState['ref'] = [];
             
            newState['id'] = id;   

            for(var x in chart[position]) {
                var chartState = chart[position][x];
                if(chartState['lhs'] == newState['lhs']
                    && chartState['dot'] == newState['dot']
                    && chartState['pos'] == newState['pos']
                    && chartState['left'] == newState['left']
                    && chartState['right'] == newState['right']
                    && JSON.stringify(chartState['rhs']) == JSON.stringify(newState['rhs'])) {
                    chartState['ref'] = chartState['ref'].concat(newState['ref']);
                    return;
                }
            }        
            chart[position].push(newState);
            idToStateMap[id] = newState;
            id++;
        }
    
        // ця функція викликається у випадку, коли 'dot' вказує на нетермінальний
        // використовуючи всі правила для заданих нетерміналів - створення нових станів, 
        // та додавання їх до таблиці (до стовпця з індексом 'j')
        function predictor( state, j, grammar ) {
            var nonTerm = state['rhs'][state['dot']];
            var productions = grammar[nonTerm];
            for(var i in productions) {
                var newState = {
                    'lhs': nonTerm,
                    'rhs': productions[i],
                    'dot': 0,
                    'pos': j,
                    'right': state['right'],
                    'left': state['right']
                };
                addToChart(newState, j);
            }
        }

        // ця функція викликається у випадку, коли 'dot' вказує на термінал
        // у випадку коли частина мови слова з індексом 'j' відповідає заданому терміналу -
        // (термінал - може генерувати цю частину мови, або термінал == word[j])
        // створення нового стану та додайте його до стовпця з індексом ('j' + 1)
        function scanner( state, j, grammar ) {
            var term = state['rhs'][state['dot']];
            var termPOS = grammar.partOfSpeech( words[j] );
            termPOS.push( words[j] );
            for(var i in termPOS) {
                if(term == termPOS[i]) {
                    var newState = {
                        'lhs': term,
                        'rhs': [words[j]],
                        'dot': 1,
                        'pos': j,
                        'right': state['right']+1,
                        'left' : state['right']
                    };
                    addToChart(newState, j + 1);
                    break;
                }
            }
        }
    
        // дана функція викликається, коли заданий стан виконано ('dot' == довжині'rhs')
        // це означає, що виявлений стан може бути приєднаний до батьківського стану (і зрушити крапку у батьківському стані)
        // насправді - батьківський стан не змінено, але генерується новий стан (батьківський стан клоновано + зсув точки) 
        // до таблиці додається новий стан (до стовпця з індексом 'k')
        function completer( state, k ) {
            var parentChart = chart[state['pos']];
            for(var i in parentChart) {
                var stateI = parentChart[i];
                if(stateI['rhs'][stateI['dot']] == state['lhs']) {
                    var newState = {
                        'lhs': stateI['lhs'],
                        'rhs': stateI['rhs'],
                        'dot': stateI['dot'] + 1,
                        'pos': stateI['pos'],
                        'left': stateI['left'],
                        'right': state['right'],
                        'ref': stateI['ref'].slice()
                    };
                    newState['ref'].push({
                        'dot': stateI['dot'],
                        'ref': state['id']
                    });
                    addToChart(newState, k);
                }
            }
        }
    
     // початок парсингу
        var rootRuleRhss = grammar[rootRule];
        for(var i in rootRuleRhss) {
            var initialState = {
                'lhs': rootRule,
                'rhs': rootRuleRhss[i],
                'dot': 0,
                'pos': 0,
                'left': 0,
                'right': 0
            };
            addToChart(initialState, 0);
        }
        for(var i = 0; i < words.length + 1; i++) {
            j = 0;
            while( j < chart[i].length) {
                var state = chart[i][j];
                if( incomplete(state) ) { 
                    if( expectedNonTerminal(state, grammar) ) {                                                            
                        predictor(state, i, grammar);                
                    } else {
                        scanner(state, i, grammar);
                    }
                } else {
                    completer(state, i);            
                }
                j++;
            }
        }
        // пошук стану, який має rootRule в lhs
        // ітерація через останній стовпець таблиці
        var roots = [];
        var lastChartColumn = chart[chart.length - 1];
        for(var i in lastChartColumn) {
            var state = lastChartColumn[i];
            if( state['lhs'] == rootRule && !incomplete( state ) ) {
                // це корінь дійсного дерева розбору
                roots.push(state);
            }
        }
        if(roots.length==0){
            document.getElementById("res").innerHTML+='"FALSE" - рядок не належить мові граматики!';
		}
        else{
            document.getElementById("res").innerHTML+='"TRUE" - рядок належить мові граматики!';
		}
    }


    // функція, яка повертає правила граматики 
    function processGrammar( grammar ) {
        var checkRule = /^(\w+)\s*->\s*(\w+)(?:\s+(\w+))?\s*\.?$/;
        var processed = {};
        for(var i in grammar) {
            var rule = grammar[i];
            if (rule.length == 0)
                continue;
            if (checkRule.exec(rule) == null) {
                alert("Правило введено некоректно: " + rule);
                location.reload();
            }
            var parts = rule.split('->');
            var lhs = parts[0].trim();
            var rhs = parts[1].trim();
            if(!processed[lhs]) 
                processed[lhs] = [];
            processed[lhs].push(rhs.split(' '));
        }
        processed.partOfSpeech = function( word ) {
            return [];
        }
        return processed;
    }

    function rootRule(grammar) {
        var rule = grammar[0];
        var parts = rule.split('->');
        return parts[0].trim();
    }

    function animation(){
        $("#sent").prop('disabled', true);
        $("#txt").prop('disabled', true);
        $("#id1").prop('disabled', true);
        $("#id2").prop('disabled', true);
        for(var i in chart){
            for(var j in chart[i]){
                var state = chart[i][j];
                if(chartRes[state['left']][state['right']]==null)
                    chartRes[state['left']][state['right']]=" ";
                chartRes[state['left']][state['right']] += toString(state);
            }
        }

        paintChart();
        n=0;
        for(i in chartRes){
            n++;
            for(j in chartRes[i]){
                if((j==i || j==n)&& n!=chartRes.length){
                    setTimeout(paint, timer, i, j, "blue");
                    setTimeout(fillCell, timer, i, j);
                    timer += sleep;
                    setTimeout(clean, timer, i, j);
                    k=i-1;
                    while(k>=0 && chartRes[k][j]!=" " && j==n) {
                        setTimeout(paint, timer, k, j, "gray");
                        setTimeout(fillCell, timer, k, j);
                        timer += sleep;
                        setTimeout(clean, timer, k, j);
                        k--;
                    }
                    
                }
            }
        }
    }

    grammar = document.getElementById('txt').value;
    sentence = document.getElementById('sent').value;
    grammar = grammar.split(/\r?\n/);
    parse(sentence.split(' '), processGrammar(grammar), rootRule(grammar) );
    animation();

    function toString(state) {
        var builder = [];
        if(state==null)
            return " ";
        builder.push(state['lhs']);
        builder.push('->');
        for (var i = 0; i < state['rhs'].length; i++) {
            if (i == state['dot']) {
                builder.push('.');
            }
            builder.push(state.rhs[i]);
        }
        if (state['dot'] == state['rhs'].length) {
            builder.push('.');
        }
        builder.push("<br>");

        return builder.join(' ');
    }
    function paintChart() {
        var html;
        var tdwidth = 100 / chartRes.length;
        var tdheight = (100 / chartRes.length) - 2;
  
        //динамічно створюємо таблицю по рядках
        for (var i = chartRes.length - 1; i > -1; i--){
        html += "<tr>";
        //динамічно створюємо кожну комірку
        for (var j = 0; j < chartRes.length; j++){
            html += "<td style=\"width:" + tdwidth + "%; height:" + tdheight + "%\" class=\"bordered " + i + "-" + j + "\">" + "&nbsp;";
            html += "</td>";
        }
            html += "</tr>";
        }
        $('.chart').append(html);
    }

    function fillCell(row, col) {
        getCell(row, col).html(chartRes[row][col]);
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
}