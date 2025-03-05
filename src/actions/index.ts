
import { objectKeys } from "tsafe/objectKeys";
import * as update_onyxia from "./update_onyxia";

export const actions = {
    update_onyxia
} as const;

const actionNames = objectKeys(actions);

export type ActionName= (typeof actionNames)[number];