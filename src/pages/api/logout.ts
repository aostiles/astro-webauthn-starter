import type { APIRoute } from "astro";
import type { APIContext } from "astro";
import { logout } from "../../db";

const domain = import.meta.env.PUBLIC_DOMAIN;

export const post: APIRoute = async ({ request, cookies }: APIContext) => {
  try {
    const sid = cookies.get("sid");
    await logout(request, sid.value);
    cookies.delete("sid", {
      domain: domain,
      path: "/",
    });
    return new Response("{}");
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

// redirect on GET requests. This can happen if the user explicitly navigates to the endpoint.
export const get: APIRoute = async ({ request, redirect }: APIContext) => {
  return redirect("/", 302);
};
