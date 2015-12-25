var request = require("request");
var fs = require('fs');

var pat =  new RegExp(/"[^"]*p_disp_course_detail.*"/g);

/*
fs.readFile('oscar.html', 'utf8',function (err, data) {
  if (err) throw err;
  var bodyArray;
  var courselinks = data.match(pat);
  //console.log(courselinks.length);
  //for(var i = 0; i < courselinks.length; i++) {
  //  console.log(courselinks[i]+'\n');
  //}
  requestAndWriteToFile(courselinks,0);
});

function requestAndWriteToFile(data,index){
    if(index == data.length) {
        return;
    }
    var cc= "https://oscar.gatech.edu"+data[index].replace(/"/g,"").replace(/amp;/g,"");
    console.log(cc+"\n");
    request(cc, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            fs.writeFile('oscar'+index+'.txt', body);
            console.log(index+"\n");
            index++;
            requestAndWriteToFile(data,index);
        } else if(error){
            console.log(error);
        }
    });
}
*/
for(var i = 0; i<=3704;i++){
    var courseFile = fs.readFileSync("oscar"+i+".txt", {encoding:"utf-8"});
    
        var pppp = FindPrereqs(courseFile);
        var lineOfFile = i+" " + findCourseName(courseFile)+ " "+parsePrereqsIntoObjects(pppp) + " \n>> "+ pppp+ " << "+ "\n\n------------------------------\n\n";
        fs.appendFileSync("PREreqs1.html",lineOfFile);
    
}

function FindPrereqs(courseString) {
    var noMarkupPat =  new RegExp(/<[^>]*>/g);

    var p = courseFile.indexOf("Prerequisites:");
    if(p==-1) return "";
    var b1 = courseFile.indexOf("<br />",p);
    var b2 = courseFile.indexOf("<br />",b1+1);
    var s = courseFile.substring(b1,b2).replace(/Undergraduate Semester level/g,"")
    .replace(/Graduate Semester level/g,"")
    .replace(noMarkupPat,"").replace(/\n/g,'').replace(/Minimum Grade of [A-Z]/g,"");
    return s;    
}
function findCourseName(courseString){
    var noMarkupPat =  new RegExp(/<[^>]*>/g);

    var courseName = (  courseString.match(/.*colgroup.*/g)+" ").replace(noMarkupPat,"");
    return  courseName;
}
function parsePrereqsIntoObjects(prereqString){
    var pCount=0;
    var lastParen = -1;
    var firstParen;
    var returnString = "";
    if(prereqString.indexOf('(')==-1 && prereqString.indexOf(')')==-1) {
        return  prereqString ; 
    }
    for(var i =0; i <prereqString.length;i++){
        if(prereqString.charAt(i)=='('){
            if(pCount==0){
                firstParen=i;
            }           
            pCount++; 
        }
        if(prereqString.charAt(i)==')'){
            pCount--;
            if(pCount == 0){
                console.log("recurse: " + firstParen + " " + i  + "\n");
               returnString = returnString+ prereqString.substring(lastParen+1,firstParen)+"  {"+ parsePrereqsIntoObjects(prereqString.substring(firstParen+1,i)) + "}";
               lastParen=i;
            }            
        }

    }
    return returnString+ prereqString.substring(lastParen+1,prereqString.length);    
}
