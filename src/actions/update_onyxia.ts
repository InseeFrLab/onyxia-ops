import { getActionParamsFactory } from "../inputHelper";
import { SemVer } from "../tools/SemVer";
import * as fs from "fs";
import { join as pathJoin } from "path";
import { assert } from "tsafe/assert";
import YAML from "yaml";
import { gitClone } from "../tools/gitClone";
import { updateUrl } from "../tools/updateUrl";

const { getActionParams } = getActionParamsFactory({
    "inputNameSubset": [
        "owner",
        "repo",
        "sha",
        "github_token",
        "automatic_commit_author_email",
        "onyxia_apps",
        "keycloak_apps",
        "version"
    ] as const
});

type Params = ReturnType<typeof getActionParams>;


export async function _run(
    params: Params & {
        log?: (message: string) => void;
    }
): Promise<void> {

    const {
        github_token,
        owner,
        repo,
        sha,
        automatic_commit_author_email,
        keycloak_apps,
        onyxia_apps,
        version,
        log = () => { }
    } = params;

    log(JSON.stringify(params, null, 2));


    gitClone({
        log,
        "repository": `${owner}/${repo}` as const,
        "ref": sha,
        "token": github_token,
        "action": async ({ repoPath }) => {

            onyxia_apps.split(" ").forEach(appName => {

                const chartPath = pathJoin(repoPath, "apps", appName, "Chart.yaml");

                const chart = YAML.parseDocument(fs.readFileSync(chartPath, "utf8"));

                {

                    assert(chart.getIn(["dependencies", 0, "name"]) === "onyxia", "Expect the first dependency to be onyxia");

                    const currentVersion = chart.getIn(["dependencies", 0, "version"]);

                    assert(typeof currentVersion === "string", "Current version should be a string");

                    if( SemVer.compare(SemVer.parse(currentVersion), SemVer.parse(version)) === 0 ){

                        log(`Onyxia is already at version ${version} for app apps/${appName}`);

                        return;

                    }

                    chart.setIn(["dependencies", 0, "version"], SemVer.stringify(SemVer.parse(version)))
                }

                fs.writeFileSync(
                    chartPath,
                    Buffer.from(YAML.stringify(chart), "utf8"),
                );

            });

            keycloak_apps.split(" ").forEach(appName => {

                const valuesYamlFilePath = pathJoin(repoPath, "apps", appName, "values.yaml");

                let valuesYamlRaw = fs.readFileSync(valuesYamlFilePath).toString("utf8");

                valuesYamlRaw = updateUrl({
                    "text": valuesYamlRaw,
                    "getUrl": tagName => `https://github.com/InseeFrLab/onyxia/releases/download/${tagName}/`,
                    "tagName": `v${SemVer.stringify(SemVer.parse(version))}`
                });

                fs.writeFileSync(
                    valuesYamlFilePath,
                    Buffer.from(valuesYamlRaw, "utf8")
                );

            });

            return { 
                "doCommit": true,
                "doAddAll": false,
                "commitAuthorEmail": automatic_commit_author_email,
                "message": `Update Onyxia to ${version}`
             };

        }
    });

}


export async function run() {

    const params = getActionParams();

    await _run({
        ...params,
        "log": console.log.bind(console)
    });

}
