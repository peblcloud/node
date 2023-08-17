import { send } from "./send.js";

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
  