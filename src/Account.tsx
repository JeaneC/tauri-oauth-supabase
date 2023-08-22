import { useState, useEffect, FormEvent } from "react";
import { supabase } from "./supabaseClient";
import { AuthSession } from "@supabase/supabase-js";

export default function Account({ session }: { session: AuthSession }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatar_url, setAvatarUrl] = useState("");

  useEffect(() => {
    async function getProfile() {
      setLoading(true);
      const { user } = session;

      let { data, error } = await supabase
        .from("profiles")
        .select(`username, website, avatar_url`)
        .eq("id", user.id)
        .single();

      if (error) {
        console.warn(error);
      } else if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }

      setLoading(false);
    }

    getProfile();
  }, [session]);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    const { user } = session;

    const updates = {
      id: user.id,
      username,
      website,
      avatar_url: avatar_url,
      updated_at: new Date(),
    };

    let { error } = await supabase.from("profiles").upsert(updates);

    if (error) {
      alert(error.message);
    } else {
      setAvatarUrl(avatar_url);
      alert("Updated!");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={updateProfile} className="form-widget">
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="text" value={session.user.email} disabled />
      </div>
      <div>
        <label htmlFor="username">Name</label>
        <input
          id="username"
          type="text"
          required
          value={username || ""}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          value={website || ""}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <button
          className="button block primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Loading ..." : "Update"}
        </button>
      </div>

      <div>
        <button
          className="button block"
          type="button"
          onClick={() => supabase.auth.signOut()}
        >
          Sign Out
        </button>
      </div>
    </form>
  );
}
