import { send } from "./send.js";

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
