const net = require("net");
const fs = require("fs");

const PORT = 4221;
const HOST = "localhost";
const directory = process.argv[3]; // directory passed via --directory flag

function sendResponse(
  socket,
  { statusCode = "200 OK", content = "", contentType = "text/plain" } = {}
) {
  let response = `HTTP/1.1 ${statusCode}\r\n`;
  if (content) {
    response += `Content-Type: ${contentType}\r\nContent-Length: ${content.length}\r\n`;
  }
  response += `\r\n${content}`;
  socket.write(response);
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const [requestHeader, ...bodyContent] = data.toString().split("\r\n\r\n");
    const [requestLine, ...otherLines] = requestHeader.toString().split("\r\n");
    const [method, urlPath, _version] = requestLine.trim().split(" ");
    const headers = Object.fromEntries(
      otherLines.filter((el) => el).map((pair) => pair.split(": "))
    );

    if (urlPath === "/") {
      // root
      sendResponse(socket);
    } else if (urlPath === "/user-agent") {
      // read user agent header
      const userAgent = headers["User-Agent"];
      sendResponse(socket, { content: userAgent });
    } else if (urlPath.startsWith("/echo/")) {
      // echo content
      const content = urlPath.replace("/echo/", "");
      sendResponse(socket, { content });
    } else if (urlPath.startsWith("/files/")) {
      // file request
      const filePath = directory + urlPath.replace("/files/", "");

      if (method === "POST") {
        const body = bodyContent.join("\r\n");
        fs.writeFile(filePath, body, function (err) {
          if (err) {
            sendResponse(socket, { statusCode: "500 Internal Server Error" });
            socket.end();
            return;
          }
          sendResponse(socket, { statusCode: "201 Created" });
        });
      } else if (method === "GET" && fs.existsSync(filePath)) {
        fs.readFile(filePath, function (err, data) {
          if (err) {
            sendResponse(socket, { statusCode: "500 Internal Server Error" });
            socket.end();
            return;
          }
          sendResponse(socket, {
            content: data,
            contentType: "application/octet-stream",
          });
        });
      } else {
        sendResponse(socket, { statusCode: "404 Not Found" });
        socket.end();
      }
    } else {
      // not found
      sendResponse(socket, { statusCode: "404 Not Found" });
    }
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server started at http://${HOST}:${PORT} ✧♡(◕‿◕✿)`);
});
