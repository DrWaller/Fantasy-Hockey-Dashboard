// Snapshot of all 12 league rosters, re-imported from Yahoo roster screenshots
// taken Wed Oct 14, 2026 (includes IR+ and NA slots; all of them count as
// rostered). STATIC DATA — accurate as of that day, not live. Re-import
// (replace this file) after trades or notable waiver moves, until the Yahoo
// API sync lands. Team keys are unchanged so matchupSchedule.ts keeps working.

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
      "name": "Sam Bennett",
      "pos": "C",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "Dylan Strome",
      "pos": "C",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Alexis Lafrenière",
      "pos": "LW",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Jack Hughes",
      "pos": "C",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Jackson Blake",
      "pos": "RW",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Tom Wilson",
      "pos": "RW",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Ryan O'Reilly",
      "pos": "C",
      "nhl": "NSH",
      "keeper": false
    },
    {
      "name": "Timo Meier",
      "pos": "LW",
      "nhl": "NJ",
      "keeper": true
    },
    {
      "name": "Miro Heiskanen",
      "pos": "D",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Filip Hronek",
      "pos": "D",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Quinn Hughes",
      "pos": "D",
      "nhl": "MIN",
      "keeper": true
    },
    {
      "name": "Sean Walker",
      "pos": "D",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Nick Schmaltz",
      "pos": "C",
      "nhl": "UTA",
      "keeper": true
    },
    {
      "name": "J.T. Miller",
      "pos": "C",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Brock Boeser",
      "pos": "LW",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Easton Cowan",
      "pos": "LW",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Steven Stamkos",
      "pos": "C",
      "nhl": "NSH",
      "keeper": false
    },
    {
      "name": "Kyle Connor",
      "pos": "LW",
      "nhl": "WPG",
      "keeper": true
    },
    {
      "name": "Jake Sanderson",
      "pos": "D",
      "nhl": "OTT",
      "keeper": true
    },
    {
      "name": "Carter Hart",
      "pos": "G",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Dustin Wolf",
      "pos": "G",
      "nhl": "CGY",
      "keeper": false
    },
    {
      "name": "Jake Oettinger",
      "pos": "G",
      "nhl": "DAL",
      "keeper": true
    },
    {
      "name": "Frederik Andersen",
      "pos": "G",
      "nhl": "EDM",
      "keeper": false
    }
  ],
  "Ice Drop": [
    {
      "name": "Connor McDavid",
      "pos": "C",
      "nhl": "EDM",
      "keeper": true
    },
    {
      "name": "Jack Eichel",
      "pos": "C",
      "nhl": "VGK",
      "keeper": true
    },
    {
      "name": "Andrei Svechnikov",
      "pos": "LW",
      "nhl": "CAR",
      "keeper": true
    },
    {
      "name": "Mikko Rantanen",
      "pos": "LW",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Jesper Bratt",
      "pos": "LW",
      "nhl": "NJ",
      "keeper": true
    },
    {
      "name": "Pavel Dorofeyev",
      "pos": "LW",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Anthony Cirelli",
      "pos": "C",
      "nhl": "TB",
      "keeper": false
    },
    {
      "name": "Filip Forsberg",
      "pos": "LW",
      "nhl": "NSH",
      "keeper": true
    },
    {
      "name": "Noah Dobson",
      "pos": "D",
      "nhl": "MTL",
      "keeper": false
    },
    {
      "name": "Jakob Chychrun",
      "pos": "D",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Zach Werenski",
      "pos": "D",
      "nhl": "CBJ",
      "keeper": true
    },
    {
      "name": "Mattias Ekholm",
      "pos": "D",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Vincent Trocheck",
      "pos": "C",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Tyson Foerster",
      "pos": "LW",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Claude Giroux",
      "pos": "C",
      "nhl": "OTT",
      "keeper": false
    },
    {
      "name": "Josh Doan",
      "pos": "RW",
      "nhl": "BUF",
      "keeper": false
    },
    {
      "name": "Quinton Byfield",
      "pos": "C",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Ryan Nugent-Hopkins",
      "pos": "C",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Pyotr Kochetkov",
      "pos": "G",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Sergei Murashov",
      "pos": "G",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Devon Levi",
      "pos": "G",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Karel Vejmelka",
      "pos": "G",
      "nhl": "UTA",
      "keeper": false
    }
  ],
  "Top Pro...": [
    {
      "name": "Brock Nelson",
      "pos": "C",
      "nhl": "COL",
      "keeper": false
    },
    {
      "name": "Jared McCann",
      "pos": "C",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Tomas Hertl",
      "pos": "C",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Tim Stützle",
      "pos": "C",
      "nhl": "OTT",
      "keeper": true
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
      "name": "Owen Tippett",
      "pos": "LW",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Artemi Panarin",
      "pos": "LW",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Darnell Nurse",
      "pos": "D",
      "nhl": "SJ",
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
      "name": "Travis Konecny",
      "pos": "LW",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Brad Marchand",
      "pos": "LW",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "John Gibson",
      "pos": "G",
      "nhl": "DET",
      "keeper": false
    },
    {
      "name": "Leevi Merilainen",
      "pos": "G",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Nico Daws",
      "pos": "G",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Jake Allen",
      "pos": "G",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Anton Forsberg",
      "pos": "G",
      "nhl": "LA",
      "keeper": false
    }
  ],
  "Mighty...": [
    {
      "name": "Morgan Geekie",
      "pos": "C",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Erik Haula",
      "pos": "C",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Aliaksei Protas",
      "pos": "LW",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Jason Robertson",
      "pos": "LW",
      "nhl": "DAL",
      "keeper": true
    },
    {
      "name": "Tyler Bertuzzi",
      "pos": "LW",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Sam Reinhart",
      "pos": "C",
      "nhl": "FLA",
      "keeper": true
    },
    {
      "name": "Mason McTavish",
      "pos": "C",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Beckett Sennecke",
      "pos": "LW",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Roman Josi",
      "pos": "D",
      "nhl": "NSH",
      "keeper": true
    },
    {
      "name": "Pavel Mintyukov",
      "pos": "D",
      "nhl": "ANA",
      "keeper": false
    },
    {
      "name": "Mattias Samuelsson",
      "pos": "D",
      "nhl": "BUF",
      "keeper": false
    },
    {
      "name": "Lane Hutson",
      "pos": "D",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Jean-Gabriel Pageau",
      "pos": "C",
      "nhl": "NYI",
      "keeper": false
    },
    {
      "name": "Brayden Schenn",
      "pos": "C",
      "nhl": "NYI",
      "keeper": false
    },
    {
      "name": "Pavel Zacha",
      "pos": "C",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Rasmus Andersson",
      "pos": "D",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Mark Scheifele",
      "pos": "C",
      "nhl": "WPG",
      "keeper": true
    },
    {
      "name": "Bobby McMann",
      "pos": "LW",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Brock Faber",
      "pos": "D",
      "nhl": "MIN",
      "keeper": false
    },
    {
      "name": "John Tavares",
      "pos": "C",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Sergei Bobrovsky",
      "pos": "G",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Anthony Stolarz",
      "pos": "G",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Jordan Binnington",
      "pos": "G",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Connor Hellebuyck",
      "pos": "G",
      "nhl": "WPG",
      "keeper": true
    }
  ],
  "Arkham...": [
    {
      "name": "Logan Stankoven",
      "pos": "C",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Dylan Cozens",
      "pos": "C",
      "nhl": "OTT",
      "keeper": false
    },
    {
      "name": "Viktor Arvidsson",
      "pos": "LW",
      "nhl": "DET",
      "keeper": true
    },
    {
      "name": "Paul Cotter",
      "pos": "C",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Adrian Kempe",
      "pos": "RW",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Artturi Lehkonen",
      "pos": "LW",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Mark Stone",
      "pos": "RW",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Fraser Minten",
      "pos": "C",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Erik Karlsson",
      "pos": "D",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Nikita Zadorov",
      "pos": "D",
      "nhl": "BOS",
      "keeper": true
    },
    {
      "name": "Morgan Rielly",
      "pos": "D",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Vince Dunn",
      "pos": "D",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Mikael Granlund",
      "pos": "C",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Kaapo Kakko",
      "pos": "RW",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Blake Coleman",
      "pos": "C",
      "nhl": "MIN",
      "keeper": true
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
      "name": "Mason Marchment",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Pierre-Luc Dubois",
      "pos": "C",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "William Eklund",
      "pos": "LW",
      "nhl": "OTT",
      "keeper": false
    },
    {
      "name": "Matt Duchene",
      "pos": "C",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Lukas Dostal",
      "pos": "G",
      "nhl": "ANA",
      "keeper": false
    },
    {
      "name": "Joey Daccord",
      "pos": "G",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Joseph Woll",
      "pos": "G",
      "nhl": "PHI",
      "keeper": false
    }
  ],
  "JRoc's D...": [
    {
      "name": "Dylan Holloway",
      "pos": "C",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Evgeni Malkin",
      "pos": "C",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Gabriel Landeskog",
      "pos": "LW",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Nicholas Robertson",
      "pos": "RW",
      "nhl": "PIT",
      "keeper": true
    },
    {
      "name": "Pavel Buchnevich",
      "pos": "C",
      "nhl": "STL",
      "keeper": true
    },
    {
      "name": "Will Cuylle",
      "pos": "LW",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Gabe Perreault",
      "pos": "LW",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Jeremy Lauzon",
      "pos": "D",
      "nhl": "VGK",
      "keeper": true
    },
    {
      "name": "John Carlson",
      "pos": "D",
      "nhl": "TB",
      "keeper": false
    },
    {
      "name": "Brandt Clarke",
      "pos": "D",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Josh Manson",
      "pos": "D",
      "nhl": "COL",
      "keeper": false
    },
    {
      "name": "Kasperi Kapanen",
      "pos": "RW",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Luca Cagnoni",
      "pos": "D",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Gavin McKenna",
      "pos": "LW",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Igor Chernyshov",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Gabriel Vilardi",
      "pos": "C",
      "nhl": "WPG",
      "keeper": false
    },
    {
      "name": "Mathew Barzal",
      "pos": "C",
      "nhl": "NYI",
      "keeper": false
    },
    {
      "name": "Matt Savoie",
      "pos": "C",
      "nhl": "EDM",
      "keeper": true
    },
    {
      "name": "Zach Hyman",
      "pos": "LW",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Roger McQueen",
      "pos": "C",
      "nhl": "ANA",
      "keeper": false
    },
    {
      "name": "Darcy Kuemper",
      "pos": "G",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Tristan Jarry",
      "pos": "G",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Arturs Silovs",
      "pos": "G",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Joel Hofer",
      "pos": "G",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Stuart Skinner",
      "pos": "G",
      "nhl": "WPG",
      "keeper": true
    }
  ],
  "UmZy's...": [
    {
      "name": "Auston Matthews",
      "pos": "C",
      "nhl": "TOR",
      "keeper": true
    },
    {
      "name": "Brayden Point",
      "pos": "C",
      "nhl": "TB",
      "keeper": false
    },
    {
      "name": "Ivan Barbashev",
      "pos": "LW",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Carter Verhaeghe",
      "pos": "LW",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "Matvei Michkov",
      "pos": "LW",
      "nhl": "PHI",
      "keeper": true
    },
    {
      "name": "Will Smith",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": true
    },
    {
      "name": "Juraj Slafkovsky",
      "pos": "LW",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Matthew Tkachuk",
      "pos": "LW",
      "nhl": "FLA",
      "keeper": true
    },
    {
      "name": "Shayne Gostisbehere",
      "pos": "D",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Seth Jones",
      "pos": "D",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "Charlie McAvoy",
      "pos": "D",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Cale Makar",
      "pos": "D",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Dylan Larkin",
      "pos": "C",
      "nhl": "DET",
      "keeper": true
    },
    {
      "name": "Leon Draisaitl",
      "pos": "C",
      "nhl": "EDM",
      "keeper": true
    },
    {
      "name": "Jake Guentzel",
      "pos": "LW",
      "nhl": "TB",
      "keeper": true
    },
    {
      "name": "Jimmy Snuggerud",
      "pos": "RW",
      "nhl": "STL",
      "keeper": true
    },
    {
      "name": "Ivar Stenberg",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Michael Misa",
      "pos": "C",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Jacob Markstrom",
      "pos": "G",
      "nhl": "FLA",
      "keeper": false
    },
    {
      "name": "Yaroslav Askarov",
      "pos": "G",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Ukko-Pekka Luukkonen",
      "pos": "G",
      "nhl": "BUF",
      "keeper": false
    }
  ],
  "Charlest...": [
    {
      "name": "Leo Carlsson",
      "pos": "C",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Tyler Seguin",
      "pos": "C",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Kirill Marchenko",
      "pos": "LW",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Chris Kreider",
      "pos": "LW",
      "nhl": "MTL",
      "keeper": false
    },
    {
      "name": "Brandon Hagel",
      "pos": "LW",
      "nhl": "TB",
      "keeper": true
    },
    {
      "name": "Ryan Leonard",
      "pos": "RW",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Nick Suzuki",
      "pos": "C",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Connor Bedard",
      "pos": "C",
      "nhl": "CHI",
      "keeper": true
    },
    {
      "name": "Thomas Harley",
      "pos": "D",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Denton Mateychuk",
      "pos": "D",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "Devon Toews",
      "pos": "D",
      "nhl": "COL",
      "keeper": false
    },
    {
      "name": "Logan Stanley",
      "pos": "D",
      "nhl": "NYI",
      "keeper": false
    },
    {
      "name": "Sebastian Aho",
      "pos": "C",
      "nhl": "CAR",
      "keeper": true
    },
    {
      "name": "Rickard Rakell",
      "pos": "C",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Zach Benson",
      "pos": "LW",
      "nhl": "BUF",
      "keeper": false
    },
    {
      "name": "James Hagens",
      "pos": "C",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Lawson Crouse",
      "pos": "LW",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Wyatt Johnston",
      "pos": "C",
      "nhl": "DAL",
      "keeper": true
    },
    {
      "name": "Josh Morrissey",
      "pos": "D",
      "nhl": "WPG",
      "keeper": false
    },
    {
      "name": "Jakub Dobes",
      "pos": "G",
      "nhl": "MTL",
      "keeper": false
    },
    {
      "name": "Juuse Saros",
      "pos": "G",
      "nhl": "NSH",
      "keeper": false
    },
    {
      "name": "Jeremy Swayman",
      "pos": "G",
      "nhl": "BOS",
      "keeper": true
    },
    {
      "name": "Spencer Knight",
      "pos": "G",
      "nhl": "CHI",
      "keeper": false
    }
  ],
  "THE GO...": [
    {
      "name": "Jack Roslovic",
      "pos": "C",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "Yakov Trenin",
      "pos": "C",
      "nhl": "MIN",
      "keeper": false
    },
    {
      "name": "Nick Paul",
      "pos": "C",
      "nhl": "TOR",
      "keeper": false
    },
    {
      "name": "David Pastrnak",
      "pos": "RW",
      "nhl": "BOS",
      "keeper": true
    },
    {
      "name": "Martin Necas",
      "pos": "RW",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Drake Batherson",
      "pos": "LW",
      "nhl": "OTT",
      "keeper": true
    },
    {
      "name": "Kirill Kaprizov",
      "pos": "LW",
      "nhl": "MIN",
      "keeper": true
    },
    {
      "name": "Mikhail Sergachev",
      "pos": "D",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Dougie Hamilton",
      "pos": "D",
      "nhl": "NJ",
      "keeper": false
    },
    {
      "name": "Brandon Montour",
      "pos": "D",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Kiefer Sherwood",
      "pos": "LW",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Robert Thomas",
      "pos": "C",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Vladislav Gavrikov",
      "pos": "D",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Valeri Nichushkin",
      "pos": "LW",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "Roope Hintz",
      "pos": "C",
      "nhl": "DAL",
      "keeper": false
    },
    {
      "name": "Jared Spurgeon",
      "pos": "D",
      "nhl": "MIN",
      "keeper": false
    },
    {
      "name": "Kevin Lankinen",
      "pos": "G",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Scott Wedgewood",
      "pos": "G",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Charlie Lindgren",
      "pos": "G",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Adin Hill",
      "pos": "G",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Andrei Vasilevskiy",
      "pos": "G",
      "nhl": "TB",
      "keeper": true
    },
    {
      "name": "Jesper Wallstedt",
      "pos": "G",
      "nhl": "MIN",
      "keeper": true
    },
    {
      "name": "Filip Gustavsson",
      "pos": "G",
      "nhl": "MIN",
      "keeper": false
    }
  ],
  "Mother...": [
    {
      "name": "Nazem Kadri",
      "pos": "C",
      "nhl": "COL",
      "keeper": false
    },
    {
      "name": "Nathan MacKinnon",
      "pos": "C",
      "nhl": "COL",
      "keeper": true
    },
    {
      "name": "Jonathan Marchessault",
      "pos": "LW",
      "nhl": "NSH",
      "keeper": false
    },
    {
      "name": "Ilya Protas",
      "pos": "C",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Cole Caufield",
      "pos": "LW",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Alex Ovechkin",
      "pos": "LW",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Nikolaj Ehlers",
      "pos": "LW",
      "nhl": "CAR",
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
      "name": "K'Andre Miller",
      "pos": "D",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Adam Fox",
      "pos": "D",
      "nhl": "NYR",
      "keeper": true
    },
    {
      "name": "Thomas Chabot",
      "pos": "D",
      "nhl": "OTT",
      "keeper": false
    },
    {
      "name": "Jacob Trouba",
      "pos": "D",
      "nhl": "SJ",
      "keeper": false
    },
    {
      "name": "Adam Fantilli",
      "pos": "C",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "Nico Hischier",
      "pos": "C",
      "nhl": "NJ",
      "keeper": true
    },
    {
      "name": "MacKenzie Weegar",
      "pos": "D",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Clayton Keller",
      "pos": "LW",
      "nhl": "UTA",
      "keeper": true
    },
    {
      "name": "Alex DeBrincat",
      "pos": "LW",
      "nhl": "DET",
      "keeper": true
    },
    {
      "name": "Aleksander Barkov",
      "pos": "C",
      "nhl": "FLA",
      "keeper": true
    },
    {
      "name": "MacKenzie Blackwood",
      "pos": "G",
      "nhl": "COL",
      "keeper": false
    },
    {
      "name": "Dan Vladar",
      "pos": "G",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Brandon Bussi",
      "pos": "G",
      "nhl": "CAR",
      "keeper": true
    }
  ],
  "Mark's T...": [
    {
      "name": "Trevor Zegras",
      "pos": "C",
      "nhl": "PHI",
      "keeper": false
    },
    {
      "name": "Macklin Celebrini",
      "pos": "C",
      "nhl": "SJ",
      "keeper": true
    },
    {
      "name": "Dylan Guenther",
      "pos": "LW",
      "nhl": "UTA",
      "keeper": true
    },
    {
      "name": "Boone Jenner",
      "pos": "C",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Jordan Eberle",
      "pos": "RW",
      "nhl": "SEA",
      "keeper": false
    },
    {
      "name": "Tage Thompson",
      "pos": "C",
      "nhl": "BUF",
      "keeper": true
    },
    {
      "name": "Logan Cooley",
      "pos": "C",
      "nhl": "UTA",
      "keeper": false
    },
    {
      "name": "Brady Tkachuk",
      "pos": "C",
      "nhl": "FLA",
      "keeper": true
    },
    {
      "name": "Zayne Parekh",
      "pos": "D",
      "nhl": "CGY",
      "keeper": true
    },
    {
      "name": "Philip Broberg",
      "pos": "D",
      "nhl": "STL",
      "keeper": false
    },
    {
      "name": "Shea Theodore",
      "pos": "D",
      "nhl": "VGK",
      "keeper": false
    },
    {
      "name": "Cole Hutson",
      "pos": "D",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Bo Horvat",
      "pos": "C",
      "nhl": "NYI",
      "keeper": false
    },
    {
      "name": "Nikita Kucherov",
      "pos": "RW",
      "nhl": "TB",
      "keeper": true
    },
    {
      "name": "Matthew Knies",
      "pos": "LW",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "Jackson LaCombe",
      "pos": "D",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Anton Frondell",
      "pos": "C",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Yegor Chinakhov",
      "pos": "LW",
      "nhl": "PIT",
      "keeper": false
    },
    {
      "name": "Ivan Demidov",
      "pos": "RW",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Taylor Hall",
      "pos": "LW",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Ilya Sorokin",
      "pos": "G",
      "nhl": "NYI",
      "keeper": true
    },
    {
      "name": "Jacob Fowler",
      "pos": "G",
      "nhl": "MTL",
      "keeper": true
    },
    {
      "name": "Dylan Garand",
      "pos": "G",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Igor Shesterkin",
      "pos": "G",
      "nhl": "NYR",
      "keeper": true
    }
  ],
  "The Dark Seider (You)": [
    {
      "name": "Elias Pettersson",
      "pos": "C",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Mika Zibanejad",
      "pos": "C",
      "nhl": "NYR",
      "keeper": false
    },
    {
      "name": "Matt Boldy",
      "pos": "LW",
      "nhl": "MIN",
      "keeper": true
    },
    {
      "name": "Jake DeBrusk",
      "pos": "LW",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Jack Quinn",
      "pos": "RW",
      "nhl": "BUF",
      "keeper": false
    },
    {
      "name": "Jordan Kyrou",
      "pos": "RW",
      "nhl": "WSH",
      "keeper": false
    },
    {
      "name": "Marco Rossi",
      "pos": "C",
      "nhl": "VAN",
      "keeper": false
    },
    {
      "name": "Vasily Podkolzin",
      "pos": "LW",
      "nhl": "EDM",
      "keeper": false
    },
    {
      "name": "Darren Raddysh",
      "pos": "D",
      "nhl": "TOR",
      "keeper": true
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
      "name": "Owen Power",
      "pos": "D",
      "nhl": "BUF",
      "keeper": false
    },
    {
      "name": "Alex Laferriere",
      "pos": "C",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Mitch Marner",
      "pos": "C",
      "nhl": "VGK",
      "keeper": true
    },
    {
      "name": "Bowen Byram",
      "pos": "D",
      "nhl": "CHI",
      "keeper": false
    },
    {
      "name": "Porter Martone",
      "pos": "RW",
      "nhl": "PHI",
      "keeper": true
    },
    {
      "name": "JJ Peterka",
      "pos": "LW",
      "nhl": "BOS",
      "keeper": false
    },
    {
      "name": "Cole Perfetti",
      "pos": "LW",
      "nhl": "WPG",
      "keeper": false
    },
    {
      "name": "Rasmus Dahlin",
      "pos": "D",
      "nhl": "BUF",
      "keeper": true
    },
    {
      "name": "Cutter Gauthier",
      "pos": "C",
      "nhl": "ANA",
      "keeper": true
    },
    {
      "name": "Kevin Fiala",
      "pos": "LW",
      "nhl": "LA",
      "keeper": false
    },
    {
      "name": "Seth Jarvis",
      "pos": "LW",
      "nhl": "CAR",
      "keeper": false
    },
    {
      "name": "Alex Nikishin",
      "pos": "D",
      "nhl": "CAR",
      "keeper": true
    },
    {
      "name": "Jet Greaves",
      "pos": "G",
      "nhl": "CBJ",
      "keeper": false
    },
    {
      "name": "Logan Thompson",
      "pos": "G",
      "nhl": "WSH",
      "keeper": true
    },
    {
      "name": "Linus Ullmark",
      "pos": "G",
      "nhl": "OTT",
      "keeper": false
    }
  ]
};
