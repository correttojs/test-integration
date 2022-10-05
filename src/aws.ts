



import S3 from 'aws-sdk/clients/s3';
import { config } from 'aws-sdk';

config.update({ region: 'eu-central-1' });

const s3 = new S3({ apiVersion: '2006-03-01', accessKeyId: process.env.ACCESS_KEY, secretAccessKey: process.env.SECRET_KEY });
const BUCKET_NAME = 'web-vercel-integration';

const getKey = (id: string) => `${id}.json`;

export const aws = {

  setToken: async (id: string, token: string) => s3.upload(
    {
      Bucket: BUCKET_NAME,
      Key: getKey(id),
      Body: JSON.stringify({ token }),
    }).promise()
  ,
  setKey: async (id: string, count: number) => s3.upload(
    {
      Bucket: BUCKET_NAME,
      Key: getKey(id),
      Body: JSON.stringify({ count }),
    }).promise(),

  getKey: async (id: string) => {
    try {
      const data = await s3.getObject(
        {
          Bucket: BUCKET_NAME,
          Key: getKey(id),
        }).promise();
      const body = data.Body?.toString()
      return (JSON.parse(body ?? ''));
    } catch (e) {
      return null;
    }

  },
  removeKey: async (id: string) => s3.deleteObject({
          Bucket: BUCKET_NAME,
          Key: getKey(id),
  }).promise()
}


export const hasDeploymentRerunChecks = async (deploymentId: string) => { 

  const cacheData = await aws.getKey(deploymentId);
  console.log(`aws - get ${deploymentId}`, typeof cacheData, cacheData?.count);

  if (cacheData && cacheData?.count >= parseInt(process.env.RERUN_CHECKS_COUNT ?? '0', 10)) {
    console.log(`aws - skipped ${deploymentId}`);
    return true;
  }

  const cacheSet = await aws.setKey(deploymentId, (cacheData?.count ?? 0) + 1);
  console.log(`aws - set ${deploymentId}`, cacheSet);
  return false;
};