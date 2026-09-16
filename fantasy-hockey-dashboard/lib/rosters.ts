// Snapshot of all 12 league rosters, imported from the post-draft
// Team_Comparison_2026-27.xlsx workbook. STATIC DATA — accurate as of
// draft night, not live. Re-import (replace this file) after trades or
// notable waiver moves for best accuracy, until the Yahoo API sync lands.

export const YOUR_TEAM = "The Dark Seider (You)";

export type RosteredPlayer = {
  name: string;
  pos: string | null;
  nhl: string | null;
  keeper: boolean;
};

export const ROSTERS: Record<string, RosteredPlayer[]> = {
  "Kwik-E-...": [
    {
      "name": "Jack Hughes",
      "pos": "C",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Miro Heiskanen",
      "pos": "D",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Sam Bennett",
      "pos": "C",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "J.T. Miller",
      "pos": "C",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Steven Stamkos",
      "pos": "C",
      "nhl": "NSH",
      "keeper": false
    },
    {
      "name": "Carter Hart",
      "pos": "G",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Alexis Lafreni\u00e8re",
      "pos": "LW",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Filip Hronek",
      "pos": "D",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Dustin Wolf",
      "pos": "G",
      "nhl": "CGY",
      "keeper": false
    },
    {
      "name": "Ryan O'Reilly",
      "pos": "C",
      "nhl": "NSH",
      "keeper": false
    },
    {
      "name": "Jackson Blake",
      "pos": "RW",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Brock Boeser",
      "pos": "LW",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Dylan Strome",
      "pos": "C",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Timo Meier",
      "pos": "LW",
      "nhl": "NJ",
      "keeper": true
    },
    {
      "name": "Easton Cowan",
      "pos": "LW",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Tom Wilson",
      "pos": "RW",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Jake Sanderson",
      "pos": "D",
      "nhl": "OTT",
      "keeper": true
    },
    {
      "name": "Nick Schmaltz",
      "pos": "C",
      "nhl": "UTA",
      "keeper": true
    },
    {
      "name": "Jake Oettinger",
      "pos": "G",
      "nhl": "DAL",
      "keeper": true
    },
    {
      "name": "Quinn Hughes",
      "pos": "D",
      "nhl": "MIN",
      "keeper": true
    },
    {
      "name": "Kyle Connor",
      "pos": "LW",
      "nhl": "WPG",
      "keeper": true
    }
  ],
  "Ice Drop": [
    {
      "name": "Mikko Rantanen",
      "pos": "LW",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Pavel Dorofeyev",
      "pos": "LW",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Karel Vejmelka",
      "pos": "G",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Noah Dobson",
      "pos": "D",
      "nhl": "MTL",
      "keeper": false
    },
    {
      "name": "Pyotr Kochetkov",
      "pos": "G",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Quinton Byfield",
      "pos": "C",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Vincent Trocheck",
      "pos": "C",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Sergei Murashov",
      "pos": "G",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Anthony Cirelli",
      "pos": "C",
      "nhl": "TB",
      "keeper": false
    },
    {
      "name": "Anthony Mantha",
      "pos": "LW",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Tyson Foerster",
      "pos": "LW",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Ryan Nugent-Hopkins",
      "pos": "C",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Josh Doan",
      "pos": "RW",
      "nhl": "BUF",
      "keeper": false
    },
    {
      "name": "Andrei Svechnikov",
      "pos": "LW",
      "nhl": "CAR",
      "keeper": true
    },
    {
      "name": "Filip Forsberg",
      "pos": "LW",
      "nhl": "NSH",
      "keeper": true
    },
    {
      "name": "Jesper Bratt",
      "pos": "LW",
      "nhl": "NJ",
      "keeper": true
    },
    {
      "name": "Jakob Chychrun",
      "pos": "D",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Zeev Buium",
      "pos": "D",
      "nhl": "VAN",
      "keeper": true
    },
    {
      "name": "Jack Eichel",
      "pos": "C",
      "nhl": "VGK",
      "keeper": true
    },
    {
      "name": "Zach Werenski",
      "pos": "D",
      "nhl": "CBJ",
      "keeper": true
    },
    {
      "name": "Connor McDavid",
      "pos": "C",
      "nhl": "EDM",
      "keeper": true
    }
  ],
  "Top Pro...": [
    {
      "name": "Artemi Panarin",
      "pos": "LW",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Travis Konecny",
      "pos": "LW",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Alex Tuch",
      "pos": "LW",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Bryan Rust",
      "pos": "RW",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "John Gibson",
      "pos": "G",
      "nhl": "DET",
      "keeper": false
    },
    {
      "name": "Brock Nelson",
      "pos": "C",
      "nhl": "COL",
      "keeper": false
    },
    {
      "name": "Jake Allen",
      "pos": "G",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Owen Tippett",
      "pos": "LW",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Darnell Nurse",
      "pos": "D",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Anton Forsberg",
      "pos": "G",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Brad Marchand",
      "pos": "LW",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "Tomas Hertl",
      "pos": "C",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Jared McCann",
      "pos": "C",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Lian Bichsel",
      "pos": "D",
      "nhl": "DAL",
      "keeper": true
    },
    {
      "name": "Luke Hughes",
      "pos": "D",
      "nhl": "NJ",
      "keeper": true
    },
    {
      "name": "Victor Hedman",
      "pos": "D",
      "nhl": "TB",
      "keeper": true
    },
    {
      "name": "Lucas Raymond",
      "pos": "RW",
      "nhl": "DET",
      "keeper": true
    },
    {
      "name": "William Nylander",
      "pos": "C",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Tim St\u00fctzle",
      "pos": "C",
      "nhl": "OTT",
      "keeper": true
    },
    {
      "name": "Evan Bouchard",
      "pos": "D",
      "nhl": "EDM",
      "keeper": true
    },
    {
      "name": "Sidney Crosby",
      "pos": "C",
      "nhl": "PIT",
      "keeper": true
    }
  ],
  "Mighty...": [
    {
      "name": "Sergei Bobrovsky",
      "pos": "G",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Morgan Geekie",
      "pos": "C",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Brock Faber",
      "pos": "D",
      "nhl": "MIN",
      "keeper": false
    },
    {
      "name": "Anthony Stolarz",
      "pos": "G",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Mattias Samuelsson",
      "pos": "D",
      "nhl": "BUF",
      "keeper": false
    },
    {
      "name": "Jean-Gabriel Pageau",
      "pos": "C",
      "nhl": "NYI",
      "keeper": false
    },
    {
      "name": "Rasmus Andersson",
      "pos": "D",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Tyler Bertuzzi",
      "pos": "LW",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Bobby McMann",
      "pos": "LW",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Pavel Mintyukov",
      "pos": "D",
      "nhl": "ANA",
      "keeper": false
    },
    {
      "name": "Aliaksei Protas",
      "pos": "LW",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Pavel Zacha",
      "pos": "C",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Mason McTavish",
      "pos": "C",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Connor Hellebuyck",
      "pos": "G",
      "nhl": "WPG",
      "keeper": true
    },
    {
      "name": "Roman Josi",
      "pos": "D",
      "nhl": "NSH",
      "keeper": true
    },
    {
      "name": "John Tavares",
      "pos": "C",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Sam Reinhart",
      "pos": "RW",
      "nhl": "FLA",
      "keeper": true
    },
    {
      "name": "Beckett Sennecke",
      "pos": "RW",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Mark Scheifele",
      "pos": "C",
      "nhl": "WPG",
      "keeper": true
    },
    {
      "name": "Lane Hutson",
      "pos": "D",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Jason Robertson",
      "pos": "LW",
      "nhl": "DAL",
      "keeper": true
    }
  ],
  "Arkham...": [
    {
      "name": "Adrian Kempe",
      "pos": "RW",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Erik Karlsson",
      "pos": "D",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Lukas Dostal",
      "pos": "G",
      "nhl": "ANA",
      "keeper": false
    },
    {
      "name": "Logan Stankoven",
      "pos": "C",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Mark Stone",
      "pos": "RW",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Spencer Knight",
      "pos": "G",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Dylan Cozens",
      "pos": "C",
      "nhl": "OTT",
      "keeper": false
    },
    {
      "name": "Vince Dunn",
      "pos": "D",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Joey Daccord",
      "pos": "G",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "William Eklund",
      "pos": "LW",
      "nhl": "OTT",
      "keeper": false
    },
    {
      "name": "Simon Nemec",
      "pos": "D",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Mason Marchment",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Matt Duchene",
      "pos": "C",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Luke Evangelista",
      "pos": "LW",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Noah Hanifin",
      "pos": "D",
      "nhl": "VGK",
      "keeper": true
    },
    {
      "name": "Nikita Zadorov",
      "pos": "D",
      "nhl": "BOS",
      "keeper": true
    },
    {
      "name": "Artturi Lehkonen",
      "pos": "LW",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Mikael Granlund",
      "pos": "C",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Morgan Rielly",
      "pos": "D",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Blake Coleman",
      "pos": "C",
      "nhl": "MIN",
      "keeper": true
    },
    {
      "name": "Viktor Arvidsson",
      "pos": "RW",
      "nhl": "DET",
      "keeper": true
    }
  ],
  "JRoc's D...": [
    {
      "name": "Gavin McKenna",
      "pos": "C",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "John Carlson",
      "pos": "D",
      "nhl": "TB",
      "keeper": false
    },
    {
      "name": "Dylan Holloway",
      "pos": "RW",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Zach Hyman",
      "pos": "LW",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Brandt Clarke",
      "pos": "D",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Gabe Perreault",
      "pos": "RW",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Joel Hofer",
      "pos": "G",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Mathew Barzal",
      "pos": "C",
      "nhl": "NYI",
      "keeper": false
    },
    {
      "name": "Gabriel Vilardi",
      "pos": "C",
      "nhl": "WPG",
      "keeper": false
    },
    {
      "name": "Darcy Kuemper",
      "pos": "G",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Evgeni Malkin",
      "pos": "C",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Mattias Ekholm",
      "pos": "D",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Will Cuylle",
      "pos": "LW",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Igor Chernyshov",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Mike Matheson",
      "pos": "D",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Gabriel Landeskog",
      "pos": "LW",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Stuart Skinner",
      "pos": "G",
      "nhl": "WPG",
      "keeper": true
    },
    {
      "name": "Jeremy Lauzon",
      "pos": "D",
      "nhl": "VGK",
      "keeper": true
    },
    {
      "name": "Matt Savoie",
      "pos": "C",
      "nhl": "EDM",
      "keeper": true
    },
    {
      "name": "Pavel Buchnevich",
      "pos": "RW",
      "nhl": "STL",
      "keeper": true
    },
    {
      "name": "Nicholas Robertson",
      "pos": "RW",
      "nhl": "PIT",
      "keeper": true
    }
  ],
  "UmZy's...": [
    {
      "name": "Brayden Point",
      "pos": "C",
      "nhl": "TB",
      "keeper": false
    },
    {
      "name": "Jacob Markstrom",
      "pos": "G",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "Ivar Stenberg",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Charlie McAvoy",
      "pos": "D",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Shayne Gostisbehere",
      "pos": "D",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Ukko-Pekka Luukkonen",
      "pos": "G",
      "nhl": "BUF",
      "keeper": false
    },
    {
      "name": "Yaroslav Askarov",
      "pos": "G",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Seth Jones",
      "pos": "D",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "Michael Misa",
      "pos": "C",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Patrick Kane",
      "pos": "RW",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Carter Verhaeghe",
      "pos": "LW",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "Juraj Slafkovsky",
      "pos": "LW",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Jimmy Snuggerud",
      "pos": "RW",
      "nhl": "STL",
      "keeper": true
    },
    {
      "name": "Dylan Larkin",
      "pos": "C",
      "nhl": "DET",
      "keeper": true
    },
    {
      "name": "Jake Guentzel",
      "pos": "LW",
      "nhl": "TB",
      "keeper": true
    },
    {
      "name": "Will Smith",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": true
    },
    {
      "name": "Matvei Michkov",
      "pos": "LW",
      "nhl": "PHI",
      "keeper": true
    },
    {
      "name": "Leon Draisaitl",
      "pos": "C",
      "nhl": "EDM",
      "keeper": true
    },
    {
      "name": "Matthew Tkachuk",
      "pos": "LW",
      "nhl": "FLA",
      "keeper": true
    },
    {
      "name": "Auston Matthews",
      "pos": "C",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Cale Makar",
      "pos": "D",
      "nhl": "COL",
      "keeper": true
    }
  ],
  "Charlest...": [
    {
      "name": "Kirill Marchenko",
      "pos": "RW",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "Jakub Dobes",
      "pos": "G",
      "nhl": "MTL",
      "keeper": false
    },
    {
      "name": "Josh Morrissey",
      "pos": "D",
      "nhl": "WPG",
      "keeper": false
    },
    {
      "name": "James Hagens",
      "pos": "C",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Juuse Saros",
      "pos": "G",
      "nhl": "NSH",
      "keeper": false
    },
    {
      "name": "Rickard Rakell",
      "pos": "C",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Thomas Harley",
      "pos": "D",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Roman Kantserov",
      "pos": "RW",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Ryan Leonard",
      "pos": "RW",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Devon Toews",
      "pos": "D",
      "nhl": "COL",
      "keeper": false
    },
    {
      "name": "Simon Edvinsson",
      "pos": "D",
      "nhl": "DET",
      "keeper": false
    },
    {
      "name": "Zach Benson",
      "pos": "LW",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Denton Mateychuk",
      "pos": "D",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "Lawson Crouse",
      "pos": "LW",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Connor Bedard",
      "pos": "C",
      "nhl": "CHI",
      "keeper": true
    },
    {
      "name": "Jeremy Swayman",
      "pos": "G",
      "nhl": "BOS",
      "keeper": true
    },
    {
      "name": "Leo Carlsson",
      "pos": "C",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Brandon Hagel",
      "pos": "LW",
      "nhl": "TB",
      "keeper": true
    },
    {
      "name": "Sebastian Aho",
      "pos": "C",
      "nhl": "CAR",
      "keeper": true
    },
    {
      "name": "Nick Suzuki",
      "pos": "C",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Wyatt Johnston",
      "pos": "C",
      "nhl": "DAL",
      "keeper": true
    }
  ],
  "THE GO...": [
    {
      "name": "Robert Thomas",
      "pos": "C",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Roope Hintz",
      "pos": "C",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Mikhail Sergachev",
      "pos": "D",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Kiefer Sherwood",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Yakov Trenin",
      "pos": "C",
      "nhl": "MIN",
      "keeper": false
    },
    {
      "name": "Brandon Montour",
      "pos": "D",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Dougie Hamilton",
      "pos": "D",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Jack Roslovic",
      "pos": "C",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Filip Gustavsson",
      "pos": "G",
      "nhl": "MIN",
      "keeper": false
    },
    {
      "name": "Thomas Chabot",
      "pos": "D",
      "nhl": "OTT",
      "keeper": false
    },
    {
      "name": "Justin Faulk",
      "pos": "D",
      "nhl": "DET",
      "keeper": false
    },
    {
      "name": "Sam Rinzel",
      "pos": "D",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Valeri Nichushkin",
      "pos": "LW",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "Nick Paul",
      "pos": "C",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Drake Batherson",
      "pos": "LW",
      "nhl": "OTT",
      "keeper": true
    },
    {
      "name": "Scott Wedgewood",
      "pos": "G",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Kirill Kaprizov",
      "pos": "LW",
      "nhl": "MIN",
      "keeper": true
    },
    {
      "name": "Martin Necas",
      "pos": "RW",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Jesper Wallstedt",
      "pos": "G",
      "nhl": "MIN",
      "keeper": true
    },
    {
      "name": "Andrei Vasilevskiy",
      "pos": "G",
      "nhl": "TB",
      "keeper": true
    },
    {
      "name": "David Pastrnak",
      "pos": "RW",
      "nhl": "BOS",
      "keeper": true
    }
  ],
  "Mother...": [
    {
      "name": "Adam Fantilli",
      "pos": "C",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "MacKenzie Blackwood",
      "pos": "G",
      "nhl": "COL",
      "keeper": false
    },
    {
      "name": "Alex Ovechkin",
      "pos": "LW",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "MacKenzie Weegar",
      "pos": "D",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Nikolaj Ehlers",
      "pos": "LW",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Dan Vladar",
      "pos": "G",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Jacob Trouba",
      "pos": "D",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Joel Eriksson Ek",
      "pos": "C",
      "nhl": "MIN",
      "keeper": false
    },
    {
      "name": "Travis Sanheim",
      "pos": "D",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Nazem Kadri",
      "pos": "C",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "K'Andre Miller",
      "pos": "D",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Jonathan Marchessault",
      "pos": "LW",
      "nhl": "NSH",
      "keeper": false
    },
    {
      "name": "Ilya Protas",
      "pos": "LW",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Brandon Bussi",
      "pos": "G",
      "nhl": "CAR",
      "keeper": true
    },
    {
      "name": "Adam Fox",
      "pos": "D",
      "nhl": "NYR",
      "keeper": true
    },
    {
      "name": "Nico Hischier",
      "pos": "C",
      "nhl": "NJ",
      "keeper": true
    },
    {
      "name": "Alex DeBrincat",
      "pos": "LW",
      "nhl": "DET",
      "keeper": true
    },
    {
      "name": "Clayton Keller",
      "pos": "LW",
      "nhl": "UTA",
      "keeper": true
    },
    {
      "name": "Cole Caufield",
      "pos": "LW",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Aleksander Barkov",
      "pos": "C",
      "nhl": "FLA",
      "keeper": true
    },
    {
      "name": "Nathan MacKinnon",
      "pos": "C",
      "nhl": "COL",
      "keeper": true
    }
  ],
  "Mark's T...": [
    {
      "name": "Matthew Knies",
      "pos": "LW",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Logan Cooley",
      "pos": "C",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Anton Frondell",
      "pos": "C",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Shea Theodore",
      "pos": "D",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Bo Horvat",
      "pos": "C",
      "nhl": "NYI",
      "keeper": false
    },
    {
      "name": "Trevor Zegras",
      "pos": "C",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Yegor Chinakhov",
      "pos": "LW",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Mats Zuccarello",
      "pos": "RW",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Philip Broberg",
      "pos": "D",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Ivan Demidov",
      "pos": "RW",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Dylan Guenther",
      "pos": "LW",
      "nhl": "UTA",
      "keeper": true
    },
    {
      "name": "Jackson LaCombe",
      "pos": "D",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Tage Thompson",
      "pos": "C",
      "nhl": "BUF",
      "keeper": true
    },
    {
      "name": "Zayne Parekh",
      "pos": "D",
      "nhl": "CGY",
      "keeper": true
    },
    {
      "name": "Brady Tkachuk",
      "pos": "C",
      "nhl": "FLA",
      "keeper": true
    },
    {
      "name": "Jacob Fowler",
      "pos": "G",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Ilya Sorokin",
      "pos": "G",
      "nhl": "NYI",
      "keeper": true
    },
    {
      "name": "Igor Shesterkin",
      "pos": "G",
      "nhl": "NYR",
      "keeper": true
    },
    {
      "name": "Cole Hutson",
      "pos": "D",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Nikita Kucherov",
      "pos": "RW",
      "nhl": "TB",
      "keeper": true
    },
    {
      "name": "Macklin Celebrini",
      "pos": "C",
      "nhl": "SJ",
      "keeper": true
    }
  ],
  "The Dark Seider (You)": [
    {
      "name": "Mika Zibanejad",
      "pos": "C",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Jet Greaves",
      "pos": "G",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "Linus Ullmark",
      "pos": "G",
      "nhl": "OTT",
      "keeper": false
    },
    {
      "name": "Seth Jarvis",
      "pos": "LW",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Bowen Byram",
      "pos": "D",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Elias Pettersson",
      "pos": "C",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "JJ Peterka",
      "pos": "LW",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Jordan Kyrou",
      "pos": "RW",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Danila Yurov",
      "pos": "LW",
      "nhl": "MIN",
      "keeper": false
    },
    {
      "name": "Alex Laferriere",
      "pos": "RW",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Frank Nazar",
      "pos": "C",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Moritz Seider",
      "pos": "D",
      "nhl": "DET",
      "keeper": true
    },
    {
      "name": "Matthew Schaefer",
      "pos": "D",
      "nhl": "NYI",
      "keeper": true
    },
    {
      "name": "Logan Thompson",
      "pos": "G",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Alex Nikishin",
      "pos": "D",
      "nhl": "CAR",
      "keeper": true
    },
    {
      "name": "Darren Raddysh",
      "pos": "D",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Porter Martone",
      "pos": "RW",
      "nhl": "PHI",
      "keeper": true
    },
    {
      "name": "Mitch Marner",
      "pos": "RW",
      "nhl": "VGK",
      "keeper": true
    },
    {
      "name": "Rasmus Dahlin",
      "pos": "D",
      "nhl": "BUF",
      "keeper": true
    },
    {
      "name": "Cutter Gauthier",
      "pos": "LW",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Matt Boldy",
      "pos": "LW",
      "nhl": "MIN",
      "keeper": true
    }
  ]
};