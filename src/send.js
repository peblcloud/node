import * as http from "http";

const __version = "0.0.10"

export const check_env = () => {
  const kernel_url = process.env.__PEBL_KERNEL_URL;
  const kernel_port = process.env.__PEBL_KERNEL_PORT;
  const token = process.env.__PEBL_TOKEN;

  if (
    kernel_url === undefined ||
    kernel_port === undefined ||
    token === undefined
  ) {
    console.log("no pebl context was detected, aborting!");
    console.log(
      "pebl programs must be run within a pebl environment, either with"
    );
    console.log("a local pebl cluster or in the pebl cloud environment.");
    console.log("");
    console.log("for more information visit: https://docs.pebl.io/issues");
    console.log("");
    process.abort(1);
  }

  return { kernel_url, kernel_port, token };
};

export const send = ({ method, path, query, form }) => {
  const { kernel_url, kernel_port, token } = check_env();

  let headers = {
    TOKEN: token,
    VERSION: __version,
  };

  if (form !== undefined) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  let encoded_path;
  if (query !== undefined) {
    encoded_path =
      path +
      "?" +
      Object.keys(query)
        .map((key) => {
          return `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`;
        })
        .join("&");
  } else {
    encoded_path = path;
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method: method,
        hostname: kernel_url,
        port: kernel_port,
        path: encoded_path,
        headers: headers,
      },
      (res) => {
        if (res.headers.token !== undefined) {
          process.env.__PEBL_TOKEN = res.headers.token;
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("close", () => {
          resolve(data);
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    if (form !== undefined) {
      Object.keys(form).forEach((key) => {
        req.write(
          `${encodeURIComponent(key)}=${encodeURIComponent(form[key])}`
        );
      });
    }
    req.end();
  });
};
