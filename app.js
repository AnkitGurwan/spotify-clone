import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config()
import cors from "cors";
import  bodyParser from "body-parser"
import  lyricsFinder from "lyrics-finder"
import  SpotifyWebApi from "spotify-web-api-node"

const app = express();
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post("/login", (req, res) => {
  const code = req.body.code;

  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  })

  spotifyApi.authorizationCodeGrant(code)
    .then(data => {
      res.status(200).json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      })
    })
    .catch(err => {
      res.status(400)
    })
})




app.get("/albums/:token", async (req, res) => {
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });
  const token = req.params.token;

  spotifyApi.setAccessToken(token);

  await spotifyApi.getAlbum('3BGU0BqGwBkYDHpfCWFm7I')
  .then(({body}) => {
    const albums = {
        name: body.name,
        artists: body.artists.map(artist => artist.name).join(', '),
        image: body.images.length > 0 ? body.images[0].url : null,
        releaseDate: body.release_date,
      };
    res.status(200).json(albums);
    }, (err) => {
       console.log("Something went wrong!", err);
    });
  
  

})

app.get('/tracks/:token/:name', async (req, res) => {
  try {
    const spotifyApi = new SpotifyWebApi({
      redirectUri: process.env.REDIRECT_URI,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    });
    const token = req.params.token;

    const albumName = req.params.name;

    spotifyApi.setAccessToken(token);

    // Search for albums with the given name
    const { body: { albums } } = await spotifyApi.searchAlbums(albumName, { limit: 1 });

    if (albums.items.length === 0) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }

    const albumId = albums.items[0].id;

    // Fetch tracks of the album by ID
    const { body: { items } } = await spotifyApi.getAlbumTracks(albumId);

    // Extract relevant information from each track
    const tracks = items.map(track => ({
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      previewUrl: track.preview_url,
    }));

    res.json(tracks);
  } catch (error) {
    console.error('Error fetching album tracks by name:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(process.env.PORT,(req,res,err)=>{
    if(err)console.log(err);
    else console.log(`Server listening on PORT : ${process.env.PORT}`)
})