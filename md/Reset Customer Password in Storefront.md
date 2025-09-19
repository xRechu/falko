# Reset Customer Password in Storefront

In this guide, you'll learn how to implement the flow to reset a customer's password in your storefront.

## Reset Password Flow in Storefront

Customers need to reset their password if they forget it. To implement the flow to reset a customer's password, you need two pages in your storefront:

1. [Request Reset Password Page](#1-request-reset-password-page): A page to request the password reset.
   - When the customer requests to reset their password, they would receive an email (or other notification) with a URL to the Reset Password Page.
2. [Reset Password Page](#2-reset-password-page): A page that prompts the customer to enter a new password.

### Prerequisites

- [To send the customer an email (or other notification) with the URL to reset their password, you must implement the subscriber that handles the notification.](https://docs.medusajs.com/commerce-modules/auth/reset-password)

***

## 1. Request Reset Password Page

The request password reset page prompts the customer to enter their email. Then, it sends a request to the [Request Reset Password Token API route](https://docs.medusajs.com/api/store#auth_postactor_typeauth_providerresetpassword) to request resetting the password.

This API route will then handle sending an email or another type of notification, if you handle it as explained in the [Reset Password Guide](https://docs.medusajs.com/commerce-modules/auth/reset-password).

For example, you can implement the following functionality in your storefront to request resetting the password:

Learn how to install and configure the JS SDK in the [JS SDK documentation](https://docs.medusajs.com/js-sdk).

### React

```tsx highlights={highlights}
"use client" // include with Next.js 13+

import { useState } from "react"
import { sdk } from "@/lib/sdk"

export default function RequestResetPassword() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    if (!email) {
      alert("Email is required")
      return
    }
    setLoading(true)

    sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })
    .then(() => {
      alert("If an account exists with the specified email, it'll receive instructions to reset the password.")
    })
    .catch((error) => {
      alert(error.message)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Email</label>
      <input 
        placeholder="Email" 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        Request Password Reset
      </button>
    </form>
  )
}
```

### JS SDK

```ts highlights={fetchHighlights}
const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement> // or other form event
) => {
  e.preventDefault()
  if (!email) {
    alert("Email is required")
    return
  }

  sdk.auth.resetPassword("customer", "emailpass", {
    identifier: email,
  })
  .then(() => {
    alert("If an account exists with the specified email, it'll receive instructions to reset the password.")
  })
  .catch((error) => {
    alert(error.message)
  })
}
```

In this example, you send a request to the [Request Reset Password Token API route](https://docs.medusajs.com/api/store#auth_postactor_typeauth_providerresetpassword) when the form that has the email field is submitted.

In the request body, you pass an `identifier` parameter, which is the customer's email.

The [Request Reset Password Token API route](https://docs.medusajs.com/api/store#auth_postactor_typeauth_providerresetpassword) returns a successful response always, even if the customer's email doesn't exist. This ensures that customer emails that don't exist are not exposed.

***

## 2. Reset Password Page

Once the customer requests to reset their password, you should handle sending them a notification, such as an email, as explained in the [Reset Password Guide](https://docs.medusajs.com/commerce-modules/auth/reset-password).

The notification should include a URL in your storefront that allows the customer to update their password. In this step, you'll implement this page.

The reset password page should receive a `token` and `email` query parameters. Then, it prompts the customer for a new password, and sends a request to the [Reset Password API route](https://docs.medusajs.com/api/store#auth_postactor_typeauth_providerupdate) to update the password.

If you followed [this guide](https://docs.medusajs.com/commerce-modules/auth/reset-password) to set up a subscriber that sends the customer an email, make sure to use the URL of this page in the notification's data payload.

For example:

### React

```tsx highlights={resetPasswordHighlights}
"use client" // include with Next.js 13+

import { useMemo, useState } from "react"
import { sdk } from "@/lib/sdk"

export default function ResetPassword() {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  // for other than Next.js
  const searchParams = useMemo(() => {
    if (typeof window === "undefined") {
      return
    }

    return new URLSearchParams(
      window.location.search
    )
  }, [])
  const token = useMemo(() => {
    return searchParams?.get("token")
  }, [searchParams])
  const email = useMemo(() => {
    return searchParams?.get("email")
  }, [searchParams])

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    if (!token) {
      return
    }
    if (!password) {
      alert("Password is required")
      return
    }
    setLoading(true)

    sdk.auth.updateProvider("customer", "emailpass", {
      email,
      password,
    }, token)
    .then(() => {
      alert("Password reset successfully!")
    })
    .catch((error) => {
      alert(`Couldn't reset password: ${error.message}`)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Password</label>
      <input 
        placeholder="Password" 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        Reset Password
      </button>
    </form>
  )
}
```

### JS SDK

```ts highlights={resetPasswordFetchHighlights}
const queryParams = new URLSearchParams(window.location.search)
const token = queryParams.get("token")
const email = queryParams.get("email")

const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault()
  if (!token) {
    return
  }
  if (!password) {
    alert("Password is required")
    return
  }

  sdk.auth.updateProvider("customer", "emailpass", {
    email,
    password,
  }, token)
  .then(() => {
    alert("Password reset successfully!")
  })
  .catch((error) => {
    alert(`Couldn't reset password: ${error.message}`)
  })
}
```

In this example, you receive the `token` and `email` from the page's query parameters.

Then, when the form that has the password field is submitted, you send a request to the [Reset Password API route](https://docs.medusajs.com/api/store#auth_postactor_typeauth_providerupdate), passing it the token, email, and new password.

Notice that the JS SDK passes the token in the `Authorization: Bearer` header. So, if you're implementing this flow without using the JS SDK, make sure to pass the token accordingly.

Before [Medusa v2.6](https://github.com/medusajs/medusa/releases/tag/v2.6), you passed the token as a query parameter. Now, you must pass it in the `Authorization: Bearer` header.