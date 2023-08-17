import * as net from "net";
import { check_env } from "./send.js";

export { service, internalService } from './service.js';
export { get, set } from './kv.js';
export { cron } from './cron.js';
export { redis } from './redis.js';
export { mysql } from './mysql.js';
export { publish, subscribe } from './pubsub.js';

export const open = async (path, mode) => {
  const { kernel_url, kernel_port, token } = check_env();
  const encoded_path = encodeURIComponent(path);
  const encoded_mode = encodeURIComponent(mode);

  return new Promise((resolve, reject) => {
    const socket = net.connect({
      host: kernel_url,
      port: Number(kernel_port),
    });

    socket.on("connect", () => {
      socket.write(
        `GET /open?mode=${encoded_mode}&path=${encoded_path} HTTP/1.1\r\n`
      );
      socket.write(`Host: ${kernel_url}:${kernel_port}\r\n`);
      socket.write(`TOKEN: ${token}\r\n`);
      socket.write(`VERSION: 0.0.10\r\n`);
      socket.write(`Content-Length: 0\r\n\r\n`);
    });

    let initializing = true;
    socket.on("data", (initChunk) => {
      if (!initializing) {
        return;
      }

      initializing = false;

      if (initChunk[0] === "0".charCodeAt(0)) {
        if (mode === "w") {
          resolve(
            new WritableStream({
              write: (chunk, controller) => {
                return new Promise((resolve, reject) => {
                  socket.write(chunk, (maybeErr) => {
                    if (maybeErr) {
                      reject(maybeErr);
                    } else {
                      resolve();
                    }
                  });
                });
              },
              close: () => {
                socket.destroy();
              },
            })
          );
        } else {
          resolve(
            new ReadableStream({
              type: "bytes",
              start: (controller) => {
                socket.on("data", (chunk) => {
                  controller.enqueue(chunk);
                });

                socket.on("close", (hadError) => {
                  controller.close();
                });

                // handle sending the left over payload from the init chunk
                if (initChunk.length > 1) {
                  controller.enqueue(initChunk.subarray(1));
                }
              },
            })
          );
        }
      } else {
        reject(new Error("error opening file"));
      }
    });
  });
};
