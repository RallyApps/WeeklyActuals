Utils = function() {
    //
    // ARRAY/OBJECT FUNCTIONS

    //
    // remove duplicates from array
    var removeDuplicates = function(a) {
        var list = [];
        for (var i = 0; i < a.length; i++) {
            var found = false;
            for (var j = 0; j < list.length; j++) {
                if (a[i] === list[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                list.push(a[i]);
            }
        }
        return list;
    };

    //
    // return an array of keys of an object
    var keys = function(obj) {
        var a = [];
        for (var key in obj) {
            if(obj.hasOwnProperty(key)) {
                a.push(key);
            }
        }
        return a;
    };


    //
    // OUTPUT FUNCTIONS
    var dumpObj = function(obj, name, indent, depth) {
        if (depth > 10) {
            return indent + name + ": <Maximum Depth Reached>\n";
        }
        if (typeof obj == "object") {
            var child = null;
            var output = indent + name + "<br>";
            indent += "&nbsp;&nbsp;&nbsp;&nbsp;";
            for (var item in obj) {

                if(obj.hasOwnProperty(item)) {
                    child = obj[item];
                    if (typeof child == "object") {
                        output += dumpObj(child, item, indent, depth + 1);
                    } else {
                        output += indent + item + ": " + child + "<br>";
                    }
                } else {
                    child = "<Unable to Evaluate>";
                }
            }
            return output;
        } else {
            return obj;
        }
    };

    var out = function(str) {
        document.body.innerHTML = document.body.innerHTML + str + "<br>";
    };

    var dump = function(obj, name) {
        document.body.innerHTML = document.body.innerHTML + dumpObj(obj, name, "", 0);
    };

    var obj = {
        removeDuplicates: removeDuplicates,
        keys: keys,
        out: out,
        dump: dump
    };

    return obj;
}();
