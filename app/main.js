const net = require("net");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const requestLine = data.toString().split("\n")[0];
    const [method, path, version] = requestLine.trim().split(" ");

    if (path === "/") {
      socket.write("HTTP/1.1 200 OK \r\n\r\n");
    } else if (path.startsWith("/echo/")) {
      const content = path.replace("/echo/", "");
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
      );
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost", () => {
  console.log("Server started at http://localhost:4221 ✧♡(◕‿◕✿)");
});
