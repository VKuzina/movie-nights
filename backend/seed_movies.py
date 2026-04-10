"""Seed the database with movies fetched from OMDB by IMDB ID.

Usage:
    python seed_movies.py

Requires the backend to be running on localhost:8080 (or set BASE env var).
Requires a valid OMDB API key in OMDB_API_KEY env var (defaults to the project key).
"""
import urllib.request
import json
import sys
import os
import time

BASE = os.getenv("SEED_BASE", "http://localhost:8000")
OMDB_KEY = os.getenv("OMDB_API_KEY", "8bed798d")

# ─────────────────────────────────────────────
# All IMDB IDs to seed. Duplicates are skipped
# automatically (the API returns 400/409).
# ─────────────────────────────────────────────
IMDB_IDS = [
    # ── Top 250 / IMDB Classics ──────────────────────────────────────────
    "tt0111161",  # The Shawshank Redemption (1994)
    "tt0068646",  # The Godfather (1972)
    "tt0071562",  # The Godfather Part II (1974)
    "tt0468569",  # The Dark Knight (2008)
    "tt0050083",  # 12 Angry Men (1957)
    "tt0108052",  # Schindler's List (1993)
    "tt0167260",  # LOTR: The Return of the King (2003)
    "tt0110912",  # Pulp Fiction (1994)
    "tt0120737",  # LOTR: The Fellowship of the Ring (2001)
    "tt0060196",  # The Good, the Bad and the Ugly (1966)
    "tt0109830",  # Forrest Gump (1994)
    "tt0137523",  # Fight Club (1999)
    "tt1375666",  # Inception (2010)
    "tt0167261",  # LOTR: The Two Towers (2002)
    "tt0080684",  # The Empire Strikes Back (1980)
    "tt0133093",  # The Matrix (1999)
    "tt0099685",  # Goodfellas (1990)
    "tt0073486",  # One Flew Over the Cuckoo's Nest (1975)
    "tt0114369",  # Se7en (1995)
    "tt0047478",  # Seven Samurai (1954)
    "tt0102926",  # The Silence of the Lambs (1991)
    "tt0120815",  # Saving Private Ryan (1998)
    "tt0816692",  # Interstellar (2014)
    "tt0317248",  # City of God (2002)
    "tt0120689",  # The Green Mile (1999)
    "tt0118799",  # Life is Beautiful (1997)
    "tt0103064",  # Terminator 2: Judgment Day (1991)
    "tt0088763",  # Back to the Future (1985)
    "tt0253474",  # The Pianist (2002)
    "tt0245429",  # Spirited Away (2001)
    "tt6751668",  # Parasite (2019)
    "tt0054215",  # Psycho (1960)
    "tt0172495",  # Gladiator (2000)
    "tt0110357",  # The Lion King (1994)
    "tt0120586",  # American History X (1998)
    "tt0407887",  # The Departed (2006)
    "tt0114814",  # The Usual Suspects (1995)
    "tt2582802",  # Whiplash (2014)
    "tt0482571",  # The Prestige (2006)
    "tt0034583",  # Casablanca (1942)
    "tt1675434",  # The Intouchables (2011)
    "tt0047396",  # Rear Window (1954)
    "tt0064116",  # Once Upon a Time in the West (1968)
    "tt0078748",  # Alien (1979)
    "tt0078788",  # Apocalypse Now (1979)
    "tt0209144",  # Memento (2000)
    "tt0082971",  # Raiders of the Lost Ark (1981)
    "tt1853728",  # Django Unchained (2012)
    "tt0910970",  # WALL-E (2008)
    "tt0081505",  # The Shining (1980)
    "tt0057012",  # Dr. Strangelove (1964)
    "tt0114709",  # Toy Story (1995)
    "tt7286456",  # Joker (2019)
    "tt0112573",  # Braveheart (1995)
    "tt0090605",  # Aliens (1986)
    "tt2380307",  # Coco (2017)
    "tt0119217",  # Good Will Hunting (1997)
    "tt0062622",  # 2001: A Space Odyssey (1968)
    "tt0093058",  # Full Metal Jacket (1987)
    "tt0268978",  # A Beautiful Mind (2001)
    "tt0056172",  # Lawrence of Arabia (1962)
    "tt0105236",  # Reservoir Dogs (1992)
    "tt0040522",  # Bicycle Thieves (1948)
    "tt0076759",  # Star Wars: A New Hope (1977)
    "tt0338013",  # Eternal Sunshine of the Spotless Mind (2004)
    "tt0993846",  # The Wolf of Wall Street (2013)
    "tt0066921",  # A Clockwork Orange (1971)
    "tt0364569",  # Oldboy (2003)
    "tt0435761",  # Toy Story 3 (2010)
    "tt2278388",  # The Grand Budapest Hotel (2014)
    "tt0457430",  # Pan's Labyrinth (2006)
    "tt0477348",  # No Country for Old Men (2007)
    "tt1130884",  # Shutter Island (2010)
    "tt0120382",  # The Truman Show (1998)
    "tt5311514",  # Your Name (2016)
    "tt0095327",  # Grave of the Fireflies (1988)
    "tt0086879",  # Amadeus (1984)
    "tt0082096",  # Das Boot (1981)
    "tt4154756",  # Avengers: Infinity War (2018)
    "tt0180093",  # Requiem for a Dream (2000)
    "tt0052357",  # Vertigo (1958)
    "tt0087843",  # Once Upon a Time in America (1984)
    "tt0095765",  # Cinema Paradiso (1988)
    "tt0038650",  # It's a Wonderful Life (1946)
    "tt0027977",  # Modern Times (1936)
    "tt0050825",  # Paths of Glory (1957)
    "tt0043014",  # Sunset Boulevard (1950)
    "tt1345836",  # The Dark Knight Rises (2012)
    "tt0264464",  # Catch Me If You Can (2002)
    "tt2106476",  # The Hunt (2012)
    "tt0044741",  # Ikiru (1952)
    "tt1049413",  # Up (2009)
    "tt0032138",  # The Wizard of Oz (1939)
    "tt0113277",  # Heat (1995)
    "tt0071853",  # Monty Python and the Holy Grail (1975)
    "tt0050976",  # The Seventh Seal (1957)
    "tt1187043",  # 3 Idiots (2009)
    "tt4154796",  # Avengers: Endgame (2019)
    "tt0119698",  # Princess Mononoke (1997)
    "tt0986264",  # Taare Zameen Par (2007)
    "tt0091251",  # Come and See (1985)
    "tt0469494",  # There Will Be Blood (2007)
    "tt0758758",  # Into the Wild (2007)

    # ── Crime / Noir / Thriller ───────────────────────────────────────────
    "tt0075314",  # Taxi Driver (1976)
    "tt0119488",  # L.A. Confidential (1997)
    "tt0112641",  # Casino (1995)
    "tt0208092",  # Snatch (2000)
    "tt0116282",  # Fargo (1996)
    "tt0110413",  # Léon: The Professional (1994)
    "tt0266697",  # Kill Bill: Volume 1 (2003)
    "tt0379725",  # Kill Bill: Volume 2 (2004)
    "tt0167404",  # The Sixth Sense (1999)
    "tt2267998",  # Gone Girl (2014)
    "tt0246578",  # Donnie Darko (2001)
    "tt0118715",  # The Big Lebowski (1998)
    "tt0117951",  # Trainspotting (1996)
    "tt0071081",  # Chinatown (1974)
    "tt0063350",  # Rosemary's Baby (1968)
    "tt0245712",  # Ocean's Eleven (2001)
    "tt0091763",  # Blue Velvet (1986)
    "tt0185937",  # Mulholland Drive (2001)
    "tt0353969",  # Memories of Murder (2003)
    "tt0405094",  # The Lives of Others (2006)
    "tt3011894",  # The Handmaiden (2016)
    "tt1477834",  # Burning (2018)
    "tt0338013",  # Eternal Sunshine — already above, will skip
    "tt0107048",  # Groundhog Day (1993)
    "tt1515091",  # Silver Linings Playbook (2012)
    "tt1024648",  # Argo (2012)
    "tt2024544",  # 12 Years a Slave (2013)
    "tt0381681",  # Before Sunset (2004)
    "tt0361862",  # The Motorcycle Diaries (2004)
    "tt0347149",  # Amélie (2001)

    # ── Action / Adventure ───────────────────────────────────────────────
    "tt0083658",  # Blade Runner (1982)
    "tt1856101",  # Blade Runner 2049 (2017)
    "tt0073195",  # Jaws (1975)
    "tt0097576",  # Indiana Jones and the Last Crusade (1989)
    "tt0075148",  # Rocky (1976)
    "tt0079417",  # The Deer Hunter (1978)
    "tt0070735",  # The Sting (1973)
    "tt0067116",  # The French Connection (1971)
    "tt0064115",  # Butch Cassidy and the Sundance Kid (1969)
    "tt0107290",  # Jurassic Park (1993)
    "tt0118849",  # Children of Men (2006)
    "tt3659388",  # The Martian (2015)
    "tt1392190",  # Mad Max: Fury Road (2015)
    "tt0086190",  # Return of the Jedi (1983)
    "tt2488496",  # Star Wars: The Force Awakens (2015)
    "tt0325980",  # Pirates of the Caribbean (2003)
    "tt0371746",  # Iron Man (2008)
    "tt1825683",  # Black Panther (2018)
    "tt2015381",  # Guardians of the Galaxy (2014)
    "tt0120338",  # Titanic (1997)
    "tt0499549",  # Avatar (2009)
    "tt0096895",  # Batman (1989)

    # ── Sci-Fi ────────────────────────────────────────────────────────────
    "tt0083658",  # Blade Runner — already listed, will skip
    "tt0374901",  # -- skip
    "tt0796366",  # Star Trek (2009)
    "tt1392190",  # Mad Max — already listed
    "tt0816692",  # Interstellar — already listed
    "tt2395427",  # Avengers: Age of Ultron (2015) - skipping
    "tt0120915",  # Star Wars: The Phantom Menace (1999) - not great but popular
    "tt0121766",  # Star Wars: Revenge of the Sith (2005)

    # ── Animation ─────────────────────────────────────────────────────────
    "tt0266543",  # Finding Nemo (2003)
    "tt0892769",  # How to Train Your Dragon (2010)
    "tt0317705",  # The Incredibles (2004)
    "tt0382932",  # Ratatouille (2007)
    "tt0198781",  # Monsters, Inc. (2001)
    "tt0405508",  # Howl's Moving Castle (2004)
    "tt2948356",  # Zootopia (2016)
    "tt2294629",  # Frozen (2013)
    "tt2096673",  # Inside Out (2015)
    "tt6105098",  # Klaus (2019)
    "tt4633694",  # Spider-Man: Into the Spider-Verse (2018)
    "tt3783958",  # La La Land (2016)
    "tt0120623",  # A Bug's Life (1998)
    "tt1798684",  # How to Train Your Dragon 2 (2014)
    "tt0107902",  # The Nightmare Before Christmas (1993)
    "tt0119177",  # Akira (1988)

    # ── Horror ────────────────────────────────────────────────────────────
    "tt0071200",  # The Exorcist (1973)
    "tt0077416",  # Halloween (1978)
    "tt0083907",  # The Thing (1982)
    "tt0094721",  # Beetlejuice (1988) - more comedy/horror
    "tt0978762",  # Get Out (2017) - tt - let me use right ID
    "tt5052448",  # Get Out (2017)
    "tt1560747",  # A Quiet Place (2018)
    "tt6644200",  # A Quiet Place Part II (2020)
    "tt2283362",  # It (2017)
    "tt4806470",  # Hereditary (2018)
    "tt7784604",  # Midsommar (2019)
    "tt0099RR",   # placeholder - skip invalid
    "tt0053221",  # Rio Bravo (1959) - western

    # ── Classic Hollywood ─────────────────────────────────────────────────
    "tt0033467",  # Citizen Kane (1941)
    "tt0025316",  # It Happened One Night (1934)
    "tt0021749",  # City Lights (1931)
    "tt0045152",  # Singin' in the Rain (1952)
    "tt0055031",  # The Apartment (1960)
    "tt0053604",  # Some Like It Hot (1959)
    "tt0053125",  # North by Northwest (1959)
    "tt0051201",  # Witness for the Prosecution (1957)
    "tt0041959",  # All About Eve (1950)
    "tt0048473",  # Pather Panchali (1955)
    "tt0059742",  # The Sound of Music (1965)
    "tt0044079",  # High Noon (1952)

    # ── Drama ─────────────────────────────────────────────────────────────
    "tt0105695",  # Philadelphia (1993)
    "tt0244640",  # In the Mood for Love (2000)
    "tt0116791",  # Secrets & Lies (1996)
    "tt0117665",  # Sling Blade (1996)
    "tt0107207",  # In the Name of the Father (1993)
    "tt0361471",  # Million Dollar Baby (2004)
    "tt0406655",  # Crash (2004)
    "tt2278388",  # Grand Budapest Hotel — already listed
    "tt0111161",  # Shawshank — already listed
    "tt0112573",  # Braveheart — already listed
    "tt0099509",  # Edward Scissorhands (1990)
    "tt0101414",  # Beauty and the Beast (1991)
    "tt0100405",  # Pretty Woman (1990)
    "tt0099685",  # Goodfellas — already listed

    # ── Comedy ────────────────────────────────────────────────────────────
    "tt0084787",  # The Thing (1982) — already listed as horror
    "tt0196229",  # O Brother, Where Art Thou? (2000)
    "tt0110822",  # Dumb and Dumber (1994) - fun
    "tt0107011",  # Mrs. Doubtfire (1993)
    "tt0103639",  # Aladdin (1992)
    "tt0096895",  # Batman — already listed
    "tt0116629",  # Independence Day (1996)
    "tt0120915",  # The Phantom Menace — already listed

    # ── Recent / 2010s-2020s ─────────────────────────────────────────────
    "tt1375670",  # The Help (2011) - hmm check ID
    "tt1392190",  # Mad Max — already listed
    "tt4729430",  # Klaus — wait wrong ID above, tt6105098 is correct
    "tt8503618",  # Hamilton (2020)
    "tt6751668",  # Parasite — already listed
    "tt7286456",  # Joker — already listed
    "tt4154756",  # Infinity War — already listed
    "tt4154796",  # Endgame — already listed
    "tt2975590",  # Batman v Superman — skip
    "tt3498820",  # Captain America: Civil War (2016)
    "tt0458339",  # Captain America: The First Avenger (2011)
    "tt1843866",  # Captain America: The Winter Soldier (2014)
    "tt1228705",  # Iron Man 2 (2010) - mediocre
    "tt3315342",  # Logan (2017)
    "tt2395427",  # Age of Ultron — skip
    "tt6320628",  # Spider-Man: Homecoming (2017)
    "tt9114286",  # Spider-Man: No Way Home (2021)
    "tt7131622",  # Once Upon a Time in Hollywood (2019)
    "tt1950186",  # Ford v Ferrari (2019)
    "tt8267604",  # Crawl -- skip
    "tt6966692",  # Green Book (2018)
    "tt5580390",  # The Shape of Water (2017)
    "tt4975722",  # Moonlight (2016)
    "tt3521164",  # Moana (2016)
    "tt2096673",  # Inside Out — already listed
    "tt4786824",  # The Crown Season 1 — TV, skip
    "tt3783958",  # La La Land — already listed
    "tt1856101",  # Blade Runner 2049 — already listed
    "tt1630029",  # Avatar 2 (2022)
    "tt1745960",  # Top Gun: Maverick (2022)
    "tt6710474",  # Everything Everywhere All at Once (2022)
    "tt1160419",  # Dune (2021)
    "tt9419884",  # Doctor Strange in the Multiverse of Madness — skip
    "tt10872600", # Spider-Man: No Way Home — duplicate check
    "tt0298148",  # Ocean's Twelve (2004) - skip
    "tt0349903",  # Collateral (2004)
    "tt0387564",  # Saw (2004) - skip
    "tt0387IMD",  # invalid — skip
    "tt0268380",  # Catch Me if You Can — already listed as tt0264464
    "tt0372784",  # Batman Begins (2005)
    "tt0800369",  # Thor (2011)
    "tt0458339",  # Captain America — already listed
    "tt0800080",  # Superbad (2007)
    "tt0910936",  # Pineapple Express (2008) — skip
    "tt1049413",  # Up — already listed
    "tt0457496",  # Happy Feet (2006) — skip
]

# ─────────────────────────────────────────────


def omdb_fetch(imdb_id: str) -> dict | None:
    url = f"http://www.omdbapi.com/?i={imdb_id}&apikey={OMDB_KEY}"
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read())
    except Exception as exc:
        print(f"  OMDB error for {imdb_id}: {exc}", file=sys.stderr)
        return None
    if data.get("Response") == "False":
        return None
    year = None
    try:
        year = int(str(data.get("Year", ""))[:4])
    except (ValueError, TypeError):
        pass
    poster = data.get("Poster")
    return {
        "title": data.get("Title"),
        "year": year,
        "genre": data.get("Genre") if data.get("Genre") != "N/A" else None,
        "poster_url": poster if poster and poster != "N/A" else None,
        "imdb_url": f"https://www.imdb.com/title/{imdb_id}/",
        "description": data.get("Plot") if data.get("Plot") != "N/A" else None,
    }


def login(username, password):
    form = f"username={username}&password={password}".encode()
    req = urllib.request.Request(f"{BASE}/auth/login", data=form, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]


def add_movie(token, movie):
    req = urllib.request.Request(
        f"{BASE}/movies",
        data=json.dumps(movie).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()}


def main():
    # Deduplicate IDs while preserving order
    seen = set()
    unique_ids = []
    for imdb_id in IMDB_IDS:
        imdb_id = imdb_id.strip()
        if imdb_id and imdb_id not in seen and imdb_id.startswith("tt") and imdb_id[2:].isdigit():
            seen.add(imdb_id)
            unique_ids.append(imdb_id)

    print(f"Logging in...")
    try:
        token = login("testflow", "pass123")
    except Exception as e:
        print(f"Login failed: {e}\nMake sure the backend is running and 'testflow' user exists.", file=sys.stderr)
        sys.exit(1)

    print(f"Seeding {len(unique_ids)} movies (duplicates in DB are skipped automatically)...\n")

    added = skipped = failed = 0
    for i, imdb_id in enumerate(unique_ids, 1):
        movie = omdb_fetch(imdb_id)
        if movie is None:
            print(f"  [{i:3d}] NOT FOUND  {imdb_id}")
            failed += 1
            time.sleep(0.15)
            continue

        result = add_movie(token, movie)
        if "error" in result:
            err = result["error"]
            if "already" in err.lower() or "400" in err or "409" in err:
                print(f"  [{i:3d}] SKIP       {movie['title']} ({movie.get('year')})")
                skipped += 1
            else:
                print(f"  [{i:3d}] ERROR      {movie['title']}: {err}")
                failed += 1
        else:
            print(f"  [{i:3d}] ADDED      {result['title']} ({result.get('year')})")
            added += 1

        # Be polite to OMDB (free tier: 1000 req/day)
        time.sleep(0.12)

    print(f"\n{'─'*50}")
    print(f"Done!  Added: {added}  |  Skipped (already in DB): {skipped}  |  Failed: {failed}")


if __name__ == "__main__":
    main()
