# How to Create an Auth Module Provider

In this document, youâll learn how to create an Auth Module Provider and the methods you must implement in its main service.

***

## Implementation Example

As you implement your Auth Module Provider, it can be useful to refer to an existing provider and how it's implemeted.

If you need to refer to an existing implementation as an example, check the [Google Auth Module Provider in the Medusa repository](https://github.com/medusajs/medusa/tree/develop/packages/modules/providers/auth-google).

***

## 1. Create Module Provider Directory

Start by creating a new directory for your module provider.

If you're creating the module provider in a Medusa application, create it under the `src/modules` directory. For example, `src/modules/my-auth`.

If you're creating the module provider in a plugin, create it under the `src/providers` directory. For example, `src/providers/my-auth`.

The rest of this guide always uses the `src/modules/my-auth` directory as an example.

***

## 2. Create the Auth Module Provider's Service

Create the file `src/modules/my-auth/service.ts` that holds the module provider's main service. It must extend the `AbstractAuthModuleProvider` class imported from `@medusajs/framework/utils`:

```ts title="src/modules/my-auth/service.ts"
import { AbstractAuthModuleProvider } from "@medusajs/framework/utils"

class MyAuthProviderService extends AbstractAuthModuleProvider {
  // TODO implement methods
}

export default MyAuthProviderService
```

### constructor

The constructor allows you to access resources from the module's container using the first parameter,
and the module's options using the second parameter.

If you're creating a client or establishing a connection with a third-party service, do it in the constructor.

#### Example

```ts
import { AbstractAuthModuleProvider } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  apiKey: string
}

class MyAuthProviderService extends AbstractAuthModuleProvider {
  static identifier = "my-auth"
  protected logger_: Logger
  protected options_: Options
  // assuming you're initializing a client
  protected client

  constructor (
    { logger }: InjectedDependencies,
    options: Options
  ) {
    super(...arguments)

    this.logger_ = logger
    this.options_ = options

    // assuming you're initializing a client
    this.client = new Client(options)
  }

  // ...
}

export default MyAuthProviderService
```

### DISPLAY\_NAME

This property indicates the name used when displaying the provider on a frontend application.

#### Example

```ts
class MyAuthProviderService extends AbstractAuthModuleProvider {
  static DISPLAY_NAME = "My Auth"
  // ...
}
```

### identifier

Every auth provider must have an `identifier` static property. The provider's ID
will be stored as `au_{identifier}_{id}`, where `{id}` is the provider's `id`
property in the `medusa-config.ts`.

#### Example

```ts
class MyAuthProviderService extends AbstractAuthModuleProvider {
  static identifier = "my-auth"
  // ...
}
```

### authenticate

This method authenticates the user.

The authentication happens either by directly authenticating or returning a redirect URL to continue
the authentication with a third party provider.

Related Read: [Learn about the different authentication flows in Medusa](https://docs.medusajs.com/resources/commerce-modules/auth/authentication-route).

#### Example

For example, if your authentication provider doesn't require validating a callback:

```ts
import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse
} from "@medusajs/framework/types"
// ...

class MyAuthProviderService extends AbstractAuthModuleProvider {
  // ...
  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const isAuthenticated = false
    // TODO perform custom logic to authenticate the user
    // for example, verifying a password

    if (!isAuthenticated) {
      // if the authentication didn't succeed, return
      // an object of the following format
      return {
        success: false,
        error: "Incorrect credentials"
      }
    }

    // authentication is successful, retrieve the identity
    const authIdentity = await authIdentityProviderService.retrieve({
      entity_id: data.body.email, // email or some ID
      provider: this.provider
    })

    return {
      success: true,
      authIdentity
    }
  }
}
```

If your authentication provider requires validating callback:

```ts
import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse
} from "@medusajs/framework/types"
// ...

class MyAuthProviderService extends AbstractAuthModuleProvider {
  // ...
  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const isAuthenticated = false
    // TODO perform custom logic to authenticate the user
    // ...

    if (!isAuthenticated) {
      // if the authentication didn't succeed, return
      // an object of the following format
      return {
        success: false,
        error: "Incorrect credentials"
      }
    }

    return {
      success: true,
      location: "some-url.com"
    }
  }
}
```

#### Parameters

- data: (\[AuthenticationInput]\(../../../types/interfaces/types.AuthenticationInput/page.mdx)) The details of the authentication request.

  - url: (\`string\`) URL of the incoming authentication request.

  - headers: (\`Record\<string, string>\`) Headers of incoming authentication request.

  - query: (\`Record\<string, string>\`) Query params of the incoming authentication request.

  - body: (\`Record\<string, string>\`) Body of the incoming authentication request.

    One of the arguments that is suggested to be treated in a standard manner is a \`callback\_url\` field.
    The field specifies where the user is redirected to after a successful authentication in the case of Oauth auhentication.
    If not passed, the provider will fallback to the callback\\\_url provided in the provider options.

  - protocol: (\`string\`) Protocol of the incoming authentication request (For example, \`https\`).
- authIdentityProviderService: (\[AuthIdentityProviderService]\(../../../types/interfaces/types.AuthIdentityProviderService/page.mdx)) The service used to retrieve or
  create an auth identity. It has two methods: \`create\` to create an auth identity,
  and \`retrieve\` to retrieve an auth identity. When you authenticate the user, you can create an auth identity
  using this service.

  - retrieve: ((\`selector\`: \`\`\{ entity\_id: string  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - create: ((\`data\`: \`\`\{ entity\_id: string ; provider\_metadata?: Record\&#60;string, unknown\&#62; ; user\_metadata?: Record\&#60;string, unknown\&#62;  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - update: ((\`entity\_id\`: \`string\`, \`data\`: \`\`\{ provider\_metadata?: Record\&#60;string, unknown\&#62; ; user\_metadata?: Record\&#60;string, unknown\&#62;  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - setState: ((\`key\`: \`string\`, \`value\`: \`Record\<string, unknown>\`) => Promise\&#60;void\&#62;)

  - getState: ((\`key\`: \`string\`) => Promise\&#60;null \\| Record\&#60;string, unknown\&#62;\&#62;)

#### Returns

- Promise: (Promise\&#60;\[AuthenticationResponse]\(../../../types/interfaces/types.AuthenticationResponse/page.mdx)\&#62;) The authentication response.

  - success: (\`boolean\`) Whether the authentication was successful.

  - authIdentity: (\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)) The authenticated user's details.

    - id: (\`string\`) The ID of the auth identity.

    - provider\_identities: (\[ProviderIdentityDTO]\(../../../auth/interfaces/auth.ProviderIdentityDTO/page.mdx)\[]) The list of provider identities linked to the auth identity.

    - app\_metadata: (\`Record\<string, unknown>\`) Holds information related to the actor IDs tied to the auth identity.

  - error: (\`string\`) If an error occurs during the authentication process,
    whether within the Auth Module or a third-party provider,
    the error message is set in this field.

  - location: (\`string\`) The URL to redirect to for further authentication action
    with a third-party provider. This takes precedence before
    the \`success\` field.

    So, after checking that authentication is successful,
    you should check whether this field is defined and, if so, redirect to the
    specified location.

### register

This method receives credentails to create a new auth identity. It performs any validation necessary
before creating the auth identity.

For example, in the `emailpass` provider, this method ensures that the provided email doesn't exist
before creating the auth identity.

This method is only used in a basic authentication flow, such as when using an email and password
to register and authenticate a user.

Related Read: [Learn about the different authentication flows in Medusa](https://docs.medusajs.com/resources/commerce-modules/auth/authentication-route).

#### Example

```ts
import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
// ...

class MyAuthProviderService extends AbstractAuthModuleProvider {
  // ...
  async register(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    try {
      await authIdentityService.retrieve({
        entity_id: data.body.email, // email or some ID
      })

      return {
        success: false,
        error: "Identity with email already exists",
      }
    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        const createdAuthIdentity = await authIdentityProviderService.create({
          entity_id: data.body.email, // email or some ID
          provider: this.provider,
          provider_metadata: {
            // can include password or any other relevant information
          }
        })

        return {
          success: true,
          authIdentity: createdAuthIdentity,
        }
      }

      return { success: false, error: error.message }
    }
  }
}
```

#### Parameters

- data: (\[AuthenticationInput]\(../../../types/interfaces/types.AuthenticationInput/page.mdx)) The details of the authentication request.

  - url: (\`string\`) URL of the incoming authentication request.

  - headers: (\`Record\<string, string>\`) Headers of incoming authentication request.

  - query: (\`Record\<string, string>\`) Query params of the incoming authentication request.

  - body: (\`Record\<string, string>\`) Body of the incoming authentication request.

    One of the arguments that is suggested to be treated in a standard manner is a \`callback\_url\` field.
    The field specifies where the user is redirected to after a successful authentication in the case of Oauth auhentication.
    If not passed, the provider will fallback to the callback\\\_url provided in the provider options.

  - protocol: (\`string\`) Protocol of the incoming authentication request (For example, \`https\`).
- authIdentityProviderService: (\[AuthIdentityProviderService]\(../../../types/interfaces/types.AuthIdentityProviderService/page.mdx)) The service used to retrieve or
  create an auth identity. It has two methods: \`create\` to create an auth identity,
  and \`retrieve\` to retrieve an auth identity. When you authenticate the user, you can create an auth identity
  using this service.

  - retrieve: ((\`selector\`: \`\`\{ entity\_id: string  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - create: ((\`data\`: \`\`\{ entity\_id: string ; provider\_metadata?: Record\&#60;string, unknown\&#62; ; user\_metadata?: Record\&#60;string, unknown\&#62;  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - update: ((\`entity\_id\`: \`string\`, \`data\`: \`\`\{ provider\_metadata?: Record\&#60;string, unknown\&#62; ; user\_metadata?: Record\&#60;string, unknown\&#62;  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - setState: ((\`key\`: \`string\`, \`value\`: \`Record\<string, unknown>\`) => Promise\&#60;void\&#62;)

  - getState: ((\`key\`: \`string\`) => Promise\&#60;null \\| Record\&#60;string, unknown\&#62;\&#62;)

#### Returns

- Promise: (Promise\&#60;\[AuthenticationResponse]\(../../../types/interfaces/types.AuthenticationResponse/page.mdx)\&#62;) The created authentication identity if no errors occur.

  - success: (\`boolean\`) Whether the authentication was successful.

  - authIdentity: (\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)) The authenticated user's details.

    - id: (\`string\`) The ID of the auth identity.

    - provider\_identities: (\[ProviderIdentityDTO]\(../../../auth/interfaces/auth.ProviderIdentityDTO/page.mdx)\[]) The list of provider identities linked to the auth identity.

    - app\_metadata: (\`Record\<string, unknown>\`) Holds information related to the actor IDs tied to the auth identity.

  - error: (\`string\`) If an error occurs during the authentication process,
    whether within the Auth Module or a third-party provider,
    the error message is set in this field.

  - location: (\`string\`) The URL to redirect to for further authentication action
    with a third-party provider. This takes precedence before
    the \`success\` field.

    So, after checking that authentication is successful,
    you should check whether this field is defined and, if so, redirect to the
    specified location.

### update

This method is used to update an auth identity's details.

For example, the `emailpass` provider's implementation of this method updates a user's password.

#### Example

```ts
import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
// ...

class MyAuthProviderService extends AbstractAuthModuleProvider {
  // ...
  async update(
    data: Record<string, unknown>,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    try {
      const authIdentity = await authIdentityService.update(
        data.email, // email or some ID used to identify the auth identity
        {
          user: data.user // example
        }
      )

      return { success: true, authIdentity }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}
```

#### Parameters

- data: (\`Record\<string, unknown>\`) Data relevant to identify the auth identity and what to update in it. For example,
  the \`emailpass\` provider expects in this object an \`email\` and \`password\` properties.
- authIdentityProviderService: (\[AuthIdentityProviderService]\(../../../types/interfaces/types.AuthIdentityProviderService/page.mdx)) The service used to retrieve or
  create an auth identity. It has two methods: \`create\` to create an auth identity,
  and \`retrieve\` to retrieve an auth identity. When you authenticate the user, you can create an auth identity
  using this service.

  - retrieve: ((\`selector\`: \`\`\{ entity\_id: string  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - create: ((\`data\`: \`\`\{ entity\_id: string ; provider\_metadata?: Record\&#60;string, unknown\&#62; ; user\_metadata?: Record\&#60;string, unknown\&#62;  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - update: ((\`entity\_id\`: \`string\`, \`data\`: \`\`\{ provider\_metadata?: Record\&#60;string, unknown\&#62; ; user\_metadata?: Record\&#60;string, unknown\&#62;  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - setState: ((\`key\`: \`string\`, \`value\`: \`Record\<string, unknown>\`) => Promise\&#60;void\&#62;)

  - getState: ((\`key\`: \`string\`) => Promise\&#60;null \\| Record\&#60;string, unknown\&#62;\&#62;)

#### Returns

- Promise: (Promise\&#60;\[AuthenticationResponse]\(../../../types/interfaces/types.AuthenticationResponse/page.mdx)\&#62;) The updated authentication identity if no errors occur.

  - success: (\`boolean\`) Whether the authentication was successful.

  - authIdentity: (\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)) The authenticated user's details.

    - id: (\`string\`) The ID of the auth identity.

    - provider\_identities: (\[ProviderIdentityDTO]\(../../../auth/interfaces/auth.ProviderIdentityDTO/page.mdx)\[]) The list of provider identities linked to the auth identity.

    - app\_metadata: (\`Record\<string, unknown>\`) Holds information related to the actor IDs tied to the auth identity.

  - error: (\`string\`) If an error occurs during the authentication process,
    whether within the Auth Module or a third-party provider,
    the error message is set in this field.

  - location: (\`string\`) The URL to redirect to for further authentication action
    with a third-party provider. This takes precedence before
    the \`success\` field.

    So, after checking that authentication is successful,
    you should check whether this field is defined and, if so, redirect to the
    specified location.

### validateCallback

This method validates the callback of an authentication request.

In an authentication flow that requires performing an action with a third-party service, such as login
with a social account, the [authenticate](https://docs.medusajs.com/references/auth/provider#authenticate) method is called first.

Then, the third-party service redirects to a frontend URL passing it a `code` query parameter.
The frontend should then send a request to the Medusa application's validate callback API route, passing it the code.
That route uses this method to verify the callback's code.

If the callback is verified successfully, the provider creates an auth identity for the user, or updates the auth identity's user information.

In the auth identity, use the following properties to store additional data:

- `provider_metadata`: Store metadata useful for the provider, such as a password hash.
- `user_metadata`: Store metadata of the user's details. For example, if the third-party service returns the user's information such as email
  or name, you store this data in this property.

Related Guide: [Learn about the different authentication flows in Medusa](https://docs.medusajs.com/resources/commerce-modules/auth/authentication-route).

#### Example

```ts
import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse
} from "@medusajs/framework/types"
// ...

class MyAuthProviderService extends AbstractAuthModuleProvider {
  // ...
  async validateCallback(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const isAuthenticated = false
    // TODO perform custom logic to authenticate the user
    // ...

    if (!isAuthenticated) {
      // if the authentication didn't succeed, return
      // an object of the following format
      return {
        success: false,
        error: "Something went wrong"
      }
    }

    // authentication is successful, create an auth identity
    // if doesn't exist
    let authIdentity

    try {
      authIdentity = await authIdentityProviderService.retrieve({
        entity_id: data.body.email, // email or some ID
        provider: this.provider
      })
    } catch (e) {
      // The auth identity doesn't exist so create it
      authIdentity = await authIdentityProviderService.create({
        entity_id: data.body.email, // email or some ID
        provider: this.provider,
        provider_metadata: {
          // can include password or any other relevant information
        },
        user_metadata: {
          // can include data retrieved from the third-party service
        }
      })
    }

    return {
      success: true,
      authIdentity
    }
  }
}
```

#### Parameters

- data: (\[AuthenticationInput]\(../../../types/interfaces/types.AuthenticationInput/page.mdx)) The details of the authentication request.

  - url: (\`string\`) URL of the incoming authentication request.

  - headers: (\`Record\<string, string>\`) Headers of incoming authentication request.

  - query: (\`Record\<string, string>\`) Query params of the incoming authentication request.

  - body: (\`Record\<string, string>\`) Body of the incoming authentication request.

    One of the arguments that is suggested to be treated in a standard manner is a \`callback\_url\` field.
    The field specifies where the user is redirected to after a successful authentication in the case of Oauth auhentication.
    If not passed, the provider will fallback to the callback\\\_url provided in the provider options.

  - protocol: (\`string\`) Protocol of the incoming authentication request (For example, \`https\`).
- authIdentityProviderService: (\[AuthIdentityProviderService]\(../../../types/interfaces/types.AuthIdentityProviderService/page.mdx)) The service used to retrieve or
  create an auth identity. It has two methods: \`create\` to create an auth identity,
  and \`retrieve\` to retrieve an auth identity. When you authenticate the user, you can create an auth identity
  using this service.

  - retrieve: ((\`selector\`: \`\`\{ entity\_id: string  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - create: ((\`data\`: \`\`\{ entity\_id: string ; provider\_metadata?: Record\&#60;string, unknown\&#62; ; user\_metadata?: Record\&#60;string, unknown\&#62;  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - update: ((\`entity\_id\`: \`string\`, \`data\`: \`\`\{ provider\_metadata?: Record\&#60;string, unknown\&#62; ; user\_metadata?: Record\&#60;string, unknown\&#62;  }\`\`) => Promise\&#60;\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)\&#62;)

  - setState: ((\`key\`: \`string\`, \`value\`: \`Record\<string, unknown>\`) => Promise\&#60;void\&#62;)

  - getState: ((\`key\`: \`string\`) => Promise\&#60;null \\| Record\&#60;string, unknown\&#62;\&#62;)

#### Returns

- Promise: (Promise\&#60;\[AuthenticationResponse]\(../../../types/interfaces/types.AuthenticationResponse/page.mdx)\&#62;) The authentication response.

  - success: (\`boolean\`) Whether the authentication was successful.

  - authIdentity: (\[AuthIdentityDTO]\(../../../auth/interfaces/auth.AuthIdentityDTO/page.mdx)) The authenticated user's details.

    - id: (\`string\`) The ID of the auth identity.

    - provider\_identities: (\[ProviderIdentityDTO]\(../../../auth/interfaces/auth.ProviderIdentityDTO/page.mdx)\[]) The list of provider identities linked to the auth identity.

    - app\_metadata: (\`Record\<string, unknown>\`) Holds information related to the actor IDs tied to the auth identity.

  - error: (\`string\`) If an error occurs during the authentication process,
    whether within the Auth Module or a third-party provider,
    the error message is set in this field.

  - location: (\`string\`) The URL to redirect to for further authentication action
    with a third-party provider. This takes precedence before
    the \`success\` field.

    So, after checking that authentication is successful,
    you should check whether this field is defined and, if so, redirect to the
    specified location.

### validateOptions

This method validates the options of the provider set in `medusa-config.ts`.
Implementing this method is optional. It's useful if your provider requires custom validation.

If the options aren't valid, throw an error.

#### Example

```ts
class MyAuthProviderService extends AbstractAuthModuleProvider {
  static validateOptions(options: Record<any, any>) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "API key is required in the provider's options."
      )
    }
  }
  // ...
}
```

#### Parameters

- options: (\`Record\<any, any>\`) The provider's options.

***

## 3. Create Module Provider Definition File

Create the file `src/modules/my-auth/index.ts` with the following content:

```ts title="src/modules/my-auth/index.ts"
import MyAuthProviderService from "./service"
import { 
  ModuleProvider, 
  Modules
} from "@medusajs/framework/utils"

export default ModuleProvider(Modules.AUTH, {
  services: [MyAuthProviderService],
})
```

This exports the module provider's definition, indicating that the `MyAuthProviderService` is the module provider's service.

A auth module provider can have export multiple provider services, where each are registered as a separate auth provider.

***

## 4. Use Module Provider

To use your Auth Module Provider, add it to the `providers` array of the Auth Module in `medusa-config.ts`:

```ts title="medusa-config.ts"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

module.exports = defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          // default provider
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
          {
            // if module provider is in a plugin, use `plugin-name/providers/my-auth`
            resolve: "./src/modules/my-auth",
            id: "my-auth",
            options: {
              // provider options...
            },
          },
        ],
      },
    },
  ]
})
```

***

## 5. Test it Out

To test out your Authentication Module Provider, use any of the [Authentication Routes](https://docs.medusajs.com/resources/commerce-modules/auth/authentication-route), using your provider's ID as a path parameter.

For example, to get a registration token for an admin user, send a `POST` request to `/auth/user/my-auth/register` replacing `my-auth` with your Authentication Module Provider's ID:

```bash
curl -X POST http://localhost:9000/auth/user/my-auth/register
-H 'Content-Type: application/json' --data-raw '{
  "email": "Whitney_Schultz@gmail.com",
  "password": "supersecret"
}'
```

Change the request body to pass the data required for your Authentication Module Provider to register the user.

If registration is successful, the response will have a `token` property.