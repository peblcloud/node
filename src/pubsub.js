import { send } from "./send.js";

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
  