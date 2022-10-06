import { NextApiRequest, NextApiResponse } from "next";

const TOKEN = "aDfz6ZwDnHzgimgM3ehOSSi7";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("Webhook received", req.body.type);
  console.log("Webhook Payload", req.body);
  if (req.body.type === "deployment") {
    await fetch(
      `https://api.vercel.com/v1/deployments/${req.body.payload.deployment.id}/checks`,
      {
        body: JSON.stringify({
          blocking: true,
          name: "Fake Check",
        }),
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
        method: "post",
      }
    );
  }
  if (req.body.type === "deployment-ready") {
    const data = await fetch(
      `https://api.vercel.com/v1/deployments/${req.body.payload.deployment.id}/checks`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
        method: "get",
      }
    ).then((r) => r.json());
    console.log("Checks", data);
    console.log("CheckId", data.checks[0].id);
    await fetch(
      `https://api.vercel.com/v1/deployments/${req.body.payload.deployment.id}/checks/${data.checks[0].id}`,
      {
        body: JSON.stringify({
          conclusion: "succeeded",
        }),
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
        method: "patch",
      }
    );
  }
  res.json({ done: true });
};
