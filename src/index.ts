import { Probot } from "probot";
import * as shell from "shelljs";
const FLAKEBOT_BRANCH = "flakebot";
const FLAKEBOT_USERNAME = "flakebot[bot]";
const FLAKEBOT_EMAIL = "flakebot[bot]@users.noreply.github.com";

export = (app: Probot) => {
    app.on(["repository_dispatch"], async (context) => {
        const token = (
            (await context.octokit.auth({
                type: "installation",
            })) as any
        ).token;

        const { owner, repo } = context.repo();
        const repoDir = cloneRepo(token, owner, repo);
        update(repoDir);
        cleanupRepo(repoDir);

        const pr = context.pullRequest({
            body: "Automatic flake update request",
        });
        const repoData = await context.octokit.repos.get(pr);
        const baseBranch =
            repoData.data.default_branch ??
            repoData.data.master_branch ??
            "main";
        try {
            await context.octokit.pulls.create({
                head: FLAKEBOT_BRANCH,
                base: baseBranch,
                repo: pr.repo,
                owner: pr.owner,
                title: "Update Flake Inputs",
            });
        } catch (e) {
            console.error(e);
            console.log("pull request already exists. aborting...");
        }
    });
};

function mkTempDir(name: string): string {
    const currentTime = new Date().getTime();
    const dir = `~/.local/tmp/${name}_${currentTime}`;
    shell.echo(`creating ${dir}`);
    shell.mkdir("-p", dir);
    return dir;
}

function cloneRepo(token: string, owner: string, repo: string): string {
    const dir = mkTempDir(`${owner}_${repo}`);
    const cmd = `git clone https://x-access-token:${token}@github.com/${owner}/${repo}.git ${dir}`;
    shell.echo(`cloning ${owner}/${repo} to ${dir}`);
    shell.exec(cmd);
    return dir;
}

function cleanupRepo(repoPath: string): void {
    shell.echo(`removing ${repoPath}`);
    shell.rm("-rf", [repoPath]);
}

function update(repoPath: string): void {
    shell.cd(repoPath);

    shell.echo(`setting username: ${FLAKEBOT_USERNAME}`);
    shell.exec(`git config user.name ${FLAKEBOT_USERNAME}`);

    shell.echo(`setting email: ${FLAKEBOT_EMAIL}`);
    shell.exec(`git config user.email ${FLAKEBOT_EMAIL}`);

    const cmd = `git checkout -B ${FLAKEBOT_BRANCH} && nix flake update --commit-lock-file && git push --force -u origin ${FLAKEBOT_BRANCH}`;
    shell.echo("updating flake inputs");
    shell.echo(cmd);
    shell.exec(cmd);
}
