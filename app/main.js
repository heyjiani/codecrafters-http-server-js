const net = require("net");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const [requestLine, ...otherLines] = data.toString().split("\r\n");
    const [method, path, version] = requestLine.trim().split(" ");
    const headers = Object.fromEntries(
      otherLines.filter((el) => el).map((pair) => pair.split(": "))
    );

    if (path === "/") {
      socket.write("HTTP/1.1 200 OK \r\n\r\n");
    } else if (path === "/user-agent") {
      const userAgent = headers["User-Agent"];
      socket.write(
        `HTTP/1.1 200 OK \r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
      );
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
