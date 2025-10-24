import { postRouter } from "~/server/api/routers/post";
import { eventRouter } from "~/server/api/routers/event";
import { technicalVisitRouter } from "~/server/api/routers/technical-visit";
import { inventoryRouter } from "~/server/api/routers/inventory";
import { notificationRouter } from "~/server/api/routers/notification";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { adminRouter } from "~/server/api/routers/admin";
import { sketchRouter } from "~/server/api/routers/sketch";
import { pushRouter } from "~/server/api/routers/push";
import { profileRouter } from "~/server/api/routers/profile";
import { clienteRouter } from "~/server/api/routers/cliente";
import { proveedorRouter } from "~/server/api/routers/proveedor";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  event: eventRouter,
  technicalVisit: technicalVisitRouter,
  inventory: inventoryRouter,
  notification: notificationRouter,
  dashboard: dashboardRouter,
  admin: adminRouter,
  sketch: sketchRouter,
  push: pushRouter,
  profile: profileRouter,
  cliente: clienteRouter,
  proveedor: proveedorRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
