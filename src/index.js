import * as net from "net";
import { send, check_env } from "./send.js";

export const service = async (server, endpoint) => {
  return send({
    method: "GET",
    path: "/service",
    query: {
      endpoint: endpoint,
      internal: "0",
    },
  })
    .then((data) => {
      const res = JSON.parse(data);
      if (res.status === 0) {
        return undefined;
      }
      if (res.status === 1) {
        throw new Error(res.error);
      }
      if (res.status === 2) {
        server.listen(80);
        return new Promise(() => {});
      }
      throw new Error(
        "received an unrecognized payload, are you running on an outdated version?"
      );
    })
    .catch((err) => {
      console.log(`exception during: service(service, ${endpoint})`);
      console.log(err);
      throw err;
    });
};

export const internalService = async (server, endpoint) => {
  return send({
    method: "GET",
    path: "/service",
    query: {
      endpoint: endpoint,
      internal: "1",
    },
  })
    .then((data) => {
      const res = JSON.parse(data);
      if (res.status === 0) {
        return undefined;
      }
      if (res.status === 1) {
        throw new Error(res.error);
      }
      if (res.status === 2) {
        server.listen(80);
        return new Promise(() => {});
      }
      throw new Error(
        "received an unrecognized payload, are you running on an outdated version?"
      );
    })
    .catch((err) => {
      console.log(`exception during: internalService(service, ${endpoint})`);
      console.log(err);
      throw err;
    });
};

export const redis = async (name) => {
  return send({
    method: "GET",
    path: "/redis",
    query: {
      name: name,
    },
  })
    .then((data) => {
      const res = JSON.parse(data);
      if (res.status === 0) {
        return {
          host: res.host,
          port: res.port,
          addr: `${res.host}:${res.port}`,
        };
      }
      throw new Error(res.error);
    })
    .catch((err) => {
      console.log(`exception during: redis(${name}})`);
      console.log(err);
      throw err;
    });
};

export const mysql = async (name) => {
  return send({
    method: "GET",
    path: "/mysql",
    query: {
      name: name,
    },
  })
    .then((data) => {
      const res = JSON.parse(data);
      if (res.status === 0) {
        return {
          host: res.host,
          port: res.port,
          addr: `${res.host}:${res.port}`,
        };
      }
      throw new Error(res.error);
    })
    .catch((err) => {
      console.log(`exception during: mysql(${name}})`);
      console.log(err);
      throw err;
    });
};

export const cron = async (name, schedule, fn) => {
  return send({
    method: "GET",
    path: "/cron",
    query: {
      name: name,
      schedule: schedule,
    },
  })
    .then((data) => {
      const res = JSON.parse(data);
      if (res.status === 0) {
        return undefined;
      }
      if (res.status === 1) {
        throw new Error(res.error);
      }
      if (res.status === 2) {
        fn();
        process.abort(0);
      }
      throw new Error(
        "received an unrecognized payload, are you running on an outdated version?"
      );
    })
    .catch((err) => {
      console.log(`exception during: cron(${name}, ${schedule}, ${fn.name})`);
      console.log(err);
      throw err;
    });
};

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

export const get = async (key) => {
  return send({
    method: "GET",
    path: "/kv",
    query: {
      key: key,
    },
  })
    .then((data) => {
      const res = JSON.parse(data);

      if (res.status === 0) {
        if (res.found) {
          return res.data;
        }
        return undefined;
      }

      throw new Error(res.error);
    })
    .catch((err) => {
      console.log(`exception during: get(${key})`);
      console.log(err);
      throw err;
    });
};

export const set = async (key, value) => {
  return send({
    method: "POST",
    path: "/kv",
    form: {
      [key]: value,
    },
  })
    .then((data) => {
      const res = JSON.parse(data);

      if (res.status === 0) {
        return undefined;
      }

      throw new Error(res.error);
    })
    .catch((err) => {
      console.log(`exception during: set(${key}, ${value})`);
      console.log(err);
      throw err;
    });
};

export const publish = async (topic, data) => {
  return send({
    method: "POST",
    path: "/publish",
    form: {
      [topic]: data,
    },
  })
    .then((data) => {
      const res = JSON.parse(data);

      if (res.status === 0) {
        return undefined;
      }

      throw new Error(res.error);
    })
    .catch((err) => {
      console.log(`exception during: publish(${topic}, ${data})`);
      console.log(err);
      throw err;
    });
};

export const subscribe = async (topic, cb) => {
  try {
    const data = await send({
      method: "GET",
      path: "/subscribe",
      query: {
        topic: topic,
      },
    });
    const res = JSON.parse(data);
    if (res.status === 0) {
      return undefined;
    }

    if (res.status === 1) {
      throw new Error(res.error);
    }

    if (res.status !== 2) {
      throw new Error(
        "received an unrecognized payload, are you running on an outdated version?"
      );
    }
  } catch (err) {
    console.log(`exception during: subscribe(${topic})`);
    console.log(err);
    throw err;
  }

  let num = 0;
  while (true) {
    try {
      const data = await send({
        method: "GET",
        path: "/subscribe_get",
        query: {
          topic: topic,
        },
      });
      const res = JSON.parse(data);
      if (res.status === 0) {
        cb(res.data);
        num = 0;
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      console.log(`encountered error within subscription for ${topic}`);
      console.log(err);
      console.log("retyring with backoff...");
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, (1 << num) * 1000);
      });
      num += 1;
    }
  }
};
