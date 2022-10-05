import { CheckType } from "pages/api/webhook.types";
import { aws } from "src/aws";

type FetchVercelArgs = {
    path: string,
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: Record<string, number | string | boolean>
}

const TEAM_ID = 'team_GHTQvEMwSj2cIkL50vUq4yLj';
export const fetchVercel = async <T>(args: FetchVercelArgs) => {
    const token = (await aws.getKey("token"))?.accessToken; 
    console.log(`Fetching ${args.path}`); 
    var headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);
    if (args.body) {
        headers.append("Content-Type", "application/json");
    }
    headers.append("Host", "api.vercel.com");
    const data: T = await fetch(`https://api.vercel.com${args.path}?teamId=${TEAM_ID}`, {
        headers,
        method: args.method ?? 'GET',
        body: args.body ? JSON.stringify(args.body) : undefined,
    }).then(r => r.json());

    return data as T;
}

export const fetchChecks = async (deploymentId: string) => {
    const data = await fetchVercel<{ checks: CheckType[] }>({
        path: `/v13/deployments/${deploymentId}/checks`,
    });
    return data.checks;
};

export const fetchFailedChecks = async (deploymentId: string) => {
    const checks = await fetchChecks(deploymentId);
    const failingChecks = checks.filter((check) => check.conclusion === 'failed');
    console.log('failingChecks', failingChecks);
    return failingChecks;
};

export const rerunFailedChecks = (failingChecks: CheckType[], deploymentId: string) => {
    return Promise.all(
        failingChecks.map(async (check) => {
            await fetchVercel<{ checks: CheckType[] }>({
                path: `/v1/deployments/${deploymentId}/checks/${check.id}/rerequest`,
                method: 'POST',
            });

            return { id: check.id, status: 'rerequested' };
        })
    );

}

type UpdateCheckArgs = {
    deploymentId: string,
    checkId: string,
    detailsUrl?: string
    conclusion?: "canceled" | "failed" | "neutral" | "succeeded" | "skipped"
    status: "running" | "completed"
}

export const updateCheck = async (args: UpdateCheckArgs) => {
    const body: Record<string, string | boolean | number> = {
        status: args.status,
    }
    if (args.conclusion) {
        body.conclusion = args.conclusion;
    }
    if (args.detailsUrl) {
        body.detailsUrl = args.detailsUrl;
    }
    fetchVercel({
        path: `/v1/deployments/${args.deploymentId}/checks/${args.checkId}`,
        method: 'PATCH',
        body,
    });
}