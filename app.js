const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDBToDatabase = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

const convertMatchDBToDatabase = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;
    `;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerDBToDatabase(eachPlayer))
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};
    `;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDBToDatabase(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    UPDATE player_details 
    SET 
    player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;
  await database.run(updateQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details 
    WHERE match_id = ${matchId};
    `;
  const match = await database.get(getMatchQuery);
  response.send(convertMatchDBToDatabase(match));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
    SELECT 
    match_details.match_id,
    match_details.match,
    match_details.year
    FROM match_details INNER JOIN player_match_score ON 
    match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};
    `;
  const matchesArray = await database.all(getMatchesQuery);
  response.send(
    matchesArray.map((eachMatch) => convertMatchDBToDatabase(eachMatch))
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersDetails = `
    SELECT 
    player_details.player_id,
    player_details.player_name
    FROM player_details INNER JOIN player_match_score ON 
    player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ${matchId};`;
  const playersArray = await database.all(getPlayersDetails);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerDBToDatabase(eachPlayer))
  );
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getScoresQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM player_details INNER JOIN player_match_score ON 
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const scoresArray = await database.get(getScoresQuery);
  response.send({
    playerId: scoresArray["playerId"],
    playerName: scoresArray["playerName"],
    totalScore: scoresArray["totalScore"],
    totalFours: scoresArray["totalFours"],
    totalSixes: scoresArray["totalSixes"],
  });
});

module.exports = app;
