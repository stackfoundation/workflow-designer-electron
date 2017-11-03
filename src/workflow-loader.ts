// import * as fs from 'fs';
import { toJS } from 'mobx';
import * as jsYaml from 'js-yaml';
import { IWorkflow } from '@stackfoundation/workflow-designer';

function isEmptyArray(obj: any): boolean {
    if (Array.isArray(obj) && obj.length == 0) {
        return true;
    }

    return false;
}

function condense(obj: any): any {
    let condensed: any = {};

    for (var prop in obj) {
        let value = obj[prop];
        if (!(value === null || value === undefined || value === false || value === '' || isEmptyArray(value))) {
            if (typeof (value) === 'object' && !Array.isArray(value)) {
                value = condense(value);
                if (Object.keys(value).length === 0) {
                    condensed[prop] = value;
                }
            } else if (Array.isArray(value) && value.length > 0) {
                condensed[prop] = value.map(element => typeof (element) === 'object' ? condense(element) : element);
            } else {
                condensed[prop] = value;
            }
        }
    }

    return condensed;
}

export function saveWorkflow(workflow: IWorkflow) {
    return jsYaml.safeDump(condense(toJS(workflow)), { skipInvalid: true });
}

export function loadWorkflow(input: string): IWorkflow {
    return jsYaml.safeLoad(input);
}