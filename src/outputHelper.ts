
import * as core from '@actions/core'
import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";

export const outputNames = [
] as const;

export function getOutputDescription(inputName: typeof outputNames[number]): string {
    switch (inputName) {
    }
    assert(false);
}

export function setOutputFactory<U extends typeof outputNames[number]>() {

    function setOutput(outputs: Record<U, string>): void {
        objectKeys(outputs)
            .forEach(outputName => core.setOutput(outputName, outputs[outputName]));
    };

    return { setOutput };

}