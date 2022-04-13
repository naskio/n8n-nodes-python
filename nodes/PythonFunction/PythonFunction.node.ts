import {IExecuteFunctions} from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import {spawn} from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as tempy from 'tempy';


export interface IExecReturnData {
	exitCode: number;
	error?: Error;
	stderr: string;
	stdout: string;
	items?: IDataObject[];
}


export class PythonFunction implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Python Function',
		name: 'pythonFunction',
		icon: 'fa:code',
		group: ['transform'],
		version: 1,
		description: 'Run custom Python 3.10 code which gets executed once and allows you to add, remove, change and replace items',
		defaults: {
			name: 'PythonFunction',
			color: '#4B8BBE',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'pythonEnvVars',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Python Code',
				name: 'functionCode',
				typeOptions: {
					alwaysOpenEditWindow: true,
					rows: 10,
					// codeAutocomplete: 'function', // requires changes in UI
					// editor: 'code', // LATER: need to set language='python' in monaco-editor but code => language='javascript'
				},
				type: 'string',
				default: `
# Code here will run only once, no matter how many input items there are.
# More info and help: https://github.com/naskio/n8n-nodes-python
return items
`,
				description: 'The Python code to execute.',
				noDataExpression: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {

		let items = this.getInputData();
		// Copy the items as they may get changed in the functions
		items = JSON.parse(JSON.stringify(items));


		// Get the python code snippet
		const functionCode = this.getNodeParameter('functionCode', 0) as string;
		const pythonEnvVars: Record<string, string> = parseEnvFile(String((await this.getCredentials('pythonEnvVars'))?.envFileContent || ''));
		let scriptPath = '';
		try {
			scriptPath = await getTemporaryScriptPath(functionCode);
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Could not generate temporary python script file: ${error.message}`);
		}


		try {

			// Execute the function code
			const execResults = await execPythonSpawn(scriptPath, unwrapJsonField(items), pythonEnvVars, this.sendMessageToUI);
			const {
				error: returnedError,
				exitCode,
				// stdout,
				// stderr,
				items: returnedItems,
			} = execResults;
			items = wrapJsonField(returnedItems) as INodeExecutionData[];


			// check errors
			if (returnedError !== undefined) {
				throw new NodeOperationError(this.getNode(), `exitCode: ${exitCode} ${returnedError?.message || ''}`);
			}
			// Do very basic validation of the data
			if (items === undefined) {
				throw new NodeOperationError(this.getNode(), 'No data got returned. Always return an Array of items!');
			}
			if (!Array.isArray(items)) {
				throw new NodeOperationError(this.getNode(), 'Always an Array of items has to be returned!');
			}
			for (const item of items) {
				if (item.json === undefined) {
					throw new NodeOperationError(this.getNode(), 'All returned items have to contain a property named "json"!');
				}
				if (typeof item.json !== 'object') {
					throw new NodeOperationError(this.getNode(), 'The json-property has to be an object!');
				}
				if (item.binary !== undefined) {
					if (Array.isArray(item.binary) || typeof item.binary !== 'object') {
						throw new NodeOperationError(this.getNode(), 'The binary-property has to be an object!');
					}
				}
			}
		} catch (error) {


			if (this.continueOnFail()) {
				items = [{json: {error: error.message}}];
			} else {


				// Try to find the line number which contains the error and attach to error message
				const stackLines = error.stack.split('\n');
				if (stackLines.length > 0) {
					const lineParts = stackLines[1].split(':');
					if (lineParts.length > 2) {
						const lineNumber = lineParts.splice(-2, 1);
						if (!isNaN(lineNumber)) {
							error.message = `${error.message} [Line ${lineNumber}]`;
						}
					}
				}
				throw error;
			}
		}


		return this.prepareOutputData(items);
	}
}


function parseShellOutput(outputStr: string): [] {
	return JSON.parse(outputStr);
}


function execPythonSpawn(scriptPath: string, items: IDataObject[], envVars: object, stdoutListener?: CallableFunction): Promise<IExecReturnData> {
	const returnData: IExecReturnData = {
		error: undefined,
		exitCode: 0,
		stderr: '',
		stdout: '',
	};
	return new Promise((resolve, reject) => {
		const child = spawn('python3', [scriptPath, '--items', JSON.stringify(items), '--env_vars', JSON.stringify(envVars)], {
			cwd: process.cwd(),
			// shell: true,
		});

		child.stdout.on('data', data => {
			returnData.stdout += data.toString();
			if (stdoutListener) {
				stdoutListener(data.toString());
			}
		});

		child.stderr.on('data', data => {
			returnData.stderr += data.toString();
		});

		child.on('error', (error) => {
			returnData.error = error;
			resolve(returnData);
		});

		child.on('close', code => {
			returnData.exitCode = code || 0;
			if (!code) {
				returnData.items = parseShellOutput(returnData.stderr);
			} else {
				returnData.error = new Error(returnData.stderr);
			}
			resolve(returnData);
		});
	});
}


function parseEnvFile(envFileContent: string): Record<string, string> {
	if (!envFileContent || envFileContent === '') {
		return {};
	}
	const envLines = envFileContent.split('\n');
	const envVars: Record<string, string> = {};
	for (const line of envLines) {
		const parts = line.split('=');
		if (parts.length === 2) {
			envVars[parts[0]] = parts[1];
		}
	}
	return envVars;
}


function formatCodeSnippet(code: string): string {
	// add tab at the beginning of each line
	return code
		.replace(/\n/g, '\n\t')
		.replace(/\r/g, '\n\t')
		.replace(/\r\n\t/g, '\n\t')
		.replace(/\r\n/g, '\n\t');
}


function getScriptCode(codeSnippet: string): string {
	const css = fs.readFileSync(path.resolve(__dirname, 'script.template.py'), 'utf8') || '';
	return css.replace('pass', formatCodeSnippet(codeSnippet));
}


async function getTemporaryScriptPath(codeSnippet: string): Promise<string> {
	const tmpPath = tempy.file({extension: 'py'});
	const codeStr = getScriptCode(codeSnippet);
	// write code to file
	fs.writeFileSync(tmpPath, codeStr);
	return tmpPath;
}


function unwrapJsonField(list: IDataObject[] = []): IDataObject[] {
	return list.reduce((acc, item) => {
		if ('json' in item) {
			acc.push(item.json as never);
		} else {
			acc.push(item as never);
		}
		return acc;
	}, []);
}


function wrapJsonField(list: IDataObject[] = []): IDataObject[] {
	return list.reduce((acc, item) => {
		const newItem: IDataObject = {...item};
		newItem.json = item;
		acc.push(newItem as never);
		return acc;
	}, []);
}
