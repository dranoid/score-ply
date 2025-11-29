const fs = require("fs");
const path = require("path");
pathObj = path.parse(__filename);

//create new folder
// fs.mkdir(path.join(__dirname, "test"), {}, err => {
//   if (err) throw err;

//   console.log("Folder created...");
// });

//create and write to file
fs.writeFile(
  path.join(__dirname, "test", "hello.txt"),
  "Hello world!",
  (err) => {
    if (err) throw err;
    console.log("File successfully written to...");

    fs.appendFile(
      path.join(__dirname, "test", "hello.txt"),
      " I love Node.js",
      (err) => {
        if (err) throw err;
        console.log("File successfully written to...");
      }
    );
  }
);

//read from file
// fs.readFile(path.join(__dirname, "/test", "hello.txt"), "utf8", (err, data) => {
//   if (err) throw err;
//   console.log(
//     `Data from ${path.basename(
//       path.join(__dirname, "/test", "hello.txt")
//     )}: ${data} `
//   );
// });

//rename a file
fs.rename(
  path.join(__dirname, "/test", "hello.txt"),
  path.join(__dirname, "/test", "helloWorld.txt"),
  (err) => {
    if (err) throw err;
    console.log("File renamed...");
  }
);
