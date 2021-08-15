import { Probot } from "probot";
import * as shell from "shelljs";
const FLAKEBOT_BRANCH = "flakebot";
const FLAKEBOT_USERNAME = "flakebot";
const FLAKEBOT_EMAIL = "flakebot[bot]@users.noreply.github.com";
let APP_TOKEN: string;
let DEFAULT_BRANCH: string;

export = (app: Probot) => {
    app.on(["issues", "repository_dispatch"], async (context) => {
        if (!APP_TOKEN) {
            APP_TOKEN = (
                (await context.octokit.auth({
                    type: "installation",
                })) as any
            ).token;
        }

        const { owner, repo } = context.repo();
        const repoDir = cloneRepo(owner, repo);
        update(repoDir);
        cleanupRepo(repoDir);

        const pr = context.pullRequest({
            body: "Automatic flake update request",
        });
        await context.octokit.pulls.create({
            head: FLAKEBOT_BRANCH,
            base: "main",
            repo: pr.repo,
            owner: pr.owner,
            title: "Update Flake Inputs",
        });
    });

    // For more information on building apps:
    // https://probot.github.io/docs/

    // To get your app running against GitHub, see:
    // https://probot.github.io/docs/development/
};

function mkTempDir(name: string): string {
    const currentTime = new Date().getTime();
    const dir = `~/.local/tmp/${name}_${currentTime}`;
    shell.echo(`creating ${dir}`);
    shell.mkdir("-p", dir);
    return dir;
}

function setUserInfo() {
    shell.exec(`git config user.name ${FLAKEBOT_USERNAME}`);
    shell.exec(`git config user.email ${FLAKEBOT_EMAIL}`);
}

function cloneRepo(owner: string, repo: string): string {
    const dir = mkTempDir(`${owner}_${repo}`);
    const cmd = `git clone https://x-access-token:${APP_TOKEN}@github.com/${owner}/${repo}.git ${dir}`;
    shell.echo(cmd);
    shell.exec(cmd);
    return dir;
}

function cleanupRepo(dir: string): void {
    shell.rm("-rf", [dir]);
}

function update(repoPath: string): void {
    shell.cd(repoPath);
    setUserInfo();
    const cmd = `git checkout -B ${FLAKEBOT_BRANCH} && nix flake update --commit-lock-file && git push -u origin ${FLAKEBOT_BRANCH}`;
    shell.echo(cmd);
    shell.exec(cmd);
}
