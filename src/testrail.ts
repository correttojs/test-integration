
import { CheckType } from 'pages/api/webhook.types';
import Testrail, { INewTestRun, ITestResult } from 'testrail-api';

var testrail = new Testrail({
    host: 'https://mxdqa.testrail.io',
    user: process.env.TESTRAIL_REPORTER_USERNAME ?? '',
    password: process.env.TESTRAIL_REPORTER_PASSWORD ?? ''
});

const projectId = 25;
const suiteId = 1692;

const getBody = <T>(body: T) => (body as any as { ["tests"]: typeof body })["tests"]


export const reportTestrail = async (testResults: CheckType[]) => {
    try {
        const { body: run } = await testrail.addRun(projectId, {
            suite_id: suiteId,
            name: "Running checkly",
        } as INewTestRun);
        console.log("RunId", run.id);
        const { body: testsBody } = await testrail.getTests(run.id, {});
        const tests = getBody(testsBody);
        console.log(tests, "tests");

        const mappedTestResults = testResults.map(result => {
            const match = result.name.match(/(C\d+)/); 
            if (match?.[1]) {
                const testCase = parseInt(match?.[1].slice(1), 10); 
                const test = tests.find(t => t.case_id === testCase);
                if (test) {
                    return {
                        test_id: test.id,
                        status_id: result.conclusion === "succeeded" ? 1 : 5,
                    }
                }
            }
            return null

        }).filter(t => t !== null) as NonNullable<ITestResult>[];
        if (!mappedTestResults.length) {
            return;
        }

        await testrail.addResults(run.id, mappedTestResults);
        return mappedTestResults
    } catch (e) {
        console.log(e);
    }


}