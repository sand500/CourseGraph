var request = require("request");
var fs = require('fs');

var pat = new RegExp(/"[^"]*p_disp_course_detail.*"/g);


//generateLocalCache();
parseAllCourses();

function parseAllCourses() {
    var courseDB = {};
    fs.writeFile('PREreqs.txt', '', function() {
        console.log('Cleared Output File');
    });

    var brokenCourses = "";

    for (var fn_I = 0; fn_I <= 6375; fn_I++) {
        var courseFile = fs.readFileSync("courseCache/oscar" + fn_I + ".txt", {
            encoding: "utf-8"
        });

        var pppp = FindPrereqs(courseFile);
        try {
            var prereqTree = parsePrereqsIntoObjects(pppp);
            var courseName = findCourseName(courseFile);
            var courseNumber = courseName.split("-")[0].trim();
            var courseTitle = courseName.split("-")[1].trim();
            var classObj = {
                name: courseNumber,
                title: courseTitle,
                children: [prereqTree]
            };
            console.log(courseName);

            var courseMajor;
            if (courseNumber.split(' ').length > 1) {
                courseMajor = courseNumber.split(' ')[0];
            } else {
                throw new Error();
            }
            if (typeof courseDB[courseMajor] === "undefined") {
                courseDB[courseMajor] = {};
            }
            courseDB[courseMajor][courseNumber] = classObj;

            var lineOfFile = fn_I + " " + courseName + " " + JSON.stringify(classObj) + " \n\n>> " + pppp + " << " + "\n\n-------------------------------------------------------\n\n\n";
            fs.appendFileSync("PREreqs.txt", lineOfFile);
        } catch (err) {
            brokenCourses += findCourseName(courseFile) + "\n";
        }

    }
    fs.appendFileSync("PREreqs.txt", JSON.stringify(courseDB));
    console.log("\n\nBroken Courses:\n\n" + brokenCourses);

    for (var prop in courseDB) {
        fs.appendFileSync("jsonFiles/"+prop + ".json", JSON.stringify(courseDB[prop]));
    }


    function FindPrereqs(courseString) {
        var noMarkupPat = new RegExp(/<[^>]*>/g);

        var p = courseFile.indexOf("Prerequisites:");
        if (p == -1) return "";
        var b1 = courseFile.indexOf("<br />", p);
        var b2 = courseFile.indexOf("<br />", b1 + 1);
        var s = courseFile.substring(b1, b2).replace(/Undergraduate Semester level/g, "")
            .replace(/Graduate Semester level/g, "")
            .replace(noMarkupPat, "").replace(/\n/g, '').replace(/Minimum Grade of [A-Z]/g, "");
        return s;
    }

    function findCourseName(courseString) {
        var noMarkupPat = new RegExp(/<[^>]*>/g);

        var courseName = (courseString.match(/.*colgroup.*/g) + " ").replace(noMarkupPat, "");
        return courseName;
    }

    function parsePrereqsIntoObjects(prereqString) {
        var ro;
        var pCount = 0;
        var lastParen = -1;
        var firstParen;
        var returnString = "";
        var returnObject = {
            name: "_",
            children: []
        };
        //console.log("> "+prereqString)
        if (prereqString.indexOf('(') == -1 && prereqString.indexOf(')') == -1) {
            return simpleStringToObject(prereqString);

        }
        for (var i = 0; i < prereqString.length; i++) {
            if (prereqString.charAt(i) == '(') {
                if (pCount === 0) {
                    firstParen = i;
                }
                pCount++;
            }
            if (prereqString.charAt(i) == ')') {
                pCount--;
                if (pCount === 0) {
                    //console.log("recurse: " + firstParen + " " + i  + "\n");
                    returnObject.children.push(parsePrereqsIntoObjects(prereqString.substring(firstParen + 1, i)));

                    ro = simpleStringToObject(prereqString.substring(lastParen + 1, firstParen));


                    if (!(typeof ro === 'undefined' || ro === null)) {
                        //console.log(" - "+JSON.stringify(returnObject)+"\n");
                        //console.log(" - "+JSON.stringify(ro)+"\n");
                        if (returnObject.name == ("_")) {
                            returnObject.name = ro.name;
                        }
                        returnObject.children = returnObject.children.concat(ro.children);
                    }


                    lastParen = i;
                }
            }

        }

        ro = simpleStringToObject(prereqString.substring(lastParen + 1, prereqString.length));
        if (!(typeof ro === 'undefined' || ro === null)) {
            //console.log(" - "+JSON.stringify(returnObject)+"\n");
            //console.log(" - "+JSON.stringify(ro)+"\n");
            if (returnObject.name == ("_")) {
                returnObject.name = ro.name;
            }
            returnObject.children = returnObject.children.concat(ro.children);
        }



        return returnObject;
    }

    function simpleStringToObject(s) {
        //console.log(s);
        if (s.trim().length === 0) {
            return;
        }
        if (s.indexOf('and') != -1 && s.indexOf('or') != -1) {
            throw new Error('something bad happened\n' + s + "\n");
        }

        var sArr;
        var o;
        if (s.indexOf('and') != -1) {
            sArr = s.split('and');
            o = {
                name: "and",
                children: []
            };
            sArr.forEach(function(entry) {
                if (entry.trim().length === 0) {
                    return;
                }
                o.children.push({
                    name: entry.trim(),
                    children: []
                });
            });

            return o;
        } else if (s.indexOf('or') != -1) {
            sArr = s.split('or');
            o = {
                name: "or",
                children: []
            };
            sArr.forEach(function(entry) {
                if (entry.trim().length === 0) {
                    return;
                }
                o.children.push({
                    name: entry.trim(),
                    children: []
                });
            });

            return o;
        }
        return {
            name: s.trim(),
            children: []
        };
    }
}

function generateLocalCache() {

    fs.readFile('Catalog Entries.html', 'utf8', function(err, data) {
        if (err) throw err;
        var bodyArray;
        var courselinks = data.match(pat);
        //console.log(courselinks.length);
        //for(var i = 0; i < courselinks.length; i++) {
        //  console.log(courselinks[i]+'\n');
        //}
        for (var i = 0; i < 10; i++) {
            requestAndWriteToFile(courselinks, i);
        }
    });

    function requestAndWriteToFile(data, index) {
        if (index >= data.length) {
            return;
        }
        var cc = data[index].replace(/"/g, "").replace(/amp;/g, "");
        console.log(cc + "\n");
        request(cc, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                fs.writeFile('courseCache/oscar' + index + '.txt', body);
                console.log(index + "\n");

                requestAndWriteToFile(data, index + 10);
            } else if (error) {
                console.log(error);
            }
        });
    }

}