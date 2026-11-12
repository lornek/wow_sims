# Prompting a build with a progress dashboard

Use one kickoff prompt to define the outcome, the evidence needed to call it done, and how you will review it. Start with one playable fight and one healer. Review the interaction and mechanics before the agent repeats them across every spec.

Ask for two links: a playable preview and a progress dashboard. Play the preview and give feedback in the same chat. Have the agent track each item and the build that addresses it in the dashboard. Supply the reference URL, screenshots of the states you care about, and sources you trust for game mechanics.

## Copyable kickoff prompt

```text
Build a fresh, browser-based WoW Forever healing simulator. Use my existing
Healbot as the reference for feature depth and interaction quality. Build
the new simulator from scratch.

The outcome
A player should be able to pick a healer, configure gear and talents,
choose a boss and difficulty, and play a fight that rewards triage,
anticipation, cooldown timing, and mana management. They should be able
to explain why a run succeeded or failed from the post-fight report.

Target scope
- Restoration Shaman, Restoration Druid, Holy Paladin, Discipline Priest,
  and Holy Priest. Each gets its own saved setup.
- Rend Blackhand, Patchwerk, and Sapphiron, with distinct healing
  pressures and four difficulties.
- Gear presets, talents that affect the simulation, buffs, spell ranks,
  and tooltips with live values for the current build.
- Desktop mouse bindings and mobile tap-to-target casting. Incoming
  healing, aura countdowns, cooldown sweeps, cast and mana bars, and
  live party damage and healing meters.
- Fight reports with spell breakdowns, effective healing, overhealing,
  healing per mana, total mana restored, and marginal mana gained from
  +1 raw Spirit and +1 MP5.
- Fast class switches that preserve encounter settings, a stable
  battlefield layout, and lightweight mobile artwork.

Start by turning this into an acceptance checklist. Inspect the reference
and add concrete behaviors that are easy to miss. Record any assumptions
you need to make and begin building immediately.

Build and verification loop
1. Make one playable vertical slice: Shaman versus Rend. Include a
   complete pull, a win or loss, and a readable report. Put it in the
   preview as soon as I can play it.
2. Verify the slice before expanding it. Use seeded combat runs to check
   spell math, event timing, mana accounting, and report totals. Use a
   browser to check real interactions at desktop and phone widths.
3. Expand the shared engine and UI to the remaining healers and bosses.
   Build each new spec around the decisions it should make differently.
4. Run a balance pass with several strategies per spec under the same
   gear, buffs, and difficulty. Report clear rate, healing, mana left,
   fight duration, and what caused failures. Separate game mechanics
   from tuning decisions made for the simulator.
5. Review the finished preview for readability, layout shifts, input
   behavior, loading, and usability. Fix issues and rerun the relevant
   checks. Continue until each acceptance item has evidence or a
   specific blocker.

Mechanics and sources
For each mechanic that affects results, record its source and whether it
is confirmed for WoW Forever, borrowed from another WoW version, or
chosen for encounter tuning. When sources disagree, state which
interpretation you used and make it easy to change. Include the
assumptions in the balance report.

Progress dashboard
Create a simple dashboard separate from the game UI. Give me its URL
and the playable preview URL once both are available. Update the
dashboard at each milestone from a versioned status file. Show:
- The latest playable build and what I can try in it.
- Each acceptance item with status and evidence.
- Screenshots at desktop and mobile widths for visual changes.
- Mechanics awaiting confirmation and decisions that need my input.
- Feedback from this chat, its disposition, and the build that addresses it.
- The next milestone and any blocker.

Show me what to try after each milestone, with one or two specific
things to look for. Keep working on independent items while I review.
Treat new messages as steering for the current project. Ask me before
committing to a hard-to-reverse choice when the answer would materially
change the outcome. Keep the last playable preview available while
working on the next one.

Finish with the playable site, source code, verification results,
mechanics assumptions, and any remaining gaps.
```

## Giving feedback

Give feedback after the first playable fight, while changes are still cheap. Describe the setup, the action you took, and what happened.

- **UI.** At phone width I lose track of Cairne's health when the damage meter expands.
- **Balance.** On Mythic Rend with dungeon gear and no consumables, Chain Heal leaves me out of mana before enrage even when all three hits are effective.

The dashboard records progress while the agent is working. Continuing after the session ends requires a separate scheduled or unattended workflow. Use the same acceptance checklist and status file as its handoff.
