const jsmediatags = window.jsmediatags;
const table = document.getElementById("sortTable");
let musicArr = [
  "AUD",
  "Currently",
  "Hallelujah",
  "Hustle",
  "infinity",
  "Injure me",
  "Jazz study",
  "Moslado",
  "Skoin-Skoin",
  "Talk",
];
let detailArr = [];

for (let i = 0, len = musicArr.length; i < len; i++) {
  let row = document.createElement("tr");
  detailArr = [i + 1, musicArr[i]];
  jsmediatags.read(`http://localhost:5500/music/${musicArr[i]}.mp3`, {
    onSuccess: function (result) {
      //   console.log(result);
      let obj = result.tags;
      detailArr = [
        ...[i + 1, musicArr[i]],
        ...[obj.artist, obj.album, obj.genre, obj.title, obj.year, obj.track],
      ];
      for (let j = 0; j < detailArr.length; j++) {
        let td = document.createElement("td");
        td.innerHTML = detailArr[j];
        row.appendChild(td);
        // console.log(detailArr);
      }
      table.appendChild(row);
      sortMusic("title");
      // console.log(detailArr, "test Run");

      // console.log(picture.data);
    },
    onError: function (error) {
      console.log(":(", error.type, error.info);
    },
  });
}

function sortMusic(sortValue) {
  let sortItem = 1;

  switch (sortValue) {
    case "title":
      sortItem = 1;
      break;
    case "artist":
      sortItem = 2;
      break;
    case "album":
      sortItem = 3;
      break;
    case "genre":
      sortItem = 4;
      break;

    default:
      sortItem = 1;
      break;
  }

  // console.log(table.children[1]);
  let children = Array.from(table.children);
  // console.log(children[4].children[2].textContent);
  children.sort((el1, el2) => {
    if (el1 == children[0] || el2 == children[0]) {
      return 0;
    }
    let item1 = el1.children[sortItem].textContent;
    let item2 = el2.children[sortItem].textContent;
    item1 = item1.toUpperCase();
    item2 = item2.toUpperCase();
    if (item1 > item2) {
      return 1;
    }
    if (item1 < item2) {
      return -1;
    }
    if (el1.children[1].textContent > el2.children[sortItem].textContent) {
      return 1;
    }
    if (el1.children[1].textContent < el2.children[sortItem].textContent) {
      return -1;
    }
  });
  table.innerHTML = "";
  children.forEach((el, i) => {
    table.appendChild(el);
  });
}

table.addEventListener("click", (e) => {
  sortMusic("genre");
});

// for (let i = 0, len = musicArr.length; i < len; i++) {
//   let row = document.createElement("tr");
//   detailArr = [...[i + 1, musicArr[i]]];
//   for (let j = 0; j < detailArr.length; j++) {
//     let td = document.createElement("td");
//     td.innerHTML = detailArr[j];
//     row.appendChild(td);
//     // console.log(detailArr);
//   }
//   table.appendChild(row);
// }

// musicArr.forEach(function (song, i) {
//   let row = document.createElement("tr");
//   detailArr = [i + 1, musicArr[i]];
//   jsmediatags.read(`http://localhost:5500/music/${musicArr[i]}.mp3`, {
//     onSuccess: function (result) {
//       //   console.log(result);
//       let obj = result.tags;
//       detailArr = [
//         ...[i + 1, musicArr[i]],
//         ...[obj.artist, obj.album, obj.genre, obj.title, obj.year, obj.track],
//       ];
//       for (let j = 0; j < detailArr.length; j++) {
//         let td = document.createElement("td");
//         td.innerHTML = detailArr[j];
//         row.appendChild(td);
//         // console.log(detailArr);
//       }
//       table.appendChild(row);
//       // console.log(detailArr, "test Run");

//       // console.log(picture.data);
//     },
//     onError: function (error) {
//       console.log(":(", error.type, error.info);
//     },
//   });
// });

// // console.log(getMetaData("infinity", "mp3", []));
// async function getMetaData(name, format, tempDataArr) {
//   await jsmediatags.read(`http://localhost:5500/music/${name}.${format}`, {
//     onSuccess: function (result) {
//       //   console.log(result);
//       let obj = result.tags;
//       tempDataArr = [
//         ...[obj.artist, obj.album, obj.genre, obj.title, obj.year, obj.track],
//       ];
//       //   console.log(tempDataArr);

//       // console.log(picture.data);
//     },
//     onError: function (error) {
//       console.log(":(", error.type, error.info);
//     },
//   });
//   return tempDataArr;
// }
