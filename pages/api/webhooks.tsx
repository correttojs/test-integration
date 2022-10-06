import { NextApiRequest, NextApiResponse } from "next";

const TOKEN = "aDfz6ZwDnHzgimgM3ehOSSi7";
const AXIOM_TOKEN = "xaat-91ca3499-12a8-406e-96b5-5f17348e985c";

const postMessage = async ({
  deploymentId,
  webhookType,
  level,
  payload,
}: {
  deploymentId: string;
  webhookType: string;
  payload?: any;
  level: "info" | "error" | "debug";
}) => {
  const d = await fetch(
    "https://cloud.axiom.co/api/v1/datasets/vercel/ingest",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AXIOM_TOKEN}`,
      },
      body: JSON.stringify([
        {
          time: new Date().toISOString(),
          data: { payload },
          level,
          tags: { deploymentId, webhookType },
        },
      ]),
    }
  ).then((r) => r.json());
  console.log(d);
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
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

        await postMessage({
          deploymentId: req.body.payload.deployment.id,
          webhookType: req.body.type,
          payload: check,
          level: "debug",
        });
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

        // const result = await fetch(
        //   `https://api.vercel.com/v1/deployments/${req.body.payload.deployment.id}/checks/${data.checks[0].id}`,
        //   {
        //     body: JSON.stringify({
        //       conclusion: "succeeded",
        //       status: "completed",
        //     }),
        //     headers: {
        //       Authorization: `Bearer ${TOKEN}`,
        //       "Content-Type": "application/json",
        //     },
        //     method: "patch",
        //   }
        // ).then((r) => r.json());

        await postMessage({
          deploymentId: req.body.payload.deployment.id,
          webhookType: req.body.type,
          payload: {
            checks: data,
            // updateCheck: result
          },
          level: "debug",
        });
        break;
      default:
        await postMessage({
          deploymentId: req.body.payload.deployment.id,
          webhookType: req.body.type,
          payload: null,
          level: "debug",
        });
    }
  } catch (e) {
    console.log(e);
  }
  res.json({ done: true });
};
