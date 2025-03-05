
import * as core from '@actions/core';
import { assert, type Equals } from "tsafe/assert";
import type { ActionName } from "./actions";

export const inputNames = [
    "action_name",
    "github_token",
    "owner",
    "repo",
    "sha",
    "automatic_commit_author_email",
    "onyxia_apps",
    "keycloak_apps",
    "version"
] as const;

export function getInputDescription(inputName: typeof inputNames[number]): string {
    switch (inputName) {
        case "action_name": return [
            `Action to run, one of: `,
            (() => {

                //NOTE: We don't import directly to avoid circular dependency
                const actionNames = [
                    "update_onyxia"
                ] as const;

                assert<Equals<typeof actionNames[number], ActionName>>(true);

                return actionNames;

            })().map(s => `"${s}"`).join(", ")
        ].join("");
        case "owner": return [
            "Repository owner, example: 'garronej',",
            "github.repository_owner"
        ].join("");
        case "repo": return [
            "Repository name, example: ",
            "'evt', github.event.repository.name"
        ].join("");
        case "github_token": return [
            "GitHub Personal access token",
            "One with no write access is provided by default"
        ].join("");
        case "sha": return [
            "If not provided, the good default will be used",
            "github.sha"
        ].join(" ")
        case "automatic_commit_author_email": return [
            "In actions that perform a git commit, the email of the author of the commit.",
            "Default to actions@github.com"
        ].join(" ");
        case "onyxia_apps": return [
            "For the update_onyxia action, Required.",
            "A space separated list of the onyxia app to update",
            "Example, in the default branch if you have",
            "apps/onyxia and apps/onyxia-test you would provide:",
            "'onyxia onyxia-test'.",
            "If empty string no app will be updated."
        ].join(" ");
        case "keycloak_apps": return [
            "For the update_onyxia action, Required.",
            "A space separated list of the keycloak app to update",
            "It will update the version of the Onyxia theme that is used",
            "Example, in the default branch if you have",
            "apps/keycloak and apps/keycloakv2 you would provide:",
            "'keycloak keycloakv2 onyxia-test'.",
            "If empty string no app will be updated."
        ].join(" ");
        case "version": return [
            "For the update_onyxia action, Required.",
            "The version of Onyxia to use.",
            "Example: 'v1.0.0' (it's ok to omit the 'v')"
        ].join(" ");
    }
}


export function getInputDefault(inputName: typeof inputNames[number]): string | undefined {
    switch (inputName) {
        case "owner": return "${{github.repository_owner}}";
        case "repo": return "${{github.event.repository.name}}";
        case "github_token": return "${{ github.token }}";
        case "sha": return "${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha }}";
        case "automatic_commit_author_email": return "actions@github.com";
    }
}


const getInput = (inputName: typeof inputNames[number]) => {

    if (inputNames.indexOf(inputName) < 0) {
        throw new Error(`${inputName} expected`);
    }

    return core.getInput(inputName);

}


export function getActionParamsFactory<U extends typeof inputNames[number]>(
    params: {
        inputNameSubset: readonly U[]
    }
) {

    const { inputNameSubset } = params;

    function getActionParams() {

        const params: Record<U, string> = {} as any;

        inputNameSubset.forEach(inputName => params[inputName] = getInput(inputName));

        return params;

    };

    return { getActionParams };

}

export function getActionName(): ActionName {
    return getInput("action_name") as any;
}
