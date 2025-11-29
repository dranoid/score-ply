// const glob = require("glob");

// var getDirectories = function (src, callback) {
//   glob(src + "/**/*.epub", callback);
// };

// getDirectories("C:\\Users\\DG\\Downloads\\Cable\\Books", function (err, res) {
//   if (err) {
//     console.log("Error", err);
//   } else {
//     console.log(res.length);
//   }
// });

// the choice is between these two methods now

// const path = require("path");
// const fs = require("fs");
// let files = [];

// function ThroughDirectory(directory) {
//   fs.readdirSync(directory).forEach((file) => {
//     const absolute = path.join(directory, file);
//     if (fs.statSync(absolute).isDirectory()) {
//       return ThroughDirectory(absolute);
//     } else {
//       if (path.extname(absolute) == ".epub") {
//         return files.push(absolute);
//       }
//     }
//   });
// }

// ThroughDirectory("C:\\Users\\DG\\Downloads\\Cable\\Books");
// console.log(files.length);
