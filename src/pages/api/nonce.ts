import type { APIRoute } from "astro";
import type { APIContext } from "astro";
import { setNonce } from "../../db";

export const post: APIRoute = async ({ request, cookies }: APIContext) => {
  const nonce = await setNonce(request);
  return new Response(JSON.stringify({ nonce: nonce }));
};

// redirect on GET requests. This can happen if the user explicitly navigates to the endpoint.
export const get: APIRoute = async ({ request, redirect }: APIContext) => {
  return redirect("/", 302);
};
