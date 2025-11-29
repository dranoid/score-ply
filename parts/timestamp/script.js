const container = document.querySelector(".container");
const btnPlay = document.getElementById("play");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const audio = document.getElementById("audio");
const leftTime = document.getElementById("left");
const rightTime = document.getElementById("right");
const progress = document.querySelector(".progress");
const progressContainer = document.querySelector(".progress-container");
const title = document.querySelector("#title");
const btnLoop = document.getElementById("loop");
const btnJump = document.getElementById("jump");
const btnBreak = document.getElementById("break");
const btnBreakSec = document.getElementById("break-sec");
const controlArea = document.querySelector(".section-control");
const sectionList = document.querySelector(".section-list");
const loopObj = { from: "", to: "" };
const sectArr = [];

// Song titles
let songs = [
  "Moslado",
  "Hustle",
  "Injure me",
  "Amen",
  "Beautiful people",
  "Faithful",
  "Finders keepers",
  "Forever",
  "Forgive",
  "If you no love",
  "insecure",
  "Nakupenda",
  "Out of love",
  "Roju",
  "Running",
  "Soldier",
  "Watching over me",
];

// Keep track of songs
let songIndex = 1;

// Song Info
loadSong(songs[songIndex]);

function loadSong(song) {
  title.innerText = song;
  audio.src = `./music/${song}.mp3`;
}

function playSong() {
  container.classList.add("play");
  btnPlay.querySelector("i.fas").classList.remove("fa-play");
  btnPlay.querySelector("i.fas").classList.add("fa-pause");

  audio.play();
}
function pauseSong() {
  container.classList.remove("play");
  btnPlay.querySelector("i.fas").classList.remove("fa-pause");
  btnPlay.querySelector("i.fas").classList.add("fa-play");

  audio.pause();
}
function nextSong() {
  if (container.classList.contains("loop")) {
    return;
  } else {
    songIndex++;
    sectionList.innerHTML = "";
    if (songIndex > songs.length - 1) {
      songIndex = 0;
    }
    loadSong(songs[songIndex]);
    playSong();
  }
}
function prevSong() {
  if (container.classList.contains("loop")) {
    return;
  } else {
    songIndex--;
    sectionList.innerHTML = "";
    if (songIndex < 0) {
      songIndex = songs.length - 1;
    }
    loadSong(songs[songIndex]);
    playSong();
  }
}

function updateProgress() {
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = `${progressPercent}%`;
  updateTime();
  loopControl();
}
function setProgress(e) {
  const width = this.clientWidth;
  const offsetX = e.offsetX;
  const duration = audio.duration;
  audio.currentTime = Math.round((offsetX / width) * duration);
  console.log(Math.round((offsetX / width) * duration, "duration "));
  console.log(Math.round((offsetX / width) * 100, "percent "));
}

function updateTime() {
  const duration = audio.duration;
  const currentTime = audio.currentTime;

  // Duration
  rightTime.innerText = `${formatTime(duration).min}:${
    formatTime(duration).sec
  }`;

  // Current time
  leftTime.innerText = `${formatTime(currentTime).min}:${
    formatTime(currentTime).sec
  }`;
}
function formatTime(time) {
  // To pick out the minutes and seconds
  let min = Math.floor(Math.round(time) / 60);
  let sec = Math.round(time) % 60;

  // To format it properly
  if (sec.toString().length < 2) {
    sec = "0" + sec;
  } else if (!sec) {
    // To prevent NaN from flashing when the song is changed
    sec = "00";
    // console.log("not");
  }

  if (min.toString().length < 2) {
    min = "0" + min;
  } else if (!min) {
    // To prevent NaN from flashing when the song is changed
    min = "00";
    // console.log("not");
  }
  return { min, sec };
}

function loop(loopFrom, loopTo) {
  if (!(loopFrom > Math.round(audio.duration))) {
    audio.currentTime = loopFrom;
  }
  loopObj.from = loopFrom > Math.round(audio.duration) ? undefined : loopFrom;
  loopObj.to = loopTo > Math.round(audio.duration) ? undefined : loopTo;
  console.log(loopObj);
}

function loopControl() {
  // loopObj value being 0 messes the loopControl up
  if (
    loopObj.to &&
    (loopObj.from || loopObj.from == 0) &&
    container.classList.contains("loop")
  ) {
    console.log(loopObj.to, "to", loopObj.from, "from");
    // To account for looping at the end of a song
    let to =
      Math.round(audio.currentTime) == Math.round(audio.duration)
        ? parseInt(loopObj.to)
        : parseInt(loopObj.to) + 1;
    if (Math.round(audio.currentTime) >= to) {
      audio.currentTime = loopObj.from;
    }
  }
}

// Cutting the song into sections
function sectioning(duration, sectLen, num) {
  sectionList.style.display = "block";
  sectionList.innerHTML = "";
  let estimateGreater;
  let disparity, extraSeconds, unAddedSec; // disparity + extraSeconds = sectionLength, extra seconds are the remainder secs to be added to the last section, disparity is how much time between a whole section and the extra secs
  let estTime = sectLen * num;
  console.log(estTime, "estimated time");
  if (estTime >= duration) {
    estimateGreater = true;
    disparity = Math.abs(estTime - duration);
    console.log(disparity, "disparity");
    extraSeconds = sectLen - disparity;
    console.log(extraSeconds, "extra seconds");
  } else if (estTime < duration) {
    estimateGreater = false;
    unAddedSec = Math.abs(estTime - duration); //Its not disparity here, just unadded seconds
    console.log(unAddedSec, "disparity or unadded seconds");
  }
  console.log(sectLen, "sectionLength");
  console.log(audio.duration, "duration");
  console.log(duration, "rounded duration");

  let curLen = 0;
  let sectTimeObj = {};
  for (let i = 0; i <= num - 1; i++) {
    const span = document.createElement("span");
    span.classList.add("section");
    if (i == num - 1 && estimateGreater == true) {
      sectTimeObj.start = curLen;
      curLen += extraSeconds;
      sectTimeObj.end = curLen;
      console.log(sectTimeObj, "each time");
    } else if (i == num - 1 && estimateGreater == false) {
      sectTimeObj.start = curLen;
      curLen += sectLen;
      curLen += unAddedSec;
      sectTimeObj.end = curLen;
      console.log(sectTimeObj, "each time");
    } else {
      sectTimeObj.start = curLen;
      curLen += sectLen;
      sectTimeObj.end = curLen;
      console.log(sectTimeObj, "each time");
    }

    // For some fucking odd reason sectArr.push(sectTimeObj) is giving me wrong values!!!
    sectArr.push({
      start: sectTimeObj.start,
      end: sectTimeObj.end,
    });
    span.innerText = `${formatTime(sectTimeObj.start).min}:${
      formatTime(sectTimeObj.start).sec
    } - ${formatTime(sectTimeObj.end).min}:${formatTime(sectTimeObj.end).sec}`;
    sectionList.appendChild(span);
    console.log(
      formatTime(sectTimeObj.start),
      "start(left)",
      formatTime(sectTimeObj.end),
      "end(right)"
    );
  }
}

// Event Listeners
btnPlay.addEventListener("click", (e) => {
  const isPlaying = container.classList.contains("play");
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
});
btnNext.addEventListener("click", nextSong);
btnPrev.addEventListener("click", prevSong);

audio.addEventListener("timeupdate", updateProgress);
progressContainer.addEventListener("click", setProgress);
audio.addEventListener("ended", nextSong);

btnLoop.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("clicked");
  if (btnLoop.classList.contains("in-action")) {
    loopObj.from = null;
    loopObj.to = null;
    btnLoop.classList.remove("in-action");
    // container.classList.remove("loop");
  } else {
    container.classList.add("loop");
    btnLoop.classList.add("in-action");
    const loopFromMin = controlArea.querySelector("#loop-from-min");
    const loopFromSec = controlArea.querySelector("#loop-from-sec");
    const loopToMin = controlArea.querySelector("#loop-to-min");
    const loopToSec = controlArea.querySelector("#loop-to-sec");
    console.log(parseInt(loopFromMin.value), "loopFmin value");
    if (
      isNaN(parseInt(loopFromMin.value)) ||
      isNaN(parseInt(loopFromSec.value)) ||
      isNaN(parseInt(loopToMin.value)) ||
      isNaN(parseInt(loopToSec.value))
    ) {
      console.log("within range of rubbish");
      btnLoop.classList.remove("in-action");
      return;
    }
    console.log("not catching");
    const loopFrom =
      Math.round(parseInt(loopFromMin.value)) * 60 +
      Math.round(parseInt(loopFromSec.value));
    const loopTo =
      Math.round(parseInt(loopToMin.value)) * 60 +
      Math.round(parseInt(loopToSec.value));
    loop(loopFrom, loopTo);
    console.log(loopObj);
    console.log(btnLoop.classList);
  }
});

btnJump.addEventListener("click", (e) => {
  // Remember to validate data
  e.preventDefault();
  const jumpToMin = controlArea.querySelector("#jump-to-min");
  const jumpToSec = controlArea.querySelector("#jump-to-sec");
  if (isNaN(parseInt(jumpToMin.value)) || isNaN(parseInt(jumpToSec.value))) {
    console.log("within range of rubbish");
    return;
  }
  const jumpTo =
    Math.round(parseInt(jumpToMin.value)) * 60 +
    Math.round(parseInt(jumpToSec.value));
  if (!(jumpTo > Math.round(audio.duration))) {
    audio.currentTime = jumpTo;
  }
});

btnBreak.addEventListener("click", (e) => {
  e.preventDefault();
  let duration = Math.round(audio.duration);
  const sectionNumber = controlArea.querySelector("#section");
  const num = Math.round(sectionNumber.value);
  let sectLen = Math.round(duration / num);
  sectioning(duration, sectLen, num);
});

btnBreakSec.addEventListener("click", (e) => {
  e.preventDefault();
  const duration = Math.round(audio.duration);
  const sectSec = controlArea.querySelector("#section-sec");
  const sectLen = Math.round(sectSec.value);
  const num = Math.round(duration / sectLen);
  sectioning(duration, sectLen, num);
});

sectionList.addEventListener("click", (e) => {
  let index;
  const section = e.target;
  const childList = Array.from(e.target.parentNode.children);
  for (let i = 0; i < childList.length; i++) {
    if (section == childList[i]) {
      index = i;
    }
  }

  if (!section.classList.contains("active")) {
    childList.forEach((child) => {
      child.classList.remove("active");
    });
    section.classList.add("active");
    console.log("active");

    //for the looping
    container.classList.add("loop");
    let details = sectArr[index];
    loop(details.start, details.end);
  } else if (section.classList.contains("active")) {
    section.classList.remove("active");
    container.classList.remove("loop");
    console.log("inactive");
  }
});
