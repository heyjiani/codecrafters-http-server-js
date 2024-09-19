const net = require("net");
const fs = require("fs");
const path = require("path");

const PORT = 4221;
const HOST = "localhost";
const directory = process.argv[3]; // directory passed via --directory flag

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const [requestHeader, ...bodyContent] = data.toString().split("\r\n\r\n");
    const [requestLine, ...otherLines] = requestHeader.toString().split("\r\n");
    const [method, urlPath, version] = requestLine.trim().split(" ");
    const headers = Object.fromEntries(
      otherLines.filter((el) => el).map((pair) => pair.split(": "))
    );

    if (urlPath === "/") {
      // root
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (urlPath === "/user-agent") {
      // user agent
      const userAgent = headers["User-Agent"];
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
      );
    } else if (urlPath.startsWith("/echo/")) {
      // echo content
      const content = urlPath.replace("/echo/", "");
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
      );
    } else if (urlPath.startsWith("/files/")) {
      // file request
      const filePath = path.join(directory, urlPath.replace("/files/", ""));

      if (method === "POST") {
        const body = bodyContent.join("\r\n");
        fs.writeFile(filePath, body, function (err) {
          if (err) {
            socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
            socket.end();
            return;
          }
          socket.write("HTTP/1.1 201 Created\r\n\r\n");
        });
      } else if (method === "GET" && fs.existsSync(filePath)) {
        fs.readFile(filePath, function (err, data) {
          if (err) {
            socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
            socket.end();
            return;
          }
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${data.length}\r\n\r\n${data}`
          );
        });
      }
    } else {
      // not found
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server started at http://${HOST}:${PORT} ✧♡(◕‿◕✿)`);
});
