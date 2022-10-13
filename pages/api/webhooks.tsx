import { NextApiRequest, NextApiResponse } from "next";

const TOKEN = "aDfz6ZwDnHzgimgM3ehOSSi7";
const AXIOM_TOKEN = "xaat-91ca3499-12a8-406e-96b5-5f17348e985c";

const postMessage = async ({
  deploymentId,
  webhookType,
  level,
  payload,
  link,
}: {
  deploymentId: string;
  webhookType: string;
  payload?: any;
  level: "info" | "error" | "debug";
  link?: string;
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
          link,
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

const getChecks = (req: NextApiRequest) => {
  return fetch(
    `https://api.vercel.com/v1/deployments/${req.body.payload.deployment.id}/checks`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      method: "get",
    }
  ).then((r) => r.json());
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    switch (req.body.type) {
      case "deployment":
        // 1 - Register checks
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
          link: req.body.payload.deployment.url,
        });
        break;
      case "deployment-prepared":
        // 2 - Run checks (i.e. npm run tests)...

        await fetch(req.body.payload.deployment.url).then((r) => r.text());

        // 3 - Update checks
        const data = await getChecks(req);

        const result = await fetch(
          `https://api.vercel.com/v1/deployments/${req.body.payload.deployment.id}/checks/${data.checks[0].id}`,
          {
            body: JSON.stringify({
              conclusion: "completed",
              status: "completed",
            }),
            headers: {
              Authorization: `Bearer ${TOKEN}`,
              "Content-Type": "application/json",
            },
            method: "patch",
          }
        ).then((r) => r.json());

        await postMessage({
          deploymentId: req.body.payload.deployment.id,
          webhookType: req.body.type,
          payload: {
            checks: data.checks,
            updateCheck: result,
          },
          level: "debug",
          link: req.body.payload.deployment.url,
        });
        break;
      case "deployment-ready":
        await postMessage({
          deploymentId: req.body.payload.deployment.id,
          webhookType: req.body.type,
          payload: {
            checks: (await getChecks(req)).checks,
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
