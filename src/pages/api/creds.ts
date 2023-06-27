import type { APIRoute } from "astro";
import type { APIContext } from "astro";
import { getCreds } from "../../db";

export const post: APIRoute = async ({ request, cookies }: APIContext) => {
  const data = await request.json();
  const creds = await getCreds(request, data.username);
  return new Response(JSON.stringify({ creds: creds }));
};

// redirect on GET requests. This can happen if the user explicitly navigates to the endpoint.
export const get: APIRoute = async ({ request, redirect }: APIContext) => {
  return redirect("/", 302);
};
