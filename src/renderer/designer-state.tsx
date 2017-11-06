import * as fs from 'fs';
var electron = require('electron');

import {remote, ipcRenderer} from 'electron';
import * as path from 'path';
import {debounce} from 'lodash';

import { action, autorun, observable } from 'mobx';
import * as React from 'react';

import { EditorState } from '@stackfoundation/workflow-designer/lib/models/state';
import { CatalogImage } from '@stackfoundation/workflow-designer/lib/models/catalog';
import { Workflow, WorkflowStepSimple } from '@stackfoundation/workflow-designer/lib/models/workflow';
import { WorkflowService } from '@stackfoundation/workflow-designer/lib/services/workflow_service';
import { saveWorkflow, loadWorkflow } from '../workflow-loader';
import { StepCodeEditor } from './step-code-editor';

var electron = require('electron');
var currentWindow = electron.remote.getCurrentWindow();

const scriptEditorFactory = (step: WorkflowStepSimple, fieldName: string) =>
    <StepCodeEditor step={step} fieldName={fieldName} />;
const externalBrowserLinkFactory = (link: string, text: string) =>
    <a href="#" onClick={_ => electron.shell.openExternal('https://stack.foundation/#!' + link)} > {text} </a>;

export class UIState {
    @observable projectName: string = '';
    @observable projectPath: string = '';
    @observable projectWorkflows: string[] = [];
    @observable workflowName: string = '';
    @observable workflowPath: string = '';
    @observable yaml: boolean = false;
    @observable yamlError: boolean = false;
}

export class DesignerState {
    private catalog: CatalogImage[];
    @observable public dirty: boolean = false;
    private dispose: any;
    @observable public editorState: EditorState;
    private originalYaml: string = '';
    @observable public yamlMode: boolean = false;
    @observable public yaml: string = '';

    @observable
    public uiState: UIState = new UIState();

    private ipcEventCallbacks: any = {
        new: () => this.newWorkflow(),
        open: () => this.openWorkflow(),
        save: () => this.saveWorkflow(),
        saveAs: () => this.saveWorkflowAs(),
    };

    constructor() {
        let state = new EditorState();

        new WorkflowService().getWorkflowImagesCatalog()
            .then(response => {
                this.catalog = response;
                state.catalog = this.catalog;
            });

        state.workflow = new Workflow({});
        state.ide = false;
        state.allowCalls = true;

        state.scriptEditorFactory = scriptEditorFactory;
        state.sfLinkFactory = externalBrowserLinkFactory;

        state.selectInitialStep();

        this.editorState = state;

        this.resetDirtyCheck();

        ipcRenderer.on('new', this.ipcEventCallbacks.new);
        ipcRenderer.on('open', this.ipcEventCallbacks.open);
        ipcRenderer.on('save', this.ipcEventCallbacks.save);
        ipcRenderer.on('saveAs', this.ipcEventCallbacks.saveAs);

        let forceQuit = false;
        window.onbeforeunload = (e) => {
            if (!forceQuit && this.dirty) {
                e.returnValue = false

                if (this.runDirtyFileCheck()) {
                    forceQuit = true;
                    setTimeout(() => {
                        remote.getCurrentWindow().close();
                        ipcRenderer.send('quit');
                    }, 1)
                }
            }
          }
          
    }

    onDestroy () {
        if (this.dispose) {
            this.dispose();
        }
        
        ipcRenderer.removeListener('new', this.ipcEventCallbacks.new);
        ipcRenderer.removeListener('open', this.ipcEventCallbacks.open);
        ipcRenderer.removeListener('save', this.ipcEventCallbacks.save);
        ipcRenderer.removeListener('saveAs', this.ipcEventCallbacks.saveAs);
    }

    @action
    private setDirty(dirty: boolean) {
        // ipcRenderer.sendSync('file-dirty', dirty);
        this.dirty = dirty;
    }

    public quit () {
        ipcRenderer.send('quit');
    }

    @action
    private resetDirtyCheck() {
        if (this.dispose) {
            this.dispose();
        }

        this.originalYaml = this.yaml;
        this.setDirty(false);
        this.dispose = autorun(() => {
            if (!this.dirty) {
                let objectDiff = this.workflowToYaml() !== this.originalYaml;
                let codeDiff = this.yaml !== this.originalYaml;
                if (this.uiState.yaml ? codeDiff : objectDiff) {
                    this.setDirty(true);
                    if (this.dispose) {
                        this.dispose();
                    }
                }
            }
        });
    }

    @action
    private updateWorkflow = (yaml: string): boolean => {
        try{
            let workflow = loadWorkflow(yaml);
    
            this.editorState.workflow = Workflow.apply(workflow as Workflow);
            this.editorState.selectInitialStep();
            this.uiState.yamlError = false;

            return true
        }
        catch (e) {
            this.uiState.yamlError = true;
            return false;
        }
    }

    private workflowToYaml() {
        let yaml = saveWorkflow(this.editorState.workflow.toJS()).trim();
        return yaml === "{}" ? '' : yaml;
    }

    public saveWorkflowAs = (savePath?: string): boolean => {
        if (!savePath) {
            let path = electron.remote.dialog.showSaveDialog(currentWindow,
                {
                    title: "Save workflow as",
                    filters: [
                        { name: 'Workflows', extensions: ['wflow'] }
                    ]
                });
            if (!path || path.length === 0) {
                return false;
            }

            savePath = path;
        }

        if (this.uiState.yaml) {
            fs.writeFileSync(savePath, this.yaml);
            this.updateWorkflow(this.yaml);
        } else {
            this.yaml = this.workflowToYaml();
            fs.writeFileSync(savePath, this.yaml);
        }

        this.resetDirtyCheck();
        this.updateUiState(savePath);
        return true;
    }

    public saveWorkflow = (): boolean => {
        if (this.uiState.workflowPath && this.uiState.workflowPath.length > 0) {
            return this.saveWorkflowAs(this.uiState.workflowPath);
        }
        return this.saveWorkflowAs();
    }

    @action
    public updateYaml(yaml: string, updateWorkflow: boolean = false) {
        this.yaml = yaml;

        if (updateWorkflow) {
            debounce(this.updateWorkflow, 500);
        }
    }

    @action
    public setMode(yamlMode: boolean) {
        if (yamlMode === this.uiState.yaml) {
            return;
        }

        if (yamlMode) {
            this.yaml = this.workflowToYaml();
        } else {
            if (!this.updateWorkflow(this.yaml)) {
                return;
            }
        }

        this.uiState.yaml = yamlMode;
        this.editorState.catalog = this.catalog;
    }

    private runDirtyFileCheck (): boolean {
        if (this.dirty) {
            let currentWindow = electron.remote.getCurrentWindow();
            let response = electron.remote.dialog.showMessageBox(currentWindow, { 
                type: 'warning',
                buttons: ['Yes', 'No', 'Cancel'],
                noLink: true,
                defaultId: 0,
                cancelId: -1,
                title: 'Workflow modified',
                message: 'Do you want to save changes to the current workflow?'
            });

            if (response == -1 || response == 2) {
                return false;
            } else if (response == 0) {
                return this.saveWorkflow();
            }
        }

        return true 
    }

    @action
    public openWorkflow = (workflowPath?: string) => {
        if (!this.runDirtyFileCheck()) {
            return;
        }
        if (!workflowPath) {
            let path = electron.remote.dialog.showOpenDialog(currentWindow,
                {
                    title: "Open workflow",
                    filters: [
                        { name: 'Workflows', extensions: ['wflow'] }
                    ]
                });
            if (!path || path.length === 0) {
                return;
            }
            workflowPath = path[0];
        }
        this.uiState.workflowPath = workflowPath;
        
        let buffer = fs.readFileSync(workflowPath);
        if (buffer) {
            if (!this.updateWorkflow(buffer.toString())) {
                this.setMode(true);
            }

            this.updateYaml(buffer.toString());
            this.editorState.catalog = this.catalog;

            this.resetDirtyCheck();
        }

        this.updateUiState(workflowPath);
    }

    @action
    private updateUiState (workflowPath?: string) {
        if (workflowPath) {
            this.uiState.workflowPath = workflowPath;
            this.uiState.workflowName = path.basename(workflowPath);
            if (this.uiState.workflowName.endsWith('.wflow')) {
                this.uiState.workflowName = this.uiState.workflowName.substring(0, this.uiState.workflowName.length - 6);
            }
    
            this.uiState.projectPath = path.dirname(workflowPath);
    
            if (path.basename(this.uiState.projectPath) == 'workflows') {
                this.uiState.projectWorkflows = this.listProjectWorkflows(this.uiState.projectPath);
                this.uiState.projectName = path.basename(path.dirname(this.uiState.projectPath));
            }
        }
        else {
            this.uiState = new UIState();
        }
    }

    @action
    public newWorkflow = () => {
        if (!this.runDirtyFileCheck()) {
            return;
        }
        this.editorState.workflow = new Workflow();
        this.editorState.selectInitialStep();
        this.yaml = this.workflowToYaml();
        this.editorState.catalog = this.catalog;
        this.resetDirtyCheck();
        this.updateUiState();
    }

    private listProjectWorkflows(projectDirectory: string): string[] {
        let children = fs.readdirSync(projectDirectory);
        if (children && children.length > 0) {
            children = children
                .filter(workflow => workflow && workflow.endsWith('.wflow'))
                .map(workflow => workflow.substring(0, workflow.length - 6));
        }

        return children;
    }
}
