import colors from "./colors";
import Card from "./card";
import Deck from "./deck";
import Table from "./table";
import "./style.css";

let playerId = window.location.search.split("?")[1] || "new";
let players = {};
players[playerId] = { name: playerId, score: 0 };

////// connection
let socketUrl = "ws://localhost:8000";
let ws = new WebSocket(socketUrl);
console.log(ws);
ws.onmessage = (e) => {
  let msg = JSON.parse(e.data);
  switch (msg.action) {
    case "newGame":
      console.log("round trip newGame msg");
      trophies = [];
      d = Deck.fromServer(msg.deck);
      // debugger;
      table = Table.fromServer(msg.table);
      break;
    case "players":
      players = msg.players;
      break;
    case "currentGame":
      d = Deck.fromServer(msg.deck);
      table = Table.fromServer(msg.table);
      break;
    case "table_indexes":
      // for (let x = 0; x < msg.idxs.length; x++) {
      msg.idxs.forEach((i) => {
        let newCard = d.pop();
        newCard.setTableIndex(i);
        table[i] = newCard;
      });
      selected = [];
  }
};
ws.onopen = (e) => {
  ws.send(
    JSON.stringify({
      action: "id",
      player: { name: playerId, score: 0 },
    })
  );
};

let canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.querySelector("#app").appendChild(canvas);
let ctx = canvas.getContext("2d");

function shuffle(array) {
  console.log(array.length);
  let m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  console.log(array.length);
  return array;
}

// class Game {
//   constructor() {
//     this.deck = new Deck();
//     this.score = 0;
//     this.selected = [];
//   }
// }
// let game = new Game();

let buttons = [];
let d = new Deck();
let table = new Table();
let selected = [];
let trophies = [];

let secondsPassed = 0;
let oldTimeStamp = 0;
let frameRate = 0;

let mousePos = { x: 0, y: 0 };

function gameLoop(timeStamp) {
  secondsPassed = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;

  // Pass the time to the update
  update(secondsPassed);
  draw();

  window.requestAnimationFrame(gameLoop);
}
let startTime = new Date();
gameLoop(startTime);

buttons = [
  {
    x: canvas.width - 150,
    y: canvas.height - 300,
    width: 130,
    height: 50,
    text: "new game",
  },
  {
    x: canvas.width - 150,
    y: canvas.height - 100,
    width: 100,
    height: 50,
    text: "shuffle",
  },
  {
    x: canvas.width - 150,
    y: canvas.height - 200,
    width: 100,
    height: 50,
    text: "draw one",
  },
];

function update(secondsPassed) {
  // Use time to calculate new position
  // rectX += (movingSpeed * secondsPassed);
  // rectY += (movingSpeed * secondsPassed);
  frameRate = 1 / secondsPassed;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw table
  table.draw(ctx);

  // draw ui
  ctx.beginPath();
  ctx.rect(canvas.width - 200, canvas.height / 4, 200, 200);
  ctx.closePath();
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.fillStyle = "rgba(200, 200, 200, 1)";
  ctx.fill();

  Object.values(players).forEach((player, i) => {
    ctx.beginPath();
    let playerBoxPos = {
      x: canvas.width - 200 + 5,
      y: canvas.height / 4 + 5 + i * 30,
    };
    ctx.rect(playerBoxPos.x, playerBoxPos.y, 175, 50);
    ctx.closePath();
    ctx.strokeStyle = colors.grey;
    ctx.stroke();
    ctx.fillStyle = "rgba(150, 105, 150, 1)";
    ctx.fill();
    ctx.beginPath();
    ctx.font = "24px Helvetica";
    ctx.fillStyle = "black";
    ctx.fillText(
      `${player.name}: ${player.score}`,
      playerBoxPos.x + 5,
      playerBoxPos.y + 5 + 24
    );
    ctx.closePath();
  });

  buttons.forEach((butt) => {
    if (butt.highlight) {
      ctx.beginPath();
      ctx.rect(butt.x - 5, butt.y - 5, butt.width + 10, butt.height + 10);
      ctx.closePath();
      ctx.fillStyle = "cyan";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.rect(butt.x, butt.y, butt.width, butt.height);
    ctx.closePath();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.fillStyle = "grey";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.font = "24px Helvetica";
    ctx.fillText(butt.text, butt.x + 5, butt.y + 5 + 24);
    ctx.closePath();
    drawTime(ctx);
  });
}

function drawTime(ctx) {
  let elapsed = parseInt((new Date() - startTime) / 1000);
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "red";
  ctx.font = "14px Verdana";
  ctx.fillText(elapsed + " secs", canvas.width - 75, 25);
  ctx.fillText(frameRate + " fps", canvas.width - 75, 50);
  ctx.fillText(
    "{ " + mousePos.x + ", " + mousePos.y + " }",
    canvas.width - 175,
    75
  );
  ctx.fillText("score: " + trophies.length, canvas.width - 100, 75);
  ctx.fillText("selected: " + selected, canvas.width - 400, 100);
  ctx.restore();
}

function tableStateUpdate() {
  if (selected.length === 3) {
    let cards = selected.map((i) => {
      return table[i];
    });
    if (isSet(cards)) {
      console.log("a set!");
      // cards.forEach(callbackfn)
      trophies.splice(trophies.length, 0, cards);
      // trophies.push(cards[x]);
      ws.send(JSON.stringify({ action: "score", selected }));
      // for (let x = 0; x < cards.length; x++) {
      // players[0].score += 1;
      // //////////
      // let newCard = d.pop();
      // newCard.setTableIndex(selected[x]);
      // console.log("selected", selected);
      // table[selected[x]] = newCard;
      // }
      // selected = [];
    } else {
      console.log("bad");
    }
  }
}

window.addEventListener("mousemove", (e) => {
  table.forEach((card, i) => {
    mousePos.x = e.x;
    mousePos.y = e.y;
    if (
      e.x > card.x &&
      e.x < card.x + Card.width &&
      e.y > card.y &&
      e.y < card.y + Card.height
    ) {
      card.highlight = true;
    } else {
      card.highlight = false;
    }
  });

  buttons.forEach((butt) => {
    if (
      e.x > butt.x &&
      e.x < butt.x + butt.width &&
      e.y > butt.y &&
      e.y < butt.y + butt.height
    ) {
      butt.highlight = true;
    } else {
      butt.highlight = false;
    }
  });
});

window.addEventListener("mousedown", (e) => {
  // if (selected.length > 3) {
  //   let removed = selected.splice(0, selected.length - 3);
  //   removed.forEach(card => {
  //     card.selected = false;
  //   })
  //   return;
  // } else if (selected.length === 3) {
  //   return;
  // }
  table.forEach((card, idx) => {
    if (card.highlight) {
      if (!card.selected) {
        card.selected = true;
        selected.push(idx);
        return;
      } else {
        card.selected = false;
        let i = selected.indexOf(idx);
        selected.splice(i, 1);
        return;
      }
    }
  });

  tableStateUpdate();

  buttons.forEach((butt) => {
    if (butt.highlight) {
      if (butt.text === "shuffle") {
        console.log("running shuffle");
        d = shuffle(d);
        return;
      } else if (butt.text === "new game") {
        if (ws.readyState === 1) {
          d = new Deck();
          d = shuffle(d);
          for (let i = 0; i < 12; i++) {
            drawCardToTable(d, table);
          }
          ws.send(JSON.stringify({ action: "newGame", deck: d, table }));
        } else {
          console.log("websocket not ready");
        }
      } else {
        console.log("drawing");
        drawCardToTable(d, table);
        return;
      }
    }
  });
});

function drawCardToTable(deck, table) {
  let c = deck.pop();
  let x = 120 * (table.length % 3) + 250;
  let y = 120 * Math.floor(table.length / 3) + 120;
  c.setPos(x, y);
  table.push(c);
}

const PropType = Object.freeze({
  Suit: "shape",
  Color: "color_index",
  Count: "count",
  Fill: "fillType",
});
function isSet(sel) {
  console.log("checking set ", sel);
  if (sel.length > 3) {
    console.error("too many!");
    return;
  }
  return Object.values(PropType).every((propType) => {
    let matchSum = 0;
    sel.forEach((c) => {
      matchSum += c[propType];
    });

    if (matchSum % 3 !== 0) {
      console.log("matchSum for " + propType + " is " + matchSum);
      return false;
    }
    return true;
  });
}