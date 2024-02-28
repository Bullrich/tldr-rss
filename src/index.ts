import { getInput, info, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { PullRequest } from "@octokit/webhooks-types";

import { PullRequestApi } from "./github/pullRequest";
import { generateCoreLogger } from "./util";

const getRepo = (ctx: Context) => {
  let repo = getInput("repo", { required: false });
  if (!repo) {
    repo = ctx.repo.repo;
  }

  let owner = getInput("owner", { required: false });
  if (!owner) {
    owner = ctx.repo.owner;
  }

  return { repo, owner };
};

const repo = getRepo(context);

setOutput("repo", `${repo.owner}/${repo.repo}`);

if (context.payload.pull_request) {
  const token = getInput("GITHUB_TOKEN", { required: true });
  const api = new PullRequestApi(getOctokit(token), generateCoreLogger());
  const author = api.getPrAuthor(context.payload.pull_request as PullRequest);
  info("Author of the PR is " + author);
}
