# 使用Node.js的官方镜像作为基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 复制项目文件到工作目录
COPY package.json package-lock.json /app/
RUN npm install

# 复制项目代码到工作目录
COPY . /app/

# 暴露容器的端口，如果您的游戏使用了其他端口，请相应更改此处的端口号
EXPOSE 3000

# 运行游戏
CMD ["node", "server.js"]
