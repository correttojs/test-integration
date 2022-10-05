import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(JSON.stringify(req.body));
  res.json({ done: true });
};
