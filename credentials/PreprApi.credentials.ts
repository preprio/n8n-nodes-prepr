import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon
} from 'n8n-workflow';

export class PreprApi implements ICredentialType {
	name = 'preprApi';

	displayName = 'Prepr CMS API';

	icon: Icon = 'file:Prepr.svg';

	documentationUrl = 'https://docs.prepr.io/graphql-api/authorization';

	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			description: 'sss',
			name: 'access_token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			hint: 'Create a access token with the following scopes `GraphQL`, `content_items`, `content_items_publish`, `content_items_delete` and connect the token to a Prepr User Account.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.access_token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://tracking.prepr.io',
			url: '/zapier/validate',
		},
	};
}
