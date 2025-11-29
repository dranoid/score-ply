const path = require("path");

//base file name
console.log(path.basename(__filename));

//file directory
console.log(path.dirname(__filename));

//file extension
console.log(path.extname(__filename));

//object of the file
console.log(path.parse(__filename));

//concatenate paths
console.log(path.join(__dirname, "test", "tester", "hello.html"));
