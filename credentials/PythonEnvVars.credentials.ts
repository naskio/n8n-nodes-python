import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';


export class PythonEnvVars implements ICredentialType {
	displayName = 'Python Environment Variables';
	name = 'pythonEnvVars';
	properties: INodeProperties[] = [
		{
			displayName: '.env File Content',
			name: 'envFileContent',
			typeOptions: {
				rows: 10,
			},
			type: 'string',
			default: '',
			placeholder: 'HELLO=World!\n',
			description: 'The content of the .env file.',
		},
		// {
		// 	displayName: 'Environment Variables',
		// 	name: 'envVars',
		// 	type: 'fixedCollection',
		// 	// type: 'collection',
		// 	// type: 'string',
		// 	default: {},
		// 	placeholder: 'Add environment variable',
		// 	typeOptions: {
		// 		multipleValues: true,
		// 		sortable: true,
		// 	},
		// 	description: 'Environment variables.',
		// 	options: [
		// 		{
		// 			name: 'envVar',
		// 			displayName: 'Environment Variable',
		// 			values: [
		// 				{
		// 					displayName: 'Name',
		// 					name: 'name',
		// 					type: 'string',
		// 					default: '',
		// 					description: 'Name of the environment variable.',
		// 				},
		// 				{
		// 					displayName: 'Value',
		// 					name: 'value',
		// 					type: 'string',
		// 					default: '',
		// 					description: 'Value of the environment variable.',
		// 					typeOptions: {
		// 						password: true,
		// 					},
		// 				},
		// 			],
		// 		},
		// 	],
		// },
	];
}
