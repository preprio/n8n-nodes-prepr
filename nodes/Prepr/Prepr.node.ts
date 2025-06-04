import {
	IExecuteFunctions, ILoadOptionsFunctions, NodeApiError
} from 'n8n-workflow';

import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { NodeConnectionType } from 'n8n-workflow';

export class Prepr implements INodeType {

	methods = {
		loadOptions: {

			// Get Field for specific models (fetched on GraphQL)
			async getFieldsForType(this: ILoadOptionsFunctions) {
				const typeName = this.getNodeParameter('typeName', 0) as string;

				const options = {
					method: 'POST' as const,
					headers: {
						'Content-Type': 'application/json',
					},
					body: {
						query: `
							query IntrospectType($name: String!) {
								__type(name: $name) {
									fields {
										name
										description
									}
								}
							}
						`,
						variables: { name: typeName },
					},
					json: true,
				};

				const response = await this.helpers.requestWithAuthentication.call(this, 'preprApi', options);

				const fields = response.data?.__type?.fields ?? [];

				return fields
					.filter((field: any) => !field.name.startsWith('_'))
					.map((field: any) => ({
						name: field.description || field.name,
						value: field.name,
					}));
			},

			async getTypenames(this: ILoadOptionsFunctions) {

				let options = {
					method: 'POST' as const,
					headers: {
						'Content-Type': 'application/json',
					},
					body: {
						query: `
            {
              __schema {
                types {
                  name
                  kind
                  description
                }
              }
            }
          `,
					},
					json: true,
				};

				const response = await this.helpers.requestWithAuthentication.call(this, 'preprApi', options);
				const types = response.data?.__schema?.types ?? [];

				return types
					.filter(
						(t: any) =>
							t.kind === 'OBJECT' &&
							typeof t.description === 'string' &&
							t.description.startsWith('Single')
					)
					.map((t: any) => ({
						name: t.name,
						value: t.name,
					}));
			},

			async getLocales(this: ILoadOptionsFunctions) {

				let options = {
					method: 'POST' as const,
					headers: {
						'Content-Type': 'application/json',
					},
					body: {
						query: `
            {
              _Locales
            }
          `,
					},
					json: true,
				};

				const response = await this.helpers.requestWithAuthentication.call(this, 'preprApi', options);
				const types = response.data?._Locales ?? [];

				return types
					.map((t: any) => ({
						name: t,
						value: t,
					}));
			},
		},
	};

	description: INodeTypeDescription = {

		displayName: 'Prepr',

		name: 'prepr',

		icon: 'file:Prepr.svg',

		group: [],

		description: 'Interact with the Prepr API to create, update or delete items.',

		version: 1,

		defaults: {
			name: 'Prepr',
	},

		inputs: [NodeConnectionType.Main],

		outputs: [NodeConnectionType.Main],

		credentials: [
			{
				name: 'preprApi',
				required: true,
			},
		],

		requestDefaults: {
			baseURL: 'https://graphql.prepr.io',
			url: '/graphql'
		},

		documentationUrl: 'https://docs.prepr.io',

		properties: [
			// Prepr Resources
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Item',
						value: 'item',
					},
				],
				default: 'item',
				noDataExpression: true,
				required: true,
				description: 'Content Item',
			},

			// Prepr Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'item',
						],
					},
				},
				options: [
					{
						name: 'Assign',
						value: 'assign',
						description: 'Assign a item',
						action: 'Assign a item',
					},

					{
						name: 'Create',
						value: 'create',
						description: 'Create a item',
						action: 'Create a item',
					},

					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a item',
						action: 'Delete a item',
					},

					{
						name: 'Publish',
						value: 'publish',
						description: 'Publish a item',
						action: 'Publish a item',
					},

					{
						name: 'Unpublish',
						value: 'unpublish',
						description: 'Unpublish a item',
						action: 'Unpublish a item',
					},

					{
						name: 'Update',
						value: 'update',
						description: 'Update a item',
						action: 'Update a item',
					},
				],
				default: 'create',
				noDataExpression: true,
			},

			// ON ALL OPERATION
			{
				displayName: 'Locale Name or ID',
				name: 'locale',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getLocales',
				},
				default: '',
				required: true,
				description: 'Select the locale. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			// ON CREATE OPERATION
			{
				displayName: 'Model Name or ID',
				name: 'typeName',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTypenames',
				},
				displayOptions: {
					show: {
						operation: [
							'create', 'update'
						],
						resource: [
							'item',
						],
					},
				},
				default: '',
				required: true,
				description: 'Select the item model. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			{
				displayName: 'When updating an existing item, N8N will fetch the current state first, the fields specified below will be overwritten.',
				name: 'notice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['update'],
					},
				},
			},

			// WORKFLOW STAGE, CREATE, UPDATE OPERATIONS
			{
				displayName: 'Workflow Stage',
				name: 'workflowStage',
				type: 'options',
				options: [
					{ name: 'Done', value: 'Done' },
					{ name: 'In Progress', value: 'In progress' },
					{ name: 'Review', value: 'Review' },
					{ name: 'To Do', value: 'To do' },
					{ name: 'Unchanged', value: 'Unchanged' },
				],
				displayOptions: {
					show: {
						operation: [
							'create', 'update'
						],
						resource: [
							'item',
						],
					},
				},
				required:true,
				default: 'To do',
				description: 'Set the stage in the content workflow',
			},

			// ALL ACTION OPERATIONS
			{
				displayName: 'Item ID',
				name: 'itemId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'publish', 'unpublish', 'assign', 'delete', 'update'
						],
						resource: [
							'item',
						],
					},
				},
				default:'',
				placeholder: '',
				description: 'ID of the item the action is preformed on',
			},

			// ASSIGN OPERATION
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'assign'
						],
						resource: [
							'item',
						],
					},
				},
				default:'',
				placeholder: '',
				description: 'ID of the user the item gets assigned to',
			},

			// PUBLISH OPERATION
			{
				displayName: 'Publish On',
				name: 'publishOn',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'publish', 'create', 'update'
						],
						resource: [
							'item',
						],
					},
				},
				description: 'Only return entries published after this date',
			},

			// UNPUBLISH OPERATION
			{
				displayName: 'Unpublish On',
				name: 'unpublishOn',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'unpublish', 'create', 'update'
						],
						resource: [
							'item',
						],
					},
				},
				description: 'Only return entries published after this date',
			},

			// DELETE OPERATION
			{
				displayName: 'Delete Whole Item?',
				name: 'deleteWholeItem',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: [
							'delete'
						],
						resource: [
							'item',
						],
					},
				},
				required: true,
				default: false,
				description: 'Whether to delete the entire item rather than just the selected locale',
			},

			{
				displayName: 'Content Fields',
				name: 'contentFields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['create', 'update'],
					},
				},
				required: true,
				default: {},
				options: [
					{
						name: 'filter',
						displayName: 'Filter',
						values: [
							{
								displayName: 'Field Name or ID',
								name: 'key',
								type: 'options',
								description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
								typeOptions: {
									loadOptionsMethod: 'getFieldsForType',
									loadOptionsDependsOn: ['typeName'],
								},
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'json',
								default: '',
							},
						],
					},
				],
			}
		],
	};

	// EXECUTE OPERATION
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {

		// Handle data coming from previous nodes
		const items = this.getInputData();

		const returnData = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// For each item, we run the operations
		for (let i = 0; i < items.length; i++) {

			if (resource === 'item') {

				//region: CREATE OPERATION
				if (operation === 'create') {

					const typeName = this.getNodeParameter('typeName', i) as string;
					const locale = this.getNodeParameter('locale', i) as string;
					const workflowStage = this.getNodeParameter('workflowStage', i) as string;
					const publishOn = this.getNodeParameter('publishOn', i) as string;
					const unpublishOn = this.getNodeParameter('unpublishOn', i) as string;
					const contentFields = this.getNodeParameter('contentFields', i) as any;

					// Generate Prepr REST Record format
					const formattedFields: Record<string, any> = {};
					if (contentFields?.filter) {
						for (const field of contentFields.filter) {
							if (field.key) {
								try {
									formattedFields[field.key] = JSON.parse(field.value);
								} catch (e) {
									formattedFields[field.key] = field.value;
								}
							}
						}
					}

					// Create operation require at least one specified field.
					if (Object.keys(formattedFields).length === 0) {
						continue;
					}

					const body = {
						model : {
							body: typeName
						},
						locales: [
							locale
						],
						workflow_stage: {
							[locale]: workflowStage
						},
						items: {
							[locale] : formattedFields
						},
						publish_on: undefined as object | undefined,
						expire_on: undefined as object | undefined,
						fields: 'items,workflow_stage'
					};

					if (publishOn) {
						body.publish_on = {
							[locale]: Math.floor(new Date(publishOn).getTime() / 1000) as number
						};
					}

					if (unpublishOn) {
						body.expire_on = {
							[locale]: Math.floor(new Date(unpublishOn).getTime() / 1000) as number
						};
					}

					const options = {
						headers: {
							'Accept': 'application/json',
						},
						method: 'POST' as const,
						body: body,
						json: true,
						url: `https://rest6.prepr.io/content_items`,
						resolveWithFullResponse: true
					};

					const response = await this.helpers.requestWithAuthentication.call(this, 'preprApi', options);

					if(response.statusCode !== 201) {
						throw new NodeApiError(this.getNode(), response.body, { message: 'Create operation failed' });
					}

					// If 201; return created item.
					returnData.push(response.body);
				}
				//endregion

				//region: UPDATE OPERATION
				if (operation === 'update') {

					const itemId = this.getNodeParameter('itemId', i) as string;
					const locale = this.getNodeParameter('locale', i) as string;
					const workflowStage = this.getNodeParameter('workflowStage', i) as string;
					const publishOn = this.getNodeParameter('publishOn', i) as string;
					const unpublishOn = this.getNodeParameter('unpublishOn', i) as string;
					const contentFields = this.getNodeParameter('contentFields', i) as any;

					const fetchOptions = {
						headers: {
							'Accept': 'application/json',
						},
						method: 'GET' as const,
						body: {
								'fields': 'items,locales,workflow_stage'
						},
						json: true,
						url: `https://api.eu1.prepr.io/content_items/`+itemId,
						resolveWithFullResponse: true
					};

					const fetchResponse = await this.helpers.requestWithAuthentication.call(this, 'preprApi', fetchOptions);

					if(fetchResponse.statusCode === 200) {

						// Generate Prepr REST Record format
						let formattedFields: Record<string, any> = {};

						// Merge existing fields with new values
						const existingFields = fetchResponse.body?.items?.[locale];
						if (existingFields) {
							formattedFields = { ...existingFields };
						}
						if (contentFields?.filter) {
							for (const field of contentFields.filter) {
								if (field.key) {
									try {
										formattedFields[field.key] = JSON.parse(field.value);
									} catch (e) {
										formattedFields[field.key] = field.value;
									}
								}
							}
						}
						// Update operation requires at least one specified field
						if (Object.keys(formattedFields).length === 0) {
							continue;
						}

						const body = {
							locales: [
								locale
							],
							// Workflow Stage is only changed if set to a new default stage
							workflow_stage: {
								[locale]: workflowStage === 'Unchanged'
									? fetchResponse.body?.workflow_stage?.[locale]
									: workflowStage
							},
							items: {
								[locale] : formattedFields
							},
							publish_on: undefined as object | undefined,
							expire_on: undefined as object | undefined,
							fields: 'items,workflow_stage'
						};

						if (publishOn) {
							body.publish_on = {
								[locale]: Math.floor(new Date(publishOn).getTime() / 1000) as number
							};
						}

						if (unpublishOn) {
							body.expire_on = {
								[locale]: Math.floor(new Date(unpublishOn).getTime() / 1000) as number
							};
						}

						const options = {
							headers: {
								'Accept': 'application/json',
							},
							method: 'PUT' as const,
							body: body,
							json: true,
							url: `https://api.eu1.prepr.io/content_items/`+itemId,
							resolveWithFullResponse: true
						};

						const response = await this.helpers.requestWithAuthentication.call(this, 'preprApi', options);

						if(response.statusCode !== 200) {
							throw new NodeApiError(this.getNode(), response.body, { message: 'Update operation failed' });
						}

						// If 200; return created item.
						returnData.push(response.body);
						continue;
					}
				}
				//endregion

				//region: PUBLISH OPERATION
				if (operation === 'publish') {

					const itemId = this.getNodeParameter('itemId', i) as string;
					const locale = this.getNodeParameter('locale', i) as string;
					let publishOn = this.getNodeParameter('publishOn', i) as string;

					if (!publishOn) {
						publishOn = new Date().toISOString();
					}

					const options = {
						headers: {
							'Accept': 'application/json',
						},
						method: 'PATCH' as const,
						body: {
							publish_on: Math.floor(new Date(publishOn).getTime() / 1000) as number
						},
						json: true,
						url: `https://api.eu1.prepr.io/content_items/`+itemId+`/`+locale+`/publish`,
						resolveWithFullResponse: true
					};

					const response = await this.helpers.requestWithAuthentication.call(this, 'preprApi', options);

					if(response.statusCode !== 200) {
						throw new NodeApiError(this.getNode(), response.body, { message: 'Publish operation failed' });
					}

					// If 200; return result data.
					returnData.push(response.body);
					continue;
				}
				//endregion

				//region: UNPUBLISH OPERATION
				if (operation === 'unpublish') {

					const itemId = this.getNodeParameter('itemId', i) as string;
					const locale = this.getNodeParameter('locale', i) as string;
					let unpublishOn = this.getNodeParameter('unpublishOn', i) as string;

					if (!unpublishOn) {
						unpublishOn = new Date().toISOString();
					}

					const options = {
						headers: {
							'Accept': 'application/json',
						},
						method: 'PATCH' as const,
						body: {
							unpublish_on: Math.floor(new Date(unpublishOn).getTime() / 1000) as number
						},
						json: true,
						url: `https://api.eu1.prepr.io/content_items/`+itemId+`/`+locale+`/unpublish`,
						resolveWithFullResponse: true
					};

					const response = await this.helpers.requestWithAuthentication.call(this, 'preprApi', options);

					if(response.statusCode !== 200) {
						throw new NodeApiError(this.getNode(), response.body, { message: 'Unpublish operation failed' });
					}

					// If 200; return result data.
					returnData.push(response.body);
					continue;
				}
				//endregion

				//region: ASSIGN OPERATION
				if (operation === 'assign') {

					const itemId = this.getNodeParameter('itemId', i) as string;
					const locale = this.getNodeParameter('locale', i) as string;
					const userId = this.getNodeParameter('userId', i) as string;

					const options = {
						headers: {
							'Accept': 'application/json',
						},
						method: 'PATCH' as const,
						body: {},
						json: true,
						url: `https://api.eu1.prepr.io/content_items/`+itemId+`/`+locale+`/assign/`+userId,
						resolveWithFullResponse: true
					};

					const response = await this.helpers.requestWithAuthentication.call(this, 'preprApi', options);

					if(response.statusCode !== 200) {
						throw new NodeApiError(this.getNode(), response.body, { message: 'Assign operation failed' });
					}

					// If 200; return result data.
					returnData.push(response.body);
					continue;
				}
				//endregion

				//region: DELETE OPERATION
				if (operation === 'delete') {

					const itemId = this.getNodeParameter('itemId', i) as string;
					const locale = this.getNodeParameter('locale', i) as string;
					const deleteWholeItem = this.getNodeParameter('deleteWholeItem', i) as boolean;

					let deleteUri = 'content_items/'+itemId+'/'+locale;

					if(deleteWholeItem === true) {
						deleteUri = 'content_items/'+itemId;
					}

					const options = {
						headers: {
							'Accept': 'application/json',
						},
						method: 'DELETE' as const,
						body: {},
						json: true,
						url: `https://api.eu1.prepr.io/`+deleteUri,
						resolveWithFullResponse: true
					};

					const response = await this.helpers.requestWithAuthentication.call(this, 'preprApi', options);

					if(response.statusCode !== 204) {
						throw new NodeApiError(this.getNode(), response.body, { message: 'Delete operation failed' });
					}

					// If 204; return result data.
					returnData.push([]);
					continue;
				}
				//endregion
			}
		}

		// Map data to n8n data structure
		return [this.helpers.returnJsonArray(returnData)];
	}
}
