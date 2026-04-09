"""Seed the database with IMDB Top 100 movies."""
import urllib.request
import json
import sys

BASE = "http://localhost:8080"

# Get token
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

MOVIES = [
    {"title": "The Shawshank Redemption", "year": 1994, "genre": "Drama", "imdb_url": "https://www.imdb.com/title/tt0111161/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg"},
    {"title": "The Godfather", "year": 1972, "genre": "Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0068646/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg"},
    {"title": "The Dark Knight", "year": 2008, "genre": "Action, Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0468569/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg"},
    {"title": "The Godfather Part II", "year": 1974, "genre": "Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0071562/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/03/The_Godfather_Part_II_%281974%29.jpg"},
    {"title": "12 Angry Men", "year": 1957, "genre": "Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0050083/", "poster_url": "https://upload.wikimedia.org/wikipedia/commons/b/b5/12_Angry_Men_%281957_film_poster%29.jpg"},
    {"title": "Schindler's List", "year": 1993, "genre": "Biography, Drama, History", "imdb_url": "https://www.imdb.com/title/tt0108052/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/3/38/Schindler%27s_List_movie.jpg"},
    {"title": "The Lord of the Rings: The Return of the King", "year": 2003, "genre": "Action, Adventure, Drama", "imdb_url": "https://www.imdb.com/title/tt0167260/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/b/be/The_Lord_of_the_Rings_-_The_Return_of_the_King_%282003%29.jpg"},
    {"title": "Pulp Fiction", "year": 1994, "genre": "Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0110912/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg"},
    {"title": "The Lord of the Rings: The Fellowship of the Ring", "year": 2001, "genre": "Action, Adventure, Drama", "imdb_url": "https://www.imdb.com/title/tt0120737/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg"},
    {"title": "The Good, the Bad and the Ugly", "year": 1966, "genre": "Western", "imdb_url": "https://www.imdb.com/title/tt0060196/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/4/45/Good_the_bad_and_the_ugly_poster.jpg"},
    {"title": "Forrest Gump", "year": 1994, "genre": "Drama, Romance", "imdb_url": "https://www.imdb.com/title/tt0109830/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg"},
    {"title": "Fight Club", "year": 1999, "genre": "Drama", "imdb_url": "https://www.imdb.com/title/tt0137523/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/f/fc/Fight_Club_poster.jpg"},
    {"title": "Inception", "year": 2010, "genre": "Action, Adventure, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt1375666/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg"},
    {"title": "The Lord of the Rings: The Two Towers", "year": 2002, "genre": "Action, Adventure, Drama", "imdb_url": "https://www.imdb.com/title/tt0167261/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/b/b0/Lord_of_the_rings_two_towers.jpg"},
    {"title": "Star Wars: Episode V – The Empire Strikes Back", "year": 1980, "genre": "Action, Adventure, Fantasy", "imdb_url": "https://www.imdb.com/title/tt0080684/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/3/3c/SW_-_Empire_Strikes_Back.jpg"},
    {"title": "The Matrix", "year": 1999, "genre": "Action, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0133093/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/c/c1/The_Matrix_Poster.jpg"},
    {"title": "Goodfellas", "year": 1990, "genre": "Biography, Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0099685/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/7/7b/Goodfellas.jpg"},
    {"title": "One Flew Over the Cuckoo's Nest", "year": 1975, "genre": "Drama", "imdb_url": "https://www.imdb.com/title/tt0073486/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/2/26/One_Flew_Over_the_Cuckoo%27s_Nest_poster.jpg"},
    {"title": "Se7en", "year": 1995, "genre": "Crime, Drama, Mystery", "imdb_url": "https://www.imdb.com/title/tt0114369/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/6/68/Seven_%28movie%29_poster.jpg"},
    {"title": "Seven Samurai", "year": 1954, "genre": "Action, Drama", "imdb_url": "https://www.imdb.com/title/tt0047478/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/a/a7/Reprints-7samurai-linen.jpg"},
    {"title": "The Silence of the Lambs", "year": 1991, "genre": "Crime, Drama, Thriller", "imdb_url": "https://www.imdb.com/title/tt0102926/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg"},
    {"title": "Saving Private Ryan", "year": 1998, "genre": "Drama, War", "imdb_url": "https://www.imdb.com/title/tt0120815/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/a/ac/Saving_Private_Ryan_poster.jpg"},
    {"title": "Interstellar", "year": 2014, "genre": "Adventure, Drama, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0816692/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg"},
    {"title": "City of God", "year": 2002, "genre": "Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0317248/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/2/22/City_of_God_film.jpg"},
    {"title": "The Green Mile", "year": 1999, "genre": "Crime, Drama, Fantasy", "imdb_url": "https://www.imdb.com/title/tt0120689/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/e/e2/The_Green_Mile_%28film%29_poster.jpg"},
    {"title": "Life is Beautiful", "year": 1997, "genre": "Comedy, Drama, Romance", "imdb_url": "https://www.imdb.com/title/tt0118799/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/8d/Life_is_beautiful_poster.gif"},
    {"title": "Terminator 2: Judgment Day", "year": 1991, "genre": "Action, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0103064/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/85/Terminator2poster.jpg"},
    {"title": "Back to the Future", "year": 1985, "genre": "Adventure, Comedy, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0088763/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/d/d2/Back_to_the_Future.jpg"},
    {"title": "The Pianist", "year": 2002, "genre": "Biography, Drama, Music", "imdb_url": "https://www.imdb.com/title/tt0253474/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/e/e8/The_Pianist.jpg"},
    {"title": "Spirited Away", "year": 2001, "genre": "Animation, Adventure, Family", "imdb_url": "https://www.imdb.com/title/tt0245429/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/d/db/Spirited_Away_Japanese_poster.png"},
    {"title": "Parasite", "year": 2019, "genre": "Comedy, Drama, Thriller", "imdb_url": "https://www.imdb.com/title/tt6751668/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29_poster.jpg"},
    {"title": "Psycho", "year": 1960, "genre": "Horror, Mystery, Thriller", "imdb_url": "https://www.imdb.com/title/tt0054215/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/a/a8/Psycho_%281960%29_poster.jpg"},
    {"title": "Gladiator", "year": 2000, "genre": "Action, Adventure, Drama", "imdb_url": "https://www.imdb.com/title/tt0172495/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/f/f6/Gladiator_%282000_film_poster%29.png"},
    {"title": "The Lion King", "year": 1994, "genre": "Animation, Adventure, Drama", "imdb_url": "https://www.imdb.com/title/tt0110357/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/3/3d/The_Lion_King_poster.jpg"},
    {"title": "American History X", "year": 1998, "genre": "Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0120586/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/0e/American_History_X_poster.png"},
    {"title": "The Departed", "year": 2006, "genre": "Crime, Drama, Thriller", "imdb_url": "https://www.imdb.com/title/tt0407887/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/5/50/The_Departed_Poster.jpg"},
    {"title": "The Usual Suspects", "year": 1995, "genre": "Crime, Drama, Mystery", "imdb_url": "https://www.imdb.com/title/tt0114814/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/9/9c/Usual_suspects_ver1.jpg"},
    {"title": "Whiplash", "year": 2014, "genre": "Drama, Music", "imdb_url": "https://www.imdb.com/title/tt2582802/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/01/Whiplash_poster.jpg"},
    {"title": "The Prestige", "year": 2006, "genre": "Drama, Mystery, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0482571/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/d/d2/Prestige_poster.jpg"},
    {"title": "Casablanca", "year": 1942, "genre": "Drama, Romance, War", "imdb_url": "https://www.imdb.com/title/tt0034583/", "poster_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Casablanca_poster.jpg/500px-Casablanca_poster.jpg"},
    {"title": "The Intouchables", "year": 2011, "genre": "Biography, Comedy, Drama", "imdb_url": "https://www.imdb.com/title/tt1675434/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/1/1b/The_Intouchables_poster.jpg"},
    {"title": "Rear Window", "year": 1954, "genre": "Mystery, Thriller", "imdb_url": "https://www.imdb.com/title/tt0047396/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/4/41/Rear_Window.jpg"},
    {"title": "Once Upon a Time in the West", "year": 1968, "genre": "Western", "imdb_url": "https://www.imdb.com/title/tt0064116/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/6/6f/Once_Upon_a_Time_in_the_West_poster.jpg"},
    {"title": "Alien", "year": 1979, "genre": "Horror, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0078748/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/c/c3/Alien_film_poster.jpg"},
    {"title": "Apocalypse Now", "year": 1979, "genre": "Drama, Mystery, War", "imdb_url": "https://www.imdb.com/title/tt0078788/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/2/22/Apocalypse_Now_poster.jpg"},
    {"title": "Memento", "year": 2000, "genre": "Mystery, Thriller", "imdb_url": "https://www.imdb.com/title/tt0209144/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/3/3d/Memento_poster.jpg"},
    {"title": "Raiders of the Lost Ark", "year": 1981, "genre": "Action, Adventure", "imdb_url": "https://www.imdb.com/title/tt0082971/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/7/7e/Raiders_of_the_lost_ark.jpg"},
    {"title": "Django Unchained", "year": 2012, "genre": "Drama, Western", "imdb_url": "https://www.imdb.com/title/tt1853728/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/4/4f/Django_Unchained_Poster.jpg"},
    {"title": "WALL-E", "year": 2008, "genre": "Animation, Adventure, Family", "imdb_url": "https://www.imdb.com/title/tt0910970/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/c/c2/WALL-E_poster.jpg"},
    {"title": "The Shining", "year": 1980, "genre": "Drama, Horror", "imdb_url": "https://www.imdb.com/title/tt0081505/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/b/b6/The_Shining_poster.jpg"},
    {"title": "Dr. Strangelove", "year": 1964, "genre": "Comedy, War", "imdb_url": "https://www.imdb.com/title/tt0057012/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/e/ed/Dr._Strangelove.jpg"},
    {"title": "Toy Story", "year": 1995, "genre": "Animation, Adventure, Comedy", "imdb_url": "https://www.imdb.com/title/tt0114709/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/1/13/Toy_Story.jpg"},
    {"title": "Joker", "year": 2019, "genre": "Crime, Drama, Thriller", "imdb_url": "https://www.imdb.com/title/tt7286456/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/e/e1/Joker_%282019_film%29_poster.jpg"},
    {"title": "Braveheart", "year": 1995, "genre": "Biography, Drama, History", "imdb_url": "https://www.imdb.com/title/tt0112573/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/e/e5/Braveheart_poster.jpg"},
    {"title": "Aliens", "year": 1986, "genre": "Action, Adventure, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0090605/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/e/e1/Aliens_movie_poster.jpg"},
    {"title": "Coco", "year": 2017, "genre": "Animation, Adventure, Comedy", "imdb_url": "https://www.imdb.com/title/tt2380307/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/9/98/Coco_%282017_film%29_poster.jpg"},
    {"title": "Good Will Hunting", "year": 1997, "genre": "Drama, Romance", "imdb_url": "https://www.imdb.com/title/tt0119217/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/4/40/Good_Will_Hunting.png"},
    {"title": "2001: A Space Odyssey", "year": 1968, "genre": "Adventure, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0062622/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/1/11/2001_A_Space_Odyssey_%281968%29.png"},
    {"title": "Full Metal Jacket", "year": 1987, "genre": "Drama, War", "imdb_url": "https://www.imdb.com/title/tt0093058/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/4/4e/Full_Metal_Jacket_poster.jpg"},
    {"title": "A Beautiful Mind", "year": 2001, "genre": "Biography, Drama", "imdb_url": "https://www.imdb.com/title/tt0268978/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/04/A_Beautiful_Mind_Poster.jpg"},
    {"title": "Lawrence of Arabia", "year": 1962, "genre": "Adventure, Biography, Drama", "imdb_url": "https://www.imdb.com/title/tt0056172/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/07/Lawrence_of_Arabia_%281962_film%29.jpg"},
    {"title": "Reservoir Dogs", "year": 1992, "genre": "Crime, Drama, Thriller", "imdb_url": "https://www.imdb.com/title/tt0105236/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/5/52/Reservoir_Dogs_poster.jpg"},
    {"title": "Bicycle Thieves", "year": 1948, "genre": "Drama", "imdb_url": "https://www.imdb.com/title/tt0040522/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/b/b5/Ladri_di_biciclette_original_poster.jpg"},
    {"title": "Star Wars: Episode IV – A New Hope", "year": 1977, "genre": "Action, Adventure, Fantasy", "imdb_url": "https://www.imdb.com/title/tt0076759/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/87/StarWarsMoviePoster1977.jpg"},
    {"title": "Eternal Sunshine of the Spotless Mind", "year": 2004, "genre": "Drama, Romance, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0338013/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/3/3c/Eternal_Sunshine_of_the_Spotless_Mind.png"},
    {"title": "The Wolf of Wall Street", "year": 2013, "genre": "Biography, Comedy, Crime", "imdb_url": "https://www.imdb.com/title/tt0993846/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/d/d8/The_Wolf_of_Wall_Street_%282013%29.jpg"},
    {"title": "A Clockwork Orange", "year": 1971, "genre": "Crime, Drama, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt0066921/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/2/20/A_Clockwork_Orange_%281971%29.png"},
    {"title": "Oldboy", "year": 2003, "genre": "Action, Drama, Mystery", "imdb_url": "https://www.imdb.com/title/tt0364569/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/6/67/Oldboykoreanposter.jpg"},
    {"title": "Toy Story 3", "year": 2010, "genre": "Animation, Adventure, Comedy", "imdb_url": "https://www.imdb.com/title/tt0435761/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/3/31/Toy_Story_3_poster.jpg"},
    {"title": "The Grand Budapest Hotel", "year": 2014, "genre": "Adventure, Comedy, Crime", "imdb_url": "https://www.imdb.com/title/tt2278388/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/1/1c/The_Grand_Budapest_Hotel_%282014%29_Poster.jpg"},
    {"title": "Pan's Labyrinth", "year": 2006, "genre": "Drama, Fantasy, War", "imdb_url": "https://www.imdb.com/title/tt0457430/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/2/2b/PansLabyrinthPoster.jpg"},
    {"title": "No Country for Old Men", "year": 2007, "genre": "Crime, Drama, Thriller", "imdb_url": "https://www.imdb.com/title/tt0477348/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/7/7f/No_Country_for_Old_Men_poster.jpg"},
    {"title": "Shutter Island", "year": 2010, "genre": "Mystery, Thriller", "imdb_url": "https://www.imdb.com/title/tt1130884/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/80/Shutter_Island_poster.jpg"},
    {"title": "The Truman Show", "year": 1998, "genre": "Comedy, Drama", "imdb_url": "https://www.imdb.com/title/tt0120382/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/c/c8/The_Truman_Show_film_poster.jpg"},
    {"title": "Your Name", "year": 2016, "genre": "Animation, Drama, Fantasy", "imdb_url": "https://www.imdb.com/title/tt5311514/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/0b/Your_Name_poster.jpg"},
    {"title": "Grave of the Fireflies", "year": 1988, "genre": "Animation, Drama, War", "imdb_url": "https://www.imdb.com/title/tt0095327/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/a/a0/Grave_of_the_fireflies_poster.jpg"},
    {"title": "Amadeus", "year": 1984, "genre": "Biography, Drama, Music", "imdb_url": "https://www.imdb.com/title/tt0086879/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/8d/Amadeus_movie_poster.jpg"},
    {"title": "Das Boot", "year": 1981, "genre": "Drama, War", "imdb_url": "https://www.imdb.com/title/tt0082096/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/7/7a/Das_Boot.jpg"},
    {"title": "Avengers: Infinity War", "year": 2018, "genre": "Action, Adventure, Sci-Fi", "imdb_url": "https://www.imdb.com/title/tt4154756/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/4/4b/Avengers_Infinity_War.jpg"},
    {"title": "Requiem for a Dream", "year": 2000, "genre": "Drama", "imdb_url": "https://www.imdb.com/title/tt0180093/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/e/e0/Requiem_for_a_Dream.png"},
    {"title": "Vertigo", "year": 1958, "genre": "Mystery, Romance, Thriller", "imdb_url": "https://www.imdb.com/title/tt0052357/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/80/Vertigomovie_restored.jpg"},
    {"title": "Once Upon a Time in America", "year": 1984, "genre": "Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0087843/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/4/48/Once_Upon_a_Time_in_America.jpg"},
    {"title": "Cinema Paradiso", "year": 1988, "genre": "Drama, Romance", "imdb_url": "https://www.imdb.com/title/tt0095765/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/b/b5/Cinema_Paradiso_poster.jpg"},
    {"title": "It's a Wonderful Life", "year": 1946, "genre": "Drama, Family, Fantasy", "imdb_url": "https://www.imdb.com/title/tt0038650/", "poster_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Its_a_wonderful_life_movie_poster.jpg/500px-Its_a_wonderful_life_movie_poster.jpg"},
    {"title": "Modern Times", "year": 1936, "genre": "Comedy, Drama, Family", "imdb_url": "https://www.imdb.com/title/tt0027977/", "poster_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Modern_Times_poster.jpg/500px-Modern_Times_poster.jpg"},
    {"title": "Paths of Glory", "year": 1957, "genre": "Drama, War", "imdb_url": "https://www.imdb.com/title/tt0050825/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/4/45/Paths_of_Glory_poster.jpg"},
    {"title": "Sunset Boulevard", "year": 1950, "genre": "Drama, Film-Noir", "imdb_url": "https://www.imdb.com/title/tt0043014/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/86/Sunset_Blvd_%281950_poster%29.jpg"},
    {"title": "The Dark Knight Rises", "year": 2012, "genre": "Action, Drama", "imdb_url": "https://www.imdb.com/title/tt1345836/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/83/Dark_knight_rises_poster.jpg"},
    {"title": "Catch Me If You Can", "year": 2002, "genre": "Biography, Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0264464/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/f/f7/Catchmeifyoucan.jpg"},
    {"title": "The Hunt", "year": 2012, "genre": "Drama", "imdb_url": "https://www.imdb.com/title/tt2106476/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/7/75/The_Hunt_Danish_film.jpg"},
    {"title": "Ikiru", "year": 1952, "genre": "Drama", "imdb_url": "https://www.imdb.com/title/tt0044741/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/7/72/Ikiru_1952_poster.jpg"},
    {"title": "Up", "year": 2009, "genre": "Animation, Adventure, Comedy", "imdb_url": "https://www.imdb.com/title/tt1049413/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/05/Up_%282009_film%29.jpg"},
    {"title": "The Wizard of Oz", "year": 1939, "genre": "Adventure, Family, Fantasy", "imdb_url": "https://www.imdb.com/title/tt0032138/", "poster_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Wizard_of_Oz_quad_cinema_poster.jpg/500px-Wizard_of_Oz_quad_cinema_poster.jpg"},
    {"title": "Heat", "year": 1995, "genre": "Action, Crime, Drama", "imdb_url": "https://www.imdb.com/title/tt0113277/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/9/9f/Heat1995poster.jpg"},
    {"title": "Monty Python and the Holy Grail", "year": 1975, "genre": "Adventure, Comedy, Fantasy", "imdb_url": "https://www.imdb.com/title/tt0071853/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/3/3c/Holy_Grail_poster.jpg"},
    {"title": "The Seventh Seal", "year": 1957, "genre": "Drama, Fantasy", "imdb_url": "https://www.imdb.com/title/tt0050976/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/05/Hetsjunde_inseglet_poster.jpg"},
    {"title": "3 Idiots", "year": 2009, "genre": "Comedy, Drama", "imdb_url": "https://www.imdb.com/title/tt1187043/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/d/df/3_idiots_poster.jpg"},
    {"title": "Avengers: Endgame", "year": 2019, "genre": "Action, Adventure, Drama", "imdb_url": "https://www.imdb.com/title/tt4154796/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg"},
    {"title": "Princess Mononoke", "year": 1997, "genre": "Animation, Action, Adventure", "imdb_url": "https://www.imdb.com/title/tt0119698/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/e/ec/Princess_Mononoke.jpg"},
    {"title": "Taare Zameen Par", "year": 2007, "genre": "Drama, Family", "imdb_url": "https://www.imdb.com/title/tt0986264/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/8/8f/Taare_Zameen_Par.jpg"},
    {"title": "Come and See", "year": 1985, "genre": "Drama, History, War", "imdb_url": "https://www.imdb.com/title/tt0091251/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/b/b0/Come_and_See_film_poster.jpg"},
    {"title": "There Will Be Blood", "year": 2007, "genre": "Drama, History", "imdb_url": "https://www.imdb.com/title/tt0469494/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/4/4b/There_Will_Be_Blood_poster.jpg"},
    {"title": "Into the Wild", "year": 2007, "genre": "Adventure, Biography, Drama", "imdb_url": "https://www.imdb.com/title/tt0758758/", "poster_url": "https://upload.wikimedia.org/wikipedia/en/7/77/Into_the_wild_poster.jpg"},
]

def main():
    print("Logging in...")
    token = login("testflow", "pass123")
    print(f"Got token. Adding {len(MOVIES)} movies...\n")

    added = 0
    skipped = 0
    for movie in MOVIES:
        result = add_movie(token, movie)
        if "error" in result:
            print(f"  SKIP  {movie['title']}: {result['error']}")
            skipped += 1
        else:
            print(f"  OK    {result['title']} ({result['year']})")
            added += 1

    print(f"\nDone! Added: {added}, Skipped: {skipped}")

if __name__ == "__main__":
    main()
