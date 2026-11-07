# ManyChat comment-keyword DM flow: realtor check first

Owner: Darien Phillips, REALTOR, eXp Nor Cal, DRE 02439090
Phone: 209.882.6469
Website: darienphillips.com
Property link site: darienphillips.exprealty.com
Date written: 2026-11-06
Status: DRAFTED, NOT YET APPLIED. No live ManyChat automation was changed, no Claude task was changed, no test DM was sent.

## Why this change

Darien asked 2026-11-06: do not send the home info/link straight away in ManyChat. First ask if the person is working with an agent. If yes, collect their agent info so Darien can send the home info to the agent, so he does not step on anyones toes. If no, give them the info as before.

This matches the website realtor check added the same day: on darienphillips.com, a home-info request now asks "Are you working with a realtor?" first.

## Current flow (old, as on record 2026-11-05 / 2026-11-02)

Source note: the Claude scheduled task page could NOT be re-read in this session. A text fetch of https://claude.ai/scheduled-task/trig_01S2ifkYr1DuqSDc5UXgrRBs timed out on 2026-11-06, so the full Claude task instruction text was not re-verified word for word here. The wording below is quoted from Darien's saved records, which describe what the Claude task and the ManyChat automations were doing.

Claude scheduled task "Instagram posts to ManyChat", https://claude.ai/scheduled-task/trig_01S2ifkYr1DuqSDc5UXgrRBs:
- Status 2026-11-05: Paused / Needs attention
- Schedule: hourly at :17, 9:00 AM to 11:59 PM daily, auto-runs without asking, requires Darien's MacBook Neo connected
- Claude account: darienphillips45@gmail.com, Pro, out of credits until Nov 9, 2026, 4:00 AM
- Job: each new @darienphillips45 Instagram post becomes a row in the Google Sheet "Client home activity", Listings tab, which creates darienphillips.com/p/<keyword>, plus a live ManyChat comment automation named "<KEYWORD> · <street>, <city>"
- DM wording was pre-approved in that task's instructions. Old flow: send the link straight away, button "Send me the link".

ManyChat link message, approved 2026-11-01, on record as:
- Reply is link first (darienphillips.exprealty.com), then text or call 209.882.6469 as the backup. Use a button if ManyChat offers one.

Property-post comment DM template, set 2026-10-23, with lot size added 2026-10-28, on record as:
- "Hi there, thanks for your comment on my post [name]! That property is listed for [price]. The home is located in [city]. It features [bedrooms], [bathrooms], and [sqft] of living space. Are you mainly interested in this specific home, or are you looking for something similar in the area?"
- Include the verified lot size in the features line of every property-post DM.
- Public reply is basically "Sent all your info to your DM" (short, simple).

Old flow in short: comment keyword -> public reply -> DM with the home link and details straight away.

## New flow (paste-ready)

No em dashes are used in the new copy below. Replace [KEYWORD], [name], [price], [city], [bedrooms], [bathrooms], [sqft], and [lot size] with the real values for each post. Keep the per-post keyword, price, city, and features as before. Do not put a street address in a DM.

### Trigger and public reply (unchanged)

- Trigger: Instagram comment with the post keyword, for example HAVEN, RIO, PALM.
- Public reply: "Sent all your info to your DM."

### Step 1, first DM, ask about a realtor (NEW, send this first, do NOT send the link yet)

"Hi there, thanks for commenting [KEYWORD]! Quick question before I send the details, are you working with a realtor?"

Quick replies / buttons:
- Yes
- No

### Step 2A, if they tap Yes, ask for agent info (NEW)

"No problem at all, I don't want to step on anyones toes. Could you put your agent's info in here so I can send it to them?"

Then collect, in order:
1. Agent name
2. Brokerage
3. Agent phone or email

In ManyChat, use one free-text question per field, or one message asking for all three, whichever the automation already uses for collecting info. Save each answer to a contact field, for example Agent Name, Agent Brokerage, Agent Phone or Email, and tag the contact "Has agent" so Darien can find it.

If they reply Yes but do not send agent info, send this one nudge only, then wait:
"Just send your agent's name, brokerage, and phone or email when you get a chance, and I will get the info to them."

Do NOT send the home link or home details to the buyer in the Yes branch.

### Step 2B, after agent info is given (NEW)

"Thanks so much, Darien will be in contact with you soon to send all home info to your agent to share with you."

Then, in ManyChat, notify Darien / flag the conversation for follow-up, with the agent name, brokerage, and agent phone or email, plus the home keyword, street, and city, so he knows who to send it to. Do not auto-send the home link to the buyer after this message.

### Step 3, if they tap No, give them the info (same info as before)

"Hi there, thanks for your comment on my post [name]! That property is listed for [price]. The home is located in [city]. It features [bedrooms], [bathrooms], and [sqft] of living space, on a [lot size] lot. Are you mainly interested in this specific home, or are you looking for something similar in the area?"

Then send the link:
"Here is the link with all the details: darienphillips.com/p/[keyword]"

Then the backup line, as approved 2026-11-01:
"If that link does not work, you can also find it at darienphillips.exprealty.com, or text or call me at 209.882.6469."

Use a button if ManyChat offers one, for example a button labeled "Send me the link" that sends the darienphillips.com/p/[keyword] link. Keep the button only on the No branch, not on the Yes branch.

## What this does NOT change

- The keyword, the public reply, the property details, the price, the city, the lot size, and the link itself are unchanged.
- The Google Sheet "Client home activity" Listings tab step is unchanged. A new row still creates darienphillips.com/p/<keyword>.
- The automation name format is unchanged: "<KEYWORD> · <street>, <city>".
- Only add, never edit or delete other automations or rows, per the original task rules.
- Never message or follow anyone on Instagram outside this flow, and never put a street address in a DM.

## How to apply it in ManyChat (needs Darien, in his ManyChat account)

Important: updating the Claude task template does NOT change existing live automations. Each live automation has its own copy of the flow. Every live keyword automation must be edited in ManyChat one by one, or rebuilt from this new flow.

For each live automation, in ManyChat, Automations, open the automation named "<KEYWORD> · <street>, <city>":

1. Find the first DM step that sends the home link/details straight away. Move that whole DM, and the "Send me the link" button, into a new No branch.
2. Before it, add a new first DM: Step 1 above, "are you working with a realtor?", with Yes and No quick replies.
3. Add a Yes branch: Step 2A above, asking for agent name, brokerage, and agent phone or email, saving each to a contact field, then Step 2B above, "Darien will be in contact with you soon to send all home info to your agent to share with you.", plus a notification / tag for Darien.
4. Add a No branch: Step 3 above, the property DM, the darienphillips.com/p/[keyword] link, and the darienphillips.exprealty.com and 209.882.6469 backup line, with the link button.
5. Test it with a test comment on a test post, or in ManyChat Preview, before turning it live. Do NOT test it on a real follower.
6. Repeat for every live keyword automation. Known live examples from Nov 2, 2026 include HAVEN (6981 Daffodil Trail, Rescue), PALM (10722 Rawles Rd, Oakdale), and RIO (6619 Carver Rd, Modesto). Do not assume that list is complete. Check the full Automations list in ManyChat and update every keyword automation there.

## How to apply it in the Claude scheduled task (after Nov 9, 2026)

The Claude task is Paused and Claude is out of credits until Nov 9, 2026, 4:00 AM. Do not try to edit it until after that reset, and do not resume it until Darien says to.

After Nov 9, in Claude, open https://claude.ai/scheduled-task/trig_01S2ifkYr1DuqSDc5UXgrRBs, and update its instructions so future automations it creates use the new flow:

1. Replace the old instruction "send the link straight away, button Send me the link" with the new flow in this file: first DM asks "Are you working with a realtor?", Yes collects agent name, brokerage, and agent phone or email, then says Darien will be in contact soon to send all home info to the agent to share with you, and No gives the info and link as before.
2. Keep the rest of the task unchanged: Sheet row first, automation named "<KEYWORD> · <street>, <city>", turned on live without waiting for approval, only add, never edit or delete other automations or rows, never message or follow anyone on Instagram, never put a street address in a DM.
3. Add this line to the task instructions: "Existing live automations are NOT updated by this task. Only new automations use this flow. Live automations must be edited in ManyChat directly."
4. Do not resume the task until Darien confirms, because he told it on Nov 2 not to auto-check ("If I already posted don't do a check I'll let you know if I posted").

## What was actually done on 2026-11-06, and what was NOT done

Done:
- New flow drafted, paste-ready, in this file.
- Old flow quoted from saved records, with the source gap noted above.
- ManyChat public homepage checked by text fetch only. It loads, but it shows no account, no login state, and no automations list. That is expected for a public page fetch.
- No ManyChat connector exists in Muse. No ManyChat login, API, or automation list was invented.

Not done, and why:
- Claude scheduled task instructions were NOT updated. The text fetch of the task page timed out on 2026-11-06, and Claude is out of credits until Nov 9, 2026, 4:00 AM in any case. Editing it needs the live browser after the reset, with Darien's go-ahead.
- ManyChat automations were NOT opened, listed, edited, paused, deleted, or renamed. There is no saved ManyChat login in Muse, and a text fetch cannot sign in to ManyChat. Signing in needs Darien in his own browser or the ManyChat app, or a ManyChat login saved through Muse's secure sign-in flow. Do not send a ManyChat password in chat.
- No test DM was sent to a real follower.
- The website was NOT touched in this task. The website realtor check is separate work in progress by another agent.

## Open items for Darien / parent agent

1. Sign in to ManyChat and edit each live keyword automation to the new flow, or confirm who should do it, and when.
2. After Nov 9, 2026, 4:00 AM, update the Claude scheduled task instructions with this flow, and confirm whether to resume that task at all.
3. Confirm the agent-info fields in ManyChat: agent name, brokerage, agent phone or email, plus a "Has agent" tag, and how Darien wants to be notified when a Yes with agent info comes in.
