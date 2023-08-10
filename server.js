const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
// 设置静态文件目录，将 'app' 替换为您的静态文件所在的目录
app.use(express.static(path.join(__dirname, '/')));
const server = http.createServer(app);
const io = socketIO(server);

// 存储玩家和房间的对应关系
const players = {};

io.on('connection', (socket) => {
  console.log('新玩家已经连接，等待加入房间!');

  // 加入房间
  socket.on('joinRoom', (data) => {
    const {nickname, room} = data;
    console.log(nickname + '已经加入[' + room + ']房间');
    socket.join(room);
    players[socket.id] = {nickname, room};
    io.to(room).emit('players', players);
  });


  // 接收来自玩家的掷骰子结果，并广播给房间内的其他玩家
  socket.on('rollDice', (data) => {
    const {room, results} = data;
    const player = players[socket.id].nickname;
    console.log(player + '骰子:' + results);
    io.to(room).emit('rollResult', {player, results});
  });

  // 监听淘汰消息
  socket.on('eliminated', (minPlayer) => {
    io.to(room).emit('eliminated', minPlayer);
  });

  // 断开连接时，删除玩家信息
  socket.on('disconnect', () => {
    if (players[socket.id] != null) {
      console.log(players[socket.id].nickname + '玩家离开');
      const room = players[socket.id].room
      delete players[socket.id];
      io.to(room).emit('players', players);

    }
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
