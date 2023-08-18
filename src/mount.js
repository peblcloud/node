import * as net from "net";
import * as fs from "fs";
import { Buffer } from "buffer";
import { check_env } from "./send.js";

const getTar = async (name) => {
  const { kernel_url, kernel_port, token } = check_env();
  const encoded_name = encodeURIComponent(name);

  return new Promise((resolve, reject) => {
    const socket = net.connect({
      host: kernel_url,
      port: Number(kernel_port),
    });

    socket.on("connect", () => {
      socket.write(`GET /mount?name=${encoded_name} HTTP/1.1\r\n`);
      socket.write(`Host: ${kernel_url}:${kernel_port}\r\n`);
      socket.write(`TOKEN: ${token}\r\n`);
      socket.write(`VERSION: 0.1.0\r\n`);
      socket.write(`Content-Length: 0\r\n\r\n`);
    });

    let success = undefined;
    let b = Buffer.alloc(0);
    let size = 0;
    socket.on("data", (chunk) => {
      if (success === undefined) {
        // check the first byte to determine status
        if (chunk[0] === "0".charCodeAt(0)) {
          success = true;
        } else {
          success = false;
        }
        b = Buffer.concat([b, chunk.subarray(1)]);
      } else {
        b = Buffer.concat([b, chunk]);
      }
      size += chunk.length;
    });
    socket.on("end", () => {
      if (success) {
        resolve(b);
      } else {
        reject(b.toString());
      }
    });
  });
};

const unpack = async (data, path) => {
  fs.mkdirSync(path, { recursive: true });
  let left_to_read = undefined;
  let fd = undefined;

  for (let i = 0; i < data.length; i += 512) {
    const chunk = data.subarray(i, i + 512);

    if (left_to_read !== undefined) {
      if (left_to_read >= 512) {
        fs.writeFileSync(fd, chunk);
      } else {
        fs.writeFileSync(fd, chunk.subarray(0, left_to_read));
      }

      left_to_read -= 512;
      if (left_to_read <= 0) {
        left_to_read = undefined;
        fs.closeSync(fd);
        fd = undefined;
      }
      continue;
    }

    let ix = 0;
    for (; ix < 100; ix++) {
      if (chunk[ix] === 0) {
        break;
      }
    }

    if (ix === 0) {
      // done!
      continue;
    }

    const name = chunk.subarray(0, ix).toString();
    const size = chunk.subarray(124, 135).toString(); // 12 reserved but only 11 used + space char
    const parsed = parseInt(size, 8);

    let type = chunk[156];
    if (type === "5".charCodeAt(0)) {
      // directory
      fs.mkdirSync(`${path}/${name}`, { recursive: true });
    } else {
      fd = fs.openSync(`${path}/${name}`, "w", 0o777);
      if (parsed === 0) {
        fs.closeSync(fd);
        fd = undefined;
      } else {
        left_to_read = parsed;
      }
    }
  }
};

export const mount = async (name, path) => {
  return getTar(name)
    .then((data) => {
      return unpack(data, path);
    })
    .catch((err) => {
      throw err;
    });
};
