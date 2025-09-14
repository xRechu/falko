import {
  MiddlewaresConfig,
} from "@medusajs/framework";
import { corsMiddleware } from "./cors-middleware";

export const config: MiddlewaresConfig = {
  routes: [
    {
      matcher: "/store/*",
      middlewares: [corsMiddleware],
    },
    {
      matcher: "/auth/*", 
      middlewares: [corsMiddleware],
    },
    {
      matcher: "/admin/*",
      middlewares: [corsMiddleware],
    },
  ],
};