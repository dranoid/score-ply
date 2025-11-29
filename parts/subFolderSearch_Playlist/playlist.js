const glob = require("glob");
const path = require("path");
const fs = require("fs");

var getDirectories = function (src, callback) {
  glob(src + "/**/*.mp3", callback);
};

// "C:\Users\DG\Music"

let playlist = [];
let songObj = {};

getDirectories("C:\\Users\\DG\\Music", function (err, res) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log(res.length);
    console.log(res[0]);
    console.log(path.basename(res[0]));
    console.log(path.parse(res[0]));

    res.forEach((songPath) => {
      songObj.path = songPath;
      let tempObj = path.parse(songPath);
      songObj.name = tempObj.name;
      playlist.push(JSON.stringify(songObj));
    });
    let holdObj = {};
    holdObj.playlist = playlist; // To keep the array after sending it to the file

    fs.writeFile(
      path.join(__dirname, "playlist", "first.srpl"),
      JSON.stringify(holdObj),
      (err) => {
        if (err) throw err;
        console.log("File successfully written to...");
      }
    );

    fs.readFile(
      path.join(__dirname, "playlist", "first.srpl"),
      "utf8",
      (err, data) => {
        if (err) throw err;
        let plRead = JSON.parse(data);
        console.log(plRead.playlist[0]);
      }
    );
  }
});
