import { send } from "./send.js";

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
  