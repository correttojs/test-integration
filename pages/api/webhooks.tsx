import { NextApiRequest, NextApiResponse } from "next";

const TOKEN = "aDfz6ZwDnHzgimgM3ehOSSi7";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.body.type) {
    case "deployment":
      const check = await fetch(
        `https://api.vercel.com/v1/deployments/${req.body.payload.deployment.id}/checks`,
        {
          body: JSON.stringify({
            blocking: true,
            name: "Fake Check",
          }),
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "post",
        }
      ).then((r) => r.json());
      console.log(
        `Webhook ${req.body.type} received for deployment ${req.body.payload.deployment.id}`,
        `Check created:`,
        check
      );
      break;
    case "deployment-prepared":
      const data = await fetch(
        `https://api.vercel.com/v1/deployments/${req.body.payload.deployment.id}/checks`,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
          method: "get",
        }
      ).then((r) => r.json());

      const result = await fetch(
        `https://api.vercel.com/v1/deployments/${req.body.payload.deployment.id}/checks/${data.checks[0].id}`,
        {
          body: JSON.stringify({
            conclusion: "succeeded",
            status: "completed",
          }),
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "patch",
        }
      ).then((r) => r.json());
      console.log(
        `Webhook ${req.body.type} received for deployment ${req.body.payload.deployment.id}`,
        "Get Checks:",
        data,
        "Update Check:",
        result
      );
    default:
      console.log(
        `Webhook ${req.body.type} received for deployment ${req.body.payload.deployment.id}`
      );
  }

  if (req.body.type === "deployment-prepared") {
  }
  res.json({ done: true });
};
