import { App } from "@octokit/app";

const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_BASE = process.env.GITHUB_API_URL;

main();

async function main() {
  try {
    const app = new App({
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
    });

    for await (const { octokit, repository } of app.eachRepository.iterator()) {
      await octokit.request({
        method: "POST",
        url: "/repos/:owner/:repo/dispatches",
        baseUrl: API_BASE,
        owner: repository.owner.login,
        repo: repository.name,
        event_type: "flakebot",
      });
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}
