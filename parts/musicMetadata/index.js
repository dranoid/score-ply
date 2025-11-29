// const jsmediatags = require("jsmediatags");
const jsmediatags = window.jsmediatags;

const albumImg = document.getElementById("album-art");
const artist = document.getElementById("artist-name");
const songTitle = document.getElementById("song-title");
const albumName = document.getElementById("album-name");
const genre = document.getElementById("genre");
const songYear = document.getElementById("song-year");
const trackNo = document.getElementById("track-no");

let tag;

// jsmediatags.read("./music/Hustle.mp3", {
jsmediatags.read("http://localhost:5501/music/Skoin-Skoin.mp3", {
  onSuccess: function (result) {
    console.log(result);

    artist.innerText = result.tags.artist;
    albumName.innerText = result.tags.album;
    songTitle.innerText = result.tags.title;
    genre.innerText = result.tags.genre;
    songYear.innerText = result.tags.year;
    trackNo.innerText = result.tags.track;

    let picture = result.tags.picture; // create reference to track art
    let base64String = "";
    for (let i = 0; i < picture.data.length; i++) {
      base64String += String.fromCharCode(picture.data[i]);
    }
    let imageUri =
      "data:" + picture.format + ";base64," + window.btoa(base64String);
    albumImg.setAttribute("src", imageUri);
    console.log(picture.data);
  },
  onError: function (error) {
    console.log(":(", error.type, error.info);
  },
});
