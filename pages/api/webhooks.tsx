import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("Webhook received", req.body.type);
  console.log("Webhook Payload", req.body);
  res.json({ done: true });
};
