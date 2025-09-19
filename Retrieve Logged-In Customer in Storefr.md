# Retrieve Logged-In Customer in Storefront

In this guide, you'll learn how to retrieve a customer after they've been authenticated in your storefront.

## Prerequisites: Set the Customer's Authentication Token

When using the [JS SDK](https://docs.medusajs.com/js-sdk), make sure that you've set the customer's authentication token using the `setToken` function:

```ts
sdk.client.setToken(token)
```

You can learn more in the [Login Customer](https://docs.medusajs.com/storefront-development/customers/login) and [Third-Party Login](https://docs.medusajs.com/storefront-development/customers/third-party-login) guides.

***

## Retrieve Logged-In Customer

To retrieve the logged-in customer, send a request to the [Get Customer API route](https://docs.medusajs.com/api/store#customers_getcustomersme):

```ts
sdk.store.customer.retrieve()
.then(({ customer }) => {
  // use customer...
  console.log(customer)
})
```

This will retrieve the authenticated customer's details. The [Get Customer API route](https://docs.medusajs.com/api/store#customers_getcustomersme) returns a `customer` field, which is a [customer object](https://docs.medusajs.com/api/store#customers_customer_schema).

Notice that the JS SDK automatically passes the necessary authentication headers or cookies based on your authentication configurations, as explained in the [Login Customer](https://docs.medusajs.com/storefront-development/customers/login) guide.

If you're not using the JS SDK, you need to pass the authentication token in the request headers or cookies accordingly:

- If you authenticate the customer with bearer authorization, pass the token in the authorization header of the request.
- If you authenticate the customer with cookie session, pass the `credentials: include` option to the `fetch` function.

***

## Restrict Access to Authenticated Customers

In your storefront, it's common to restrict access to certain pages to authenticated customers only.

For example, you may want to restrict access to the customer's profile page to authenticated customers only.

To do this, you can try to retrieve the customer's details. If the request fails, you can redirect the customer to the login page.

For example:

```ts
sdk.store.customer.retrieve()
.then(({ customer }) => {
  // use customer...
  console.log(customer)
})
.catch(() => {
  // redirect to login page
})
```

The `catch` block will only execute if the request fails, which means that the customer is not authenticated. You can add the redirect logic to the `catch` block based on your storefront framework.

If you're building a React storefront, you can use the `useCustomer` hook defined in the [Customer Context guide](https://docs.medusajs.com/storefront-development/customers/context) to check if the customer is set. If not, you can redirect the customer to the login page.