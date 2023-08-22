# Tauri + Google/GitHub OAuth with Supabase

![](https://github.com/JeaneC/tauri-supabase/blob/main/demo.gif)

Check out this example on how to setup MagicLink and OAuth (Github and Google) in Tauri using Supabase. This is based off of the Supabase starter with React.

https://supabase.com/docs/guides/getting-started/tutorials/with-react.

Supabase has a generous free tier so you should be able to use this for your projects easily!


## Setup
After cloning the repo, please make sure to do the part on [database schema setup](https://supabase.com/docs/guides/getting-started/tutorials/with-react#set-up-the-database-schema). This will create the backend for your app.

Then make sure to clone our `.env.local.example` to create a new `.env.local`. In there, configure your [env items from Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-react#get-the-api-keys).

Finally,
```
pnpm i
pnpm tauri dev
```

## Signup for GitHub and Google OAuth
Follow these guides from Supabase. If these guides ask for a website, just link your github or a google doc
- [GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

## How we deal with OAuth
The trickiest part about OAuth is the redirect in a desktop app. Once a user finishes authorizing on Google, where do we link them to? Deeplinks are a common concept in mobile apps but Tauri is still a WIP on this.

I benefited from reading this thread on [window URL manipulation](https://github.com/tauri-apps/tauri/discussions/3020) and looking at the Tauri discord. I had to deal with a few more painful things because Supabase and Tauri are rapidly updating their platforms.

The short bit is
- Your app has a hidden web browser view that we listen to events. Call this localhost:9999.
- When user tries to do OAuth, initialize the OAuth provider with a redirect url to localhost:9999. 
- Then we open up the user's main browser to ask them to authenticate with Github or Google.
- Once the user authenticates on an external platform, the redirect will bring them to localhost:9999 with a query param in it, e.g localhost:9999?code=abcd
- We need that code to finish our PKCE authorization flow with supabase. Since we were listening to this port, we just parse it from our hidden browser.

Thanks to https://github.com/FabianLars/tauri-plugin-oauth for the seamless setup.

## Gotcha with Supabase and Tauri
Idk where the fault is here, but Supabase's native storage solution doesn't work well with Tauri. I spent countless hours debugging this. You'll see we just opt for native localStorage which is a fine choice for most apps.

## Supabase Auth Notes
- Supabase now has a very low rate limit for emails. This can affect your magic link deliverability if you don't choose your own SMTP.
- Google OAuth takes around a week to be approved for public use. They also require a privacy policy url.
- GitHub is my personal favorite. Easy to setup.
