import * as http from 'http';
import * as net from 'net';

export const service = (server, endpoint) => new Promise((resolve, reject) => {
  const context = process.env.__PEBL_CONTEXT;

  if (context === `service:${endpoint}`) {
    server.listen(80);
    return;
  }

  if (context !== undefined) {
    resolve(undefined);
    return;
  }

  const kernel_url = process.env.__PEBL_KERNEL_URL;
  const kernel_port = process.env.__PEBL_KERNEL_PORT;
  const token = process.env.__PEBL_TOKEN;

  if (kernel_url === undefined || kernel_port === undefined || token === undefined) {
    reject(new Error("invalid environment detected, are you using `pebl run`?"));
  }

  const encoded_endpoint = encodeURIComponent(endpoint);
  http.get(`http://${kernel_url}:${kernel_port}/service?token=${token}&endpoint=${encoded_endpoint}`, (res) => {
    if (res.statusCode === 200) {
      resolve(undefined);
    } else {
      reject(new Error("unable to complete service request"));
    }
    res.on('data', (chunk) => { });
    res.on('close', () => { });
  }).on('error', (err) => {
    reject(err);
  });

});

export const internalService = (server, endpoint) => new Promise((resolve, reject) => {
  const context = process.env.__PEBL_CONTEXT;

  if (context === `iservice:${endpoint}`) {
    server.listen(80);
    return;
  }

  if (context !== undefined) {
    resolve(undefined);
    return;
  }

  const kernel_url = process.env.__PEBL_KERNEL_URL;
  const kernel_port = process.env.__PEBL_KERNEL_PORT;
  const token = process.env.__PEBL_TOKEN;

  if (kernel_url === undefined || kernel_port === undefined || token === undefined) {
    reject(new Error("invalid environment detected, are you using `pebl run`?"));
  }

  const encoded_endpoint = encodeURIComponent(endpoint);
  http.get(`http://${kernel_url}:${kernel_port}/service?token=${token}&endpoint=${encoded_endpoint}&internal=1`, (res) => {
    if (res.statusCode === 200) {
      resolve(undefined);
    } else {
      reject(new Error("unable to complete service request"));
    }
    res.on('data', (chunk) => { });
    res.on('close', () => { });
  }).on('error', (err) => {
    reject(err);
  });

});

export const redis = (name) => new Promise((resolve, reject) => {
  const kernel_url = process.env.__PEBL_KERNEL_URL;
  const kernel_port = process.env.__PEBL_KERNEL_PORT;
  const token =  process.env.__PEBL_TOKEN;

  if (kernel_url === undefined || kernel_port === undefined || token === undefined) {
    reject(new Error("invalid environment detected, are you using `pebl run`?"));
  }

  const encoded_name = encodeURIComponent(name);
  http.get(`http://${kernel_url}:${kernel_port}/redis?token=${token}&name=${encoded_name}`, (res) => {
    if (res.statusCode !== 200) {
      reject(new Error("unable to complete redis request"));
    }

    let data = ''
    res.on('data', (chunk) => {
      data += chunk;
    })

    res.on('close', () => {
      if (data.length < 2) {
        reject(new Error("unable to complete redis request"));
        return;
      }

      if (data[0] !== '0') {
        reject(new Error(data.split("\n")[1]));
        return;
      }

      const parts = data.split("\n")[1].split(":");
      if (parts.length !== 2) {
        reject(new Error("unable to complete redis request"));
      }
      resolve({
        'host': parts[0],
        'port': Number(parts[1]),
        'addr': data.split("\n")[1],
      })
    })
  }).on('error', (err) => {
    reject(err);
  });
});

export const mysql = (name) => new Promise((resolve, reject) => {
  const kernel_url = process.env.__PEBL_KERNEL_URL;
  const kernel_port = process.env.__PEBL_KERNEL_PORT;
  const token = process.env.__PEBL_TOKEN;

  if (kernel_url === undefined || kernel_port === undefined || token === undefined) {
    reject(new Error("invalid environment detected, are you using `pebl run`?"));
  }

  const encoded_name = encodeURIComponent(name);
  http.get(`http://${kernel_url}:${kernel_port}/mysql?token=${token}&name=${encoded_name}`, (res) => {
    if (res.statusCode !== 200) {
      reject(new Error("unable to complete mysql request"));
    }

    let data = ''
    res.on('data', (chunk) => {
      data += chunk;
    })

    res.on('close', () => {
      if (data.length < 2) {
        reject(new Error("unable to complete mysql request"));
        return;
      }

      if (data[0] !== '0') {
        reject(new Error(data.split("\n")[1]));
        return;
      }

      const parts = data.split("\n")[1].split(":");
      if (parts.length !== 2) {
        reject(new Error("unable to complete mysql request"));
      }
      resolve({
        'host': parts[0],
        'port': Number(parts[1]),
        'addr': data.split("\n")[1],
        'user': 'root',
        'password': '',
      })
    })
  }).on('error', (err) => {
    reject(err);
  });
});

export const cron = (name, schedule, fn) => new Promise((resolve, reject) => {
  const context = process.env.__PEBL_CONTEXT;

  if (context === `cron:${name}`) {
    fn()
    process.exit(0);
  }

  if (context !== undefined) {
    resolve(undefined);
    return;
  }

  const kernel_url = process.env.__PEBL_KERNEL_URL;
  const kernel_port = process.env.__PEBL_KERNEL_PORT;
  const token = process.env.__PEBL_TOKEN;

  if (kernel_url === undefined || kernel_port === undefined || token === undefined) {
    reject(new Error("invalid environment detected, are you using `pebl run`?"));
  }

  const encoded_name = encodeURIComponent(name);
  const encoded_schedule = encodeURIComponent(schedule);
  http.get(`http://${kernel_url}:${kernel_port}/cron?token=${token}&name=${encoded_name}&schedule=${encoded_schedule}`, (res) => {
    if (res.statusCode === 200) {
      resolve(undefined)
    } else {
      reject(new Error("unable to complete cron request"));
    }
    res.on('data', (chunk) => { });
    res.on('close', () => { });
  }).on('error', (err) => {
    reject(err);
  });
});

export const open = (path, mode) => new Promise((resolve, reject) => {
  const kernel_url = process.env.__PEBL_KERNEL_URL;
  const kernel_port = process.env.__PEBL_KERNEL_PORT;
  const token = process.env.__PEBL_TOKEN;

  if (kernel_url === undefined || kernel_port === undefined || token === undefined) {
    reject(new Error("invalid environment detected, are you using `pebl run`?"));
  }

  const encoded_path = encodeURIComponent(path);
  const encoded_mode = encodeURIComponent(mode);

  const socket = net.connect({
    host: kernel_url,
    port: Number(kernel_port),
  });

  socket.on('connect', () => {
    socket.write(`GET /open?token=${token}&mode=${encoded_mode}&path=${encoded_path} HTTP/1.1\r\n`);
    socket.write(`Host: ${kernel_url}:${kernel_port}\r\n`);
    socket.write(`Content-Length: 0\r\n\r\n`);
  });

  let initializing = true;
  socket.on('data', (initChunk) => {
    if (!initializing) {
      return;
    }

    initializing = false;

    if (initChunk[0] === '0'.charCodeAt(0)) {
      if (mode === 'w') {
        resolve(new WritableStream({
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
          }
        }));
      } else {
        resolve(new ReadableStream({
          type: 'bytes', start: (controller) => {
            socket.on('data', (chunk) => {
              controller.enqueue(chunk);
            })

            socket.on('close', (hadError) => {
              controller.close();
            });

            // handle sending the left over payload from the init chunk
            if (initChunk.length > 1) {
              controller.enqueue(initChunk.subarray(1))
            }
          }
        }));
      }
    } else {
      reject(new Error("error opening file"))
    }
  })
});
