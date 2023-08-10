// 在<script>标签之前引入Socket.io库
const socket = io();

const userForm = document.getElementById('userForm');
const roomInput = document.getElementById('roomInput');
const nicknameInput = document.getElementById('nickname');
const gameContent = document.getElementById('gameContent');
const userName = document.getElementById('userName');

userForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nickname = nicknameInput.value.trim();
  if (nickname !== '') {
    joinRoom(nickname);
    userName.textContent = '昵称：' + nickname;
    userForm.style.display = 'none';
    gameContent.style.display = 'block';
  }
});

// 定义全局变量用于追踪玩家结果和淘汰状态
let players = {};

// 加入房间
function joinRoom(nickname) {
  const room = roomInput.value;
  console.log(nickname + '已经加入[' + roomInput.value + ']房间');
  socket.emit('joinRoom', {nickname, room});
}

// 房间玩家信息
socket.on('players', function (players) {
  console.log(players);
  let th = '';
  let index = 1;
  for (let playersKey in players) {
    const row = `<tr>
    <th scope="row">${index}</th>
    <td>${players[playersKey].nickname}</td>
    <td id =${'dice_' + players[playersKey].nickname}></td>
    <td id =${'status_' + players[playersKey].nickname}></td>
  </tr>`;
    th += row;
    index++;
  }
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = th;
})

// 点击掷骰子按钮
function rollDice() {
  const results = [];
  for (let i = 0; i < 5; i++) {
    const randomNum = Math.floor(Math.random() * 6) + 1;
    console.log(randomNum);
    results.push(randomNum);
  }
  console.log(results);
  const room = roomInput.value;
  socket.emit('rollDice', {room, results});
}

// 接收来自其他玩家的掷骰子结果
socket.on('rollResult', function (data) {
  const {player, results} = data;
  players[player] = {
    results,
    eliminated: false // 默认未淘汰
  };
  console.log('dice_' + player);
  const dicePlay = document.getElementById('dice_' + player);
  dicePlay.textContent = results;
  // 在界面中显示掷骰子结果
  const message = document.createElement('p');
  message.textContent = `${player}掷得了${results.join(', ')}！`;
  document.body.appendChild(message);

  // 检查是否只剩下一名玩家
  const remainingPlayers = Object.keys(players).filter((p) => !players[p].eliminated);
  if (remainingPlayers.length === 1) {
    const winner = remainingPlayers[0];
    const winnerMessage = document.createElement('p');
    winnerMessage.textContent = `恭喜${winner}获胜！`;
    document.body.appendChild(winnerMessage);
  }

  // 判断是否进行下一轮
  if (remainingPlayers.length > 1) {
    nextRound();
  }
});

// 下一轮
function nextRound() {
  const minPlayer = getMinPlayer();
  const roomInput = document.getElementById('roomInput');
  const room = roomInput.value;
  socket.emit('nextRound', {room, minPlayer});
}

// 获取当前点数最小的玩家
function getMinPlayer() {
  let minPlayer;
  for (const player in players) {
    if (!players[player].eliminated) {
      if (!minPlayer || compareResults(players[player].results) < compareResults(players[minPlayer].results)) {
        minPlayer = player;
      }
    }
  }
  return minPlayer;
}


// 比较点数大小（更新为按照新规则比较）
function compareResults(results) {
  const sortedResults = results.slice().sort((a, b) => b - a); // 按照从大到小排序
  return sortedResults.join('');
}

// 在服务器端监听下一轮的请求
socket.on('nextRound', function (data) {
  const {room, minPlayer} = data;
  players[minPlayer].eliminated = true; // 将最小的玩家淘汰

  // 在界面中显示淘汰消息
  const eliminationMessage = document.createElement('p');
  eliminationMessage.textContent = `${minPlayer}被淘汰！`;
  document.body.appendChild(eliminationMessage);

  // 发送淘汰消息给其他玩家
  socket.to(room).emit('eliminated', minPlayer);

  // 展示所有玩家的掷骰子结果
  const playersInfo = document.createElement('p');
  for (const player in players) {
    const playerInfo = `${player}: ${players[player].results.join(', ')}${players[player].eliminated ? ' (淘汰)' : ''}`;
    playersInfo.textContent += playerInfo + '\n';
  }
  document.body.appendChild(playersInfo);
});
