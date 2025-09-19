# Auth Module

In this section of the documentation, you will find resources to learn more about the Auth Module and how to use it in your application.

Medusa has auth related features available out-of-the-box through the Auth Module. A [module](https://docs.medusajs.com/learn/fundamentals/modules) is a standalone package that provides features for a single domain. Each of Medusa's commerce features are placed in Commerce Modules, such as this Auth Module.

Learn more about why modules are isolated in [this documentation](https://docs.medusajs.com/learn/fundamentals/modules/isolation).

## Auth Features

- [Basic User Authentication](https://docs.medusajs.com/commerce-modules/auth/authentication-route#1-basic-authentication-flow): Authenticate users using their email and password credentials.
- [Third-Party and Social Authentication](https://docs.medusajs.com/commerce-modules/auth/authentication-route#2-third-party-service-authenticate-flow): Authenticate users using third-party services and social platforms, such as [Google](https://docs.medusajs.com/commerce-modules/auth/auth-providers/google) and [GitHub](https://docs.medusajs.com/commerce-modules/auth/auth-providers/github).
- [Authenticate Custom Actor Types](https://docs.medusajs.com/commerce-modules/auth/create-actor-type): Create custom user or actor types, such as managers, authenticate them in your application, and guard routes based on the custom user types.
- [Custom Authentication Providers](https://docs.medusajs.com/references/auth/provider): Integrate third-party services with custom authentication providors.

***

## How to Use the Auth Module

In your Medusa application, you build flows around Commerce Modules. A flow is built as a [Workflow](https://docs.medusajs.com/learn/fundamentals/workflows), which is a special function composed of a series of steps that guarantees data consistency and reliable roll-back mechanism.

You can build custom workflows and steps. You can also re-use Medusa's workflows and steps, which are provided by the `@medusajs/medusa/core-flows` package.

For example:

```ts title="src/workflows/authenticate-user.ts" highlights={highlights}
import { 
  createWorkflow, 
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules, MedusaError } from "@medusajs/framework/utils"
import { MedusaRequest } from "@medusajs/framework/http"
import { AuthenticationInput } from "@medusajs/framework/types"

type Input = {
  req: MedusaRequest
}

const authenticateUserStep = createStep(
  "authenticate-user",
  async ({ req }: Input, { container }) => {
    const authModuleService = container.resolve(Modules.AUTH)

    const { success, authIdentity, error } = await authModuleService
      .authenticate(
        "emailpass",
       {
          url: req.url,
          headers: req.headers,
          query: req.query,
          body: req.body,
          authScope: "admin", // or custom actor type
          protocol: req.protocol,
        } as AuthenticationInput
      )

    if (!success) {
      // incorrect authentication details
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        error || "Incorrect authentication details"
      )
    }

    return new StepResponse({ authIdentity }, authIdentity?.id)
  },
  async (authIdentityId, { container }) => {
    if (!authIdentityId) {
      return
    }
    
    const authModuleService = container.resolve(Modules.AUTH)

    await authModuleService.deleteAuthIdentities([authIdentityId])
  }
)

export const authenticateUserWorkflow = createWorkflow(
  "authenticate-user",
  (input: Input) => {
    const { authIdentity } = authenticateUserStep(input)

    return new WorkflowResponse({
      authIdentity,
    })
  }
)
```

You can then execute the workflow in your custom API routes, scheduled jobs, or subscribers:

```ts title="API Route" highlights={[["11"], ["12"]]} collapsibleLines="1-6" expandButtonLabel="Show Imports"
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { authenticateUserWorkflow } from "../../workflows/authenticate-user"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { result } = await authenticateUserWorkflow(req.scope)
    .run({
      req,
    })

  res.send(result)
}
```

Learn more about workflows in [this documentation](https://docs.medusajs.com/learn/fundamentals/workflows).

***

## Configure Auth Module

The Auth Module accepts options for further configurations. Refer to [this documentation](https://docs.medusajs.com/commerce-modules/auth/module-options) for details on the module's options.

***

## Providers

Medusa provides the following authentication providers out-of-the-box. You can use them to authenticate admin users, customers, or custom actor types.

***