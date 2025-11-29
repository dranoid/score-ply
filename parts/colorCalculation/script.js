const imgEl = document.querySelector(".test-img");
const testDiv = document.querySelector(".test-color");
// getAverageRGB(imgEl);
const first = document.querySelector(".first");
const second = document.querySelector(".second");
const third = document.querySelector(".third");
const add = document.getElementById("add");

// first.style.background = "red";
// second.style.background = "#eeeeee";
function shiftsColor() {
  third.style.background = "#" + shiftColor("#ff0000", "#0000ff", "add");
  console.log(shiftColor("#ff0000", "#0000ff", "add"));
}

function setColor(imgEl) {
  const colorObj = getAverageRGB(imgEl);

  let colorVar = RGBToHex(colorObj.r, colorObj.g, colorObj.b);
  testDiv.style.background = colorVar;
  testDiv.style.color = contrastYiq(colorVar);

  //   console.log(RGBToHex(colorObj.r, colorObj.g, colorObj.b));
  //   console.log(colorObj);
}

// let hexValue = 0x121514;
// let hexString = `0x${hexValue.toString(16)}`;
// let convHex = parseInt(hexString, 16);
// console.log(hexValue);
// console.log(hexString);
// console.log(convHex);

// const r = 0x12;
// const g = 0x34;
// const b = 0x56;
// const color = (r << 16) | (g << 8) | b; // 0x123456
// const negated = color ^ 0xffffff; // 0x00ff00;
// console.log(r);
// console.log(color.toString(16));

// console.log(contrastYiq(color), "YIQ Contrast");
// console.log(negated.toString(16), "Negated color");
// console.log(shiftColor("#aaaaaa", "#010101", "add"));

// for color of text against each background color
function contrastYiq(color) {
  const r = (color >>> 16) & 0xff;
  const g = (color >>> 8) & 0xff;
  const b = color & 0xff;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

// Add and subtract colors
function shiftColor(base, change, direction) {
  const colorRegEx = /^\#?[A-Fa-f0-9]{6}$/;

  // Missing parameter(s)
  if (!base || !change) {
    return "000000";
  }

  // Invalid parameter(s)
  if (!base.match(colorRegEx) || !change.match(colorRegEx)) {
    return "000000";
  }

  // Remove any '#'s
  base = base.replace(/\#/g, "");
  change = change.replace(/\#/g, "");

  // Build new color
  let newColor = "";
  for (let i = 0; i < 3; i++) {
    const basePiece = parseInt(base.substring(i * 2, i * 2 + 2), 16);
    const changePiece = parseInt(change.substring(i * 2, i * 2 + 2), 16);
    let newPiece = "";

    if (direction === "add") {
      newPiece = basePiece + changePiece;
      newPiece = newPiece > 255 ? 255 : newPiece;
    }
    if (direction === "sub") {
      newPiece = basePiece - changePiece;
      newPiece = newPiece < 0 ? 0 : newPiece;
    }

    newPiece = newPiece.toString(16);
    newPiece = newPiece.length < 2 ? "0" + newPiece : newPiece;
    newColor += newPiece;
  }

  return newColor;
}

function getAverageRGB(imgEl) {
  var blockSize = 5, // only visit every 5 pixels
    defaultRGB = { r: 0, g: 0, b: 0 }, // for non-supporting envs
    canvas = document.createElement("canvas"),
    context = canvas.getContext && canvas.getContext("2d"),
    data,
    width,
    height,
    i = -4,
    length,
    rgb = { r: 0, g: 0, b: 0 },
    count = 0;

  if (!context) {
    return defaultRGB;
  }

  height = canvas.height =
    imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
  width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

  context.drawImage(imgEl, 0, 0);

  try {
    data = context.getImageData(0, 0, width, height);
  } catch (e) {
    /* security error, img on diff domain */
    return defaultRGB;
  }

  length = data.data.length;

  while ((i += blockSize * 4) < length) {
    ++count;
    rgb.r += data.data[i];
    rgb.g += data.data[i + 1];
    rgb.b += data.data[i + 2];
  }

  // ~~ used to floor values
  rgb.r = ~~(rgb.r / count);
  rgb.g = ~~(rgb.g / count);
  rgb.b = ~~(rgb.b / count);

  return rgb;
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

testDiv.addEventListener("click", (eve) => {
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
  console.log(imgEl.src);
  setColor(imgEl);
});
