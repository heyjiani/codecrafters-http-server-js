const net = require("net");
const fs = require("fs");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const [requestHeader, ...bodyContent] = data.toString().split("\r\n\r\n");
    const [requestLine, ...otherLines] = requestHeader.toString().split("\r\n");
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
    } else if (path.startsWith("/files/")) {
      /* The tester will execute your program with a --directory flag. The --directory flag specifies the directory where the files are stored, as an absolute path.*/
      const directory = process.argv[3];
      const filePath = directory + path.replace("/files/", "");
      console.log(filePath);
      if (method === "POST") {
        const body = bodyContent.join("\r\n");
        fs.writeFile(filePath, body, function (err) {
          if (err) throw err;
        });
        socket.write("HTTP/1.1 201 Created\r\n\r\n");
      } else if (method === "GET" && fs.existsSync(filePath)) {
        fs.readFile(filePath, function (err, data) {
          if (err) {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            socket.end();
            return;
          }
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${data.length}\r\n\r\n${data}`
          );
        });
      } else {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
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
