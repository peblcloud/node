import { send } from "./send.js";

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
