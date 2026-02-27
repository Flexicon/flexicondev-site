---
title: "Fixing Plex Remote Access When You're Stuck Behind CGNAT"
date: 2026-02-27
draft: false
summary: 'A step-by-step guide to getting Plex accessible remotely when your ISP has you trapped behind CGNAT, using a Cloudflare tunnel and a single API call.'
tags: ['plex', 'networking', 'cloudflare', 'self-hosting', 'homelab']
---

So you've got a Plex server running at home, lifetime Plex Pass and everything, and you want to watch your stuff on the go. You flip on Remote Access, see a cheerful green "Fully accessible outside your network" message, and think you're done. Amazing. Job done.

Then you try to connect from your phone and... nothing.

If this sounds familiar, there's a pretty good chance your ISP has you behind [CGNAT](https://en.wikipedia.org/wiki/Carrier-grade_NAT) (Carrier-Grade NAT) - meaning you don't actually have a proper public IP address, and no amount of port forwarding will save you. Let's fix that.

## Am I actually behind CGNAT?

Quick sanity check. Run this on your Plex server:

```bash
curl ifconfig.me
```

Compare the output with what Plex shows under **Settings → Remote Access → Public IP**. If they don't match, you're behind CGNAT.

If they _do_ match, your problem is likely just a broken port forward, and this guide probably isn't for you. You might have more success with this [Troubleshooting Remote Access](https://support.plex.tv/articles/200931138-troubleshooting-remote-access/) guide from Plex themselves.

## The Fix: Cloudflare Tunnel + customConnections

The approach here is simple and split into two parts:

1. Expose your Plex server to the internet via a Cloudflare tunnel
2. Tell Plex's discovery system to advertise that tunnel URL to clients

### Step 1: Set up a Cloudflare tunnel

Install `cloudflared` on your Plex server and create a tunnel that proxies to `localhost:32400`, then assign it a public hostname - use whatever you prefer here, but for the purposes of this guide we will assume `plex.yourdomain.com`. The [official Cloudflare docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) cover the full setup.

Once it's running, verify it actually works before moving on:

```bash
curl -s "https://plex.yourdomain.com/identity"
```

You should get back some XML with your server info. If you do, the tunnel is good to go.

### Step 2: Grab your Plex token

```bash
grep -o 'PlexOnlineToken="[^"]*"' \
  "/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Preferences.xml"
```

Keep the quoted value for later, as we'll be using it to configure your custom connections domain via Plex APIs.

> **Note:** You might run into permissions issues for the above command. In which case make sure to run it as your Plex user or simply use root permissions through `sudo`.

### Step 3: Add your tunnel as a Plex custom connection

```bash
curl -X PUT "http://localhost:32400/:/prefs?customConnections=https://plex.yourdomain.com:443&X-Plex-Token=YOUR_TOKEN"
```

**Notice the `:443` at the end - it's important.** Without it, Plex "helpfully" appends whatever random external port it negotiated via UPnP when it tried to setup remote access via your public IP. Normally that would be fine and dandy, except the port isn't open on Cloudflare's side. Explicitly specifying `:443` (the port for `https`) keeps things chugging along and allows you to simply use an https domain as your custom connection.

### Step 4: Confirm your changes were saved

```bash
curl -s "http://localhost:32400/:/prefs?X-Plex-Token=YOUR_TOKEN" | grep 'customConnections'
```

Expected output:

```xml
<Setting id="customConnections" label="Custom server access URLs" summary="A comma-separated list of URLs (http or https) which are published up to plex.tv for server discovery. IPv6 addresses must specify a port." type="text" default="" value="https://plex.yourdomain.com:443" hidden="0" advanced="1" group="network" />
```

### Step 5: Finally restart Plex

And keep your fingers crossed as this is the last step! 🤞🏻

```bash
sudo systemctl restart plexmediaserver
```

### Step 6: Verify plex.tv is advertising the tunnel

```bash
curl -s "https://plex.tv/api/resources?includeHttps=1&X-Plex-Token=YOUR_TOKEN" | grep -o 'uri="[^"]*"'
```

If all went well and nothing exploded along the way, your tunnel URI should appear in the list.

Now, Plex clients try each configured URI in turn and fall through to the first one that responds. This means that even with a bunch of dead-end local addresses around, Plex clients will eventually land on your tunnel.

This also means that local addresses will still be used if available since they should respond the fastest - nice!

## But Plex tells me my server is "Fully accessible" - what gives?

Yeah, that status on the settings page can't be trusted. Plex's own remote access self-test can easily return a false positive, tricking you into believing your server is publicly accessible even when it isn't. The only reliable test is pulling out your phone, switching to mobile data, and actually trying to connect. Either that or firing up a VPN.

---

That's it. Enjoy Plex'ing around on the go or when away from home in general!
