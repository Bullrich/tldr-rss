import { PullRequest } from "@octokit/webhooks-types";

import { ActionLogger, GitHubClient } from "./types";

/** API class that uses the default token to access the data from the pull request and the repository */
export class PullRequestApi {
  constructor(
    private readonly api: GitHubClient,
    private readonly logger: ActionLogger,
  ) {}

  getPrAuthor(pr: PullRequest): string {
    return pr.user.login;
  }
}
