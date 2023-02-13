import * as net from "net";

let target_host = "localhost";
let target_ports = [3000, 3001, 3002];
let proxy_port = 8080;

let limit = {
  timeframe: 60 * 1000,
  max_requests: 10,
  message: "Too many requests, please try again later",
};

let requestCounts = new Map<string, number>();

const proxy = net.createServer((socket) => {
  const remoteAddress = socket.remoteAddress as string;

  if (
    // @ts-ignore
    requestCounts.has(remoteAddress) &&
    // @ts-ignore
    requestCounts.get(remoteAddress) >= limit.max_requests
  ) {
    socket.end(limit.message);
    return;
  }

  if (!requestCounts.has(remoteAddress)) {
    requestCounts.set(remoteAddress, 0);
  }

  // @ts-ignore
  requestCounts.set(remoteAddress, requestCounts.get(remoteAddress) + 1);

  setTimeout(() => {
    requestCounts.delete(remoteAddress);
  }, limit.timeframe);

  let forwardPort =
    target_ports[Math.floor(Math.random() * target_ports.length)];

  let forwardSocket = net.createConnection(
    { host: target_host, port: forwardPort },
    () => {
      socket.pipe(forwardSocket);
      forwardSocket.pipe(socket);
    }
  );

  forwardSocket.on("error", (error: any) => {
    console.error(error);
    socket.end("Error connecting to server");
  });
});

proxy.listen(proxy_port, () => {
  console.log("TCP proxy listening on port ", proxy_port);
});
