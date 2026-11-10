export const trees = [
  {
    "name": "Holy",
    "slug": "holy",
    "nodes": [
      {
        "name": "Spiritual Focus",
        "row": 1,
        "column": 2,
        "max": 5,
        "icon": "spell_arcane_blink",
        "requires": null,
        "description": [
          "Rank 1 Gives your Flash of Light, Holy Light, and Light's Vigil spells a 14% chance to not lose casting time when you take damage.",
          "Rank 5 Gives your Flash of Light, Holy Light, and Light's Vigil spells a 70% chance to not lose casting time when you take damage."
        ]
      },
      {
        "name": "Divine Strength",
        "row": 1,
        "column": 3,
        "max": 5,
        "icon": "ability_golemthunderclap",
        "requires": null,
        "description": [
          "Rank 1 Increases your Strength by 2%.",
          "Rank 5 Increases your Strength by 10%."
        ]
      },
      {
        "name": "Healing Light",
        "row": 2,
        "column": 1,
        "max": 3,
        "icon": "spell_holy_holybolt",
        "requires": null,
        "description": [
          "Rank 1 Increases the amount healed by your Holy Light, Flash of Light, and Holy Shock spells by 4%.",
          "Rank 3 Increases the amount healed by your Holy Light, Flash of Light, and Holy Shock spells by 12%."
        ]
      },
      {
        "name": "Reverence",
        "row": 2,
        "column": 2,
        "max": 2,
        "icon": "spell_holy_divineillumination",
        "requires": null,
        "description": [
          "Rank 1 Allows 15% of your Mana regeneration to continue while casting.",
          "Rank 2 Allows 30% of your Mana regeneration to continue while casting."
        ]
      },
      {
        "name": "Improved Seals",
        "row": 2,
        "column": 3,
        "max": 5,
        "icon": "ability_thunderbolt",
        "requires": null,
        "description": [
          "Rank 1 Increases the damage done by your Seals and Judgements by 3%.",
          "Rank 5 Increases the damage done by your Seals and Judgements by 15%."
        ]
      },
      {
        "name": "Purifying Power",
        "row": 2,
        "column": 4,
        "max": 2,
        "icon": "spell_holy_purifyingpower",
        "requires": null,
        "description": [
          "Rank 1 Reduces the mana cost of your Cleanse and Purify spells by 10% and reduces the cooldown of your Exorcism and Holy Wrath spells by 17%.",
          "Rank 2 Reduces the mana cost of your Cleanse and Purify spells by 20% and reduces the cooldown of your Exorcism and Holy Wrath spells by 33%."
        ]
      },
      {
        "name": "Divine Favor",
        "row": 3,
        "column": 1,
        "max": 1,
        "icon": "spell_holy_heal",
        "requires": null,
        "description": [
          "When activated, gives your next Flash of Light, Holy Light, or Holy Shock spell a 100% critical effect chance."
        ]
      },
      {
        "name": "Illumination",
        "row": 3,
        "column": 2,
        "max": 5,
        "icon": "spell_holy_greaterheal",
        "requires": "Reverence",
        "description": [
          "Rank 1 After getting a critical effect from your Flash of Light, Holy Light, Light's Vigil, or Holy Shock heal spell you have a 20% chance to gain Mana equal to 50% of the base cost of the spell.",
          "Rank 5 After getting a critical effect from your Flash of Light, Holy Light, Light's Vigil, or Holy Shock heal spell you have a 100% chance to gain Mana equal to 50% of the base cost of the spell."
        ]
      },
      {
        "name": "Holy Conduit",
        "row": 3,
        "column": 3,
        "max": 2,
        "icon": "spell_holy_devineaegis",
        "requires": null,
        "description": [
          "Rank 1 Reduces the mana cost of your Consecration, Holy Wrath, Exorcism, and Hammer of Wrath spells by 20%.",
          "Rank 2 Reduces the mana cost of your Consecration, Holy Wrath, Exorcism, and Hammer of Wrath spells by 40%."
        ]
      },
      {
        "name": "Divine Precision",
        "row": 4,
        "column": 1,
        "max": 2,
        "icon": "spell_holy_mindsooth",
        "requires": null,
        "description": [
          "Rank 1 Improves your chance to hit with Holy spells by 4%, and reduces the duration of Silence effects on you by 10%.",
          "Rank 2 Improves your chance to hit with Holy spells by 8%, and reduces the duration of Silence effects on you by 20%."
        ]
      },
      {
        "name": "Infusion of Light",
        "row": 4,
        "column": 2,
        "max": 2,
        "icon": "ability_paladin_infusionoflight",
        "requires": null,
        "description": [
          "Rank 1 Your Holy Shock and Flash of Light critical hits reduce the cast time of your next Holy Light cast within 15 sec by 0.5 sec.",
          "Rank 2 Your Holy Shock and Flash of Light critical hits reduce the cast time of your next Holy Light cast within 15 sec by 1 sec."
        ]
      },
      {
        "name": "Oath of Light",
        "row": 4,
        "column": 3,
        "max": 1,
        "icon": "spell_holy_greaterblessingoflight",
        "requires": null,
        "description": [
          "Swear an Oath to protect target ally for 5 min, increasing the healing of your Holy Light on them by up to 400, your Flash of Light by up to 115, and your Holy Shock by up to 230. Only one Oath of Light may be sworn by the Paladin at any one time."
        ]
      },
      {
        "name": "Consecrated Ground",
        "row": 5,
        "column": 1,
        "max": 2,
        "icon": "spell_holy_innerfire",
        "requires": null,
        "description": [
          "Rank 1 Gives your Holy spells 5% increased damage against the first 4 enemies that enter your Consecration.",
          "Rank 2 Gives your Holy spells 10% increased damage against the first 4 enemies that enter your Consecration."
        ]
      },
      {
        "name": "Holy Shock",
        "row": 5,
        "column": 2,
        "max": 1,
        "icon": "spell_holy_searinglight",
        "requires": null,
        "description": [
          "Blasts the target with Holy energy, causing 129 to 139 Holy damage to an enemy, or 110 to 118 healing to an ally."
        ]
      },
      {
        "name": "Boundless Light",
        "row": 5,
        "column": 3,
        "max": 2,
        "icon": "ability_paladin_sacredcleansing",
        "requires": "Holy Shock",
        "description": [
          "Rank 1 Increases the critical strike chance of your Holy Shock spell by 15% when cast on allies not affected by your Oath of Light.",
          "Rank 2 Increases the critical strike chance of your Holy Shock spell by 30% when cast on allies not affected by your Oath of Light."
        ]
      },
      {
        "name": "Holy Power",
        "row": 6,
        "column": 3,
        "max": 5,
        "icon": "spell_holy_power",
        "requires": null,
        "description": [
          "Rank 1 Increases the critical strike healing bonus of your Holy spells by 10%.",
          "Rank 5 Increases the critical strike healing bonus of your Holy spells by 50%."
        ]
      },
      {
        "name": "Light's Vigil",
        "row": 7,
        "column": 2,
        "max": 1,
        "icon": "ability_paladin_judgementofthepure",
        "requires": "Holy Shock",
        "description": [
          "Applies Light's Vigil to a friendly target for 30 sec. The caster's next Holy Shock on the target incurs no cooldown and heals the target and their party for 325 to 344. Only one Vigil per Paladin may be active in each party."
        ]
      }
    ]
  },
  {
    "name": "Protection",
    "slug": "protection",
    "nodes": [
      {
        "name": "Divine Intellect",
        "row": 1,
        "column": 2,
        "max": 5,
        "icon": "spell_nature_sleep",
        "requires": null,
        "description": [
          "Rank 1 Increases your total Intellect by 2%.",
          "Rank 5 Increases your total Intellect by 10%."
        ]
      },
      {
        "name": "Redoubt",
        "row": 1,
        "column": 3,
        "max": 5,
        "icon": "ability_defend",
        "requires": null,
        "description": [
          "Rank 1 Damaging melee attacks against you have a 10% chance to increase your chance to block by 6%. Lasts 10 sec or 5 blocks.",
          "Rank 5 Damaging melee attacks against you have a 10% chance to increase your chance to block by 30%. Lasts 10 sec or 5 blocks."
        ]
      },
      {
        "name": "Precision",
        "row": 2,
        "column": 1,
        "max": 3,
        "icon": "ability_rogue_ambush",
        "requires": null,
        "description": [
          "Rank 1 Improves your chance to hit by 1%.",
          "Rank 3 Improves your chance to hit by 3%."
        ]
      },
      {
        "name": "Guardian's Favor",
        "row": 2,
        "column": 2,
        "max": 2,
        "icon": "spell_holy_sealofprotection",
        "requires": null,
        "description": [
          "Rank 1 Reduces the cooldown of your Blessing of Protection by 1 min and increases the duration of your Blessing of Freedom by 3 sec.",
          "Rank 2 Reduces the cooldown of your Blessing of Protection by 2 min and increases the duration of your Blessing of Freedom by 6 sec."
        ]
      },
      {
        "name": "Sacred Duty",
        "row": 2,
        "column": 4,
        "max": 2,
        "icon": "spell_holy_divineintervention",
        "requires": null,
        "description": [
          "Rank 1 Reduces the cooldown of your Divine Shield, Divine Protection, and Templar's Bulwark spells by 30 sec, and reduces the duration of Forbearance by 5 sec.",
          "Rank 2 Reduces the cooldown of your Divine Shield, Divine Protection, and Templar's Bulwark spells by 60 sec, and reduces the duration of Forbearance by 10 sec."
        ]
      },
      {
        "name": "Templar's Bulwark",
        "row": 3,
        "column": 1,
        "max": 1,
        "icon": "ability_paladin_shieldofthetemplar",
        "requires": null,
        "description": [
          "When activated, this ability grants you an absorb shield equal to 100% of your maximum health for 8 sec. Applies Forbearance for 1 min. Cannot be cast while Forbearance is active."
        ]
      },
      {
        "name": "Improved Hammer of Justice",
        "row": 3,
        "column": 2,
        "max": 3,
        "icon": "spell_holy_sealofmight",
        "requires": null,
        "description": [
          "Rank 1 Decreases the cooldown of your Hammer of Justice spell by 5 sec.",
          "Rank 3 Decreases the cooldown of your Hammer of Justice spell by 15 sec."
        ]
      },
      {
        "name": "Shield Specialization",
        "row": 3,
        "column": 3,
        "max": 2,
        "icon": "inv_shield_06",
        "requires": "Redoubt",
        "description": [
          "Rank 1 Increases the amount of damage absorbed by your shield by 15%, and gives your blocks a 50% chance to restore 4% of your maximum Mana. May only occur once every 3 sec.",
          "Rank 2 Increases the amount of damage absorbed by your shield by 30%, and gives your blocks a 100% chance to restore 4% of your maximum Mana. May only occur once every 3 sec."
        ]
      },
      {
        "name": "Toughness",
        "row": 3,
        "column": 4,
        "max": 5,
        "icon": "spell_holy_devotion",
        "requires": null,
        "description": [
          "Rank 1 Increases your armor value from items by 2%.",
          "Rank 5 Increases your armor value from items by 10%."
        ]
      },
      {
        "name": "Swift Judgement",
        "row": 4,
        "column": 1,
        "max": 1,
        "icon": "ability_paladin_judgementred",
        "requires": "Templar's Bulwark",
        "description": [
          "Unleash the energy of a Seal spell upon an enemy. Does not consume the Seal. Refer to individual Seals for Judgement effect. Does not share a cooldown with your Judgement ability."
        ]
      },
      {
        "name": "Improved Righteous Fury",
        "row": 4,
        "column": 2,
        "max": 3,
        "icon": "spell_holy_sealoffury",
        "requires": null,
        "description": [
          "Rank 1 While Righteous Fury is active, all damage taken is reduced by 3%.",
          "Rank 3 While Righteous Fury is active, all damage taken is reduced by 9%."
        ]
      },
      {
        "name": "Anticipation",
        "row": 4,
        "column": 3,
        "max": 5,
        "icon": "spell_magic_lesserinvisibilty",
        "requires": null,
        "description": [
          "Rank 1 Increases your Defense Skill by 4.",
          "Rank 5 Increases your Defense Skill by 20."
        ]
      },
      {
        "name": "Stoicism",
        "row": 5,
        "column": 1,
        "max": 2,
        "icon": "spell_holy_stoicism",
        "requires": null,
        "description": [
          "Rank 1 Reduces the duration of Stun and Charm effects on you by 10%.",
          "Rank 2 Reduces the duration of Stun and Charm effects on you by 20%."
        ]
      },
      {
        "name": "Holy Shield",
        "row": 5,
        "column": 2,
        "max": 1,
        "icon": "spell_holy_blessingofprotection",
        "requires": null,
        "description": [
          "Increases chance to block by 30% for 10 sec, and deals 75 Holy damage for each attack blocked while active. Damage caused by Holy Shield causes 20% additional threat. Each block expends a charge. 4 charges."
        ]
      },
      {
        "name": "Reckoning",
        "row": 5,
        "column": 3,
        "max": 5,
        "icon": "spell_holy_blessingofstrength",
        "requires": null,
        "description": [
          "Rank 1 Gives you a 8% chance after Blocking and a 20% chance after receiving a non-periodic critical strike to gain an extra attack. Stores up to 4 extra attacks. Cannot occur from Blocks more than once every 1.5 sec.",
          "Rank 5 Gives you a 40% chance after Blocking and a 100% chance after receiving a non-periodic critical strike to gain an extra attack. Stores up to 4 extra attacks. Cannot occur from Blocks more than once every 1.5 sec."
        ]
      },
      {
        "name": "Iron Creed",
        "row": 6,
        "column": 3,
        "max": 3,
        "icon": "spell_holy_improvedresistanceauras",
        "requires": null,
        "description": [
          "Rank 1 Increases the threat generated by your Holy Strike ability by 10%. While Righteous Fury is active, Holy Strike also reduces your damage taken by 2% for 6 sec.",
          "Rank 3 Increases the threat generated by your Holy Strike ability by 30%. While Righteous Fury is active, Holy Strike also reduces your damage taken by 6% for 6 sec."
        ]
      },
      {
        "name": "Shieldsworn",
        "row": 7,
        "column": 2,
        "max": 1,
        "icon": "spell_holy_greaterblessingofsanctuary",
        "requires": "Holy Shield",
        "description": [
          "Reduces the cooldown of your Holy Strike ability by 4 sec. Additionally, Holy Strike now strikes with your shield, triggering your active Holy Shield and Shield Specialization talents without consuming their charges or triggering their cooldowns, and allowing you to Block spells for 6 sec."
        ]
      }
    ]
  },
  {
    "name": "Retribution",
    "slug": "retribution",
    "nodes": [
      {
        "name": "Deflection",
        "row": 1,
        "column": 2,
        "max": 5,
        "icon": "ability_parry",
        "requires": null,
        "description": [
          "Rank 1 Increases your Parry chance by 1%.",
          "Rank 5 Increases your Parry chance by 5%."
        ]
      },
      {
        "name": "Benediction",
        "row": 1,
        "column": 3,
        "max": 5,
        "icon": "spell_frost_windwalkon",
        "requires": null,
        "description": [
          "Rank 1 Reduces the Mana cost of all instant cast spells and abilities by 2%.",
          "Rank 5 Reduces the Mana cost of all instant cast spells and abilities by 10%."
        ]
      },
      {
        "name": "Improved Judgement",
        "row": 2,
        "column": 1,
        "max": 2,
        "icon": "spell_holy_righteousfury",
        "requires": null,
        "description": [
          "Rank 1 Decreases the cooldown of your Judgement ability by 1 sec.",
          "Rank 2 Decreases the cooldown of your Judgement ability by 2 sec."
        ]
      },
      {
        "name": "Conviction",
        "row": 2,
        "column": 2,
        "max": 3,
        "icon": "spell_holy_retributionaura",
        "requires": null,
        "description": [
          "Rank 1 Improves your chance to get a critical strike with all spells and attacks by 2%.",
          "Rank 3 Improves your chance to get a critical strike with all spells and attacks by 6%."
        ]
      },
      {
        "name": "Sanctified Judgement",
        "row": 2,
        "column": 3,
        "max": 3,
        "icon": "ability_paladin_judgementblue",
        "requires": null,
        "description": [
          "Rank 1 Gives your Judgement ability a 33% chance to return 20% of the Mana cost of the judged seal.",
          "Rank 3 Gives your Judgement ability a 100% chance to return 60% of the Mana cost of the judged seal."
        ]
      },
      {
        "name": "Vindication",
        "row": 3,
        "column": 1,
        "max": 3,
        "icon": "spell_holy_vindication",
        "requires": null,
        "description": [
          "Rank 1 Gives the Paladin's damaging melee attacks a chance to reduce the target's Strength and Agility by 5% for 10 sec."
        ]
      },
      {
        "name": "Unyielding Faith",
        "row": 3,
        "column": 2,
        "max": 2,
        "icon": "spell_holy_unyieldingfaith",
        "requires": null,
        "description": [
          "Rank 1 Reduces the duration of Fear and Disorient effects on you by 15%.",
          "Rank 2 Reduces the duration of Fear and Disorient effects on you by 30%."
        ]
      },
      {
        "name": "Seal of Command",
        "row": 3,
        "column": 3,
        "max": 1,
        "icon": "ability_warrior_innerrage",
        "requires": null,
        "description": [
          "Gives the Paladin a chance to deal additional Holy damage equal to 70% of normal weapon damage. Only one Seal can be active on the Paladin at any one time. Lasts 30 sec. Unleashing this Seal's energy will judge an enemy, instantly causing 74 Holy damage, 136 to 148 if the target is stunned or incapacitated."
        ]
      },
      {
        "name": "Pursuit of Justice",
        "row": 3,
        "column": 4,
        "max": 2,
        "icon": "spell_holy_persuitofjustice",
        "requires": null,
        "description": [
          "Rank 1 Increases movement speed and mounted movement speed by 8%. This does not stack with other movement speed increasing effects.",
          "Rank 2 Increases movement speed and mounted movement speed by 15%. This does not stack with other movement speed increasing effects."
        ]
      },
      {
        "name": "Eye for an Eye",
        "row": 4,
        "column": 1,
        "max": 2,
        "icon": "spell_holy_eyeforaneye",
        "requires": null,
        "description": [
          "Rank 1 All critical strikes against you cause 5% of the damage taken to the attacker as well. The damage caused by Eye for an Eye will not exceed 50% of the Paladin's total health.",
          "Rank 2 All critical strikes against you cause 10% of the damage taken to the attacker as well. The damage caused by Eye for an Eye will not exceed 50% of the Paladin's total health."
        ]
      },
      {
        "name": "Sacred Arbiter",
        "row": 4,
        "column": 2,
        "max": 1,
        "icon": "inv_sword_08",
        "requires": null,
        "description": [
          "Increases the damage of your Holy Strike ability by 20% and causes it to refresh all Judgement effects on the target."
        ]
      },
      {
        "name": "Two-Handed Weapon Specialization",
        "row": 4,
        "column": 4,
        "max": 3,
        "icon": "inv_hammer_04",
        "requires": null,
        "description": [
          "Rank 1 Increases the Physical and Holy damage you deal by 2%, and reduces all threat you generate by 7% while a two-handed melee weapon is equipped.",
          "Rank 3 Increases the Physical and Holy damage you deal by 6%, and reduces all threat you generate by 20% while a two-handed melee weapon is equipped."
        ]
      },
      {
        "name": "Turn Evil",
        "row": 5,
        "column": 1,
        "max": 2,
        "icon": "spell_holy_turnundead",
        "requires": null,
        "description": [
          "Rank 1 Reduces the cast time of your Turn Undead spell by 0.5 sec, its cooldown by 5 sec, and allows it to affect Demons.",
          "Rank 2 Reduces the cast time of your Turn Undead spell by 1 sec, its cooldown by 10 sec, and allows it to affect Demons."
        ]
      },
      {
        "name": "Repentance",
        "row": 5,
        "column": 2,
        "max": 1,
        "icon": "spell_holy_prayerofhealing",
        "requires": null,
        "description": [
          "Puts the enemy target in a state of meditation, incapacitating them for up to 6 sec. Any damage caused will awaken the target. Only works against Humanoids."
        ]
      },
      {
        "name": "Vengeance",
        "row": 5,
        "column": 3,
        "max": 3,
        "icon": "ability_racial_avatar",
        "requires": "Seal of Command",
        "description": [
          "Rank 1 Increases your Physical and Holy damage dealt by 1% for 30 sec after landing a non-periodic critical strike. Stacks up to 5 times.",
          "Rank 3 Increases your Physical and Holy damage dealt by 3% for 30 sec after landing a non-periodic critical strike. Stacks up to 5 times."
        ]
      },
      {
        "name": "Champion of the Light",
        "row": 6,
        "column": 3,
        "max": 5,
        "icon": "ability_paladin_enlightenedjudgements",
        "requires": null,
        "description": [
          "Rank 1 Increases your spell damage by up to 12% of your Intellect, and reduces the cast time of your Hammer of Wrath by 0.2 sec.",
          "Rank 5 Increases your spell damage by up to 60% of your Intellect, and reduces the cast time of your Hammer of Wrath by 1 sec."
        ]
      },
      {
        "name": "Unsealed Wrath",
        "row": 7,
        "column": 2,
        "max": 1,
        "icon": "spell_holy_blessedresillience",
        "requires": "Repentance",
        "description": [
          "Your melee attacks store a copy of your active Seal for 15 sec, stacking up to 3 times. Landing an attack with a different Seal consumes all stacks, giving the stored Seal its normal chance to activate once per stack."
        ]
      }
    ]
  }
];
