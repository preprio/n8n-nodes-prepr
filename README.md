# n8n-nodes-prepr

This is an n8n community node. It lets you use Prepr in your n8n workflows.

Prepr is a headless content management platform that lets you model, manage, and personalize content for websites and apps.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Create content items
- Update content items
- Assign content items to users
- Publish content items
- Unpublish content items
- Delete content items

## Credentials

To use this node, you must create a Prepr Access Token.

- Get your API access token from Prepr
- Your token must include the following scopes: GraphQL, content_items, content_items_publish, and content_items_delete
- The token should be associated with a Prepr user account that has sufficient permissions

## Compatibility

- Requires n8n version 1.35.0 or higher
- Tested with n8n versions 1.35.0 - 1.64.3
- Requires a Prepr Access Token with version 2025.05.02 or higher

## Usage

This node allows dynamic creation, updating, and deletion of content via the Prepr API. It also supports workflows with:

- Use the `Model` and `Locale` options to target specific content types
- Use the `Workflow Stage` and `Publish On` fields to control lifecycle and scheduling
- You can load available models and fields from the API schema automatically
- When creating/updating items, field values should follow [Prepr API field specification](https://docs.prepr.io/mutation-api/content-items-create-update-and-destroy#field-types)

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Prepr developer docs](https://docs.prepr.io)

## Version history

- v0.1.0: Initial release with content item create/update/publish/unpublish support

## Support

If you got any questions about the community node; contact the Prepr support team to get assistance.

[![npm version](https://img.shields.io/npm/v/@preprio/n8n-nodes-prepr.svg)](https://www.npmjs.com/package/@preprio/n8n-nodes-prepr)
