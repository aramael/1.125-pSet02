var express = require('express');

var app = express();

// lets make an http.request to another machine
var http = require('http');
app.get('/', function(req, res) {
    console.log('[INFO] Recieved request at ', req.url);
    console.log('[INFO] Redirecting request to /boston/total/>300000');
    res.redirect('/boston/total/>300000');
});

// Parsing Functions & API
var filterKey = {
    "NAME": 8,
    "DEPARTMENT_NAME": 9,
    "TITLE": 10,
    "REGULAR": 11,
    "RETRO": 12,
    "OTHER": 13,
    "OVERTIME": 14,
    "INJURY": 15,
    "DETAIL": 16,
    "EDUCATIONAL": 17,
    "TOTAL": 18,
    "POSTAL": 19
};

function complexNumericalFiltering(operator, a, b){
    switch (operator){
        case "<":
            return (a < b);
        case "<=":
            return (a <= b);
        case ">=":
            return (a >= b);
        case ">":
            return (a > b);
        case "==":
        default:
            return (a == b);
    }
    return null;
}

function complexFilter(filterSet){
    return function (element, i, list){
        if ("POSTAL" in filterSet){
            if(element[filterKey.POSTAL] != filterSet.POSTAL)
                return false;
        }
        if ("REGULAR" in filterSet && "operator" in filterSet.REGULAR && "value" in filterSet.REGULAR){
            if(!complexNumericalFiltering(filterSet.REGULAR.operator, Number(element[filterKey.REGULAR]), filterSet.REGULAR.value))
                return false;
        }
        if ("OVERTIME" in filterSet && "operator" in filterSet.OVERTIME && "value" in filterSet.OVERTIME){
            if(!complexNumericalFiltering(filterSet.OVERTIME.operator, Number(element[filterKey.OVERTIME]), filterSet.OVERTIME.value))
                return false;
        }
        if ("INJURY" in filterSet && "operator" in filterSet.INJURY && "value" in filterSet.INJURY){
            if(!complexNumericalFiltering(filterSet.INJURY.operator, Number(element[filterKey.INJURY]), filterSet.INJURY.value))
                return false;
        }
        if ("DETAIL" in filterSet && "operator" in filterSet.DETAIL && "value" in filterSet.DETAIL){
            if(!complexNumericalFiltering(filterSet.DETAIL.operator, Number(element[filterKey.DETAIL]), filterSet.DETAIL.value))
                return false;
        }
        if ("TOTAL" in filterSet && "operator" in filterSet.TOTAL && "value" in filterSet.TOTAL){
            if(!complexNumericalFiltering(filterSet.TOTAL.operator, Number(element[filterKey.TOTAL]), filterSet.TOTAL.value))
                return false;
        }
        return true;
    }
}

// Application Routing
app.get('/boston(/regular/:regularQuery)?(/overtime/:overtimeQuery)?(/injury/:injuryQuery)?(/detail/:detailQuery)?(/total/:totalQuery)?', function(req, res){
    console.log('[INFO] Recieved request at ', req.url);

    // Form Filter Body
    var filter = {};
    var operatorRegEx = /([<>=]=?)(\d+)/;

    if ("regularQuery" in req.params){
        var queryMatches = operatorRegEx.exec(req.params.regularQuery);
        if (queryMatches != null)
            filter["REGULAR"] = {"operator": queryMatches[1], "value": queryMatches[2]};
    }
    if ("overtimeQuery" in req.params){
        var queryMatches = operatorRegEx.exec(req.params.overtimeQuery);
        if (queryMatches != null)
            filter["OVERTIME"] = {"operator": queryMatches[1], "value": queryMatches[2]};
    }
    if ("injuryQuery" in req.params){
        var queryMatches = operatorRegEx.exec(req.params.injuryQuery);
        if (queryMatches != null)
            filter["INJURY"] = {"operator": queryMatches[1], "value": queryMatches[2]};
    }
    if ("detailQuery" in req.params){
        var queryMatches = operatorRegEx.exec(req.params.detailQuery);
        if (queryMatches != null)
            filter["DETAIL"] = {"operator": queryMatches[1], "value": queryMatches[2]};
    }
    if ("totalQuery" in req.params){
        var queryMatches = operatorRegEx.exec(req.params.totalQuery);
        if (queryMatches != null)
            filter["TOTAL"] = {"operator": queryMatches[1], "value": queryMatches[2]};
    }

    var options = {
        host: 'data.cityofboston.gov',
        path: '/api/views/sx2i-td3j/rows.json'
    };

    var callback = function(response) {
        var str='';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function(chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function() {
            var data = JSON.parse(str);
            var list = data.data;

            var filteredList = list.filter(complexFilter(filter));

            // filteredList.forEach(function (element){
            //     console.log( element[filterKey.NAME] +" ("+ element[filterKey.TITLE] +") "+ element[filterKey.TOTAL] +" <"+ element[filterKey.POSTAL]+">")
            // });
            // console.log("\nTotal Entries: "+filteredList.length);

            res.send(filteredList);
            
        });
    };
    
    http.request(options, callback).end();
});

app.listen(8080, function() {
    console.log('[INFO] Listening at: http://127.0.0.1:8000');
});