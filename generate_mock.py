import json
import random
from datetime import datetime, timedelta

football_teams = [
    ("Manchester City", "Arsenal"), ("Liverpool", "Chelsea"),
    ("Real Madrid", "Barcelona"), ("Bayern Munich", "Borussia Dortmund"),
    ("PSG", "Lyon"), ("Juventus", "AC Milan"), ("Atletico Madrid", "Sevilla"),
    ("Inter Milan", "Napoli"), ("Tottenham", "Manchester United"),
    ("Porto", "Benfica"), ("Ajax", "PSV"), ("Roma", "Lazio"),
    ("Leicester City", "Everton"), ("Newcastle", "Aston Villa"),
    ("Bayer Leverkusen", "RB Leipzig"), ("Marseille", "Monaco"),
    ("Fiorentina", "Atalanta"),
]

basketball_teams = [
    ("LA Lakers", "Boston Celtics"), ("Golden State Warriors", "Chicago Bulls"),
    ("Miami Heat", "Brooklyn Nets"), ("Phoenix Suns", "Dallas Mavericks"),
    ("Denver Nuggets", "Milwaukee Bucks"), ("Philadelphia 76ers", "Toronto Raptors"),
    ("Atlanta Hawks", "Cleveland Cavaliers"), ("Memphis Grizzlies", "New Orleans Pelicans"),
    ("Sacramento Kings", "Minnesota Timberwolves"), ("Oklahoma City Thunder", "Utah Jazz"),
    ("Portland Trail Blazers", "San Antonio Spurs"), ("Indiana Pacers", "Charlotte Hornets"),
    ("Washington Wizards", "Detroit Pistons"), ("Orlando Magic", "Houston Rockets"),
    ("New York Knicks", "Los Angeles Clippers"), ("Chicago Bulls", "Boston Celtics"),
    ("Golden State Warriors", "Miami Heat"),
]

cricket_teams = [
    ("India", "Australia"), ("England", "Pakistan"), ("South Africa", "New Zealand"),
    ("Sri Lanka", "West Indies"), ("Bangladesh", "Zimbabwe"), ("Afghanistan", "Ireland"),
    ("India", "England"), ("Australia", "Pakistan"), ("New Zealand", "South Africa"),
    ("West Indies", "Sri Lanka"), ("Pakistan", "Bangladesh"), ("England", "Australia"),
    ("India", "South Africa"), ("New Zealand", "Pakistan"), ("Australia", "West Indies"),
    ("England", "Sri Lanka"),
]

football_venues = [
    "Etihad Stadium, Manchester", "Anfield, Liverpool", "Stamford Bridge, London",
    "Santiago Bernabeu, Madrid", "Camp Nou, Barcelona", "Allianz Arena, Munich",
    "Signal Iduna Park, Dortmund", "Parc des Princes, Paris", "Old Trafford, Manchester",
    "Tottenham Hotspur Stadium, London", "Emirates Stadium, London",
]

basketball_venues = [
    "Staples Center, Los Angeles", "TD Garden, Boston", "United Center, Chicago",
    "American Airlines Arena, Miami", "Chase Center, San Francisco",
    "Barclays Center, Brooklyn", "Madison Square Garden, New York",
    "Footprint Center, Phoenix", "Ball Arena, Denver", "Fiserv Forum, Milwaukee",
]

cricket_venues = [
    "Lord's Cricket Ground, London", "Melbourne Cricket Ground, Melbourne",
    "Eden Gardens, Kolkata", "The Oval, London", "Wankhede Stadium, Mumbai",
    "SCG, Sydney", "Headingley, Leeds", "Newlands, Cape Town",
    "Gaddafi Stadium, Lahore", "Sinhalese Sports Club, Colombo",
]

football_updates = [
    "Kick off! The match has begun.",
    "Early pressure from the home side forcing a corner.",
    "GOAL! Stunning strike from outside the box finds the top corner!",
    "VAR check in progress for a potential handball in the area.",
    "Yellow card shown for a late tackle in midfield.",
    "Substitution made — fresh legs brought on to change the tempo.",
    "Free kick in a dangerous position just outside the penalty area.",
    "GOAL! Clinical finish after a slick team move down the left flank!",
    "Half time — teams heading down the tunnel for the break.",
    "Second half underway — both teams looking to push for the winner.",
    "Red card shown! The defender is dismissed for a last-man foul.",
    "Penalty awarded after a foul inside the box — VAR confirms the decision.",
    "GOAL from the spot! Coolly dispatched into the bottom corner.",
    "Crossbar hit! Brilliant save denies a certain goal.",
    "Injury time — 4 additional minutes shown on the board.",
    "GOAL! Last-minute drama as the substitute heads home from a corner!",
    "Full time whistle — what a match this has been!",
    "Counter-attack broken up by a last-ditch tackle.",
    "Offside flag raised — goal disallowed by the linesman.",
    "Corner taken quickly but defended well by the back line.",
]

basketball_updates = [
    "Tip-off! Game underway at the arena.",
    "Three-pointer from downtown — nothing but net!",
    "Fast break opportunity converted with a thunderous slam dunk!",
    "Timeout called by the head coach to reset the defense.",
    "Technical foul assessed on the bench for dissent.",
    "End of the first quarter — close contest so far.",
    "Brilliant pick and roll play results in an easy layup.",
    "Blocked shot at the rim — crowd goes wild!",
    "Star player limping after landing awkwardly — medical staff on court.",
    "Second quarter begins — both teams looking to pull ahead.",
    "Flagrant foul called — two free throws plus possession.",
    "Alley-oop! Beautiful connection between the point guard and center.",
    "Half time show underway — teams in the locker room.",
    "Third quarter starts — home team comes out with intensity.",
    "Buzzer beater at the end of the third quarter!",
    "Final quarter — this game is on a knife edge.",
    "Full court press applied — turnover leads to easy basket.",
    "Clutch three-pointer to tie the game with 30 seconds left!",
    "Overtime! Neither team could separate themselves in regulation.",
    "Final buzzer — incredible game comes to a conclusion.",
]

cricket_updates = [
    "Toss completed — home team elected to bat first.",
    "First over bowled — tight start with only 3 runs scored.",
    "WICKET! Clean bowled — the stumps are shattered!",
    "Boundary! Elegant cover drive races to the fence for four.",
    "SIX! Massive hit over mid-wicket clears the boundary comfortably.",
    "50 partnership broken by a brilliant run-out from point.",
    "Drinks break taken — fielding side having a tactical discussion.",
    "WICKET! Caught behind — inside edge onto the glove.",
    "Century! The opener raises the bat to a standing ovation.",
    "Bowling change — the spinner comes on to try and extract some turn.",
    "LBW appeal — given out by the umpire, DRS being reviewed.",
    "DRS overturns the decision — reprieve for the batter!",
    "WICKET! Top edge spooned up and taken by mid-on.",
    "Power play begins — fielding restrictions in effect.",
    "Death overs — scoring rate picking up significantly.",
    "Last 5 overs — need 40 runs with 4 wickets in hand.",
    "WICKET! Run out after a mix-up between the batters.",
    "Final over — 12 needed off 6 balls.",
    "Last ball — SIX! Incredible finish to the innings!",
    "Innings complete — comprehensive total posted on the board.",
]

statuses = ["Live", "Live", "Live", "Upcoming", "Upcoming", "Final"]


def generate_event(event_id, sport, home, away, venue, updates_pool, home_score_range, away_score_range):
    status = random.choice(statuses)
    base_date = datetime.now()

    if status == "Live":
        event_date = (base_date - timedelta(hours=random.randint(1, 2))).isoformat()
    elif status == "Upcoming":
        event_date = (base_date + timedelta(hours=random.randint(1, 48))).isoformat()
    else:
        event_date = (base_date - timedelta(days=random.randint(1, 7))).isoformat()

    home_score = random.randint(*home_score_range) if status != "Upcoming" else 0
    away_score = random.randint(*away_score_range) if status != "Upcoming" else 0

    num_updates = random.randint(5, 10) if status != "Upcoming" else random.randint(1, 3)
    updates = random.sample(updates_pool, min(num_updates, len(updates_pool)))

    return {
        "event_id": f"{sport[:4].upper()}-{event_id:03d}",
        "sport": sport,
        "home_team": home,
        "away_team": away,
        "home_score": home_score,
        "away_score": away_score,
        "status": status,
        "venue": venue,
        "date": event_date,
        "league": get_league(sport, home, away),
        "updates": updates,
    }


def get_league(sport, home, away):
    leagues = {
        "Football": ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "UEFA Champions League"],
        "Basketball": ["NBA", "NBA Playoffs", "NBA Finals"],
        "Cricket": ["ICC World Cup", "Test Series", "T20 International", "ODI Series"],
    }
    return random.choice(leagues.get(sport, ["Unknown League"]))


events = []
event_id = 1

random.shuffle(football_teams)
random.shuffle(basketball_teams)
random.shuffle(cricket_teams)

for i, (home, away) in enumerate(football_teams[:17]):
    venue = football_venues[i % len(football_venues)]
    events.append(generate_event(event_id, "Football", home, away, venue, football_updates, (0, 5), (0, 4)))
    event_id += 1

for i, (home, away) in enumerate(basketball_teams[:17]):
    venue = basketball_venues[i % len(basketball_venues)]
    events.append(generate_event(event_id, "Basketball", home, away, venue, basketball_updates, (85, 130), (80, 125)))
    event_id += 1

for i, (home, away) in enumerate(cricket_teams[:16]):
    venue = cricket_venues[i % len(cricket_venues)]
    events.append(generate_event(event_id, "Cricket", home, away, venue, cricket_updates, (120, 350), (100, 320)))
    event_id += 1

output = {"total": len(events), "events": events}

with open("mock_livescore.json", "w") as f:
    json.dump(output, f, indent=2)

print(f"Generated {len(events)} events successfully → mock_livescore.json")
sport_counts = {}
for e in events:
    sport_counts[e["sport"]] = sport_counts.get(e["sport"], 0) + 1
for sport, count in sport_counts.items():
    print(f"  {sport}: {count} events")