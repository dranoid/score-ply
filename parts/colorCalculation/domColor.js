import ColorThief from "./color-thief.mjs";
const imgEl = document.querySelector(".test-img");
const testDiv = document.querySelector(".test-color");
const btnChange = document.getElementById("change");

const colorThief = new ColorThief();

// Since the load event fires on every change to the src this listener is to change the color on every image change
// If this is not there i'll need to click twice
imgEl.addEventListener("load", function () {
  setColor(imgEl);
});

if (imgEl.complete) {
  setColor(imgEl);
} else {
  imgEl.addEventListener("load", function () {
    setColor(imgEl);
  });
}

function setColor(imgEl) {
  const colorArr = colorThief.getColor(imgEl);

  let colorVar = RGBToHex(colorArr[0], colorArr[1], colorArr[2]);
  testDiv.style.background = colorVar;
  let clStr = colorVar.slice(colorVar.indexOf("#") + 1);
  testDiv.style.color = contrastYiq(parseInt(clStr, 16));
  console.log(contrastYiq(parseInt(clStr, 16)));
  let multcolorArr = colorThief.getPalette(imgEl, 7);
  makePalette(multcolorArr);

  //   console.log(RGBToHex(colorObj.r, colorObj.g, colorObj.b));
  //   console.log(colorObj);
}

function hexStrToNum(color) {
  // console.log(color.sl)
}

// for color of text against each background color
function contrastYiq(color) {
  const r = (color >>> 16) & 0xff;
  const g = (color >>> 8) & 0xff;
  const b = color & 0xff;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

function RGBToHex(r, g, b) {
  r = r.toString(16);
  g = g.toString(16);
  b = b.toString(16);

  if (r.length == 1) r = "0" + r;
  if (g.length == 1) g = "0" + g;
  if (b.length == 1) b = "0" + b;

  return "#" + r + g + b;
}

btnChange.addEventListener("click", (eve) => {
  let picArr = [
    "blue1",
    "blue2",
    "blue3",
    "brown",
    "purple",
    "red",
    "redGreen",

    "yellow2",
  ];
  let rnd = Math.floor(Math.random() * picArr.length);
  imgEl.src = `./pictures/${picArr[rnd]}.jpg`;
  // imgEl.src = "./pictures/brown.jpg";

  setColor(imgEl);
});

btnChange.addEventListener("dblclick", (e) => {
  testDiv.style.backgroundColor = "#1ace3b";
});

function makePalette(multiColorArr) {
  const flexDiv = document.createElement("div");
  if (flexDiv) {
    document.querySelector(".holder").innerHTML = "";
  }
  flexDiv.classList.add("flex");
  for (let i = 0; i < multiColorArr.length; i++) {
    const div = document.createElement("div");
    div.classList.add("palette");
    div.style.backgroundColor = RGBToHex(
      multiColorArr[i][0],
      multiColorArr[i][1],
      multiColorArr[i][2]
    );
    flexDiv.appendChild(div);
  }
  document.querySelector(".holder").appendChild(flexDiv);
}
