![Top Langs](https://github-readme-stats.vercel.app/api/top-langs/?username=Iron-Wolf&layout=compact&langs_count=4&theme=ambient_gradient)

[Deployed here](https://iron-wolf.github.io)

# Description
Repo containing static Html files.

### Local test
To test localy and avoid CORS errors, use a simple HTTP server (in the root folder) : `python3 -m http.server`


# [OSM project](https://iron-wolf.github.io/osm/index.html)
Goal : simple Map I use as a memo

### Extract data from Google
- I use the [Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search) [playground](https://places-search-405409.ue.r.appspot.com/) to extract data (in packs of 20, because google...)
- Then [JmesPath](https://play.jmespath.org/) to transform the JSON
  ```jmespath
  places[?rating>'4.1'].{
    name: displayName.text,
    emoji: rating,
    url: websiteUri,
    lat: location.latitude,
    lng: location.longitude}
  ```
- [JQ](https://www.devtoolsdaily.com/jq_playground/) is also possible, but more verbose :
  ```jq
  [.places[] | select(.rating > 4.1) | {
    name: .displayName.text,
    emoji: .rating,
    url: .websiteUri,
    lat: .location.latitude,
    lng: .location.longitude}]
  ```
- sort the data with : https://codeshack.io/json-sorter/

### Todo
- [x] Add restaurants
- [x] Add [parking occupation](https://data.rennesmetropole.fr/explore/dataset/export-api-parking-citedia/information/)
- [ ] Add [HelloTrucks](https://hellotrucks.app/35-rennes) but there is not API...
- [ ] Add [parking opening hours](https://data.rennesmetropole.fr/explore/dataset/export-api-parking-citedia/information/) ("statut" column)
- [ ] Add [bicycle pump](https://data.rennesmetropole.fr/explore/dataset/stations-reparation-velo/information/?location=12,48.10663,-1.66082&basemap=0a029a) locations. 

### Resources :
- Leaflet icons from [leaflet-color-markers](https://github.com/pointhi/leaflet-color-markers) repo


# [Painting](https://iron-wolf.github.io/painting)
Goal : personal color referential for miniatures

### Todo
- [x] Add colors system and color detection
- [x] filter color by name, hex name, ...
- [ ] found official color code (if possible)

### Resources :
- "Fork me" banner : [fork ribbon css](https://github.com/simonwhitaker/github-fork-ribbon-css)


# [Writing](https://iron-wolf.github.io/writing)
Goal : need to get stuff out of my head (in french)

# [SH3D](https://iron-wolf.github.io/sh3d/index.html)
Goal : Sweet Home 3D editor on the go
