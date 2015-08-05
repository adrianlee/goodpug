# REST API
+ [Authentication](#auth)
+ [Users resource](#users)
+ [Teams resource](#teams)
+ [Messages resource](#messages)
+ [Leagues resource](#leagues)

## Response Formats
XML or JSON. The extension in your request indicates your desired response. e.g. https://api.challonge.com/v1/tournaments.xml or https://api.challonge.com/v1/tournaments.json - you may also set your request headers to accept application/json, text/xml or application/xml

## Response Codes
| Code | Description |
| ---- | ----------- |
| 200 | OK |
| 401 | Unauthorized (Invalid API key or insufficient permissions) |
| 404 | Object not found within your account scope |
| 422 | Validation error |
| 500 | Something went wrong on our end  |


<a id="auth"></a>
## Authentication


<a id="users"></a>
## Users
**User object**
```javascript
{
  "alias": "jun",
  "first": "adrian",
  "last": "lee",
  "steamid": "steamid:0:1:12345",
  "join": new Date()
}
```

| Name | Description |
| :--- | :---------- |
| alias | nickname (mutable) |
| first | First name |
| last | Last name |
| steamid | SteamID e.g.  steamid:0:1:12345 |
| create | Account creation date |

### List all users
```
GET /users
```
### Get a user
```
GET /users/:id
```
### Update user info
```
PUT /users/:id
```


<a id="teams"></a>
## Teams

| Name | Description |
| :--- | :---------- |
| name | Name of the team |
| tag | shortname (unique) |
| leagues | List of leagues the team belongs to |
| players | List of users who play for the team |
| owners | List of users who own this team |
| create_date | Team creation date |

### List all teams
```
GET /teams
```
### Get a team
```
GET /teams/:id
```
### Update team info
```
PUT /teams/:id
```


<a id="messages"></a>
## Messages
### Send a message
```
POST /messages
POST /matches/:league/:room/messages
```
### List messages
```
GET /matches/:league/:room/messages
```
### Edit messages
Updates a message with the specified id. Know when a message is read
```
PUT /matches/:league/:room/messages/:id
```


<a id="leagues"></a>
## Leagues

| Name | Description |
| :--- | :---------- |
| name | Name of the league |
| url | csgoscrim.com/leagues/ahgl |
| description | Description of the league |
| game_type | "csgo" |
| owners | List of users who own this league |
| matches | List of matches that belong to this league |
| create_date | Team creation date |

### List leagues
List leagues that the authenticated user is a member.

### List all leagues
List all leagues the authenticated user has access to or can join.

### Get a league
### Create a league
### Update a league
