import type { APIRoute } from "astro";
import type { APIContext } from "astro";
import { getRuntime } from "@astrojs/cloudflare/runtime";
import type { D1Database } from "@cloudflare/workers-types";

export const post: APIRoute = async ({ request, redirect }: APIContext) => {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const data = await request.formData();
  const turnstile_token = data.get("cf-turnstile-response");
  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  let formData = new FormData();
  formData.append("secret", import.meta.env.PUBLIC_TURNSTILE_SECRET_KEY);
  // @ts-ignore
  formData.append("response", turnstile_token);
  const result = await fetch(url, {
    body: formData,
    method: "POST",
  });
  const outcome = await result.json();
  if (!outcome.success) {
    return new Response(
      JSON.stringify({
        message: "Turnstile error. Are you a human?",
      }),
      { status: 500 }
    );
  }
  const email = data.get("email");
  const message = data.get("message");
  // Validate the data
  if (!email) {
    return new Response(
      JSON.stringify({
        message: "Please provide an email address so I can contact you.",
      }),
      { status: 400 }
    );
  }
  if (!message) {
    return new Response(
      JSON.stringify({
        message: "Please provide a message.",
      }),
      { status: 400 }
    );
  }
  // Insert into the DB
  const info = await SITE_DB.prepare(
    "INSERT INTO messages (email, message) VALUES (?1, ?2)"
  )
    .bind(email, message)
    .run();
  if (info.success) {
    return redirect("/thanks", 302);
  } else {
    if (info.error) {
      console.log(info.error);
    }
    return new Response(
      JSON.stringify({
        message: "database error",
      }),
      { status: 500 }
    );
  }
};

// redirect on GET requests. This can happen if the user explicitly navigates to the endpoint.
export const get: APIRoute = async ({ request, redirect }: APIContext) => {
  return redirect("/", 302);
};
