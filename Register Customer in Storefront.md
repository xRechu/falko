# Register Customer in Storefront

In this guide, you'll learn how to register a customer in your storefront.

This guide covers registration using email and password. For authentication with third-party providers, refer to the [Third-Party Login](https://docs.medusajs.com/storefront-development/customers/third-party-login) guide.

## Register Customer Flow

To register a customer, you implement the following steps:

![A diagram illustrating the flow of the register customer flow](https://res.cloudinary.com/dza7lstvk/image/upload/v1743086184/Medusa%20Resources/register-flow_yv5uw2.jpg)

1. Show the customer a form to enter their details.
2. Send a `POST` request to the `/auth/customer/emailpass/register` [Get Registration Token](https://docs.medusajs.com/api/store#auth_postactor_typeauth_provider_register) API route to obtain a registration JWT token.
3. Send a request to the [Create Customer API route](https://docs.medusajs.com/api/store#customers_postcustomers) passing the registration JWT token in the header.

However, a customer may enter an email that's already used either by an admin user, another customer, or a [custom actor type](https://docs.medusajs.com/commerce-modules/auth/auth-identity-and-actor-types). To handle this scenario:

- Try to obtain a login token by sending a `POST` request to the `/auth/customer/emailpass` [Authenticate Customer](https://docs.medusajs.com/api/store#auth_postactor_typeauth_provider) API route. The customer is only allowed to register if their email and password match the existing identity. This allows admin users to log in or register as customers.
- If you obtained the login token successfully, create the customer using the login JWT token instead of the registration token. This will not remove the existing identity. So, for example, an admin user can also become a customer.

When you're using the JS SDK, this flow is simplified with quick registration and login methods. The rest of this guide uses the JS SDK to demonstrate the registration flow. However, if you're not using the JS SDK, you can still implement the same flow using the API routes.

Learn how to install and configure the JS SDK in the [JS SDK documentation](https://docs.medusajs.com/js-sdk).

***

## How to Implement the Register Customer Flow

An example implemetation of the registration flow in a storefront:

### React

```tsx highlights={highlights} collapsibleLines="74-112" expandButtonLabel="Show form"
"use client" // include with Next.js 13+

import { useState } from "react"
import { sdk } from "@/lib/sdk"
import { FetchError } from "@medusajs/js-sdk"

export default function Register() {
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleRegistration = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault()
    if (!firstName || !lastName || !email || !password) {
      return
    }
    setLoading(true)

    try {
      await sdk.auth.register("customer", "emailpass", {
        email,
        password,
      })
    } catch (error) {
      const fetchError = error as FetchError
      
      if (fetchError.statusText !== "Unauthorized" || fetchError.message !== "Identity with email already exists") {
        alert(`An error occured while creating account: ${fetchError}`)
        return
      }
      // another identity (for example, admin user)
      // exists with the same email. So, use the auth
      // flow to login and create a customer.
      const loginResponse = (await sdk.auth.login("customer", "emailpass", {
        email,
        password,
      }).catch((e) => {
        alert(`An error occured while creating account: ${e}`)
      }))

      if (!loginResponse) {
        return
      }

      if (typeof loginResponse !== "string") {
        alert("Authentication requires more actions, which isn't supported by this flow.")
        return
      }
    }

    // create customer
    try {
      const { customer } = await sdk.store.customer.create({
        first_name: firstName,
        last_name: lastName,
        email,
      })
  
      setLoading(false)

      console.log(customer)
      // TODO redirect to login page
    } catch (error) {
      console.error(error)
      alert("Error: " + error)
      return
    }
  }

  return (
    <form>
      <input 
        type="text" 
        name="first_name"
        value={firstName}
        placeholder="First Name"
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input 
        type="text" 
        name="last_name"
        value={lastName}
        placeholder="Last Name"
        onChange={(e) => setLastName(e.target.value)}
      />
      <input 
        type="email" 
        name="email"
        value={email}
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input 
        type="password" 
        name="password"
        value={password}
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        disabled={loading}
        onClick={handleRegistration}
      >
        Register
      </button>
    </form>
  )
}
```

### JS SDK

```ts highlights={fetchHighlights}
// other imports...
import { FetchError } from "@medusajs/js-sdk"

const handleRegistration = async () => {
  // obtain registration JWT token
  try {
    await sdk.auth.register("customer", "emailpass", {
      email,
      password,
    })
  } catch (error) {
    const fetchError = error as FetchError
    
    if (fetchError.statusText !== "Unauthorized" || fetchError.message !== "Identity with email already exists") {
      alert(`An error occured while creating account: ${fetchError}`)
      return
    }
    // another identity (for example, admin user)
    // exists with the same email. So, use the auth
    // flow to login and create a customer.
    const loginResponse = (await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    }).catch((e) => {
      alert(`An error occured while creating account: ${e}`)
    }))

    if (!loginResponse) {
      return
    }

    if (typeof loginResponse !== "string") {
      alert("Authentication requires more actions, which isn't supported by this flow.")
      return
    }
  }

  // create customer
  try {
    const { customer } = await sdk.store.customer.create({
      first_name: firstName,
      last_name: lastName,
      email,
    })

    console.log(customer)
    // TODO redirect to login page
  } catch (error) {
    console.error(error)
    alert("Error: " + error)
    return
  }
}
```

In the above example, you create a `handleRegistration` function that:

- Obtains a registration JWT token from the `/auth/customer/emailpass/register` API route using the `auth.register` method. If an error is thrown:
  - If the error is an existing identity error, try retrieving the login JWT token from `/auth/customer/emailpass` API route using the `auth.login` method. This will fail if the existing identity has a different password, which doesn't allow the customer from registering.
  - For other errors, show an alert and exit execution.
  - The JS SDK automatically stores an re-uses the authentication headers or session in the `auth.register` and `auth.login` methods. So, if you're not using the JS SDK, make sure to pass the received authentication tokens as explained in the [API reference](https://docs.medusajs.com/api/store#1-bearer-authorization-with-jwt-tokens)
- Send a request to the [Create Customer API route](https://docs.medusajs.com/api/store#customers_postcustomers) to create the customer in Medusa.
  - If an error occurs, show an alert and exit execution.
  - As mentioned, the JS SDK automatically sends the authentication headers or session in all requests after registration or logging in. If you're not using the JS SDK, make sure to pass the received authentication tokens as explained in the [API reference](https://docs.medusajs.com/api/store#1-bearer-authorization-with-jwt-tokens).
- Once the customer is registered successfully, you can either redirect the customer to the login page or log them in automatically, as explained in the [Login](https://docs.medusajs.com/storefront-development/customers/login) guide.