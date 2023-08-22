import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { shell } from "@tauri-apps/api";

function getLocalHostUrl(port: number) {
  return `http://localhost:${port}`;
}

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [port, setPort] = useState<number | null>(null);

  useEffect(() => {
    console.log("Refresh", port);
    if (port) return;

    const unlisten = listen("oauth://url", (data) => {
      setPort(null);
      if (!data.payload) return;

      const url = new URL(data.payload as string);
      const code = new URLSearchParams(url.search).get("code");

      console.log("here", data.payload, code);
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) {
            alert(error.message);
            console.error(error);
            return;
          }
          location.reload();
        });
      }
    });

    let _port: number | null = null;
    invoke("plugin:oauth|start").then(async (port) => {
      setPort(port as number);
      _port = port as number;
    });

    () => {
      unlisten?.then((u) => u());
      invoke("plugin:oauth|cancel", { port: _port });
    };
  }, [port]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getLocalHostUrl(port!) },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for the login link!");
    }
    setLoading(false);
  };

  const onProviderLogin = (provider: "google" | "github") => async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      options: {
        skipBrowserRedirect: true,
        scopes: provider === "google" ? "profile email" : "",
        redirectTo: getLocalHostUrl(port!),
      },
      provider: provider,
    });

    if (data.url) {
      shell.open(data.url);
    } else {
      alert(error?.message);
    }
  };

  return (
    <div className="row flex flex-center">
      <div className="col-8 form-widget">
        <h1 className="header">Tauri + Supabase Auth</h1>

        <div className="auth-container">
          <div className="oauth-buttons">
            <button onClick={onProviderLogin("github")}>GitHub</button>
            <button onClick={onProviderLogin("google")}>Google</button>
          </div>

          <div className="flex flex-center">
            <span>OR</span>
          </div>
          <div className="magic-form">
            <p className="description">
              Sign in via magic link with your email below
            </p>
            <form className="form-widget" onSubmit={handleLogin}>
              <div>
                <input
                  className="inputField"
                  type="email"
                  placeholder="Your email"
                  value={email}
                  required={true}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <button className={"button block"} disabled={loading}>
                  {loading ? (
                    <span>Loading</span>
                  ) : (
                    <span>Send magic link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
