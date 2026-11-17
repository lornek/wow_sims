export const trees = [
  {
    "name": "Elemental Combat",
    "slug": "elemental",
    "nodes": [
      {
        "name": "Convection",
        "row": 1,
        "column": 2,
        "max": 5,
        "icon": "spell_nature_wispsplode",
        "requires": null,
        "description": [
          "Rank 1 Reduces the mana cost of your Shock, Lightning Bolt, and Chain Lightning spells by 2%.",
          "Rank 5 Reduces the mana cost of your Shock, Lightning Bolt, and Chain Lightning spells by 10%."
        ]
      },
      {
        "name": "Concussion",
        "row": 1,
        "column": 3,
        "max": 5,
        "icon": "spell_nature_earthshock",
        "requires": null,
        "description": [
          "Rank 1 Increases the damage done by your Lightning Bolt, Chain Lightning, and Earth Shock spells by 1%.",
          "Rank 5 Increases the damage done by your Lightning Bolt, Chain Lightning, and Earth Shock spells by 5%."
        ]
      },
      {
        "name": "Elemental Devastation",
        "row": 2,
        "column": 1,
        "max": 3,
        "icon": "spell_fire_elementaldevastation",
        "requires": null,
        "description": [
          "Rank 1 Your Critical Strikes with direct damage spells increase your chance to get a Critical Strike with melee attacks by 3% for 10 sec.",
          "Rank 3 Your Critical Strikes with direct damage spells increase your chance to get a Critical Strike with melee attacks by 9% for 10 sec."
        ]
      },
      {
        "name": "Reverberation",
        "row": 2,
        "column": 2,
        "max": 5,
        "icon": "spell_frost_frostward",
        "requires": null,
        "description": [
          "Rank 1 Reduces the cooldown of your Shock spells by 0.2 sec.",
          "Rank 5 Reduces the cooldown of your Shock spells by 1 sec."
        ]
      },
      {
        "name": "Elemental Alacrity",
        "row": 2,
        "column": 3,
        "max": 3,
        "icon": "spell_lightning_lightningbolt01",
        "requires": null,
        "description": [
          "Rank 1 Reduces the cast time of your Lightning Bolt and Chain Lightning spells by 0.17 sec.",
          "Rank 3 Reduces the cast time of your Lightning Bolt and Chain Lightning spells by 0.5 sec."
        ]
      },
      {
        "name": "Call of Flame",
        "row": 2,
        "column": 4,
        "max": 3,
        "icon": "spell_fire_immolation",
        "requires": null,
        "description": [
          "Rank 1 Increases the damage done by your Fire Totems and by your Flame Shock and Fire Nova spells by 5%, as well as increases the duration of your Flame Shock spell by 3 sec.",
          "Rank 3 Increases the damage done by your Fire Totems and by your Flame Shock and Fire Nova spells by 15%, as well as increases the duration of your Flame Shock spell by 9 sec."
        ]
      },
      {
        "name": "Elemental Focus",
        "row": 3,
        "column": 1,
        "max": 1,
        "icon": "spell_shadow_manaburn",
        "requires": null,
        "description": [
          "Gives you a 10% chance to enter a Clearcasting state after casting any Fire, Frost, or Nature damage spell. The Clearcasting state reduces the mana cost of your next damage spell by 100%."
        ]
      },
      {
        "name": "Elemental Warding",
        "row": 3,
        "column": 2,
        "max": 3,
        "icon": "spell_nature_spiritarmor",
        "requires": null,
        "description": [
          "Rank 1 Reduces damage taken from Fire, Frost, and Nature effects by 3%.",
          "Rank 3 Reduces damage taken from Fire, Frost, and Nature effects by 10%."
        ]
      },
      {
        "name": "Trial by Fire",
        "row": 4,
        "column": 1,
        "max": 2,
        "icon": "spell_fire_sealoffire",
        "requires": null,
        "description": [
          "Rank 1 Increases the damage done by your Fire Nova spell by 10% and reduces its cooldown by 2 sec, and increases the duration of your Magma Totem by 10 sec.",
          "Rank 2 Increases the damage done by your Fire Nova spell by 20% and reduces its cooldown by 4 sec, and increases the duration of your Magma Totem by 20 sec."
        ]
      },
      {
        "name": "Eye of the Storm",
        "row": 4,
        "column": 2,
        "max": 3,
        "icon": "spell_nature_eyeofthestorm",
        "requires": null,
        "description": [
          "Rank 1 Gives your Lightning Bolt and Chain Lightning spells a 23% chance to not lose casting time when you take damage.",
          "Rank 3 Gives your Lightning Bolt and Chain Lightning spells a 70% chance to not lose casting time when you take damage."
        ]
      },
      {
        "name": "Earthbound",
        "row": 4,
        "column": 4,
        "max": 1,
        "icon": "spell_nature_stranglevines",
        "requires": null,
        "description": [
          "Your Earthbind Totem Immobilizes nearby targets for 5 sec when cast."
        ]
      },
      {
        "name": "Elemental Reach",
        "row": 5,
        "column": 1,
        "max": 2,
        "icon": "spell_nature_stormreach",
        "requires": null,
        "description": [
          "Rank 1 Increases the range of your Lightning Bolt, Chain Lightning, and Fire Nova spells by 3 yards.",
          "Rank 2 Increases the range of your Lightning Bolt, Chain Lightning, and Fire Nova spells by 6 yards."
        ]
      },
      {
        "name": "Call of Thunder",
        "row": 5,
        "column": 2,
        "max": 1,
        "icon": "spell_nature_callstorm",
        "requires": null,
        "description": [
          "Increases the critical strike chance of your Lightning Bolt and Chain Lightning spells by 5%."
        ]
      },
      {
        "name": "Lightning Overload",
        "row": 5,
        "column": 3,
        "max": 3,
        "icon": "spell_nature_lightningoverload",
        "requires": "Elemental Alacrity",
        "description": [
          "Rank 1 Gives your Lightning Bolt and Chain Lightning spells a 10% chance to cast a second, similar spell on the same target at no additional cost that causes half damage and no threat.",
          "Rank 3 Gives your Lightning Bolt and Chain Lightning spells a 30% chance to cast a second, similar spell on the same target at no additional cost that causes half damage and no threat."
        ]
      },
      {
        "name": "Elemental Fury",
        "row": 6,
        "column": 3,
        "max": 5,
        "icon": "spell_fire_volcano",
        "requires": "Lightning Overload",
        "description": [
          "Rank 1 Increases the critical strike damage bonus of your Searing and Magma Totems and your Fire, Frost, and Nature spells by 20%.",
          "Rank 5 Increases the critical strike damage bonus of your Searing and Magma Totems and your Fire, Frost, and Nature spells by 100%."
        ]
      },
      {
        "name": "Lightning Mastery",
        "row": 7,
        "column": 2,
        "max": 1,
        "icon": "spell_nature_unrelentingstorm",
        "requires": "Call of Thunder",
        "description": [
          "Gain mastery over Lightning, reducing the cast time of your Lightning Bolt spell by 0.5 sec, and removing the cooldown from your Chain Lightning spell. Lasts 15 sec."
        ]
      }
    ]
  },
  {
    "name": "Enhancement",
    "slug": "enhancement",
    "nodes": [
      {
        "name": "Earth's Grasp",
        "row": 1,
        "column": 1,
        "max": 2,
        "icon": "spell_nature_stoneclawtotem",
        "requires": null,
        "description": [
          "Rank 1 Increases the health of your Stoneclaw Totem by 25% and the radius of your Earthbind Totem by 10%.",
          "Rank 2 Increases the health of your Stoneclaw Totem by 50% and the radius of your Earthbind Totem by 20%."
        ]
      },
      {
        "name": "Thundering Strikes",
        "row": 1,
        "column": 2,
        "max": 5,
        "icon": "ability_thunderbolt",
        "requires": null,
        "description": [
          "Rank 1 Improves your chance to get a critical strike with all spells and attacks by 1%.",
          "Rank 5 Improves your chance to get a critical strike with all spells and attacks by 5%."
        ]
      },
      {
        "name": "Ancestral Knowledge",
        "row": 1,
        "column": 3,
        "max": 5,
        "icon": "spell_shadow_grimward",
        "requires": null,
        "description": [
          "Rank 1 Increases your Intellect by 2%.",
          "Rank 5 Increases your Intellect by 10%."
        ]
      },
      {
        "name": "Guardian Totems",
        "row": 2,
        "column": 1,
        "max": 2,
        "icon": "spell_nature_stoneskintotem",
        "requires": null,
        "description": [
          "Rank 1 Increases the amount of damage reduced by your Stoneskin Totem and Windwall Totem by 10% and reduces the cooldown of your Grounding Totem by 1 sec.",
          "Rank 2 Increases the amount of damage reduced by your Stoneskin Totem and Windwall Totem by 20% and reduces the cooldown of your Grounding Totem by 2 sec."
        ]
      },
      {
        "name": "Mental Dexterity",
        "row": 2,
        "column": 2,
        "max": 3,
        "icon": "spell_nature_mentalquickness",
        "requires": null,
        "description": [
          "Rank 1 Increases your Attack Power by an amount equal to 50% of your Intellect.",
          "Rank 3 Increases your Attack Power by an amount equal to 150% of your Intellect."
        ]
      },
      {
        "name": "Improved Lightning Shield",
        "row": 2,
        "column": 3,
        "max": 3,
        "icon": "spell_nature_lightningshield",
        "requires": null,
        "description": [
          "Rank 1 Increases the damage done by your Lightning Shield orbs by 5%.",
          "Rank 3 Increases the damage done by your Lightning Shield orbs by 15%."
        ]
      },
      {
        "name": "Elemental Weapons",
        "row": 3,
        "column": 1,
        "max": 3,
        "icon": "spell_fire_flametounge",
        "requires": null,
        "description": [
          "Rank 1 Increases the melee attack power bonus of your Rockbiter Weapon by 7%, your Windfury Weapon effect by 13% and increases the damage caused by your Flametongue Weapon and Frostbrand Weapon by 5%.",
          "Rank 3 Increases the melee attack power bonus of your Rockbiter Weapon by 20%, your Windfury Weapon effect by 40% and increases the damage caused by your Flametongue Weapon and Frostbrand Weapon by 15%."
        ]
      },
      {
        "name": "Shamanistic Focus",
        "row": 3,
        "column": 3,
        "max": 1,
        "icon": "spell_nature_elementalabsorption",
        "requires": null,
        "description": [
          "Reduces the mana cost of your Shock and Lightning Shield spells by 45%."
        ]
      },
      {
        "name": "Anticipation",
        "row": 3,
        "column": 4,
        "max": 3,
        "icon": "spell_nature_mirrorimage",
        "requires": null,
        "description": [
          "Rank 1 Increases your chance to dodge by an additional 2%.",
          "Rank 3 Increases your chance to dodge by an additional 6%."
        ]
      },
      {
        "name": "Toughness",
        "row": 4,
        "column": 1,
        "max": 5,
        "icon": "spell_holy_devotion",
        "requires": null,
        "description": [
          "Rank 1 Increases your Stamina by 2%.",
          "Rank 5 Increases your Stamina by 10%."
        ]
      },
      {
        "name": "Flurry",
        "row": 4,
        "column": 2,
        "max": 5,
        "icon": "ability_ghoulfrenzy",
        "requires": "Mental Dexterity",
        "description": [
          "Rank 1 Increases your attack speed by 6% for your next 3 swings after dealing a melee critical strike.",
          "Rank 5 Increases your attack speed by 30% for your next 3 swings after dealing a melee critical strike."
        ]
      },
      {
        "name": "Stormstrike",
        "row": 4,
        "column": 3,
        "max": 1,
        "icon": "ability_shaman_stormstrike",
        "requires": null,
        "description": [
          "Instantly strike for 150% weapon damage and increase the damage you deal to the target with your next Lightning Bolt, Chain Lightning, or Earth Shock spell by 20% for 12 sec."
        ]
      },
      {
        "name": "Improved Ghost Wolf",
        "row": 4,
        "column": 4,
        "max": 2,
        "icon": "spell_nature_spiritwolf",
        "requires": null,
        "description": [
          "Rank 1 Reduces the cast time of your Ghost Wolf spell by 1 sec, and Ghost Wolf may be used indoors.",
          "Rank 2 Reduces the cast time of your Ghost Wolf spell by 3 sec, and Ghost Wolf may be used indoors."
        ]
      },
      {
        "name": "Spirit Weapons",
        "row": 5,
        "column": 1,
        "max": 1,
        "icon": "ability_parry",
        "requires": null,
        "description": [
          "Gives a chance to parry enemy melee attacks, reduces all threat generated by your attacks by 30% while Rockbiter Weapon is not active, and increases all threat generated by 30% while Rockbiter Weapon is active."
        ]
      },
      {
        "name": "Mental Quickness",
        "row": 5,
        "column": 2,
        "max": 2,
        "icon": "spell_nature_sleep",
        "requires": null,
        "description": [
          "Rank 1 Increases your spell damage and healing by up to 15% of your Intellect.",
          "Rank 2 Increases your spell damage and healing by up to 30% of your Intellect."
        ]
      },
      {
        "name": "Improved Stormstrike",
        "row": 5,
        "column": 3,
        "max": 2,
        "icon": "spell_shaman_improvedstormstrike",
        "requires": "Stormstrike",
        "description": [
          "Rank 1 When you Stormstrike, you have a 50% chance to gain 50% mana regeneration while casting spells for 15 sec, and Stormstrike's cooldown has a 50% chance to reset each time you Dodge or Parry.",
          "Rank 2 When you Stormstrike, you have a 100% chance to gain 50% mana regeneration while casting spells for 15 sec, and Stormstrike's cooldown has a 100% chance to reset each time you Dodge or Parry."
        ]
      },
      {
        "name": "Maelstrom Weapon",
        "row": 6,
        "column": 3,
        "max": 5,
        "icon": "spell_shaman_maelstromweapon",
        "requires": null,
        "description": [
          "Rank 1 When you deal damage with a melee attack, you have a chance to reduce the cast time and Mana cost of your next Lightning Bolt spell by 4%. Stacks up to 5 times. Lasts 30 sec.",
          "Rank 5 When you deal damage with a melee attack, you have a chance to reduce the cast time and Mana cost of your next Lightning Bolt spell by 20%. Stacks up to 5 times. Lasts 30 sec."
        ]
      },
      {
        "name": "Rage of the Farseer",
        "row": 7,
        "column": 2,
        "max": 1,
        "icon": "spell_nature_bloodlust",
        "requires": "Mental Quickness",
        "description": [
          "Increases your attack speed by 30% for 25 sec."
        ]
      }
    ]
  },
  {
    "name": "Restoration",
    "slug": "restoration",
    "nodes": [
      {
        "name": "Improved Healing Wave",
        "row": 1,
        "column": 2,
        "max": 5,
        "icon": "spell_nature_magicimmunity",
        "requires": null,
        "description": [
          "Rank 1 Reduces the casting time of your Healing Wave spell by 0.1 sec.",
          "Rank 5 Reduces the casting time of your Healing Wave spell by 0.5 sec."
        ]
      },
      {
        "name": "Tidal Focus",
        "row": 1,
        "column": 3,
        "max": 5,
        "icon": "spell_frost_manarecharge",
        "requires": null,
        "description": [
          "Rank 1 Reduces the Mana cost of your healing spells by 1% and improves your chance to hit by 1%.",
          "Rank 5 Reduces the Mana cost of your healing spells by 5% and improves your chance to hit by 5%."
        ]
      },
      {
        "name": "Mindfulness",
        "row": 2,
        "column": 1,
        "max": 3,
        "icon": "spell_nature_sleep",
        "requires": null,
        "description": [
          "Rank 1 Allows 17% of your Mana regeneration to continue while casting.",
          "Rank 3 Allows 50% of your Mana regeneration to continue while casting."
        ]
      },
      {
        "name": "Natural Grace",
        "row": 2,
        "column": 2,
        "max": 3,
        "icon": "spell_nature_healingtouch",
        "requires": null,
        "description": [
          "Rank 1 Reduces the threat generated by your spells by 5%.",
          "Rank 3 Reduces the threat generated by your spells by 15%."
        ]
      },
      {
        "name": "Totemic Focus",
        "row": 2,
        "column": 3,
        "max": 5,
        "icon": "spell_nature_moonglow",
        "requires": null,
        "description": [
          "Rank 1 Reduces the Mana cost of your totems and any spells that summon or move them by 5%.",
          "Rank 5 Reduces the Mana cost of your totems and any spells that summon or move them by 25%."
        ]
      },
      {
        "name": "Improved Reincarnation",
        "row": 2,
        "column": 4,
        "max": 2,
        "icon": "spell_nature_reincarnation",
        "requires": null,
        "description": [
          "Rank 1 Reduces the cooldown of your Reincarnation spell by 10 min, increases your maximum health by 2%, and increases the amount of health and Mana you reincarnate with by an additional 10%.",
          "Rank 2 Reduces the cooldown of your Reincarnation spell by 20 min, increases your maximum health by 4%, and increases the amount of health and Mana you reincarnate with by an additional 20%."
        ]
      },
      {
        "name": "Ancestral Healing",
        "row": 3,
        "column": 1,
        "max": 3,
        "icon": "spell_nature_undyingstrength",
        "requires": null,
        "description": [
          "Rank 1 Increases your target's armor value by 8% for 15 sec after getting a critical effect from one of your healing spells.",
          "Rank 3 Increases your target's armor value by 25% for 15 sec after getting a critical effect from one of your healing spells."
        ]
      },
      {
        "name": "Healing Focus",
        "row": 3,
        "column": 2,
        "max": 3,
        "icon": "spell_nature_healingwavelesser",
        "requires": null,
        "description": [
          "Rank 1 Gives your healing spells a 23% chance to not lose casting time when you take damage.",
          "Rank 3 Gives your healing spells a 70% chance to not lose casting time when you take damage."
        ]
      },
      {
        "name": "Water Shield",
        "row": 3,
        "column": 3,
        "max": 1,
        "icon": "ability_shaman_watershield",
        "requires": null,
        "description": [
          "The caster is surrounded by 3 globes of water. When a spell, melee, or ranged attack hits the caster or when one of the caster's spells gets a critical result, 2% of maximum mana is restored to the caster, expending one water globe. Only one globe will activate every few seconds. Lasts 10 min. Only one Elemental Shield can be active on the Shaman at any one time."
        ]
      },
      {
        "name": "Tidal Mastery",
        "row": 4,
        "column": 1,
        "max": 5,
        "icon": "spell_nature_tranquility",
        "requires": null,
        "description": [
          "Rank 1 Increases the critical effect chance of your healing spells by 1%.",
          "Rank 5 Increases the critical effect chance of your healing spells by 5%."
        ]
      },
      {
        "name": "Restorative Totems",
        "row": 4,
        "column": 2,
        "max": 5,
        "icon": "spell_nature_manaregentotem",
        "requires": null,
        "description": [
          "Rank 1 Increases the effect of your Mana Spring Totem by 5% and increases the effect of your Healing Stream Totem by 10%.",
          "Rank 5 Increases the effect of your Mana Spring Totem by 25% and increases the effect of your Healing Stream Totem by 50%."
        ]
      },
      {
        "name": "Mana Tide Totem",
        "row": 4,
        "column": 3,
        "max": 1,
        "icon": "spell_frost_summonwaterelemental",
        "requires": null,
        "description": [
          "Summons a Mana Tide Totem with 5 health at the feet of the caster for 12 sec that restores 88 mana every 3 seconds to group members within 30 yards."
        ]
      },
      {
        "name": "Healing Way",
        "row": 5,
        "column": 2,
        "max": 3,
        "icon": "spell_nature_healingway",
        "requires": null,
        "description": [
          "Rank 1 Increases the amount healed by your Healing Wave spell by 8%.",
          "Rank 3 Increases the amount healed by your Healing Wave spell by 25%."
        ]
      },
      {
        "name": "Nature's Swiftness",
        "row": 5,
        "column": 3,
        "max": 1,
        "icon": "spell_nature_ravenform",
        "requires": null,
        "description": [
          "When activated, your next Nature spell with a casting time less than 10 sec. becomes an instant cast spell."
        ]
      },
      {
        "name": "Purification",
        "row": 6,
        "column": 3,
        "max": 5,
        "icon": "spell_frost_wizardmark",
        "requires": null,
        "description": [
          "Rank 1 Increases the effectiveness of your healing spells by 2%.",
          "Rank 5 Increases the effectiveness of your healing spells by 10%."
        ]
      },
      {
        "name": "Riptide",
        "row": 7,
        "column": 2,
        "max": 1,
        "icon": "spell_nature_riptide",
        "requires": "Healing Way",
        "description": [
          "Heals a friendly target for 445 over 15 sec, and increases the effectiveness of your Chain Heal casts directly on that target by 25%."
        ]
      }
    ]
  }
];
