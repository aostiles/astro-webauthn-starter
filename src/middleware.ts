import type { MiddlewareHandler } from "astro";
import { userFromSession } from "./db";

const site_owner = import.meta.env.PUBLIC_SITE_OWNER;

const local_test_user = import.meta.env.LOCAL_TEST_USER;

export const onRequest: MiddlewareHandler<Response> = async function onRequest(
  { cookies, locals, request, redirect },
  next
) {
  const { url } = request;
  const { pathname } = new URL(url);
  const sid: string | undefined = cookies.get("sid").value;
  let username = local_test_user;
  if (!username) {
    username = await userFromSession(request, sid);
  }
  locals.username = username;
  if (username !== site_owner && pathname === "/admin") {
    return redirect("/");
  }

  const response = await next();

  return response;
};
